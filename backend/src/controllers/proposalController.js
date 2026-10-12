import { Proposal } from '../models/Proposal.js';
import { Observation } from '../models/Observation.js';
import { Decision } from '../models/Decision.js';
import { ImplementationRecord } from '../models/ImplementationRecord.js';
import { WorkflowEvent } from '../models/WorkflowEvent.js';
import { Document } from '../models/Document.js';
import { ProposalLifecycleService } from '../services/proposalLifecycleService.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function getProposals(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      departmentId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Role-based visibility scoping
    if (req.user.role === 'OFFICER_CREATOR') {
      // Creators can see their own department's proposals or proposals they authored
      query.$or = [
        { createdBy: req.user._id },
        { departmentId: req.user.departmentId?._id || req.user.departmentId },
      ];
    } else if (req.user.role === 'REVIEWER') {
      // Reviewers see proposals assigned or under review
      query.$or = [
        { assignedReviewerIds: req.user._id },
        { status: { $in: ['Submitted', 'Under Review', 'Clarification Requested', 'Resubmitted'] } },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (departmentId) query.departmentId = departmentId;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { proposalId: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Proposal.countDocuments(query);

    const proposals = await Proposal.find(query)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'displayName email role badgeNumber')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: {
        proposals,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProposal(req, res, next) {
  try {
    const nextSeq = Math.floor(1000 + Math.random() * 9000);
    const proposalId = `PROP-${new Date().getFullYear()}-${nextSeq}`;

    const proposal = await Proposal.create({
      ...req.body,
      proposalId,
      createdBy: req.user._id,
      status: 'Draft',
      currentVersion: 1,
    });

    await recordAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'CREATE_PROPOSAL_DRAFT',
      resourceType: 'Proposal',
      resourceId: proposal._id.toString(),
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { proposalId: proposal.proposalId, title: proposal.title },
    });

    res.status(201).json({
      success: true,
      message: 'Draft proposal created successfully.',
      data: { proposal },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProposalById(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('departmentId')
      .populate('createdBy', 'displayName email role badgeNumber')
      .populate('assignedReviewerIds', 'displayName email role');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found.',
      });
    }

    const [events, observations, decision, implementation, documents] = await Promise.all([
      WorkflowEvent.find({ proposalId: proposal._id })
        .populate('actorId', 'displayName email role')
        .sort({ timestamp: -1 }),
      Observation.find({ proposalId: proposal._id })
        .populate('reviewerId', 'displayName email role')
        .sort({ createdAt: -1 }),
      Decision.findOne({ proposalId: proposal._id })
        .populate('decidedBy', 'displayName email role'),
      ImplementationRecord.findOne({ proposalId: proposal._id }),
      Document.find({ proposalId: proposal._id })
        .populate('uploadedBy', 'displayName email'),
    ]);

    res.json({
      success: true,
      data: {
        proposal,
        events,
        observations,
        decision,
        implementation,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProposal(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    if (proposal.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Proposal cannot be edited in current status '${proposal.status}'. Only 'Draft' proposals may be modified.`,
      });
    }

    if (proposal.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permissions to edit this draft.',
      });
    }

    Object.assign(proposal, req.body);
    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal draft updated.',
      data: { proposal },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitProposal(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await ProposalLifecycleService.submitProposal(proposal, req.user, reqMeta);

    res.json({
      success: true,
      message: 'Proposal submitted successfully for review.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function addObservation(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };

    // Record observation
    const observation = await Observation.create({
      proposalId: proposal._id,
      reviewerId: req.user._id,
      text: req.body.text,
      type: req.body.type || 'Review Observation',
      linkedDocumentIds: req.body.linkedDocumentIds || [],
      proposalVersion: proposal.currentVersion,
    });

    // If currently Submitted, move to Under Review automatically
    if (proposal.status === 'Submitted') {
      await ProposalLifecycleService.markUnderReview(proposal, req.user, 'Review observation added', reqMeta);
    }

    res.status(201).json({
      success: true,
      message: 'Review observation logged.',
      data: { observation, proposal },
    });
  } catch (error) {
    next(error);
  }
}

export async function requestClarification(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await ProposalLifecycleService.requestClarification(
      proposal,
      req.user,
      req.body.text,
      reqMeta
    );

    // Also record as observation
    await Observation.create({
      proposalId: proposal._id,
      reviewerId: req.user._id,
      text: `[Clarification Requested]: ${req.body.text}`,
      type: 'Clarification Request',
      proposalVersion: proposal.currentVersion,
    });

    res.json({
      success: true,
      message: 'Clarification query registered and dispatched to author.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function resubmitProposal(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };
    const { responseExplanation, ...updates } = req.body;

    const result = await ProposalLifecycleService.resubmitProposal(
      proposal,
      req.user,
      responseExplanation,
      updates,
      reqMeta
    );

    res.json({
      success: true,
      message: 'Proposal successfully resubmitted with clarification response.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function recordDecision(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await ProposalLifecycleService.recordDecision(
      proposal,
      req.user,
      req.body,
      reqMeta
    );

    res.json({
      success: true,
      message: `Formal decision recorded: ${req.body.outcome}.`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateImplementation(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await ProposalLifecycleService.updateImplementation(
      proposal,
      req.user,
      req.body,
      reqMeta
    );

    res.json({
      success: true,
      message: 'Implementation details updated.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function closeProposal(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await ProposalLifecycleService.closeProposal(
      proposal,
      req.user,
      req.body.closureNotes,
      reqMeta
    );

    res.json({
      success: true,
      message: 'Proposal closed and archived into precedent knowledge base.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const [
      totalProposals,
      draftCount,
      underReviewCount,
      clarificationCount,
      approvedCount,
      rejectedCount,
      implementingCount,
      implementedCount,
      closedCount,
      recentProposals,
    ] = await Promise.all([
      Proposal.countDocuments(),
      Proposal.countDocuments({ status: 'Draft' }),
      Proposal.countDocuments({ status: { $in: ['Submitted', 'Under Review', 'Resubmitted'] } }),
      Proposal.countDocuments({ status: 'Clarification Requested' }),
      Proposal.countDocuments({ status: 'Approved' }),
      Proposal.countDocuments({ status: 'Rejected' }),
      Proposal.countDocuments({ status: 'Implementation In Progress' }),
      Proposal.countDocuments({ status: 'Implemented' }),
      Proposal.countDocuments({ status: 'Closed' }),
      Proposal.find()
        .populate('departmentId', 'name')
        .populate('createdBy', 'displayName')
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        metrics: {
          totalProposals,
          draftCount,
          awaitingReviewCount: underReviewCount,
          clarificationCount,
          approvedCount,
          rejectedCount,
          implementingCount,
          implementedCount,
          closedCount,
        },
        statusDistribution: [
          { name: 'Draft', count: draftCount },
          { name: 'Review / In Queue', count: underReviewCount },
          { name: 'Clarification Requested', count: clarificationCount },
          { name: 'Approved', count: approvedCount },
          { name: 'Implementation', count: implementingCount },
          { name: 'Implemented / Closed', count: implementedCount + closedCount },
          { name: 'Rejected', count: rejectedCount },
        ],
        recentProposals,
      },
    });
  } catch (error) {
    next(error);
  }
}
