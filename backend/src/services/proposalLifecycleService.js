import { Proposal, PROPOSAL_STATUSES } from '../models/Proposal.js';
import { WorkflowEvent } from '../models/WorkflowEvent.js';
import { Decision } from '../models/Decision.js';
import { ImplementationRecord } from '../models/ImplementationRecord.js';
import { recordAuditEvent } from './auditService.js';
import { logger } from '../utils/logger.js';

// Valid transitions mapping
const VALID_TRANSITIONS = {
  Draft: ['Submitted'],
  Submitted: ['Under Review'],
  'Under Review': ['Clarification Requested', 'Approved', 'Rejected'],
  'Clarification Requested': ['Resubmitted'],
  Resubmitted: ['Under Review'],
  Approved: ['Implementation In Progress'],
  Rejected: ['Closed'],
  'Implementation In Progress': ['Implemented'],
  Implemented: ['Closed'],
  Closed: [],
};

export class ProposalLifecycleService {
  /**
   * Validates if a transition is legal in the state machine
   */
  static isValidTransition(currentStatus, nextStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Execute state transition with atomic event logging
   */
  static async transitionStatus({
    proposal,
    actor,
    action,
    toStatus,
    reason = '',
    metadata = {},
    reqMeta = {},
  }) {
    const fromStatus = proposal.status;

    if (!this.isValidTransition(fromStatus, toStatus)) {
      const msg = `Illegal workflow transition from '${fromStatus}' to '${toStatus}'.`;
      await recordAuditEvent({
        actorId: actor._id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'INVALID_TRANSITION_ATTEMPT',
        resourceType: 'Proposal',
        resourceId: proposal._id.toString(),
        outcome: 'DENIED',
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        details: { fromStatus, toStatus, action },
      });
      throw new Error(msg);
    }

    proposal.status = toStatus;
    if (toStatus === 'Submitted') {
      proposal.submittedAt = new Date();
    }

    await proposal.save();

    // Create workflow event
    const event = await WorkflowEvent.create({
      proposalId: proposal._id,
      actorId: actor._id,
      action,
      fromStatus,
      toStatus,
      reason,
      proposalVersion: proposal.currentVersion,
      metadata,
    });

    // Record audit event
    await recordAuditEvent({
      actorId: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: `PROPOSAL_STATE_${action.toUpperCase()}`,
      resourceType: 'Proposal',
      resourceId: proposal._id.toString(),
      outcome: 'SUCCESS',
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        fromStatus,
        toStatus,
        proposalId: proposal.proposalId,
        version: proposal.currentVersion,
        reason,
      },
    });

    logger.info(`Proposal ${proposal.proposalId} transitioned from ${fromStatus} -> ${toStatus} by ${actor.email}`);
    return { proposal, event };
  }

  /**
   * Submit draft proposal
   */
  static async submitProposal(proposal, actor, reqMeta = {}) {
    if (proposal.createdBy.toString() !== actor._id.toString() && actor.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only the authoring officer can submit this proposal.');
    }
    return this.transitionStatus({
      proposal,
      actor,
      action: 'SUBMIT',
      toStatus: 'Submitted',
      reason: 'Proposal submitted for departmental review.',
      reqMeta,
    });
  }

  /**
   * Move from Submitted to Under Review
   */
  static async markUnderReview(proposal, actor, reason = 'Review commenced', reqMeta = {}) {
    return this.transitionStatus({
      proposal,
      actor,
      action: 'BEGIN_REVIEW',
      toStatus: 'Under Review',
      reason,
      reqMeta,
    });
  }

  /**
   * Request clarification from authoring officer
   */
  static async requestClarification(proposal, actor, queryText, reqMeta = {}) {
    return this.transitionStatus({
      proposal,
      actor,
      action: 'REQUEST_CLARIFICATION',
      toStatus: 'Clarification Requested',
      reason: queryText,
      metadata: { clarificationQuery: queryText },
      reqMeta,
    });
  }

  /**
   * Resubmit proposal following clarification
   */
  static async resubmitProposal(proposal, actor, responseExplanation, updates = {}, reqMeta = {}) {
    if (proposal.createdBy.toString() !== actor._id.toString() && actor.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only the authoring officer can respond and resubmit this proposal.');
    }

    // Increment version
    proposal.currentVersion += 1;
    if (updates.title) proposal.title = updates.title;
    if (updates.summary) proposal.summary = updates.summary;
    if (updates.problemStatement) proposal.problemStatement = updates.problemStatement;
    if (updates.proposedBudget !== undefined) proposal.proposedBudget = updates.proposedBudget;
    if (updates.implementationTimeline) proposal.implementationTimeline = updates.implementationTimeline;

    // Transition to Resubmitted first, then seamlessly back to Under Review
    await this.transitionStatus({
      proposal,
      actor,
      action: 'RESUBMIT',
      toStatus: 'Resubmitted',
      reason: responseExplanation,
      metadata: { explanation: responseExplanation },
      reqMeta,
    });

    return this.transitionStatus({
      proposal,
      actor,
      action: 'RESUME_REVIEW',
      toStatus: 'Under Review',
      reason: 'Clarification received; review resumed.',
      reqMeta,
    });
  }

  /**
   * Record formal decision (Approving Authority only)
   */
  static async recordDecision(proposal, actor, decisionData, reqMeta = {}) {
    if (actor.role !== 'APPROVING_AUTHORITY' && actor.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only an authorized Approving Authority can record decisions.');
    }

    const { outcome, reason, approvedAmount = 0, sourceReferences = [], conditions = '' } = decisionData;
    const targetStatus = outcome === 'Approved' ? 'Approved' : 'Rejected';

    // Transition state
    await this.transitionStatus({
      proposal,
      actor,
      action: `DECISION_${outcome.toUpperCase()}`,
      toStatus: targetStatus,
      reason,
      metadata: { approvedAmount, conditions },
      reqMeta,
    });

    // Save decision document
    const decision = await Decision.findOneAndUpdate(
      { proposalId: proposal._id },
      {
        proposalId: proposal._id,
        outcome,
        reason,
        decidedBy: actor._id,
        decidedAt: new Date(),
        approvedAmount: outcome === 'Approved' ? approvedAmount : 0,
        currency: proposal.currency,
        sourceReferences,
        conditions,
      },
      { upsert: true, new: true }
    );

    // If approved, create initial ImplementationRecord
    if (outcome === 'Approved') {
      await ImplementationRecord.findOneAndUpdate(
        { proposalId: proposal._id },
        {
          proposalId: proposal._id,
          status: 'Initiated',
          actualCost: 0,
          currency: proposal.currency,
          milestones: [
            {
              title: 'Administrative Sanction Formalized',
              description: 'Official sanction order logged and verified.',
              completed: true,
              completionDate: new Date(),
            },
            {
              title: 'Procurement / Tendering',
              description: 'Vendor selection or equipment procurement initiation.',
              completed: false,
            },
            {
              title: 'Site Delivery & Deployment',
              description: 'Field installation and integration.',
              completed: false,
            },
            {
              title: 'Operational Commissioning & Acceptance Audit',
              description: 'Final technical sign-off by supervisory officers.',
              completed: false,
            },
          ],
        },
        { upsert: true, new: true }
      );
    }

    return { proposal, decision };
  }

  /**
   * Update implementation progress
   */
  static async updateImplementation(proposal, actor, implData, reqMeta = {}) {
    let implRecord = await ImplementationRecord.findOne({ proposalId: proposal._id });
    if (!implRecord) {
      implRecord = new ImplementationRecord({ proposalId: proposal._id });
    }

    if (implData.status) implRecord.status = implData.status;
    if (implData.actualCost !== undefined) implRecord.actualCost = implData.actualCost;
    if (implData.outcome) implRecord.outcome = implData.outcome;
    if (implData.closureNotes) implRecord.closureNotes = implData.closureNotes;

    if (implData.milestone) {
      implRecord.milestones.push(implData.milestone);
    }

    // Check if we should advance proposal status
    if (proposal.status === 'Approved' && implRecord.status === 'In Progress') {
      await this.transitionStatus({
        proposal,
        actor,
        action: 'START_IMPLEMENTATION',
        toStatus: 'Implementation In Progress',
        reason: 'Project work in the field commenced.',
        reqMeta,
      });
    } else if (proposal.status === 'Implementation In Progress' && (implRecord.status === 'Commissioned' || implRecord.status === 'Audited')) {
      await this.transitionStatus({
        proposal,
        actor,
        action: 'MARK_IMPLEMENTED',
        toStatus: 'Implemented',
        reason: 'All project implementation milestones completed successfully.',
        reqMeta,
      });
    }

    await implRecord.save();
    return { proposal, implRecord };
  }

  /**
   * Close proposal
   */
  static async closeProposal(proposal, actor, closureNotes = '', reqMeta = {}) {
    if (proposal.status !== 'Implemented' && proposal.status !== 'Rejected') {
      throw new Error(`Cannot close proposal in status '${proposal.status}'. Must be 'Implemented' or 'Rejected'.`);
    }

    const { event } = await this.transitionStatus({
      proposal,
      actor,
      action: 'CLOSE',
      toStatus: 'Closed',
      reason: closureNotes || 'Proposal closed and archived into departmental knowledge base.',
      reqMeta,
    });

    // Mark as indexed for precedents
    proposal.isIndexedForPrecedents = true;
    await proposal.save();

    return { proposal, event };
  }
}
