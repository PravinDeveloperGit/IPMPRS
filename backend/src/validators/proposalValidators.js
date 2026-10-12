import { z } from 'zod';
import { PROPOSAL_CATEGORIES } from '../models/Proposal.js';

export const createProposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(300),
  summary: z.string().min(10, 'Executive summary must be at least 10 characters'),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  purposeAndJustification: z.string().optional(),
  proposedSolution: z.string().optional(),
  category: z.enum(PROPOSAL_CATEGORIES, { errorMap: () => ({ message: 'Invalid proposal category' }) }),
  departmentId: z.any().transform(v => (typeof v === 'object' && v ? String(v._id || v) : String(v || ''))).refine(v => v.length > 0, 'Department ID is required'),
  proposedBudget: z.number().min(0, 'Estimated budget must be non-negative'),
  currency: z.string().default('INR'),
  expectedBenefits: z.string().optional(),
  implementationTimeline: z.string().min(2, 'Timeline is required (e.g., 6 Months)'),
});

export const updateProposalSchema = createProposalSchema.partial();

export const addObservationSchema = z.object({
  text: z.string().min(5, 'Observation text must be at least 5 characters'),
  type: z.enum([
    'Review Observation',
    'Clarification Request',
    'Technical Query',
    'Financial Observation',
    'Compliance Check',
  ]).default('Review Observation'),
  linkedDocumentIds: z.array(z.string()).optional(),
});

export const clarificationRequestSchema = z.object({
  text: z.string().min(10, 'Detailed clarification request query must be provided'),
});

export const resubmitProposalSchema = z.object({
  responseExplanation: z.string().min(10, 'Explanation responding to the clarification is required'),
  title: z.string().optional(),
  summary: z.string().optional(),
  problemStatement: z.string().optional(),
  proposedBudget: z.number().optional(),
  implementationTimeline: z.string().optional(),
});
