import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { seedDatabase } from '../scripts/seed.js';

test('Authentication & RBAC Suite', async (t) => {
  await connectDatabase();
  await seedDatabase(true);

  let officerToken = '';
  let reviewerToken = '';
  let approverToken = '';

  await t.test('POST /api/auth/login - Success for Officer Creator', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'officer@police.gov.in',
        password: 'Police@2026',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'OFFICER_CREATOR');
    officerToken = res.body.data.token;
  });

  await t.test('POST /api/auth/login - Success for Approving Authority', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'approver@police.gov.in',
        password: 'Police@2026',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.role, 'APPROVING_AUTHORITY');
    approverToken = res.body.data.token;
  });

  await t.test('POST /api/auth/login - Failure on Invalid Password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'officer@police.gov.in',
        password: 'WrongPassword!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('GET /api/auth/me - Access profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${officerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.email, 'officer@police.gov.in');
  });

  await t.test('GET /api/users - Non-Admin is Forbidden (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${officerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  t.after(async () => {
    await disconnectDatabase();
  });
});
