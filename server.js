#!/usr/bin/env node
/*
 * Carnet de repas — serveur
 * Aucune dépendance : Node.js 18 ou plus suffit.
 *
 * - Sert l'interface (dossier public/)
 * - Garde les données dans un fichier JSON (DATA_DIR/db.json), écrit de façon atomique
 * - API simple de documents : /api/state, /api/doc/:collection/:id, /api/import, /api/export
 * - Accès protégé par un mot de passe (variable PASSWORD) ; une session dure 1 an
 *
 * Licence MIT.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PASSWORD = process.env.PASSWORD || '';
const SECRET_FILE = path.join(DATA_DIR, '.secret');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const COLLECTIONS = ['recipes', 'months', 'courses', 'settings'];
const MAX_BODY = 5 * 1024 * 1024;
const SESSION_DAYS = 365;

fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ---------- secret pour signer les sessions ----------
let SECRET;
try { SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim(); } catch (e) { SECRET = ''; }
if (!SECRET) { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, SECRET, { mode: 0o600 }); }

// ---------- stockage ----------
function emptyDb() { const c = {}; COLLECTIONS.forEach(k => { c[k] = {}; }); return { rev: 1, collections: c }; }
let db;
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { db = null; }
if (!db || !db.collections) {
  db = emptyDb();
  const example = path.join(__dirname, 'exemple', 'exemple.json');
  if (fs.existsSync(example)) {
    try { importBundle(JSON.parse(fs.readFileSync(example, 'utf8')), 'replace'); db.example = true; } catch (e) { console.error('Exemple illisible :', e.message); }
  }
  saveNow();
}
COLLECTIONS.forEach(k => { if (!db.collections[k]) db.collections[k] = {}; });

let saveTimer = null;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
function saveNow() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
// une sauvegarde par jour, on garde les 30 dernières
function dailyBackup() {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const f = path.join(BACKUP_DIR, 'db-' + day + '.json');
    if (!fs.existsSync(f) && fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, f);
    const all = fs.readdirSync(BACKUP_DIR).filter(n => /^db-.*\.json$/.test(n)).sort();
    all.slice(0, Math.max(0, all.length - 30)).forEach(n => fs.unlinkSync(path.join(BACKUP_DIR, n)));
  } catch (e) { console.error('Sauvegarde :', e.message); }
}
dailyBackup();
setInterval(dailyBackup, 6 * 3600 * 1000);

function setDoc(col, id, data) {
  db.rev += 1;
  db.collections[col][id] = { data: data, rev: db.rev, deleted: false };
}
function deleteDoc(col, id) {
  if (!db.collections[col][id]) return;
  db.rev += 1;
  db.collections[col][id] = { data: null, rev: db.rev, deleted: true };
}
function mergeDeep(target, patch) {
  Object.keys(patch).forEach(k => {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) mergeDeep(target[k], v);
    else target[k] = v;
  });
  return target;
}
function importBundle(bundle, mode) {
  if (!bundle || typeof bundle !== 'object' || !bundle.collections) throw new Error('Fichier non reconnu : il manque « collections ».');
  let n = 0;
  if (mode === 'replace') {
    COLLECTIONS.forEach(col => Object.keys(db.collections[col]).forEach(id => deleteDoc(col, id)));
  }
  Object.keys(bundle.collections).forEach(col => {
    if (COLLECTIONS.indexOf(col) < 0) return;
    const docs = bundle.collections[col] || {};
    Object.keys(docs).forEach(id => {
      if (!validId(id)) return;
      const v = docs[id];
      if (v === null) deleteDoc(col, id);
      else if (typeof v === 'object') { setDoc(col, id, v); n++; }
    });
  });
  return n;
}
function exportBundle() {
  const out = { format: 'carnet-repas/1', exportedAt: new Date().toISOString(), collections: {} };
  COLLECTIONS.forEach(col => {
    out.collections[col] = {};
    Object.keys(db.collections[col]).forEach(id => { const d = db.collections[col][id]; if (!d.deleted) out.collections[col][id] = d.data; });
  });
  return out;
}
function stateSince(since) {
  const out = { rev: db.rev, collections: {} };
  COLLECTIONS.forEach(col => {
    const docs = {};
    Object.keys(db.collections[col]).forEach(id => {
      const d = db.collections[col][id];
      if (d.rev > since) docs[id] = d.deleted ? null : d.data;
    });
    out.collections[col] = docs;
  });
  return out;
}
function validId(id) { return typeof id === 'string' && /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(id) && id !== '.' && id !== '..'; }

// ---------- sessions ----------
function sign(v) { return crypto.createHmac('sha256', SECRET).update(v).digest('hex'); }
function makeToken() { const exp = Date.now() + SESSION_DAYS * 864e5; const v = 'v1.' + exp; return v + '.' + sign(v); }
function tokenOk(t) {
  if (!t) return false;
  const i = t.lastIndexOf('.'); if (i < 0) return false;
  const v = t.slice(0, i), s = t.slice(i + 1);
  const good = sign(v);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return false;
  const exp = parseInt(v.split('.')[1], 10);
  return exp > Date.now();
}
function cookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function authed(req) {
  if (!PASSWORD) return true;
  const c = cookies(req).carnet;
  if (tokenOk(c)) return true;
  const h = req.headers.authorization || '';
  if (h.indexOf('Bearer ') === 0 && tokenOk(h.slice(7))) return true;
  return false;
}
const attempts = {};
function tooMany(ip) {
  const now = Date.now(); const a = attempts[ip] = (attempts[ip] || []).filter(t => now - t < 15 * 60000);
  return a.length >= 10;
}

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
function send(res, code, body, type, extra) {
  const h = Object.assign({ 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra || {});
  res.writeHead(code, h); res.end(body);
}
function json(res, code, obj, extra) { send(res, code, JSON.stringify(obj), null, extra); }
function readBody(req, cb) {
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > MAX_BODY) { req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { cb(null, chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { cb(e); } });
  req.on('error', cb);
}
function serveStatic(req, res, p) {
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (file.indexOf(PUBLIC_DIR) !== 0) return send(res, 403, 'Interdit', 'text/plain');
  fs.readFile(file, (err, buf) => {
    if (err) {
      // les routes de l'app retombent sur index.html
      if (!path.extname(p)) return serveStatic(req, res, '/index.html');
      return send(res, 404, 'Introuvable', 'text/plain');
    }
    const ext = path.extname(file);
    send(res, 200, buf, TYPES[ext] || 'application/octet-stream', { 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300' });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  if (p === '/api/health') return json(res, 200, { ok: true, rev: db.rev });

  if (p === '/api/login' && req.method === 'POST') {
    if (tooMany(ip)) return json(res, 429, { error: 'Trop d\'essais. Réessaie dans 15 minutes.' });
    return readBody(req, (err, body) => {
      if (err) return json(res, 400, { error: 'Requête illisible.' });
      const given = String((body && body.password) || '');
      const ok = PASSWORD && given.length === PASSWORD.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(PASSWORD));
      if (!ok) { attempts[ip].push(Date.now()); return json(res, 401, { error: 'Mot de passe incorrect.' }); }
      const t = makeToken();
      const secure = (req.headers['x-forwarded-proto'] === 'https') ? '; Secure' : '';
      json(res, 200, { ok: true, token: t }, { 'Set-Cookie': 'carnet=' + encodeURIComponent(t) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (SESSION_DAYS * 86400) + secure });
    });
  }
  if (p === '/api/logout' && req.method === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': 'carnet=; Path=/; Max-Age=0' });
  if (p === '/api/me') return json(res, 200, { authed: authed(req), passwordRequired: !!PASSWORD });

  if (p.indexOf('/api/') === 0) {
    if (!authed(req)) return json(res, 401, { error: 'Connexion requise.' });

    if (p === '/api/state' && req.method === 'GET') {
      const since = parseInt(url.searchParams.get('since') || '0', 10) || 0;
      return json(res, 200, stateSince(since));
    }
    if (p === '/api/export' && req.method === 'GET') {
      const name = 'carnet-export-' + new Date().toISOString().slice(0, 10) + '.json';
      return send(res, 200, JSON.stringify(exportBundle(), null, 1), 'application/json; charset=utf-8', { 'Content-Disposition': 'attachment; filename="' + name + '"' });
    }
    if (p === '/api/import' && req.method === 'POST') {
      return readBody(req, (err, body) => {
        if (err) return json(res, 400, { error: 'Fichier JSON illisible.' });
        try {
          // tant que le carnet ne contient que l'exemple, le premier import le remplace entièrement
          const mode = (url.searchParams.get('mode') === 'replace' || db.example) ? 'replace' : 'merge';
          delete db.example;
          fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, 'avant-import-' + Date.now() + '.json'));
          const n = importBundle(body, mode); save();
          json(res, 200, { ok: true, imported: n, rev: db.rev });
        } catch (e) { json(res, 400, { error: e.message }); }
      });
    }
    const m = p.match(/^\/api\/doc\/([a-z]+)\/([^/]+)$/);
    if (m) {
      const col = m[1], id = decodeURIComponent(m[2]);
      if (COLLECTIONS.indexOf(col) < 0 || !validId(id)) return json(res, 400, { error: 'Chemin invalide.' });
      const cur = db.collections[col][id];
      if (req.method === 'GET') return cur && !cur.deleted ? json(res, 200, { id: id, data: cur.data, rev: cur.rev }) : json(res, 404, { error: 'Introuvable.' });
      if (req.method !== 'GET') delete db.example; // le carnet a été modifié à la main
      if (req.method === 'DELETE') { deleteDoc(col, id); save(); return json(res, 200, { ok: true, rev: db.rev }); }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        return readBody(req, (err, body) => {
          if (err || !body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Document invalide.' });
          if (req.method === 'PATCH') {
            if (!cur || cur.deleted) return json(res, 404, { error: 'Introuvable.' });
            setDoc(col, id, mergeDeep(JSON.parse(JSON.stringify(cur.data)), body));
          } else setDoc(col, id, body);
          save(); json(res, 200, { ok: true, rev: db.rev });
        });
      }
      return json(res, 405, { error: 'Méthode non permise.' });
    }
    return json(res, 404, { error: 'Introuvable.' });
  }
  serveStatic(req, res, p);
});

server.listen(PORT, () => {
  console.log('Carnet de repas : http://localhost:' + PORT + (PASSWORD ? '' : '  (ATTENTION : aucun mot de passe, variable PASSWORD vide)'));
});
function shutdown() { clearTimeout(saveTimer); saveNow(); process.exit(0); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
