import { AIClientService } from '../services/aiClientService.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function searchPrecedents(req, res, next) {
  try {
    const { query, category, departmentId, outcome, limit = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query text is required.',
      });
    }

    const startTime = Date.now();
    const result = await AIClientService.searchPrecedents({
      query,
      category,
      departmentId,
      outcome,
      limit: parseInt(limit, 10),
    });

    await recordAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'SEARCH_PRECEDENTS',
      resourceType: 'PrecedentIndex',
      resourceId: null,
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        category,
        resultCount: result.results.length,
        latencyMs: Date.now() - startTime,
        engineSource: result.source,
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
