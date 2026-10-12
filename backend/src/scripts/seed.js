import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Proposal } from '../models/Proposal.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { Decision } from '../models/Decision.js';
import { ImplementationRecord } from '../models/ImplementationRecord.js';
import { WorkflowEvent } from '../models/WorkflowEvent.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { logger } from '../utils/logger.js';
import { calculateBufferChecksum } from '../utils/checksum.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase(force = false) {
  logger.info('[Seed] Initializing departmental data seed...');

  if (force) {
    logger.warn('[Seed] Force flag active. Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Proposal.deleteMany({}),
      Document.deleteMany({}),
      DocumentChunk.deleteMany({}),
      Decision.deleteMany({}),
      ImplementationRecord.deleteMany({}),
      WorkflowEvent.deleteMany({}),
      AuditEvent.deleteMany({}),
    ]);
  }

  // 1. Seed Departments
  const departmentsData = [
    { code: 'TRAFFIC_TECH', name: 'Technical & Traffic Surveillance Wing', description: 'Oversees CCTV networks, automated traffic enforcement, and IT infrastructure.' },
    { code: 'ADMIN_HQ', name: 'Administration & Headquarters', description: 'Central administrative commands, police station logistical maintenance, and HR sanctions.' },
    { code: 'CRIME_CID', name: 'Crime Investigation Division', description: 'Specialized criminal forensics, intelligence collation, and major crime tracking.' },
    { code: 'COASTAL_POLICE', name: 'Coastal & Marine Police', description: 'Maritime surveillance, coastal boundary safety, and beach patrol operations.' },
    { code: 'RURAL_DIV', name: 'Rural Sub-Division', description: 'Outlying suburban and agricultural police stations and community outposts.' },
  ];

  const deptMap = {};
  for (const dept of departmentsData) {
    let d = await Department.findOne({ code: dept.code });
    if (!d) {
      d = await Department.create(dept);
      logger.info(`[Seed] Created department: ${dept.name}`);
    }
    deptMap[dept.code] = d;
  }

  // 2. Seed Users across all 6 roles
  const defaultPassword = 'Police@2026';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const demoUsers = [
    {
      displayName: 'Insp. R. Sundaralingam',
      email: 'officer@police.gov.in',
      role: 'OFFICER_CREATOR',
      departmentId: deptMap.TRAFFIC_TECH._id,
      badgeNumber: 'PY-INS-4012',
    },
    {
      displayName: 'SP K. Jayaprakash',
      email: 'reviewer@police.gov.in',
      role: 'REVIEWER',
      departmentId: deptMap.ADMIN_HQ._id,
      badgeNumber: 'PY-SP-1090',
    },
    {
      displayName: 'DIG M. Balasubramanian',
      email: 'approver@police.gov.in',
      role: 'APPROVING_AUTHORITY',
      departmentId: deptMap.ADMIN_HQ._id,
      badgeNumber: 'PY-DIG-0021',
    },
    {
      displayName: 'Admin S. Priya',
      email: 'knowledge@police.gov.in',
      role: 'KNOWLEDGE_ADMIN',
      departmentId: deptMap.TRAFFIC_TECH._id,
      badgeNumber: 'PY-KAD-5510',
    },
    {
      displayName: 'SysAdmin V. Karthik',
      email: 'admin@police.gov.in',
      role: 'SYSTEM_ADMIN',
      departmentId: deptMap.ADMIN_HQ._id,
      badgeNumber: 'PY-SYS-0001',
    },
    {
      displayName: 'Auditor N. Chandran',
      email: 'auditor@police.gov.in',
      role: 'AUDITOR',
      departmentId: deptMap.ADMIN_HQ._id,
      badgeNumber: 'PY-AUD-8802',
    },
  ];

  const userMap = {};
  for (const u of demoUsers) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      existing = await User.create({
        ...u,
        passwordHash,
        active: true,
      });
      logger.info(`[Seed] Created user: ${u.email} (${u.role})`);
    }
    userMap[u.role] = existing;
  }

  // 3. Load Synthetic Historical CCTV Proposals
  const syntheticPath = path.resolve(__dirname, '../../../data/synthetic/cctv_historical_proposals.json');
  let syntheticProposals = [];
  if (fs.existsSync(syntheticPath)) {
    syntheticProposals = JSON.parse(fs.readFileSync(syntheticPath, 'utf8'));
  }

  for (const item of syntheticProposals) {
    let prop = await Proposal.findOne({ proposalId: item.proposalId });
    const targetDept = deptMap[item.departmentCode] || deptMap.TRAFFIC_TECH;

    if (!prop) {
      prop = await Proposal.create({
        proposalId: item.proposalId,
        title: item.title,
        summary: item.summary,
        problemStatement: item.problemStatement,
        purposeAndJustification: `Mandatory departmental operational modernization initiative. Label: ${item.fictionalLabel}`,
        proposedSolution: `Deployment of standardized surveillance optical nodes with connectivity backhaul.`,
        category: item.category,
        departmentId: targetDept._id,
        createdBy: userMap.OFFICER_CREATOR._id,
        status: item.status,
        proposedBudget: item.proposedBudget,
        currency: item.currency || 'INR',
        implementationTimeline: item.implementationTimeline,
        currentVersion: 1,
        isSynthetic: true,
        isIndexedForPrecedents: true,
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
      });

      // Seed Decision
      if (item.outcome && item.outcome !== 'Pending') {
        const formalOutcome = item.outcome.startsWith('Closed') ? 'Rejected' : (item.outcome === 'Modified' ? 'Modified' : item.outcome);
        await Decision.create({
          proposalId: prop._id,
          outcome: formalOutcome,
          reason: item.decisionReason,
          decidedBy: userMap.APPROVING_AUTHORITY._id,
          decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          approvedAmount: item.decidedAmount || 0,
          currency: item.currency || 'INR',
          sourceReferences: item.sourceReferences || [],
          conditions: 'Subject to quarterly technical audit by technical inspection wing.',
        });
      }

      // Seed Implementation
      if (item.implementationStatus && item.implementationStatus !== 'Pending') {
        const formalImplStatus = item.implementationStatus === 'Implemented' ? 'Commissioned' : 'Initiated';
        await ImplementationRecord.create({
          proposalId: prop._id,
          status: formalImplStatus,
          actualCost: item.actualCost || 0,
          currency: item.currency || 'INR',
          outcome: item.implementationOutcome,
          milestones: [
            {
              title: 'Sanction Notice Issued',
              description: 'Official department memo circulated.',
              completed: true,
              completionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
            },
            {
              title: 'Field Verification and Commissioning',
              description: 'Inspection by nodal officer.',
              completed: item.implementationStatus === 'Implemented',
              completionDate: item.implementationStatus === 'Implemented' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) : null,
            },
          ],
          closureNotes: item.implementationOutcome,
        });
      }

      // Create synthetic document and chunk
      const docChecksum = calculateBufferChecksum(Buffer.from(`${prop.proposalId}-${prop.title}`));
      const doc = await Document.create({
        documentId: `DOC-${prop.proposalId}`,
        proposalId: prop._id,
        title: item.sourceReferences?.[0]?.documentTitle || `Sanction Order for ${prop.proposalId}`,
        sourceType: 'Historical Government Sanction Order',
        storageKey: `synthetic_${prop.proposalId}.txt`,
        originalFilename: `Sanction_Order_${prop.proposalId}.pdf`,
        fileSize: 1024 * 45,
        checksum: docChecksum,
        mimeType: 'application/pdf',
        accessLevel: 'Internal Department',
        processingStatus: 'Indexed',
        pageCount: item.sourceReferences?.[0]?.pageNumber || 3,
        chunkCount: 2,
        uploadedBy: userMap.KNOWLEDGE_ADMIN._id,
        isSynthetic: true,
      });

      // Create document chunks for text and semantic retrieval
      await DocumentChunk.create([
        {
          documentId: doc._id,
          chunkId: `${doc.documentId}-CHK-001`,
          text: `[OFFICIAL CASE RECORD: ${prop.proposalId}] Title: ${prop.title}. Summary: ${prop.summary}. Problem Statement: ${prop.problemStatement}. Category: ${prop.category}. Department: ${targetDept.name}.`,
          pageNumber: 1,
          sectionTitle: 'Executive Summary and Project Background',
          isSynthetic: true,
        },
        {
          documentId: doc._id,
          chunkId: `${doc.documentId}-CHK-002`,
          text: `[OFFICIAL SANCTION RECORD: ${prop.proposalId}] Decision Outcome: ${item.outcome}. Approved Budget: Rs.${item.decidedAmount || 0}. Justification Reason: ${item.decisionReason}. Implementation Status: ${item.implementationStatus}. Outcome Report: ${item.implementationOutcome}. Keywords: ${(item.keywords || []).join(', ')}.`,
          pageNumber: item.sourceReferences?.[0]?.pageNumber || 2,
          sectionTitle: 'Financial Sanction and Technical Guidelines',
          isSynthetic: true,
        },
      ]);

      // Seed Initial Workflow Events
      await WorkflowEvent.create([
        {
          proposalId: prop._id,
          actorId: userMap.OFFICER_CREATOR._id,
          action: 'SUBMIT',
          fromStatus: 'Draft',
          toStatus: 'Submitted',
          reason: 'Initial proposal submission.',
          proposalVersion: 1,
        },
        {
          proposalId: prop._id,
          actorId: userMap.REVIEWER._id,
          action: 'BEGIN_REVIEW',
          fromStatus: 'Submitted',
          toStatus: 'Under Review',
          reason: 'Review commenced by technical scrutiny team.',
          proposalVersion: 1,
        },
      ]);

      logger.info(`[Seed] Seeded historical proposal: ${prop.proposalId} (${prop.status})`);
    }
  }

  // 4. Create an active live proposal currently awaiting review for live hackathon testing!
  const activeDraft = await Proposal.findOne({ proposalId: 'PROP-2026-0001' });
  if (!activeDraft) {
    const liveProp = await Proposal.create({
      proposalId: 'PROP-2026-0001',
      title: 'High-Resolution Smart CCTV Network for White Town Heritage Corridor & Promenade Beach',
      summary: 'Installation of 50 intelligent IP PTZ night-vision cameras with optical zoom and edge analytics across White Town, Dumas Street, and Goubert Avenue to bolster tourist security and heritage asset preservation.',
      problemStatement: 'Substantial weekend tourist influx results in heavy pedestrian density and occasional vehicular parking blockages along Goubert Avenue, with blind spots during low-light nighttime periods.',
      purposeAndJustification: 'Vital for enhancing law enforcement response times, ensuring tourist safety, and curbing vehicular violations in French Quarter heritage zones.',
      proposedSolution: 'Installation of 50 IP-66 waterproof optical cameras linked through dedicated fiber to the Central Police Control Room (PCR), with 60-day local NAS retention.',
      category: 'Infrastructure & Surveillance',
      departmentId: deptMap.TRAFFIC_TECH._id,
      createdBy: userMap.OFFICER_CREATOR._id,
      status: 'Under Review',
      proposedBudget: 5200000,
      currency: 'INR',
      implementationTimeline: '5 Months',
      currentVersion: 1,
      submittedAt: new Date(),
    });

    await WorkflowEvent.create({
      proposalId: liveProp._id,
      actorId: userMap.OFFICER_CREATOR._id,
      action: 'SUBMIT',
      fromStatus: 'Draft',
      toStatus: 'Submitted',
      reason: 'Submitted for scrutiny.',
      proposalVersion: 1,
    });

    await WorkflowEvent.create({
      proposalId: liveProp._id,
      actorId: userMap.REVIEWER._id,
      action: 'BEGIN_REVIEW',
      fromStatus: 'Submitted',
      toStatus: 'Under Review',
      reason: 'Under active technical scrutiny.',
      proposalVersion: 1,
    });

    logger.info(`[Seed] Created live test proposal: ${liveProp.proposalId}`);
  }

  // 5. Seed BPR&D Official National Publications & Curated Chunks
  const bprdDocsPath = path.resolve(__dirname, '../../../data/bprd/documents.json');
  const bprdChunksPath = path.resolve(__dirname, '../../../data/bprd/chunks.jsonl');
  const storageDir = path.resolve(__dirname, '../../storage/documents');

  if (fs.existsSync(bprdDocsPath)) {
    logger.info('[Seed] Seeding BPR&D Official National Publications...');
    const bprdDocs = JSON.parse(fs.readFileSync(bprdDocsPath, 'utf8'));

    const bprdDocMap = {};
    for (const bDoc of bprdDocs) {
      let existingDoc = await Document.findOne({ documentId: bDoc.documentId });
      let fileSize = 1024 * (bDoc.totalPages || 20) * 15;
      const physicalFilePath = path.join(storageDir, bDoc.originalFilename);
      if (fs.existsSync(physicalFilePath)) {
        try {
          fileSize = fs.statSync(physicalFilePath).size;
        } catch (e) {
          // fallback
        }
      }

      if (!existingDoc) {
        existingDoc = await Document.create({
          documentId: bDoc.documentId,
          proposalId: null,
          title: bDoc.title,
          sourceType: 'BPR&D Official National Publication',
          storageKey: bDoc.originalFilename,
          originalFilename: bDoc.originalFilename,
          fileSize,
          checksum: bDoc.checksum || calculateBufferChecksum(Buffer.from(bDoc.documentId)),
          mimeType: 'application/pdf',
          accessLevel: 'Public Reference',
          processingStatus: 'Indexed',
          pageCount: bDoc.totalPages || 1,
          chunkCount: 0,
          uploadedBy: userMap.KNOWLEDGE_ADMIN._id,
          isSynthetic: false,
          metadata: {
            author: bDoc.author,
            issuingOrganization: bDoc.issuingOrganization,
            publicationDate: bDoc.publicationDate,
            documentType: bDoc.documentType,
            qualityFlags: bDoc.qualityFlags || [],
          },
        });
        logger.info(`[Seed] Ingested BPR&D Document: ${bDoc.documentId} - ${bDoc.title}`);
      }
      bprdDocMap[bDoc.documentId] = existingDoc;
    }

    // Seed Curated Chunks
    if (fs.existsSync(bprdChunksPath)) {
      const chunkLines = fs.readFileSync(bprdChunksPath, 'utf8').split('\n').filter(Boolean);
      for (const line of chunkLines) {
        try {
          const chunkData = JSON.parse(line);
          const parentDoc = bprdDocMap[chunkData.documentId];
          if (parentDoc) {
            const existingChunk = await DocumentChunk.findOne({ chunkId: chunkData.chunkId });
            if (!existingChunk) {
              await DocumentChunk.create({
                documentId: parentDoc._id,
                chunkId: chunkData.chunkId,
                text: chunkData.text,
                pageNumber: chunkData.pageStart || 1,
                sectionTitle: chunkData.sectionTitle || 'Official Standards & Guidelines',
                tokenCount: chunkData.tokenCount || 150,
                isSynthetic: false,
              });
            }
          }
        } catch (err) {
          logger.warn(`[Seed] Error parsing chunk line: ${err.message}`);
        }
      }
      logger.info(`[Seed] Ingested ${chunkLines.length} curated forensic chunks from BPR&D dataset.`);
    }
  }

  // 6. Seed Forensic & Cyber Precedents Grounded in BPR&D Official Standards
  const forensicPrecedents = [
    {
      proposalId: 'PROP-SYN-2024-0512',
      title: 'Digital Forensics Live Acquisition Workstation & BitLocker Decryption Kits for District Cyber Cell',
      summary: 'Procurement of specialized write-blocker hardware and field laptops for live Windows RAM dumps, BitLocker manage-bde decryption, and FTK Imager E01 disk capture across cyber cells.',
      problemStatement: 'Investigating officers encountered encrypted Windows laptops at financial fraud scenes without recovery keys, risking volatile RAM evidence loss upon shutdown.',
      purposeAndJustification: 'Adherence to BPR&D First Responder Handbook Vol 1 forensic methodologies for powered-on Windows crime scene seizures.',
      proposedSolution: 'Deploy field forensic acquisition kits equipped with manage-bde administrative execution scripts and FTK Imager E01 verification workflows.',
      category: 'Crime Investigation & Forensics',
      departmentCode: 'CRIME_CID',
      proposedBudget: 3200000,
      currency: 'INR',
      implementationTimeline: '4 Months',
      status: 'Closed',
      outcome: 'Approved',
      decidedAmount: 2950000,
      decisionReason: 'Sanctioned compliant with BPR&D First Responder Handbook (BPRD-DOC-0002). Standard mandate requires zero-trace live acquisition and MD5/SHA-1 verification hashes.',
      implementationStatus: 'Implemented',
      implementationOutcome: 'Deployed 12 field acquisition stations across regional cyber crime divisions. 100% evidentiary hash admissibility achieved in judicial proceedings.',
      actualCost: 2890000,
      sourceReferences: [
        {
          documentTitle: 'BPR&D First Responder Handbook - Computer System Acquisition (Vol. 1)',
          pageNumber: 32,
          sectionTitle: 'System Acquisition: Windows Live BitLocker Disabling',
        },
      ],
      keywords: ['BitLocker', 'manage-bde', 'FTK Imager', 'E01', 'forensics', 'RAM capture', 'dcfldd'],
    },
    {
      proposalId: 'PROP-SYN-2024-0618',
      title: 'Adaptive Multimedia Anti-Phishing Defense & User Verification Framework (MCSPU)',
      summary: 'Integration of Multimedia Content Set Particular to User (MCSPU) challenge-response architecture into online police citizen services portal to prevent Man-in-the-Browser credential theft.',
      problemStatement: 'Spike in spear-phishing and fake duplicate police citizen verification portals targeting citizens paying traffic challans.',
      purposeAndJustification: 'Implementing proactive Hard AI defense against MitB phishing proxies as documented in BPR&D National Webinar Proceedings.',
      proposedSolution: 'Deploy MCSPU dynamic image-embedded verification tokens that defeat automated bot credential harvesting.',
      category: 'Telecommunications & Cyber',
      departmentCode: 'TRAFFIC_TECH',
      proposedBudget: 1850000,
      currency: 'INR',
      implementationTimeline: '3 Months',
      status: 'Closed',
      outcome: 'Approved',
      decidedAmount: 1750000,
      decisionReason: 'Approved pursuant to BPR&D National Webinar Proceedings on Prevention of Phishing Crimes (BPRD-DOC-0003, Dr. Puneet Goyal session).',
      implementationStatus: 'Implemented',
      implementationOutcome: 'Integrated into citizen portal. Successfully mitigated 99.4% of automated phishing credential replay attempts.',
      actualCost: 1720000,
      sourceReferences: [
        {
          documentTitle: 'Proceedings of National Level Webinar on Prevention and Investigation of Phishing Crimes',
          pageNumber: 13,
          sectionTitle: 'Hard AI Problems Based Novel Adaptive Approach Against Phishing',
        },
      ],
      keywords: ['MCSPU', 'phishing', 'Man-in-the-Browser', 'CAPTCHA', 'adaptive authentication'],
    },
    {
      proposalId: 'PROP-SYN-2024-0733',
      title: 'Automated MMI Telecom Hijacking Alert & WhatsApp Verification Interceptor',
      summary: 'Public advisory system and telecom coordination filter for detecting unauthorized MMI call forwarding (*67* and *405*) used in WhatsApp account takeover crimes.',
      problemStatement: 'Surge in cyber extortion cases wherein victims are manipulated into dialing USSD strings that forward OTP verification calls to attackers.',
      purposeAndJustification: 'Implementing defensive counter-measures in line with BPR&D / I4C Advisory Bulletin on Latest WhatsApp Scams.',
      proposedSolution: 'Establish carrier telemetry alerts on high-frequency MMI call-forwarding transitions followed by instant SMS warnings.',
      category: 'Telecommunications & Cyber',
      departmentCode: 'CRIME_CID',
      proposedBudget: 1200000,
      currency: 'INR',
      implementationTimeline: '2 Months',
      status: 'Closed',
      outcome: 'Approved',
      decidedAmount: 1100000,
      decisionReason: 'Sanctioned following BPR&D Advisory Bulletin on Latest WhatsApp Scams (BPRD-DOC-0006).',
      implementationStatus: 'Implemented',
      implementationOutcome: 'Reduced WhatsApp account takeover complaints in Union Territory by 68% over two quarters.',
      actualCost: 1050000,
      sourceReferences: [
        {
          documentTitle: 'Latest WhatsApp Scams Advisory',
          pageNumber: 5,
          sectionTitle: 'WhatsApp Account Hijacking via MMI Call Forwarding Codes',
        },
      ],
      keywords: ['WhatsApp', 'MMI', 'call forwarding', '*67*', '*405*', 'OTP voice call', 'account hijacking'],
    },
    {
      proposalId: 'PROP-SYN-2023-0890',
      title: 'Perimeter Pulsed Electric Fence and Intrusion Detection System for Central Prison Complex',
      summary: 'Installation of high-voltage 10 kV HV-Plus pulsed perimeter fencing conforming strictly to IEC 60335-2-76 and IS 302-2-76 standards with 80,000 offline event controllers.',
      problemStatement: 'Outdated passive perimeter wall lacked active physical deterrence and automated perimeter breach notification during adverse weather conditions.',
      purposeAndJustification: 'Mandatory correctional infrastructure compliance as per BPR&D Compendium on Security Equipment in Prisons.',
      proposedSolution: 'Deploy dual-zone Live-Earth pulsed fence delivering <5 Joules with 1.1-second regulated pulses and automated escalation to 10 kV in HV Plus mode.',
      category: 'Infrastructure & Surveillance',
      departmentCode: 'ADMIN_HQ',
      proposedBudget: 6500000,
      currency: 'INR',
      implementationTimeline: '6 Months',
      status: 'Closed',
      outcome: 'Approved',
      decidedAmount: 5900000,
      decisionReason: 'Sanctioned in compliance with BPR&D Compendium on Security Equipment Used in Prisons (BPRD-DOC-0009). Must strictly adhere to <5 Joule safety envelope.',
      implementationStatus: 'Implemented',
      implementationOutcome: 'Commissioned across 800-meter outer perimeter boundary with central command console integration. Zero security breaches recorded.',
      actualCost: 5820000,
      sourceReferences: [
        {
          documentTitle: 'Compendium of Security Equipment Used in Prisons',
          pageNumber: 46,
          sectionTitle: 'Perimeter Pulse Fence Technical Specifications',
        },
      ],
      keywords: ['prison perimeter', 'pulsed fence', 'IEC 60335-2-76', 'IS 302-2-76', 'HV Plus', 'energizer'],
    },
  ];

  for (const fItem of forensicPrecedents) {
    let prop = await Proposal.findOne({ proposalId: fItem.proposalId });
    const targetDept = deptMap[fItem.departmentCode] || deptMap.CRIME_CID;

    if (!prop) {
      prop = await Proposal.create({
        proposalId: fItem.proposalId,
        title: fItem.title,
        summary: fItem.summary,
        problemStatement: fItem.problemStatement,
        purposeAndJustification: fItem.purposeAndJustification,
        proposedSolution: fItem.proposedSolution,
        category: fItem.category,
        departmentId: targetDept._id,
        createdBy: userMap.OFFICER_CREATOR._id,
        status: fItem.status,
        proposedBudget: fItem.proposedBudget,
        currency: fItem.currency || 'INR',
        implementationTimeline: fItem.implementationTimeline,
        currentVersion: 1,
        isSynthetic: true,
        isIndexedForPrecedents: true,
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      });

      // Decision
      await Decision.create({
        proposalId: prop._id,
        outcome: fItem.outcome,
        reason: fItem.decisionReason,
        decidedBy: userMap.APPROVING_AUTHORITY._id,
        decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        approvedAmount: fItem.decidedAmount,
        currency: 'INR',
        sourceReferences: fItem.sourceReferences,
        conditions: 'Adherence to national standards verified by technical inspection cell.',
      });

      // Implementation
      await ImplementationRecord.create({
        proposalId: prop._id,
        status: 'Commissioned',
        actualCost: fItem.actualCost,
        currency: 'INR',
        outcome: fItem.implementationOutcome,
        milestones: [
          {
            title: 'Technical Specification Vetting',
            description: 'Vetted against BPR&D guidelines.',
            completed: true,
            completionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          },
          {
            title: 'Commissioning & Handover',
            description: 'Operational validation complete.',
            completed: true,
            completionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          },
        ],
        closureNotes: fItem.implementationOutcome,
      });

      // Create linked chunk
      const docChecksum = calculateBufferChecksum(Buffer.from(`${prop.proposalId}-${prop.title}`));
      const doc = await Document.create({
        documentId: `DOC-${prop.proposalId}`,
        proposalId: prop._id,
        title: fItem.sourceReferences[0]?.documentTitle || `Sanction Order for ${prop.proposalId}`,
        sourceType: 'Historical Government Sanction Order',
        storageKey: `synthetic_${prop.proposalId}.txt`,
        originalFilename: `Sanction_Order_${prop.proposalId}.pdf`,
        fileSize: 1024 * 38,
        checksum: docChecksum,
        mimeType: 'application/pdf',
        accessLevel: 'Internal Department',
        processingStatus: 'Indexed',
        pageCount: fItem.sourceReferences[0]?.pageNumber || 2,
        chunkCount: 1,
        uploadedBy: userMap.KNOWLEDGE_ADMIN._id,
        isSynthetic: true,
      });

      await DocumentChunk.create({
        documentId: doc._id,
        chunkId: `${doc.documentId}-CHK-001`,
        text: `[OFFICIAL CASE RECORD: ${prop.proposalId}] Title: ${prop.title}. Summary: ${prop.summary}. Outcome: ${fItem.outcome}. Approved Budget: Rs.${fItem.decidedAmount}. Reason: ${fItem.decisionReason}. Implementation: ${fItem.implementationOutcome}. Keywords: ${(fItem.keywords || []).join(', ')}.`,
        pageNumber: fItem.sourceReferences[0]?.pageNumber || 1,
        sectionTitle: fItem.sourceReferences[0]?.sectionTitle || 'Official Decision Details',
        isSynthetic: true,
      });

      logger.info(`[Seed] Seeded forensic precedent proposal: ${prop.proposalId}`);
    }
  }

  logger.info('[Seed] Seeding sequence completed successfully.');
}


export async function seedDatabaseIfEmpty() {
  const count = await User.countDocuments();
  if (count === 0) {
    logger.info('[Seed] Database is uninitialized. Initiating automatic seed...');
    await seedDatabase(false);
  } else {
    logger.info(`[Seed] Database already contains ${count} users. Auto-seed bypassed.`);
  }
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase(true);
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
