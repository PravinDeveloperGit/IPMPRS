import { Proposal } from '../models/Proposal.js';
import { AIClientService } from '../services/aiClientService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { env } from '../config/env.js';
import axios from 'axios';

export async function generateProposalReport(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('departmentId')
      .populate('createdBy');

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    const report = await AIClientService.generatePrecedentReport(proposal);

    await recordAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'GENERATE_AI_PRECEDENT_REPORT',
      resourceType: 'Proposal',
      resourceId: proposal._id.toString(),
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        proposalId: proposal.proposalId,
        citationsCount: report.citations?.length || 0,
        hasSufficientEvidence: report.hasSufficientEvidence,
      },
    });

    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAiHealth(req, res, next) {
  try {
    let aiServiceOnline = false;
    let aiDetails = null;

    try {
      const response = await axios.get(`${env.AI_SERVICE_URL}/health`, { timeout: 2000 });
      aiServiceOnline = response.status === 200;
      aiDetails = response.data;
    } catch (e) {
      aiServiceOnline = false;
    }

    res.json({
      success: true,
      data: {
        aiServiceUrl: env.AI_SERVICE_URL,
        aiServiceOnline,
        llmProvider: env.LLM_PROVIDER,
        llmModel: env.LLM_MODEL,
        localHybridEngineActive: true,
        aiDetails,
      },
    });
  } catch (error) {
    next(error);
  }
}
