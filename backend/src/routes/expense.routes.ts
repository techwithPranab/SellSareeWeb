import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { createExpense, deleteExpense, exportExpenses, getExpenses, getExpenseSummary, getProfitLossAnalytics, updateExpense, updateExpenseSettlement } from '../controllers/expense.controller';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/summary', getExpenseSummary);
router.get('/profit-loss', getProfitLossAnalytics);
router.get('/export', exportExpenses);
router.get('/', getExpenses);
router.post('/', createExpense);
router.patch('/:id/settlement', updateExpenseSettlement);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
