import { z } from 'zod';
import { USER_ROLES } from '../models/User.js';

export const loginSchema = z.object({
  email: z.string().email('Valid official departmental email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid official departmental email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(USER_ROLES, { errorMap: () => ({ message: 'Invalid role assignment' }) }),
  departmentId: z.string().optional(),
  badgeNumber: z.string().optional(),
});
