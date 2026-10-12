import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../../storage/db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function matchQuery(doc, query = {}) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      const matchAny = val.some(subQuery => matchQuery(doc, subQuery));
      if (!matchAny) return false;
      continue;
    }

    if (key === '$text') {
      const search = (val.$search || '').toLowerCase();
      const docStr = JSON.stringify(doc).toLowerCase();
      if (!docStr.includes(search)) return false;
      continue;
    }

    const docVal = doc[key];

    if (val && typeof val === 'object') {
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || '');
        if (!regex.test(String(docVal || ''))) return false;
        continue;
      }
      if (val.$in) {
        const docValStr = docVal?._id ? String(docVal._id) : String(docVal);
        const inMatch = val.$in.some(v => String(v) === docValStr);
        if (!inMatch) return false;
        continue;
      }
      if (val.$options && val.$regex) {
        continue;
      }
    }

    const docStr = docVal?._id ? String(docVal._id) : String(docVal ?? '');
    const valStr = val?._id ? String(val._id) : String(val ?? '');

    if (docStr !== valStr) {
      return false;
    }
  }
  return true;
}

class QueryCursor {
  constructor(collection, query = {}) {
    this.collection = collection;
    this.query = query;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populate = [];
  }

  sort(sortCriteria) {
    this._sort = sortCriteria;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  populate(path, select) {
    this._populate.push({ path, select });
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    let results = this.collection.data.filter(item => matchQuery(item, this.query));

    if (this._sort) {
      const [key, dir] = Object.entries(this._sort)[0] || ['createdAt', -1];
      results.sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
        return 0;
      });
    }

    if (this._skip) {
      results = results.slice(this._skip);
    }

    if (this._limit !== null) {
      results = results.slice(0, this._limit);
    }

    // Populate references if registered
    for (const pop of this._populate) {
      const targetCol = this.collection.store.getCollection(pop.path.replace('Id', 's').replace('Ids', 's'));
      if (targetCol) {
        results = results.map(doc => {
          const clone = { ...doc };
          if (Array.isArray(clone[pop.path])) {
            clone[pop.path] = clone[pop.path].map(refId => targetCol.findByIdSync(refId) || refId);
          } else if (clone[pop.path]) {
            clone[pop.path] = targetCol.findByIdSync(clone[pop.path]) || clone[pop.path];
          }
          return clone;
        });
      }
    }

    return results.map(item => this.collection.wrapInstance(item));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

class SingleQueryCursor {
  constructor(collection, query = {}) {
    this.collection = collection;
    this.query = query;
    this._populate = [];
  }

  populate(path, select) {
    this._populate.push({ path, select });
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    let item = this.collection.data.find(d => matchQuery(d, this.query));
    if (!item) return null;

    let wrapped = { ...item };
    for (const pop of this._populate) {
      // Map reference to collection
      let colName = pop.path;
      if (pop.path === 'departmentId') colName = 'departments';
      else if (pop.path === 'createdBy' || pop.path === 'reviewerId' || pop.path === 'decidedBy' || pop.path === 'actorId' || pop.path === 'uploadedBy') colName = 'users';
      else if (pop.path === 'assignedReviewerIds') colName = 'users';
      else if (pop.path === 'proposalId') colName = 'proposals';
      else if (pop.path === 'documentId') colName = 'documents';

      const targetCol = this.collection.store.getCollection(colName);
      if (targetCol) {
        if (Array.isArray(wrapped[pop.path])) {
          wrapped[pop.path] = wrapped[pop.path].map(refId => targetCol.findByIdSync(refId) || refId);
        } else if (wrapped[pop.path]) {
          wrapped[pop.path] = targetCol.findByIdSync(wrapped[pop.path]) || wrapped[pop.path];
        }
      }
    }

    return this.collection.wrapInstance(wrapped);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

export class PureCollection {
  constructor(name, store, customMethods = {}) {
    this.name = name;
    this.store = store;
    this.filePath = path.join(DB_DIR, `${name}.json`);
    this.data = this.loadData();
    this.customMethods = customMethods;
  }

  loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (e) {
      // fallback
    }
    return [];
  }

  saveData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error(`Error persisting collection ${this.name}:`, e.message);
    }
  }

  wrapInstance(raw) {
    if (!raw) return null;
    const instance = { ...raw };
    const self = this;

    instance.save = async function () {
      const idx = self.data.findIndex(d => String(d._id) === String(instance._id));
      instance.updatedAt = new Date();
      if (idx !== -1) {
        self.data[idx] = { ...instance };
      } else {
        self.data.push({ ...instance });
      }
      self.saveData();
      return instance;
    };

    // Attach custom methods
    for (const [methodName, fn] of Object.entries(this.customMethods)) {
      instance[methodName] = fn.bind(instance);
    }

    return instance;
  }

  find(query = {}) {
    return new QueryCursor(this, query);
  }

  findOne(query = {}) {
    return new SingleQueryCursor(this, query);
  }

  findById(id) {
    const strId = String(id?._id || id);
    return new SingleQueryCursor(this, { _id: strId });
  }

  findByIdSync(id) {
    const strId = String(id?._id || id);
    const found = this.data.find(d => String(d._id) === strId);
    return found ? { ...found } : null;
  }

  async countDocuments(query = {}) {
    return this.data.filter(d => matchQuery(d, query)).length;
  }

  async create(doc) {
    const newDoc = {
      _id: doc._id ? String(doc._id) : crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.data.push(newDoc);
    this.saveData();
    return this.wrapInstance(newDoc);
  }

  async insertMany(docs = []) {
    const created = [];
    for (const d of docs) {
      const newDoc = {
        _id: d._id ? String(d._id) : crypto.randomUUID(),
        ...d,
        createdAt: d.createdAt || new Date(),
        updatedAt: new Date(),
      };
      this.data.push(newDoc);
      created.push(this.wrapInstance(newDoc));
    }
    this.saveData();
    return created;
  }

  async findOneAndUpdate(query, update, options = {}) {
    let idx = this.data.findIndex(d => matchQuery(d, query));
    if (idx === -1) {
      if (options.upsert) {
        const created = await this.create({ ...query, ...update });
        return created;
      }
      return null;
    }

    const current = this.data[idx];
    const updated = {
      ...current,
      ...update,
      updatedAt: new Date(),
    };
    this.data[idx] = updated;
    this.saveData();
    return this.wrapInstance(updated);
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      const count = this.data.length;
      this.data = [];
      this.saveData();
      return { deletedCount: count };
    }
    const before = this.data.length;
    this.data = this.data.filter(d => !matchQuery(d, query));
    this.saveData();
    return { deletedCount: before - this.data.length };
  }
}

class PureStore {
  constructor() {
    this.collections = new Map();
  }

  registerCollection(name, customMethods = {}) {
    let col = this.collections.get(name);
    if (!col) {
      col = new PureCollection(name, this, customMethods);
      this.collections.set(name, col);
    }
    return col;
  }

  getCollection(name) {
    return this.collections.get(name);
  }
}

export const pureStore = new PureStore();
