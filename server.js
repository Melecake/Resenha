const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const pika = require('./pika');
const PASS = process.env.ADMIN_PASSWORD || 'Joao123abcd789Milli';
const DIR = __dirname, PUB = path.join(DIR, 'public'), LOC = path.join(DIR, 'locations.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json' };
const readLocs = () => JSON.parse(fs.readFileSync(LOC, 'utf8'));
const body = q => new Promise(r => { let b = ''; q.on('data', c => { b += c; if (b.length > 2e6) q.destroy(); }); q.on('end', () => { try { r(JSON.parse(b)); } catch { r(null); } }); });
const json = (s, c, o) => { s.writeHead(c, { 'Content-Type': 'application/json' }); s.end(JSON.stringify(o)); };

const server = http.createServer(async (q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/api/locations') return json(s, 200, readLocs());
  if (u.startsWith('/api/admin/') && q.method === 'POST') {
    const b = await body(q);
    if (!b || b.password !== PASS) return json(s, 401, { error: 'Senha incorreta' });
    if (u === '/api/admin/check') return json(s, 200, { ok: true });
    if (u === '/api/admin/save') { fs.writeFileSync(LOC, JSON.stringify(b.data, null, 2)); return json(s, 200, { ok: true }); }
    return json(s, 404, {});
  }
  let file;
  if (u === '/') file = path.join(DIR, 'index.html');
  else if (u === '/gerenciar-locais') file = path.join(DIR, 'admin.html');
  else { file = path.join(PUB, path.normalize(u)); if (!file.startsWith(PUB)) { s.writeHead(403); return s.end(); } }
  fs.readFile(file, (e, d) => {
    if (e) { s.writeHead(404); return s.end('Não encontrado'); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }); s.end(d);
  });
});

const wss = new WebSocketServer({ server });
const rooms = {};
let nextId = 1;
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => L[Math.random() * L.length | 0]).join(''); } while (rooms[c]); return c; };
const send = (w, m) => w.readyState === 1 && w.send(JSON.stringify(m));
const clean = s => String(s || '').trim().slice(0, 30);
const cleanLoc = l => {
  const name = clean(l && l.name); if (!name) return null;
  const img = /^(https?:\/\/|\/)\S{1,500}$/.test((l && l.img) || '') ? l.img : '';
  return { name, img, icon: String((l && l.icon) || '').slice(0, 8) };
};

function begin(r) {
  const d = readLocs(), seen = new Set();
  r.locs = [...d.locations, ...(r.custom || [])].map(cleanLoc).filter(l => l && !seen.has(l.name) && seen.add(l.name)).slice(0, 150);
  r.spyImg = d.spyImage || '';
  r.loc = r.locs[Math.random() * r.locs.length | 0];
  r.spy = r.players[Math.random() * r.players.length | 0].id;
  r.phase = 'play'; r.acc = null; r.result = null;
}
function view(r, p) {
  if (r.game === 'pika') return pika.view(r, p);
  const v = { type: 'state', you: p.id, code: r.code, phase: r.phase, host: r.players[0].id,
    players: r.players.map(x => ({ id: x.id, name: x.name })), accusation: r.acc || null, result: r.result || null };
  if (r.phase !== 'lobby') v.role = { spy: p.id === r.spy, loc: p.id === r.spy ? null : r.loc, locs: r.locs, spyImg: r.spyImg };
  return v;
}
const push = r => r.players.forEach(p => send(p.ws, view(r, p)));
const err = (w, msg) => send(w, { type: 'error', msg });
const ctx = { push, err };

wss.on('connection', ws => {
  const me = { id: nextId++, ws, name: '' };
  let room = null;
  const leave = () => {
    if (!room) return;
    const r = room; room = null;
    r.players = r.players.filter(p => p !== me);
    if (!r.players.length) return void delete rooms[r.code];
    if (r.game === 'pika') return pika.leave(r, me, ctx);
    if (r.phase === 'accuse') { r.phase = 'play'; r.acc = null; }
    if (r.phase !== 'lobby' && me.id === r.spy) { r.phase = 'lobby'; r.acc = r.result = null; }
    push(r);
  };
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'leave') return leave();
    if (m.type === 'create' || m.type === 'join') {
      if (room) return;
      me.name = clean(m.name);
      if (!me.name) return err(ws, 'Digite seu nome.');
      if (m.type === 'create') {
        const c = newCode();
        room = rooms[c] = { code: c, game: m.game === 'pika' ? 'pika' : 'locais', players: [], phase: 'lobby' };
        if (room.game === 'pika') pika.init(room);
      } else {
        room = rooms[String(m.code || '').toUpperCase().trim()];
        if (!room) return err(ws, 'Sala não encontrada.');
        if (m.game && room.game !== m.game) { room = null; return err(ws, 'Essa sala é de outro jogo.'); }
        if (room.phase !== 'lobby') { room = null; return err(ws, 'A partida já começou.'); }
        if (room.players.length >= 10) { room = null; return err(ws, 'Sala cheia (máx. 10).'); }
      }
      room.players.push(me); return push(room);
    }
    if (!room) return;
    const r = room, isHost = r.players[0] === me;
    if (r.game === 'pika') return pika.handle(r, me, m, ctx);
    if (m.type === 'start' && isHost && r.phase === 'lobby') {
      r.custom = Array.isArray(m.custom) ? m.custom.slice(0, 50) : [];
      begin(r); return push(r);
    }
    if (m.type === 'again' && isHost && r.phase === 'end') { begin(r); return push(r); }
    if (m.type === 'accuse' && r.phase === 'play') {
      const t = r.players.find(p => p.id === m.target);
      if (!t || t === me) return;
      r.acc = { by: me.id, target: t.id, votes: { [me.id]: true } }; r.phase = 'accuse'; return push(r);
    }
    if (m.type === 'vote' && r.phase === 'accuse' && me.id !== r.acc.target) {
      if (!m.yes) { r.acc = null; r.phase = 'play'; return push(r); }
      r.acc.votes[me.id] = true;
      const need = r.players.filter(p => p.id !== r.acc.target);
      if (need.every(p => r.acc.votes[p.id])) {
        const name = id => r.players.find(p => p.id === id).name;
        r.result = { caught: r.acc.target === r.spy, target: name(r.acc.target), spy: name(r.spy), loc: r.loc };
        r.phase = 'end';
      }
      return push(r);
    }
  });
  ws.on('close', leave);
});
server.listen(process.env.PORT || 3000, () => console.log('Rodando em http://localhost:' + (process.env.PORT || 3000)));