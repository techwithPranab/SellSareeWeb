import { z } from 'zod';
import { INDIAN_STATES } from '@/constants';

const addressSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  addressLine1: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required').max(50, 'City cannot exceed 50 characters'),
  state: z.string().refine((val) => INDIAN_STATES.includes(val), {
    message: 'Please select a valid state',
  }),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode'),
  country: z.string().default('India'),
});

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['razorpay', 'upi', 'wallet'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  couponCode: z.string().optional(),
  loyaltyPointsToRedeem: z.number().min(0).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  saveAddress: z.boolean().optional(),
});

export const addressFormSchema = addressSchema.extend({
  type: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().default(false),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type AddressFormData = z.infer<typeof addressFormSchema>;
