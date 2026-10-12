import { z } from 'zod';
import { DECISION_OUTCOMES } from '../models/Decision.js';

export const recordDecisionSchema = z.object({
  outcome: z.enum(DECISION_OUTCOMES, { errorMap: () => ({ message: 'Decision outcome must be Approved, Rejected, or Modified' }) }),
  reason: z.string().min(10, 'A detailed official justification reason is strictly required'),
  approvedAmount: z.number().min(0).optional(),
  conditions: z.string().optional(),
  sourceReferences: z.array(
    z.object({
      documentTitle: z.string(),
      pageNumber: z.number().optional(),
      sectionTitle: z.string().optional(),
    })
  ).optional(),
});

export const updateImplementationSchema = z.object({
  status: z.enum(['Initiated', 'In Progress', 'Milestone Completed', 'Commissioned', 'Audited', 'Terminated']),
  actualCost: z.number().min(0).optional(),
  outcome: z.string().optional(),
  closureNotes: z.string().optional(),
  milestone: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    completed: z.boolean().default(false),
    targetDate: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});
