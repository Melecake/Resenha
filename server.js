const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const pika = require('./pika');
const perguntas = require('./perguntas');
process.on('uncaughtException', e => console.error('Erro não tratado:', e));
const MODS = { pika, perguntas };
const PASS = process.env.ADMIN_PASSWORD || 'Joao123abcd789Milli';
const DIR = __dirname, PUB = path.join(DIR, 'public'), LOC = path.join(DIR, 'locations.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json' };
const EMOJIS = 20, COLORS = 12, GRACE = 60000;
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
    if (u === '/api/admin/save') {
      if (!b.data || !Array.isArray(b.data.locations)) return json(s, 400, { error: 'Dados inválidos' });
      try { fs.writeFileSync(LOC, JSON.stringify(b.data, null, 2)); return json(s, 200, { ok: true }); }
      catch { return json(s, 500, { error: 'Erro ao salvar' }); }
    }
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
const send = (w, m) => w && w.readyState === 1 && w.send(JSON.stringify(m));
const clean = s => String(s || '').trim().slice(0, 30);
const cleanLoc = l => {
  const name = clean(l && l.name); if (!name) return null;
  const img = /^(https?:\/\/|\/)\S{1,500}$/.test((l && l.img) || '') ? l.img : '';
  return { name, img, icon: String((l && l.icon) || '').slice(0, 8) };
};
const count = r => { const c = {}; Object.values(r.votes || {}).forEach(t => c[t] = (c[t] || 0) + 1); return c; };
const valid = (r, me, t) => (t !== me.id || r.players.length === 1) && r.players.some(p => p.id === t);

function begin(r) {
  const d = readLocs(), pick = new Set(r.sel || d.locations.map(l => l.name));
  const locs = d.locations.filter(l => pick.has(l.name)).map(cleanLoc).filter(Boolean).slice(0, 150);
  if (locs.length < 2) return false;
  r.locs = locs; r.spyImg = d.spyImage || '';
  r.loc = locs[Math.random() * locs.length | 0];
  const sp = r.players[Math.random() * r.players.length | 0];
  r.spy = sp.id; r.spyName = sp.name; r.spyGone = false;
  r.phase = 'play'; r.ready = {}; r.intents = {}; r.votes = {}; r.result = null;
  return true;
}
function view(r, p) {
  if (MODS[r.game]) return MODS[r.game].view(r, p);
  const v = { type: 'state', you: p.id, code: r.code, phase: r.phase, host: r.players[0].id,
    players: r.players.map(x => ({ id: x.id, name: x.name, emo: x.emo, color: x.color })), result: r.result || null,
    ready: Object.keys(r.ready || {}).map(Number), intents: r.intents || {}, voted: Object.keys(r.votes || {}).map(Number), counts: count(r) };
  if (r.phase === 'lobby') {
    v.all = readLocs().locations.map(l => ({ name: l.name, icon: l.icon || '', img: l.img || '' }));
    v.selected = r.sel || v.all.map(l => l.name);
  } else v.role = { spy: p.id === r.spy, loc: p.id === r.spy ? null : r.loc, locs: r.locs, spyImg: r.spyImg };
  return v;
}
const push = r => r.players.forEach(p => {
  const v = view(r, p);
  v.gid = r.game;
  if (v.players) v.players = v.players.map(x => ({ ...x, away: !!(r.players.find(q => q.id === x.id) || {}).away }));
  send(p.ws, v);
});
const err = (w, msg, alert) => send(w, { type: 'error', msg, alert: !!alert });
const ctx = { push, err };

function step(r) {
  if (r.phase === 'play' && r.players.every(p => r.ready[p.id])) { r.phase = 'vote'; r.intents = {}; r.votes = {}; }
  else if (r.phase === 'vote') {
    const c = count(r), max = Math.max(0, ...Object.values(c));
    const need = Math.floor(r.players.length / 2) + 1, all = r.players.every(p => r.votes[p.id]);
    if (all || max >= need) {
      const top = Object.keys(c).filter(k => c[k] === max).map(Number);
      const name = id => (r.players.find(p => p.id === id) || {}).name || '?';
      r.result = { caught: !r.spyGone && top.length === 1 && top[0] === r.spy, top: top.map(name), max, early: !all,
        spy: r.spyName + (r.spyGone ? ' (saiu da partida)' : ''), loc: r.loc };
      r.phase = 'end';
    }
  }
  push(r);
}

function removePlayer(r, p) {
  clearTimeout(p.grace);
  r.players = r.players.filter(x => x !== p);
  if (!r.players.length) { clearTimeout(r.timer); clearTimeout(r.qt); delete rooms[r.code]; return; }
  if (MODS[r.game]) return MODS[r.game].leave(r, p, ctx);
  if (r.phase !== 'lobby' && p.id === r.spy) r.spyGone = true;
  for (const o of [r.ready, r.intents, r.votes]) {
    if (!o) continue;
    delete o[p.id];
    for (const k in o) if (o[k] === p.id) delete o[k];
  }
  step(r);
}

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  let me = { id: nextId++, ws, name: '', emo: 0, color: 0, token: '', away: false };
  let room = null;
  const leave = () => { if (!room) return; const r = room; room = null; removePlayer(r, me); };

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    ws.isAlive = true;
    if (m.type === 'ping') return send(ws, { type: 'pong' });
    if (room && !room.players.includes(me)) room = null;

    if (m.type === 'resume') {
      if (room) return;
      const tk = String(m.token || '');
      let found = null;
      if (tk.length >= 8) for (const r of Object.values(rooms)) { const p = r.players.find(x => x.token === tk); if (p) { found = [r, p]; break; } }
      if (!found) return send(ws, { type: 'resume_failed' });
      const [r, p] = found;
      clearTimeout(p.grace); p.away = false;
      const old = p.ws;
      if (old !== ws) { send(old, { type: 'kicked', msg: 'Sua sessão foi aberta em outra aba ou aparelho.' }); try { old.close(); } catch {} }
      p.ws = ws; me = p; room = r;
      send(ws, { type: 'resumed', gid: r.game });
      return push(r);
    }
    if (m.type === 'leave') return leave();

    if (m.type === 'create' || m.type === 'join') {
      if (room) return;
      me.name = clean(m.name);
      if (!me.name) return err(ws, 'Digite seu nome.');
      const tk = String(m.token || '').slice(0, 64);
      me.token = tk.length >= 8 ? tk : Math.random().toString(36).slice(2) + Date.now().toString(36);
      for (const r0 of Object.values(rooms)) { const p0 = r0.players.find(x => x.token === me.token && x !== me); if (p0) removePlayer(r0, p0); }
      if (m.type === 'create') {
        const c = newCode();
        room = rooms[c] = { code: c, game: MODS[m.game] ? m.game : 'locais', players: [], phase: 'lobby', sel: null };
        if (MODS[room.game]) MODS[room.game].init(room);
      } else {
        room = rooms[String(m.code || '').toUpperCase().trim()];
        if (!room) return err(ws, 'Sala não encontrada.');
        if (m.game && room.game !== m.game) { room = null; return err(ws, 'Essa sala é de outro jogo.'); }
        if (room.phase !== 'lobby') { room = null; return err(ws, 'Não é possível entrar em uma partida em andamento.', true); }
      }
      const used = new Set(room.players.map(p => p.emo)); let e = 0;
      while (used.has(e)) e++;
      if (e >= EMOJIS) { room = null; return err(ws, 'Sala cheia (máx. 20 jogadores).'); }
      me.emo = e; me.color = e % COLORS;
      room.players.push(me); return push(room);
    }
    if (!room) return;
    const r = room, isHost = r.players[0] === me;
    if (m.type === 'profile' && r.phase === 'lobby') {
      const e = +m.emo, c = +m.color;
      if (Number.isInteger(e) && e >= 0 && e < EMOJIS && !r.players.some(p => p !== me && p.emo === e)) me.emo = e;
      if (Number.isInteger(c) && c >= 0 && c < COLORS) me.color = c;
      return push(r);
    }
    if (m.type === 'kick' && isHost) {
      const t = r.players.find(p => p.id === m.target);
      if (!t || t === me) return;
      send(t.ws, { type: 'kicked', msg: 'Você foi removido da sala pelo líder.' });
      removePlayer(r, t); return;
    }
    if (MODS[r.game]) return MODS[r.game].handle(r, me, m, ctx);
    if (m.type === 'locs' && isHost && r.phase === 'lobby') {
      const ok = new Set(readLocs().locations.map(l => l.name));
      r.sel = (Array.isArray(m.selected) ? m.selected : []).filter(n => ok.has(n));
      return push(r);
    }
    if ((m.type === 'start' && r.phase === 'lobby' || m.type === 'again' && r.phase === 'end') && isHost) {
      if (!begin(r)) return err(ws, 'Escolha pelo menos 2 localidades.');
      return push(r);
    }
    if (m.type === 'ready' && r.phase === 'play') {
      if (m.ready) r.ready[me.id] = true; else delete r.ready[me.id];
      return step(r);
    }
    if (r.phase === 'vote' && !r.votes[me.id] && valid(r, me, m.target)) {
      if (m.type === 'intent') { r.intents[me.id] = m.target; return push(r); }
      if (m.type === 'vote') { r.votes[me.id] = m.target; r.intents[me.id] = m.target; return step(r); }
    }
  });

  ws.on('close', () => {
    if (!room || !room.players.includes(me) || me.ws !== ws) return;
    const r = room;
    me.away = true; push(r);
    me.grace = setTimeout(() => { if (me.away && r.players.includes(me)) removePlayer(r, me); }, GRACE);
  });
  ws.on('error', () => {});
});

setInterval(() => {
  wss.clients.forEach(c => { if (!c.isAlive) return c.terminate(); c.isAlive = false; try { c.ping(); } catch {} });
}, 25000);

server.listen(process.env.PORT || 3000, () => console.log('Rodando em http://localhost:' + (process.env.PORT || 3000)));