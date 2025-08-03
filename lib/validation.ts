import { z } from 'zod';

// User registration schemas
export const clientSignUpSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  establishmentType: z.string().min(1, 'Please select an establishment type'),
  location: z.string().min(5, 'Please enter a valid location'),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const guardSignUpSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Please select your gender'),
  experienceLevel: z.string().min(1, 'Please select your experience level'),
  yearsExperience: z.string().min(1, 'Please enter years of experience'),
  availability: z.string().min(1, 'Please select your availability'),
  address: z.string().min(10, 'Please enter a complete address'),
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
  emergencyContact: z.string().min(10, 'Please enter a valid emergency contact'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Job posting schema
export const jobPostingSchema = z.object({
  title: z.string().min(5, 'Job title must be at least 5 characters'),
  location: z.string().min(5, 'Please enter a valid location'),
  venueType: z.string().min(1, 'Please select a venue type'),
  eventDates: z.array(z.string()).min(1, 'Please select at least one event date'),
  startTime: z.string().min(1, 'Please select a start time'),
  endTime: z.string().min(1, 'Please select an end time'),
  numGuards: z.number().min(1, 'Number of guards must be at least 1'),
  hourlyPay: z.number().min(15, 'Hourly pay must be at least $15'),
  managerName: z.string().min(2, 'Manager name must be at least 2 characters'),
  managerPhone: z.string().min(10, 'Please enter a valid phone number'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

// Incident report schema
export const incidentReportSchema = z.object({
  incidentType: z.string().min(1, 'Please select an incident type'),
  severity: z.string().min(1, 'Please select severity level'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(5, 'Please enter incident location'),
  witnesses: z.string().optional(),
  policeInvolved: z.boolean(),
  photoEvidence: z.string().optional(),
});

// Review schema
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review comment must be at least 10 characters'),
});

// Checkpoint schema
export const checkpointSchema = z.object({
  checkpointName: z.string().min(2, 'Checkpoint name must be at least 2 characters'),
  notes: z.string().optional(),
  photo: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

// Message schema
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  recipientId: z.string().min(1, 'Recipient is required'),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(10, 'Please enter a complete address'),
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
});

// Payment method schema
export const paymentMethodSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Please enter a valid 16-digit card number'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Please enter a valid month (01-12)'),
  expiryYear: z.string().regex(/^\d{4}$/, 'Please enter a valid 4-digit year'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Please enter a valid CVV'),
  cardholderName: z.string().min(2, 'Cardholder name must be at least 2 characters'),
});

// Utility functions for validation
export const validateForm = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; errors?: Record<string, string> } => {
  try {
    schema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

export const validateField = <T>(schema: z.ZodSchema<T>, field: string, value: any): string | null => {
  try {
    const fieldSchema = schema.shape[field as keyof T];
    if (fieldSchema) {
      fieldSchema.parse(value);
      return null;
    }
    return 'Invalid field';
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value';
    }
    return 'Validation failed';
  }
};

// Type exports for use in components
export type ClientSignUpData = z.infer<typeof clientSignUpSchema>;
export type GuardSignUpData = z.infer<typeof guardSignUpSchema>;
export type JobPostingData = z.infer<typeof jobPostingSchema>;
export type IncidentReportData = z.infer<typeof incidentReportSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type CheckpointData = z.infer<typeof checkpointSchema>;
export type MessageData = z.infer<typeof messageSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PaymentMethodData = z.infer<typeof paymentMethodSchema>; 