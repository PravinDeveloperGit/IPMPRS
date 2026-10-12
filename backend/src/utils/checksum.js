import crypto from 'crypto';
import fs from 'fs';

export function calculateBufferChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function calculateFileChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}
