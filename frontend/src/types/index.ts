export type UserRole =
  | 'OFFICER_CREATOR'
  | 'REVIEWER'
  | 'APPROVING_AUTHORITY'
  | 'KNOWLEDGE_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'AUDITOR';

export interface User {
  id: string;
  _id?: string;
  displayName: string;
  email: string;
  role: UserRole;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  } | string;
  badgeNumber?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
}

export type ProposalStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Clarification Requested'
  | 'Resubmitted'
  | 'Approved'
  | 'Rejected'
  | 'Implementation In Progress'
  | 'Implemented'
  | 'Closed';

export type ProposalCategory =
  | 'Infrastructure & Surveillance'
  | 'Traffic & Automated Enforcement'
  | 'Crime Investigation & Forensics'
  | 'Telecommunications & Cyber'
  | 'Operational Equipment & Vehicles'
  | 'Training & Capacity Building'
  | 'Community Policing'
  | 'Administrative & General';

export const PROPOSAL_CATEGORIES: ProposalCategory[] = [
  'Infrastructure & Surveillance',
  'Traffic & Automated Enforcement',
  'Crime Investigation & Forensics',
  'Telecommunications & Cyber',
  'Operational Equipment & Vehicles',
  'Training & Capacity Building',
  'Community Policing',
  'Administrative & General',
];

export interface Proposal {
  _id: string;
  proposalId: string;
  title: string;
  summary: string;
  problemStatement: string;
  purposeAndJustification?: string;
  proposedSolution?: string;
  category: ProposalCategory;
  departmentId: Department | string;
  createdBy: User | string;
  assignedReviewerIds?: (User | string)[];
  status: ProposalStatus;
  proposedBudget: number;
  currency: string;
  expectedBenefits?: string;
  implementationTimeline: string;
  currentVersion: number;
  submittedAt?: string;
  isSynthetic?: boolean;
  isIndexedForPrecedents?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  _id: string;
  documentId: string;
  proposalId?: Proposal | string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  storageKey: string;
  originalFilename: string;
  fileSize: number;
  checksum: string;
  mimeType: string;
  accessLevel: 'Internal Department' | 'Inter-Departmental' | 'Restricted Confidential' | 'Public Reference';
  processingStatus: 'Pending' | 'Processing' | 'Extracted' | 'Indexed' | 'Failed';
  errorMessage?: string;
  pageCount: number;
  chunkCount: number;
  uploadedBy: User | string;
  isSynthetic?: boolean;
  createdAt: string;
}

export interface DocumentChunk {
  _id: string;
  documentId: string;
  chunkId: string;
  text: string;
  pageNumber: number;
  sectionTitle: string;
  vectorReference?: string;
  tokenCount?: number;
  isSynthetic?: boolean;
}

export interface Observation {
  _id: string;
  proposalId: string;
  reviewerId: User;
  text: string;
  type: string;
  proposalVersion: number;
  createdAt: string;
}

export interface Decision {
  _id: string;
  proposalId: string;
  outcome: 'Approved' | 'Rejected' | 'Modified';
  reason: string;
  decidedBy: User;
  decidedAt: string;
  approvedAmount: number;
  currency: string;
  sourceReferences?: {
    documentTitle: string;
    pageNumber?: number;
    sectionTitle?: string;
  }[];
  conditions?: string;
}

export interface WorkflowEvent {
  _id: string;
  proposalId: string;
  actorId: User;
  action: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  proposalVersion: number;
  timestamp: string;
}

export interface Milestone {
  _id?: string;
  title: string;
  description?: string;
  targetDate?: string;
  completionDate?: string;
  completed: boolean;
  notes?: string;
}

export interface ImplementationRecord {
  _id: string;
  proposalId: string;
  status: string;
  milestones: Milestone[];
  actualCost: number;
  currency: string;
  outcome?: string;
  closureNotes?: string;
  closedAt?: string;
}

export interface AuditEvent {
  _id: string;
  actorId?: User;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  correlationId: string;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PrecedentResult {
  proposalId: string;
  id: string;
  title: string;
  category: string;
  departmentName: string;
  summary: string;
  score: number;
  outcome: string;
  decidedAmount: number;
  decisionReason: string;
  implementationStatus: string;
  implementationOutcome: string;
  actualCost: number;
  currency: string;
  isSynthetic: boolean;
  sourceDocument: string;
  pageReference: number;
  excerpt: string;
  matchedTerms: string[];
}

export interface Citation {
  documentTitle: string;
  pageNumber: number;
  proposalId?: string;
  claim: string;
  isVerified: boolean;
}

export interface PrecedentReport {
  proposalId: string;
  hasSufficientEvidence: boolean;
  summary: string;
  precedents: PrecedentResult[];
  similarities: string[];
  differences: string[];
  budgetComparison: {
    proposedBudget: number;
    historicalAverageBudget: number;
    currency: string;
    variancePercent: number;
  } | null;
  recordedDecisions: {
    proposalId: string;
    outcome: string;
    reason: string;
  }[];
  implementationOutcomes: {
    proposalId: string;
    status: string;
    outcome: string;
    actualCost: number;
  }[];
  missingInformation: string[];
  citations: Citation[];
  uncertaintyNotice: string;
}

export interface DashboardMetrics {
  totalProposals: number;
  draftCount: number;
  awaitingReviewCount: number;
  clarificationCount: number;
  approvedCount: number;
  rejectedCount: number;
  implementingCount: number;
  implementedCount: number;
  closedCount: number;
}

export interface DatasetManifestSummary {
  totalDocuments: number;
  totalPages: number;
  totalBenchmarkQueries: number;
  totalExtractionErrors: number;
  totalDuplicatesIdentified: number;
  totalKeySections: number;
  cryptographicVerification: string;
}

export interface BPRDDocument {
  documentId: string;
  title: string;
  filename: string;
  issuingOrganization: string;
  totalPages: number;
  authorOrCommittee: string;
  publicationDate: string;
  subjectDomain: string;
  primaryLanguage: string;
  officialSourceUrl: string;
  fileSizeBytes: number;
  sha256Hash: string;
}

export interface BenchmarkQuery {
  queryId: string;
  query: string;
  relevantDocumentIds: string[];
  relevantChunkIds: string[];
  expectedEvidence: string;
  answerability: string;
  sourceType: string;
  synthetic: boolean;
}

export interface ExtractionError {
  errorId: string;
  documentId: string;
  pageNumber: string;
  errorType: string;
  description: string;
  recommendedAction: string;
}

export interface DuplicateRecord {
  duplicateId: string;
  primaryDocumentId: string;
  matchedDocumentId: string;
  matchType: string;
  similarityScore: number;
  sharedSections: string;
  resolutionAction: string;
}

export interface DocumentSection {
  sectionId: string;
  documentId: string;
  sectionTitle: string;
  sectionPath: string[];
  pageStart: number;
  pageEnd: number;
  parentSectionId: string | null;
  extractedText: string;
  extractionQuality: string;
}

export interface DatasetManifest {
  summary: DatasetManifestSummary;
  documents: BPRDDocument[];
  testQueries: BenchmarkQuery[];
  extractionErrors: ExtractionError[];
  duplicates: DuplicateRecord[];
  sections: DocumentSection[];
}

