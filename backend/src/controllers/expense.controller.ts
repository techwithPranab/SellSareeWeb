import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Expense, { EXPENSE_CATEGORIES, INVESTMENT_CATEGORIES } from '../models/Expense';
import Order from '../models/Order';
import { PaymentStatus } from '../constants';
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
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  if (from || to) filter.expenseDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const expenses = await Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 }).lean();
  const header = ['Date', 'Type', 'Category', 'Description', 'Vendor / Payee', 'Payment Method', 'Reference', 'Debit', 'Credit', 'Notes'];
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

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return ApiResponse.notFound(res, 'Expense not found');
  return ApiResponse.success(res, 'Expense deleted');
});
