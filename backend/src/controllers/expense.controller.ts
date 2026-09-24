import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Expense, { EXPENSE_CATEGORIES, INVESTMENT_CATEGORIES } from '../models/Expense';
import Order from '../models/Order';
import Product from '../models/Product';
import GiftItem from '../models/GiftItem';
import { OrderStatus, PaymentStatus } from '../constants';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const startOfIndiaDay = (value = new Date()): Date => {
  const indiaDate = value.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${indiaDate}T00:00:00+05:30`);
};

const endOfIndiaDay = (value = new Date()): Date => {
  const indiaDate = value.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${indiaDate}T23:59:59.999+05:30`);
};

const parseDate = (value: unknown, endOfDay = false): Date | undefined => {
  if (!value) return undefined;
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00'}+05:30`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const expensePayload = (body: Record<string, unknown>) => ({
  transactionType: body.transactionType === 'investment' ? 'investment' as const : 'expense' as const,
  expenseDate: parseDate(body.expenseDate),
  category: String(body.category || '').trim(),
  amount: Number(body.amount),
  description: String(body.description || '').trim(),
  vendor: String(body.vendor || '').trim(),
  paymentMethod: String(body.paymentMethod || 'UPI'),
  reference: String(body.reference || '').trim(),
  notes: String(body.notes || '').trim(),
  isSettled: body.transactionType === 'investment' ? true : body.isSettled === true,
});

const validatePayload = (payload: ReturnType<typeof expensePayload>): string | null => {
  if (!payload.expenseDate) return 'A valid expense date is required';
  const allowedCategories: readonly string[] = payload.transactionType === 'investment' ? INVESTMENT_CATEGORIES : EXPENSE_CATEGORIES;
  if (!allowedCategories.includes(payload.category)) return 'Select a valid transaction category';
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) return 'Amount must be greater than zero';
  if (!payload.description) return 'Description is required';
  return null;
};

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter: Record<string, unknown> = {};
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.settlement === 'pending') {
    filter.transactionType = { $ne: 'investment' };
    filter.isSettled = { $ne: true };
  } else if (req.query.settlement === 'settled') {
    filter.transactionType = { $ne: 'investment' };
    filter.isSettled = true;
  }

  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  if (from || to) filter.expenseDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const [expenses, total] = await Promise.all([
    Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Expense.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Expenses retrieved', expenses, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  });
});

const csvCell = (value: unknown): string => {
  let text = value === undefined || value === null ? '' : String(value);
  // Prevent spreadsheet formula execution when a text field is opened in Excel.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportExpenses = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.settlement === 'pending') {
    filter.transactionType = { $ne: 'investment' };
    filter.isSettled = { $ne: true };
  } else if (req.query.settlement === 'settled') {
    filter.transactionType = { $ne: 'investment' };
    filter.isSettled = true;
  }
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  if (from || to) filter.expenseDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const expenses = await Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 }).lean();
  const header = ['Date', 'Type', 'Category', 'Description', 'Vendor / Payee', 'Payment Method', 'Reference', 'Settlement Status', 'Debit', 'Credit', 'Notes'];
  const rows = expenses.map((expense) => {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(expense.expenseDate);
    const isInvestment = expense.transactionType === 'investment';
    return [
      date,
      isInvestment ? 'Investment' : 'Expense',
      expense.category,
      expense.description,
      expense.vendor,
      expense.paymentMethod,
      expense.reference,
      isInvestment ? 'Not applicable' : expense.isSettled === true ? 'Settled' : 'Needs settlement',
      isInvestment ? '' : expense.amount,
      isInvestment ? expense.amount : '',
      expense.notes,
    ].map(csvCell).join(',');
  });

  const filenameDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pps-aura-ledger-${filenameDate}.csv"`);
  return res.status(200).send(`\uFEFF${[header.map(csvCell).join(','), ...rows].join('\n')}`);
});

export const getExpenseSummary = asyncHandler(async (_req: Request, res: Response) => {
  const todayStart = startOfIndiaDay();
  const todayEnd = endOfIndiaDay();
  const indiaMonth = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
  });
  const monthStart = new Date(`${indiaMonth}-01T00:00:00+05:30`);

  const [revenue, totals, byCategory] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          'paymentInfo.status': PaymentStatus.COMPLETED,
          status: { $ne: OrderStatus.CANCELLED },
          $expr: { $lte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, todayEnd] },
        },
      },
      { $group: { _id: null, amount: { $sum: '$totalAmount' } } },
    ]),
    Expense.aggregate([
      { $match: { expenseDate: { $lte: todayEnd }, transactionType: { $ne: 'investment' } } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          todayExpenses: { $sum: { $cond: [{ $gte: ['$expenseDate', todayStart] }, '$amount', 0] } },
          monthExpenses: { $sum: { $cond: [{ $gte: ['$expenseDate', monthStart] }, '$amount', 0] } },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { expenseDate: { $lte: todayEnd }, transactionType: { $ne: 'investment' } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
  ]);

  const investments = await Expense.aggregate([
    { $match: { expenseDate: { $lte: todayEnd }, transactionType: 'investment' } },
    {
      $group: {
        _id: null,
        totalInvestments: { $sum: '$amount' },
        todayInvestments: { $sum: { $cond: [{ $gte: ['$expenseDate', todayStart] }, '$amount', 0] } },
        monthInvestments: { $sum: { $cond: [{ $gte: ['$expenseDate', monthStart] }, '$amount', 0] } },
      },
    },
  ]);

  const totalRevenue = revenue[0]?.amount || 0;
  const totalExpenses = totals[0]?.totalExpenses || 0;
  const totalInvestments = investments[0]?.totalInvestments || 0;
  return ApiResponse.success(res, 'Expense summary retrieved', {
    summary: {
      asOf: todayEnd,
      totalRevenue,
      totalInvestments,
      totalExpenses,
      currentBalance: totalRevenue + totalInvestments - totalExpenses,
      todayExpenses: totals[0]?.todayExpenses || 0,
      monthExpenses: totals[0]?.monthExpenses || 0,
      todayInvestments: investments[0]?.todayInvestments || 0,
      monthInvestments: investments[0]?.monthInvestments || 0,
      byCategory,
    },
  });
});

const pnlValues = (revenue: number, categories: Record<string, number>, costOfGoodsSold = 0) => {
  const depreciationAndAmortization = categories['Depreciation & Amortization'] || 0;
  const interest = categories.Interest || 0;
  const taxes = categories.Taxes || 0;
  const excluded = new Set(['Inventory', 'Interest', 'Taxes', 'Depreciation & Amortization']);
  const operatingExpenses = Object.entries(categories).reduce(
    (sum, [category, amount]) => sum + (excluded.has(category) ? 0 : amount),
    0
  );
  const grossProfit = revenue - costOfGoodsSold;
  const ebitda = grossProfit - operatingExpenses;
  const ebit = ebitda - depreciationAndAmortization;
  const profitBeforeTax = ebit - interest;
  const netProfit = profitBeforeTax - taxes;
  return {
    revenue,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    ebitda,
    depreciationAndAmortization,
    ebit,
    interest,
    profitBeforeTax,
    taxes,
    netProfit,
    grossMargin: revenue ? (grossProfit / revenue) * 100 : 0,
    ebitdaMargin: revenue ? (ebitda / revenue) * 100 : 0,
    netMargin: revenue ? (netProfit / revenue) * 100 : 0,
  };
};

export const getProfitLossAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const indiaYear = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' });
  const from = parseDate(req.query.from) || new Date(`${indiaYear}-01-01T00:00:00+05:30`);
  const to = parseDate(req.query.to, true) || endOfIndiaDay();
  if (from > to) return ApiResponse.badRequest(res, 'From date must be before the to date');

  const periodMs = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - periodMs + 1);

  const revenuePipeline = (start: Date, end: Date) => [
    {
      $match: {
        'paymentInfo.status': PaymentStatus.COMPLETED,
        status: { $ne: OrderStatus.CANCELLED },
        $expr: {
          $and: [
            { $gte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, start] },
            { $lte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, end] },
          ],
        },
      },
    },
    { $group: { _id: null, amount: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
  ];
  const expensePipeline = (start: Date, end: Date) => [
    { $match: { transactionType: { $ne: 'investment' }, expenseDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { amount: -1 as const } },
  ];
  const soldCostPipeline = (start: Date, end: Date, groupByMonth = false) => [
    ...revenuePipeline(start, end).slice(0, 1),
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'costProduct' } },
    { $unwind: { path: '$costProduct', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: groupByMonth
          ? { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, timezone: 'Asia/Kolkata' } }
          : null,
        costOfGoodsSold: {
          $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.unitBuyPrice', { $ifNull: ['$costProduct.buyPrice', 0] }] }] },
        },
        missingBuyPriceUnits: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ['$items.unitBuyPrice', { $ifNull: ['$costProduct.buyPrice', null] }] }, null] }, '$items.quantity', 0] },
        },
      },
    },
    { $sort: { _id: 1 as const } },
  ];
  const profitabilityOrderMatch = (start: Date, end: Date) => ({
    $match: {
      status: { $ne: OrderStatus.CANCELLED },
      createdAt: { $gte: start, $lte: end },
    },
  });

  const lifetimeStart = new Date(0);
  const lifetimeEnd = endOfIndiaDay();
  const outstandingOrderStages = [
    { $match: { status: { $ne: OrderStatus.CANCELLED }, 'paymentInfo.status': { $nin: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] } } },
    { $project: {
      user: 1,
      totalAmount: 1,
      paidAmount: { $reduce: {
        input: { $ifNull: ['$paymentInfo.manualPayments', []] }, initialValue: 0,
        in: { $add: ['$$value', { $cond: [{ $eq: [{ $ifNull: ['$$this.voidedAt', null] }, null] }, '$$this.amount', 0] }] },
      } },
    } },
    { $addFields: { balance: { $max: [{ $subtract: ['$totalAmount', '$paidAmount'] }, 0] } } },
    { $match: { balance: { $gt: 0 } } },
  ];
  const [revenue, expenses, soldCost, previousRevenue, previousExpenses, previousSoldCost, revenueByMonth, expensesByMonth, soldCostByMonth, inventory, giftInventory, orderProfitRows, lifetimeExpenses, lifetimeSold, unrealizedRevenueRows, unrealizedByCustomer] = await Promise.all([
    Order.aggregate(revenuePipeline(from, to)),
    Expense.aggregate(expensePipeline(from, to)),
    Order.aggregate(soldCostPipeline(from, to)),
    Order.aggregate(revenuePipeline(previousFrom, previousTo)),
    Expense.aggregate(expensePipeline(previousFrom, previousTo)),
    Order.aggregate(soldCostPipeline(previousFrom, previousTo)),
    Order.aggregate([
      ...revenuePipeline(from, to).slice(0, 1),
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, timezone: 'Asia/Kolkata' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
    Expense.aggregate([
      { $match: { transactionType: { $ne: 'investment' }, expenseDate: { $gte: from, $lte: to } } },
      { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$expenseDate', timezone: 'Asia/Kolkata' } }, category: '$category' }, amount: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } },
    ]),
    Order.aggregate(soldCostPipeline(from, to, true)),
    Product.aggregate([
      { $match: { stock: { $gt: 0 } } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$stock', { $ifNull: ['$buyPrice', 0] }] } }, units: { $sum: '$stock' }, products: { $sum: 1 }, missingBuyPriceProducts: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$buyPrice', null] }, null] }, 1, 0] } } } },
    ]),
    GiftItem.aggregate([
      { $match: { stock: { $gt: 0 } } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$unitCost'] } }, units: { $sum: '$stock' }, items: { $sum: 1 } } },
    ]),
    Order.aggregate([
      profitabilityOrderMatch(from, to),
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'costProduct' } },
      { $unwind: { path: '$costProduct', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: '$_id',
        orderNumber: { $first: '$orderNumber' },
        orderDate: { $first: '$createdAt' },
        customerId: { $first: '$user' },
        status: { $first: '$status' },
        paymentStatus: { $first: '$paymentInfo.status' },
        revenue: { $first: '$totalAmount' },
        sareeCount: { $sum: '$items.quantity' },
        buyPrice: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.unitBuyPrice', { $ifNull: ['$costProduct.buyPrice', 0] }] }] } },
        missingBuyPriceUnits: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$items.unitBuyPrice', { $ifNull: ['$costProduct.buyPrice', null] }] }, null] }, '$items.quantity', 0] } },
      } },
      { $lookup: { from: 'users', localField: 'customerId', foreignField: '_id', as: 'customer' } },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $project: { orderNumber: 1, orderDate: 1, status: 1, paymentStatus: 1, revenue: 1, sareeCount: 1, buyPrice: 1, missingBuyPriceUnits: 1, customerName: { $ifNull: ['$customer.name', 'Unknown customer'] } } },
      { $sort: { orderDate: -1 } },
    ]),
    Expense.aggregate(expensePipeline(lifetimeStart, lifetimeEnd)),
    Order.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED }, createdAt: { $lte: lifetimeEnd } } },
      { $unwind: '$items' },
      { $group: { _id: null, units: { $sum: '$items.quantity' } } },
    ]),
    Order.aggregate([
      ...outstandingOrderStages,
      { $group: { _id: null, amount: { $sum: '$balance' }, orders: { $sum: { $cond: [{ $gt: ['$balance', 0] }, 1, 0] } } } },
    ]),
    Order.aggregate([
      ...outstandingOrderStages,
      { $group: { _id: '$user', totalOrderValue: { $sum: '$totalAmount' }, paidAmount: { $sum: '$paidAmount' }, pendingAmount: { $sum: '$balance' }, orderCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $project: { customerId: '$_id', customerName: { $ifNull: ['$customer.name', 'Unknown customer'] }, email: { $ifNull: ['$customer.email', ''] }, phone: { $ifNull: ['$customer.phone', ''] }, totalOrderValue: 1, paidAmount: 1, pendingAmount: 1, orderCount: 1 } },
      { $sort: { pendingAmount: -1 } },
    ]),
  ]);

  const categoryMap = (rows: Array<{ _id: string; amount: number }>) => Object.fromEntries(rows.map((row) => [row._id, row.amount]));
  const current = pnlValues(revenue[0]?.amount || 0, categoryMap(expenses), soldCost[0]?.costOfGoodsSold || 0);
  const previous = pnlValues(previousRevenue[0]?.amount || 0, categoryMap(previousExpenses), previousSoldCost[0]?.costOfGoodsSold || 0);
  const months = new Map<string, { month: string; revenue: number; costOfGoodsSold: number; categories: Record<string, number> }>();
  revenueByMonth.forEach((row: { _id: string; revenue: number }) => months.set(row._id, { month: row._id, revenue: row.revenue, costOfGoodsSold: 0, categories: {} }));
  expensesByMonth.forEach((row: { _id: { month: string; category: string }; amount: number }) => {
    const entry = months.get(row._id.month) || { month: row._id.month, revenue: 0, costOfGoodsSold: 0, categories: {} };
    entry.categories[row._id.category] = row.amount;
    months.set(row._id.month, entry);
  });
  soldCostByMonth.forEach((row: { _id: string; costOfGoodsSold: number }) => {
    const entry = months.get(row._id) || { month: row._id, revenue: 0, costOfGoodsSold: 0, categories: {} };
    entry.costOfGoodsSold = row.costOfGoodsSold;
    months.set(row._id, entry);
  });
  const trend = [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).map((entry) => ({ month: entry.month, ...pnlValues(entry.revenue, entry.categories, entry.costOfGoodsSold) }));
  const inStockInventoryUnits = inventory[0]?.units || 0;
  const soldInventoryUnits = lifetimeSold[0]?.units || 0;
  const allocationInventoryUnits = inStockInventoryUnits + soldInventoryUnits;
  const allocationOperatingExpenses = pnlValues(0, categoryMap(lifetimeExpenses)).operatingExpenses;
  const averageOtherExpense = allocationInventoryUnits > 0 ? allocationOperatingExpenses / allocationInventoryUnits : 0;
  const orderProfitability = orderProfitRows.map((row: { _id: Types.ObjectId; orderNumber: string; orderDate: Date; customerName: string; status: string; paymentStatus: string; revenue: number; sareeCount: number; buyPrice: number; missingBuyPriceUnits: number }) => {
    const allocatedOtherExpense = averageOtherExpense * row.sareeCount;
    const netProfit = row.revenue - row.buyPrice - allocatedOtherExpense;
    return { ...row, _id: row._id.toString(), allocatedOtherExpense, netProfit, netMargin: row.revenue ? (netProfit / row.revenue) * 100 : 0 };
  });

  return ApiResponse.success(res, 'Profit and loss analytics retrieved', {
    period: { from, to, previousFrom, previousTo },
    current: { ...current, orderCount: revenue[0]?.orders || 0, missingBuyPriceSoldUnits: soldCost[0]?.missingBuyPriceUnits || 0 },
    previous: { ...previous, orderCount: previousRevenue[0]?.orders || 0, missingBuyPriceSoldUnits: previousSoldCost[0]?.missingBuyPriceUnits || 0 },
    trend,
    expensesByCategory: expenses,
    unrealizedRevenue: { amount: unrealizedRevenueRows[0]?.amount || 0, orders: unrealizedRevenueRows[0]?.orders || 0 },
    unrealizedByCustomer,
    orderProfitability: {
      averageOtherExpense,
      allocationOperatingExpenses,
      allocationInventoryUnits,
      inStockInventoryUnits,
      soldInventoryUnits,
      orders: orderProfitability,
    },
    inventory: {
      value: (inventory[0]?.value || 0) + (giftInventory[0]?.value || 0),
      units: inventory[0]?.units || 0,
      products: inventory[0]?.products || 0,
      missingBuyPriceProducts: inventory[0]?.missingBuyPriceProducts || 0,
      sareeValue: inventory[0]?.value || 0,
      giftValue: giftInventory[0]?.value || 0,
      giftUnits: giftInventory[0]?.units || 0,
      giftItems: giftInventory[0]?.items || 0,
    },
  });
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const payload = expensePayload(req.body);
  const error = validatePayload(payload);
  if (error) return ApiResponse.badRequest(res, error);

  const expense = await Expense.create({ ...payload, createdBy: new Types.ObjectId(req.user!.id) });
  return ApiResponse.created(res, 'Expense recorded', { expense });
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const payload = expensePayload(req.body);
  const error = validatePayload(payload);
  if (error) return ApiResponse.badRequest(res, error);

  const expense = await Expense.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!expense) return ApiResponse.notFound(res, 'Expense not found');
  return ApiResponse.success(res, 'Expense updated', { expense });
});

export const updateExpenseSettlement = asyncHandler(async (req: Request, res: Response) => {
  if (typeof req.body.isSettled !== 'boolean') {
    return ApiResponse.badRequest(res, 'Settlement status must be true or false');
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, transactionType: { $ne: 'investment' } },
    { isSettled: req.body.isSettled },
    { new: true, runValidators: true }
  );
  if (!expense) return ApiResponse.notFound(res, 'Expense not found');
  return ApiResponse.success(res, req.body.isSettled ? 'Expense marked as settled' : 'Expense marked as needing settlement', { expense });
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return ApiResponse.notFound(res, 'Expense not found');
  return ApiResponse.success(res, 'Expense deleted');
});
