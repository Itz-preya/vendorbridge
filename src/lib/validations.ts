import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/\d/, 'Password must contain at least one number'),
  role: z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER'] as const, {
    message: 'Please select a valid role',
  }),
});

export const vendorSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid Indian phone number (e.g. +91 9876543210)'),
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Enter a valid GST number (e.g. 27AABCU9603R1ZM)'
    ),
  category: z.enum(['IT_SERVICES', 'MANUFACTURING', 'CONSULTING', 'LOGISTICS', 'RAW_MATERIALS', 'OFFICE_SUPPLIES']),
  address: z.string().min(10, 'Address must be at least 10 characters'),
});

export const rfqItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().default(''),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
});

export const rfqSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  items: z.array(rfqItemSchema).min(1, 'At least one item is required'),
  deadline: z.string().refine(
    (d) => new Date(d) > new Date(),
    'Deadline must be a future date'
  ),
  vendorIds: z.array(z.string()).min(1, 'Select at least one vendor'),
});

export const quotationItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

export const quotationSchema = z.object({
  rfqId: z.string().min(1, 'RFQ ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  deliveryTimeline: z.string().min(1, 'Delivery timeline is required'),
  notes: z.string().optional(),
});

export const approvalSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED'] as const),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => data.status !== 'REJECTED' || (data.remarks && data.remarks.length >= 10),
    { message: 'Please provide rejection reason (at least 10 characters)', path: ['remarks'] }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type RFQInput = z.infer<typeof rfqSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
