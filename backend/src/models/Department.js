import mongoose from 'mongoose';
import { createModelProxy, pureDepartments } from './storeProxy.js';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MongooseDepartment = mongoose.model('Department', departmentSchema);
export const Department = createModelProxy(MongooseDepartment, pureDepartments);
