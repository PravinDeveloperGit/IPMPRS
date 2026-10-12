import fs from 'fs';
import path from 'path';

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  audit: (action, actor, resource, outcome = 'SUCCESS') => {
    console.log(`[AUDIT] ${new Date().toISOString()} - [${action}] by [${actor}] on [${resource}] -> ${outcome}`);
  }
};
