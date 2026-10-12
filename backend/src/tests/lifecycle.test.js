import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { seedDatabase } from '../scripts/seed.js';

test('Proposal Lifecycle & State Machine Suite', async (t) => {
  await connectDatabase();
  await seedDatabase(true);

  let officerToken = '';
  let reviewerToken = '';
  let approverToken = '';
  let createdProposalId = '';
  let deptId = '';

  // Login tokens
  const offRes = await request(app).post('/api/auth/login').send({ email: 'officer@police.gov.in', password: 'Police@2026' });
  officerToken = offRes.body.data.token;
  deptId = offRes.body.data.user.departmentId?._id || offRes.body.data.user.departmentId;

  const revRes = await request(app).post('/api/auth/login').send({ email: 'reviewer@police.gov.in', password: 'Police@2026' });
  reviewerToken = revRes.body.data.token;

  const appRes = await request(app).post('/api/auth/login').send({ email: 'approver@police.gov.in', password: 'Police@2026' });
  approverToken = appRes.body.data.token;

  await t.test('1. Create Draft Proposal as Officer', async () => {
    const res = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        title: 'Deployment of High-Speed Drone Corridor for East Coast Road',
        summary: 'Establishment of automated drone battery swap stations and surveillance routes.',
        problemStatement: 'Monitoring long stretches of rural highway where static CCTV is economically non-viable.',
        category: 'Operational Equipment & Vehicles',
        departmentId: deptId,
        proposedBudget: 3500000,
        implementationTimeline: '4 Months',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.proposal.status, 'Draft');
    createdProposalId = res.body.data.proposal._id;
  });

  await t.test('2. Attempt Illegal Direct Approval on Draft -> Rejects (400 or state error)', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdProposalId}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({
        outcome: 'Approved',
        reason: 'Attempting to skip review and jump straight to approve',
        approvedAmount: 3500000,
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Illegal workflow transition/);
  });

  await t.test('3. Submit Proposal Draft -> Moves to Submitted', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdProposalId}/submit`)
      .set('Authorization', `Bearer ${officerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.proposal.status, 'Submitted');
  });

  await t.test('4. Reviewer records observation -> Moves to Under Review', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdProposalId}/observations`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        text: 'Initial technical feasibility looks sound. Battery charging hubs require municipal line sync.',
        type: 'Review Observation',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.proposal.status, 'Under Review');
  });

  await t.test('5. Reviewer requests clarification -> Moves to Clarification Requested', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdProposalId}/clarification`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        text: 'Please clarify wind tolerance limits during monsoon season and DGCA airspace permissions.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.proposal.status, 'Clarification Requested');
  });

  await t.test('6. Officer responds and resubmits -> Moves to Under Review with Version 2', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdProposalId}/resubmit`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        responseExplanation: 'Drones are IP-54 rated for up to 45km/h wind gusts. DGCA pre-approval filed under government category.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.proposal.status, 'Under Review');
    assert.equal(res.body.data.proposal.currentVersion, 2);
  });

  await t.test('7. Approving Authority sanctions -> Moves to Approved with Decision record', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdProposalId}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({
        outcome: 'Approved',
        reason: 'Sanctioned with reduced scope of 2 base stations initially.',
        approvedAmount: 3200000,
        conditions: 'Bi-monthly flight safety audit required.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.proposal.status, 'Approved');
    assert.equal(res.body.data.decision.outcome, 'Approved');
    assert.equal(res.body.data.decision.approvedAmount, 3200000);
  });

  t.after(async () => {
    await disconnectDatabase();
  });
});
