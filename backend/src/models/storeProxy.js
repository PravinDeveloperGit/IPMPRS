import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { pureStore } from '../config/pureStore.js';

let pureMode = true; // default until mongoose establishes active connection

export function setPureMode(val) {
  pureMode = val;
}

export function isPureMode() {
  return pureMode;
}

// User Methods
const userMethods = {
  async comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  },
  toSafeObject() {
    return {
      id: this._id,
      displayName: this.displayName,
      email: this.email,
      role: this.role,
      departmentId: this.departmentId,
      badgeNumber: this.badgeNumber,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
};

// Collections in pure store
const pureUsers = pureStore.registerCollection('users', userMethods);
const pureDepartments = pureStore.registerCollection('departments');
const pureProposals = pureStore.registerCollection('proposals');
const pureDocuments = pureStore.registerCollection('documents');
const pureDocumentChunks = pureStore.registerCollection('document_chunks');
const pureObservations = pureStore.registerCollection('observations');
const pureDecisions = pureStore.registerCollection('decisions');
const pureWorkflowEvents = pureStore.registerCollection('workflow_events');
const pureImplementationRecords = pureStore.registerCollection('implementation_records');
const pureAuditEvents = pureStore.registerCollection('audit_events');

export function createModelProxy(mongooseModel, pureCollection) {
  return new Proxy(mongooseModel, {
    get(target, prop, receiver) {
      if (pureMode) {
        if (prop in pureCollection) {
          const val = pureCollection[prop];
          return typeof val === 'function' ? val.bind(pureCollection) : val;
        }
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export {
  pureUsers,
  pureDepartments,
  pureProposals,
  pureDocuments,
  pureDocumentChunks,
  pureObservations,
  pureDecisions,
  pureWorkflowEvents,
  pureImplementationRecords,
  pureAuditEvents,
};
