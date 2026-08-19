import mongoose, { Schema } from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Inventory',
  'Packaging',
  'Shipping',
  'Marketing',
  'Website & Technology',
  'Office',
  'Utilities',
  'Professional Fees',
  'Travel',
  'Other',
] as const;
export const INVESTMENT_CATEGORIES = ['Bank Deposit', 'Owner Investment', 'Other Investment'] as const;

const ExpenseSchema = new Schema(
  {
    transactionType: { type: String, enum: ['expense', 'investment'], default: 'expense', index: true },
    expenseDate: { type: Date, required: true, index: true },
    category: { type: String, required: true, enum: [...EXPENSE_CATEGORIES, ...INVESTMENT_CATEGORIES], index: true },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true, trim: true, maxlength: 250 },
    vendor: { type: String, trim: true, maxlength: 120 },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
      default: 'UPI',
    },
    reference: { type: String, trim: true, maxlength: 150 },
    notes: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ expenseDate: -1, category: 1 });

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
