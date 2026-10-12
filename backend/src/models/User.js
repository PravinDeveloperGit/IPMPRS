import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createModelProxy, pureUsers } from './storeProxy.js';

export const USER_ROLES = [
  'OFFICER_CREATOR',       // Department Officer / Proposal Creator
  'REVIEWER',              // Reviewer
  'APPROVING_AUTHORITY',   // Approving Authority
  'KNOWLEDGE_ADMIN',       // Knowledge Administrator
  'SYSTEM_ADMIN',          // System Administrator
  'AUDITOR',               // Auditor
];

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    badgeNumber: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
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
};

const MongooseUser = mongoose.model('User', userSchema);
export const User = createModelProxy(MongooseUser, pureUsers);
