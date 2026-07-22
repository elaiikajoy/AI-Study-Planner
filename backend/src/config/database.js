/**
 * Pure JSON File Database — no MongoDB required.
 * All data is stored in backend/data/db.json
 * Supports basic CRUD operations with UUID-based IDs.
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../data/db.json');

const INITIAL_DB = {
  users: [],
  subjects: [],
  availability: [],
  deadlines: [],
  studyPlans: [],
  studySessions: [],
  notifications: []
};

// ── Load / Save ──────────────────────────────────────────────────────────────
function load() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2));
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Collection Helper ────────────────────────────────────────────────────────
class Collection {
  constructor(name) {
    this.name = name;
  }

  _db() { return load(); }

  findAll(query = {}) {
    const db = this._db();
    const items = db[this.name] || [];
    return items.filter(item => matchesQuery(item, query));
  }

  findOne(query = {}) {
    return this.findAll(query)[0] || null;
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  create(data) {
    const db = this._db();
    const now = new Date().toISOString();
    const item = { _id: uuidv4(), ...data, createdAt: now, updatedAt: now };
    db[this.name] = db[this.name] || [];
    db[this.name].push(item);
    save(db);
    return item;
  }

  updateById(id, updates) {
    const db = this._db();
    const idx = (db[this.name] || []).findIndex(i => i._id === id);
    if (idx === -1) return null;
    db[this.name][idx] = { ...db[this.name][idx], ...updates, updatedAt: new Date().toISOString() };
    save(db);
    return db[this.name][idx];
  }

  deleteById(id) {
    const db = this._db();
    const idx = (db[this.name] || []).findIndex(i => i._id === id);
    if (idx === -1) return null;
    const [removed] = db[this.name].splice(idx, 1);
    save(db);
    return removed;
  }

  deleteMany(query = {}) {
    const db = this._db();
    const before = (db[this.name] || []).length;
    db[this.name] = (db[this.name] || []).filter(item => !matchesQuery(item, query));
    save(db);
    return before - db[this.name].length;
  }

  insertMany(items) {
    const db = this._db();
    const now = new Date().toISOString();
    const created = items.map(data => ({ _id: uuidv4(), ...data, createdAt: now, updatedAt: now }));
    db[this.name] = [...(db[this.name] || []), ...created];
    save(db);
    return created;
  }

  count(query = {}) {
    return this.findAll(query).length;
  }
}

// ── Simple query matcher ─────────────────────────────────────────────────────
function matchesQuery(item, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      if (!val.some(sub => matchesQuery(item, sub))) return false;
      continue;
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      // Operators: $in, $nin, $gte, $lte, $lt, $gt, $ne
      const itemVal = item[key];
      for (const [op, opVal] of Object.entries(val)) {
        if (op === '$in'  && !opVal.includes(itemVal)) return false;
        if (op === '$nin' &&  opVal.includes(itemVal)) return false;
        if (op === '$gte' && !(itemVal >= opVal)) return false;
        if (op === '$lte' && !(itemVal <= opVal)) return false;
        if (op === '$lt'  && !(itemVal <  opVal)) return false;
        if (op === '$gt'  && !(itemVal >  opVal)) return false;
        if (op === '$ne'  &&  (itemVal === opVal)) return false;
      }
      continue;
    }
    if (item[key] !== val) return false;
  }
  return true;
}

// ── Collections ──────────────────────────────────────────────────────────────
const db = {
  users:         new Collection('users'),
  subjects:      new Collection('subjects'),
  availability:  new Collection('availability'),
  deadlines:     new Collection('deadlines'),
  studyPlans:    new Collection('studyPlans'),
  studySessions: new Collection('studySessions'),
  notifications: new Collection('notifications'),
};

module.exports = db;
