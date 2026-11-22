const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const { WebSocketServer } = require('ws');
const pika = require('./pika');
const perguntas = require('./perguntas');
const cidade = require('./cidade');
const { draw, drawWeighted } = require('./rand');
const { blocked } = require('./nomes');
process.on('uncaughtException', e => console.error('Erro não tratado:', e));
const MODS = { pika, perguntas, cidade };
const PASS = process.env.ADMIN_PASSWORD;
if (!PASS || PASS.length < 8) { console.error('Defina a variável de ambiente ADMIN_PASSWORD (mínimo 8 caracteres).'); process.exit(1); }
const DIR = __dirname, PUB = path.join(DIR, 'public'), LOC = path.join(DIR, 'locations.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json' };
const EMOJIS = 20, COLORS = 12, GRACE = 60000;
const N_FONT = 4, N_CARD = 10, N_COL = 10; // opções de fonte, de card e de cor do nome (0 = padrão)
const look = (v, n) => (v != null && Number.isInteger(+v) && +v >= 0 && +v < n) ? +v : 0;
// Limites de proteção do servidor
const MAX_ROOMS = 300;               // salas abertas ao mesmo tempo
const ROOM_TTL = +process.env.ROOM_TTL_MS || 3 * 60 * 60 * 1000; // sala sem nenhuma atividade por 3 h é encerrada (a variável serve para testes)
const MAX_PER_IP = +process.env.MAX_PER_IP || 80; // conexões simultâneas por endereço (uma casa/escola inteira pode dividir o mesmo)
const MAX_MSGS_PER_SEC = 40;         // mensagens por segundo em cada conexão (mais que isso é ignorado; o dobro derruba a conexão)
const MAX_PAYLOAD = 32 * 1024;       // tamanho máximo de uma mensagem

// ---------- localidades (com cache) ----------
// O arquivo só é conferido no disco a cada 2 s. Quando muda, guarda a lista, o JSON pronto para a API e um "carimbo" (locMtime).
let locCache = null, locMtime = 0, locChecked = 0, locNames = [], locReply = null;
const readLocs = () => {
  const now = Date.now();
  if (locCache && now - locChecked < 2000) return locCache;
  locChecked = now;
  const m = fs.statSync(LOC).mtimeMs;
  if (!locCache || m !== locMtime) {
    const txt = fs.readFileSync(LOC, 'utf8');
    locCache = JSON.parse(txt); locMtime = m;
    locNames = locCache.locations.map(l => l.name);
    locReply = { type: MIME['.json'], raw: Buffer.from(JSON.stringify(locCache)), etag: 'W/"loc-' + Math.floor(m) + '"', compress: true, cache: 'no-cache' };
  }
  return locCache;
};

// ---------- respostas HTTP: compressão (br/gzip) e cache por ETag ----------
const TEXT = new Set(['.html', '.js', '.css', '.json', '.svg']);
function reply(q, s, o) {
  const h = { 'Content-Type': o.type, 'ETag': o.etag, 'Cache-Control': o.cache, 'Vary': 'Accept-Encoding' };
  if (q.headers['if-none-match'] === o.etag) { s.writeHead(304, h); return s.end(); }
  let body = o.raw;
  if (o.compress) {
    const ae = String(q.headers['accept-encoding'] || '');
    if (/\bbr\b/.test(ae)) { body = o.br || (o.br = zlib.brotliCompressSync(o.raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })); h['Content-Encoding'] = 'br'; }
    else if (/\bgzip\b/.test(ae)) { body = o.gz || (o.gz = zlib.gzipSync(o.raw, { level: 6 })); h['Content-Encoding'] = 'gzip'; }
  }
  h['Content-Length'] = body.length;
  s.writeHead(200, h);
  s.end(q.method === 'HEAD' ? undefined : body);
}
const fileCache = new Map();
function serveFile(q, s, file) {
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) { s.writeHead(404); return s.end('Não encontrado'); }
    const o0 = fileCache.get(file);
    if (o0 && o0.m === st.mtimeMs && o0.size === st.size) return reply(q, s, o0);
    fs.readFile(file, (e2, d) => {
      if (e2) { s.writeHead(404); return s.end('Não encontrado'); }
      const ext = path.extname(file);
      const o = { m: st.mtimeMs, size: st.size, raw: d, type: MIME[ext] || 'application/octet-stream',
        etag: 'W/"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"', compress: TEXT.has(ext),
        // páginas e scripts sempre conferem se mudou (304 é barato); imagens ficam 1 dia no navegador
        cache: /\.(png|jpe?g|webp|gif)$/.test(ext) ? 'public, max-age=86400' : 'no-cache' };
      if (st.size <= 1e6) fileCache.set(file, o);
      reply(q, s, o);
    });
  });
}

const body = q => new Promise(r => {
  let b = '';
  q.on('data', c => { b += c; if (b.length > 2e6) { r(null); q.destroy(); } });
  q.on('end', () => { try { r(JSON.parse(b)); } catch { r(null); } });
  q.on('error', () => r(null)); q.on('close', () => r(null));
});
const ipOf = req => String((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '?').trim();
// Painel admin: no máximo 30 chamadas por minuto por endereço (dificulta adivinhar a senha)
const adminHits = new Map();
const adminOk = ip => { const now = Date.now(), h = (adminHits.get(ip) || []).filter(t => now - t < 60000); h.push(now); adminHits.set(ip, h); return h.length <= 30; };
const json = (s, c, o) => { s.writeHead(c, { 'Content-Type': 'application/json' }); s.end(JSON.stringify(o)); };

const server = http.createServer(async (q, s) => {
  let u;
  try { u = decodeURIComponent(q.url.split('?')[0]); } catch { s.writeHead(400); return s.end(); }
  if (u === '/api/locations') { try { readLocs(); } catch { return json(s, 500, { error: 'Erro ao ler as localidades' }); } return reply(q, s, locReply); }
  if (u.startsWith('/api/admin/') && q.method === 'POST') {
    if (!adminOk(ipOf(q))) return json(s, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    const b = await body(q);
    if (!b || b.password !== PASS) return json(s, 401, { error: 'Senha incorreta' });
    if (u === '/api/admin/check') return json(s, 200, { ok: true });
    if (u === '/api/admin/save') {
      if (!b.data || !Array.isArray(b.data.locations)) return json(s, 400, { error: 'Dados inválidos' });
      b.data.locations.forEach(l => { l.labels = [...new Set((Array.isArray(l.labels) ? l.labels : []).map(x => String(x).trim().slice(0, 30)).filter(Boolean))].slice(0, 10); });
      try { fs.writeFileSync(LOC + '.tmp', JSON.stringify(b.data, null, 2)); fs.renameSync(LOC + '.tmp', LOC); locChecked = 0; return json(s, 200, { ok: true }); }
      catch { return json(s, 500, { error: 'Erro ao salvar' }); }
    }
    return json(s, 404, {});
  }
  let file;
  if (u === '/') file = path.join(DIR, 'index.html');
  else if (u === '/gerenciar-locais') file = path.join(DIR, 'admin.html');
  else {
    const rel = path.normalize(u);
    file = path.join(PUB, rel); if (!file.startsWith(PUB)) { s.writeHead(403); return s.end(); }
    // nomes com acento (ex.: "O meu é mais pika.webp") podem estar gravados no disco numa forma de Unicode diferente da do navegador
    if (!fs.existsSync(file)) for (const f of ['NFC', 'NFD']) { const alt = path.join(PUB, rel.normalize(f)); if (alt.startsWith(PUB) && fs.existsSync(alt)) { file = alt; break; } }
  }
  serveFile(q, s, file);
});

const wss = new WebSocketServer({ server, maxPayload: MAX_PAYLOAD });
const rooms = {};
let nextId = 1;
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => L[Math.random() * L.length | 0]).join(''); } while (rooms[c]); return c; };
const send = (w, m) => { if (w && w.readyState === 1) { w.send(JSON.stringify(m)); return true; } return false; };
const clean = s => String(s || '').trim().slice(0, 30);
// Chave para comparar nomes: sem acento, sem diferença de maiúscula/minúscula e sem espaços repetidos
const nameKey = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const cleanLoc = l => {
  const name = clean(l && l.name); if (!name) return null;
  const img = /^(https?:\/\/|\/)\S{1,500}$/.test((l && l.img) || '') ? l.img : '';
  return { name, img };
};
const count = r => { const c = {}; Object.values(r.votes || {}).forEach(t => c[t] = (c[t] || 0) + 1); return c; };
const valid = (r, me, t) => (t !== me.id || r.players.length === 1) && r.players.some(p => p.id === t);

// Ranking da sala: guardado por token do jogador enquanto a sala existir.
// r.gain guarda quanto cada jogador ganhou na última partida (aparece como +N na tela final).
function award(r, list) {
  r.scores = r.scores || {}; r.gain = {};
  for (const [p, n] of list) {
    const k = p.token || ('id' + p.id);
    const s = r.scores[k] || (r.scores[k] = { name: p.name, pts: 0 });
    s.name = p.name; s.pts += n;
    r.gain[p.id] = (r.gain[p.id] || 0) + n;
  }
  r.rounds = (r.rounds || 0) + 1;
}
const rank = r => !r.rounds ? [] : r.players.map(p => ({ id: p.id, pts: ((r.scores || {})[p.token] || {}).pts || 0 })).sort((a, b) => b.pts - a.pts);

function begin(r) {
  const d = readLocs(), pick = new Set(r.sel || d.locations.map(l => l.name));
  const locs = d.locations.filter(l => pick.has(l.name)).map(cleanLoc).filter(Boolean).slice(0, 150);
  if (locs.length < 2) return false;
  r.locs = locs; r.spyImg = d.spyImage || '';
  const ids = r.players.map(p => p.id);
  // Local e quem começa: sorteio por ciclos. Espião: sorteio ponderado pelo histórico recente da sala
  const locName = draw(r, 'loc', locs.map(l => l.name));
  r.loc = locs.find(l => l.name === locName);
  // Sorteia UMA vez (antes o sorteio ficava dentro do find e rodava uma vez por jogador: às vezes não achava ninguém e quebrava a rodada)
  const spyId = drawWeighted(r, 'spy', ids);
  const sp = r.players.find(p => p.id === spyId);
  r.spy = sp.id; r.spyName = sp.name; r.spyGone = false;
  r.starter = draw(r, 'starter', ids); r.round = (r.round || 0) + 1;
  r.phase = 'play'; r.ready = {}; r.intents = {}; r.votes = {}; r.result = null;
  return true;
}
function view(r, p) {
  if (MODS[r.game]) return MODS[r.game].view(r, p);
  const v = { type: 'state', you: p.id, code: r.code, phase: r.phase, host: r.players[0].id,
    players: r.players.map(x => ({ id: x.id, name: x.name, emo: x.emo, color: x.color })), result: r.result || null,
    ready: Object.keys(r.ready || {}).map(Number), intents: r.intents || {}, voted: Object.keys(r.votes || {}).map(Number), counts: count(r) };
  if (r.phase === 'lobby') {
    const d = readLocs();
    // A lista completa de localidades (pesada) só vai quando o jogador ainda não a recebeu ou quando o arquivo mudou.
    // O cliente guarda a última lista recebida.
    if (p.sentLoc !== locMtime) v.all = d.locations.map(l => ({ name: l.name, img: l.img || '', labels: Array.isArray(l.labels) ? l.labels : [] }));
    v.selected = r.sel || locNames;
  } else {
    v.role = { spy: p.id === r.spy, loc: p.id === r.spy ? null : r.loc, spyImg: r.spyImg };
    // A lista de localidades da rodada só vai uma vez por rodada (o cliente guarda)
    if (p.sentRound !== r.round) v.role.locs = r.locs;
    v.starter = r.starter; v.round = r.round;
  }
  return v;
}
const push = r => {
  r.lastAct = Date.now();
  r.players.forEach(p => {
    const v = view(r, p);
    v.gid = r.game; v.rank = rank(r); v.rounds = r.rounds || 0; v.gain = r.gain || {};
    if (v.players) v.players = v.players.map(x => { const q = r.players.find(z => z.id === x.id) || {}; return { ...x, away: !!q.away, fnt: q.fnt | 0, cd: q.cd | 0, col: q.col | 0 }; });
    if (send(p.ws, v)) { // só marca como enviada se a mensagem realmente saiu
      if (v.all) p.sentLoc = locMtime;
      if (v.role && v.role.locs) p.sentRound = r.round;
    }
  });
};
const err = (w, msg, alert) => send(w, { type: 'error', msg, alert: !!alert });
const ctx = { push, err, award };

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
      // Pontos vão para todo o lado vencedor, tenha votado ou não
      const pts = [];
      if (!r.spyGone) {
        if (r.result.caught) r.players.filter(p => p.id !== r.spy).forEach(p => pts.push([p, 1]));
        else { const sp = r.players.find(p => p.id === r.spy); if (sp) pts.push([sp, 2]); }
      }
      award(r, pts);
    }
  }
  push(r);
}

function removePlayer(r, p) {
  clearTimeout(p.grace);
  r.players = r.players.filter(x => x !== p);
  if (!r.players.length) { clearTimeout(r.timer); clearTimeout(r.qt); clearTimeout(r.lt); delete rooms[r.code]; return; }
  if (MODS[r.game]) return MODS[r.game].leave(r, p, ctx);
  // Espião saiu no meio da rodada: recomeça com novo local e novo espião
  if (r.phase !== 'lobby' && r.phase !== 'end' && p.id === r.spy && begin(r)) {
    r.players.forEach(q => send(q.ws, { type: 'info', msg: p.name + ' (o espião) saiu da sala. Nova rodada com novo local e novo espião.' }));
    return push(r);
  }
  if (r.phase !== 'lobby' && p.id === r.spy) r.spyGone = true;
  for (const o of [r.ready, r.intents, r.votes]) {
    if (!o) continue;
    delete o[p.id];
    for (const k in o) if (o[k] === p.id) delete o[k];
  }
  step(r);
}

// Encerra uma sala inteira (usado na limpeza por inatividade)
function closeRoom(r, msg) {
  clearTimeout(r.timer); clearTimeout(r.qt); clearTimeout(r.lt);
  r.players.forEach(p => { clearTimeout(p.grace); send(p.ws, { type: 'kicked', msg }); });
  r.players = [];
  delete rooms[r.code];
}

const ipCount = new Map();

wss.on('connection', (ws, req) => {
  const ip = ipOf(req);
  if ((ipCount.get(ip) || 0) >= MAX_PER_IP) { try { ws.close(1013, 'Muitas conexões'); } catch {} return; }
  ipCount.set(ip, (ipCount.get(ip) || 0) + 1);
  ws.on('close', () => { const n = (ipCount.get(ip) || 1) - 1; if (n) ipCount.set(ip, n); else ipCount.delete(ip); });

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  let me = { id: nextId++, ws, name: '', emo: 0, color: 0, token: '', away: false, fnt: 0, cd: 0, col: 0, sentLoc: null, sentRound: null };
  let room = null;
  const leave = () => { if (!room) return; const r = room; room = null; removePlayer(r, me); };

  const onMessage = raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
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
      me.sentLoc = null; me.sentRound = null; // página nova: precisa receber as listas de localidades de novo
      send(ws, { type: 'resumed', gid: r.game });
      return push(r);
    }
    if (m.type === 'leave') return leave();

    if (m.type === 'create' || m.type === 'join') {
      if (room) return;
      const nm = clean(m.name);
      if (!nm) return err(ws, 'Digite seu nome.');
      // Filtro de nomes com palavras preconceituosas (ver nomes.js)
      if (blocked(nm)) return err(ws, 'Esse nome não é permitido. Escolha outro.');
      me.name = nm; me.fnt = look(m.fnt, N_FONT); me.cd = look(m.cd, N_CARD); me.col = look(m.col, N_COL);
      const tk = String(m.token || '').slice(0, 64);
      me.token = tk.length >= 8 ? tk : Math.random().toString(36).slice(2) + Date.now().toString(36);
      for (const r0 of Object.values(rooms)) { const p0 = r0.players.find(x => x.token === me.token && x !== me); if (p0) removePlayer(r0, p0); }
      if (m.type === 'create') {
        if (Object.keys(rooms).length >= MAX_ROOMS) return err(ws, 'O servidor está cheio no momento. Tente de novo em alguns minutos.');
        const c = newCode();
        room = rooms[c] = { code: c, game: MODS[m.game] ? m.game : 'locais', players: [], phase: 'lobby', sel: null, scores: {}, rounds: 0, lastAct: Date.now() };
        if (MODS[room.game]) MODS[room.game].init(room);
      } else {
        room = rooms[String(m.code || '').toUpperCase().trim()];
        if (!room) return err(ws, 'Sala não encontrada.');
        if (m.game && room.game !== m.game) { room = null; return err(ws, 'Essa sala é de outro jogo.'); }
        if (room.phase !== 'lobby') { room = null; return err(ws, 'Não é possível entrar em uma partida em andamento.', true); }
        // Nome já usado por outra pessoa da sala
        const key = nameKey(me.name);
        if (room.players.some(p => p !== me && nameKey(p.name) === key)) { room = null; return err(ws, 'Já existe alguém com esse nome na sala. Escolha outro nome.'); }
      }
      const used = new Set(room.players.map(p => p.emo)); let e = 0;
      while (used.has(e)) e++;
      if (e >= EMOJIS) { room = null; return err(ws, 'Sala cheia (máx. 20 jogadores).'); }
      me.emo = e; me.color = e % COLORS; me.sentLoc = null; me.sentRound = null;
      room.players.push(me); return push(room);
    }
    if (!room) return;
    const r = room, isHost = r.players[0] === me;
    if (m.type === 'profile' && r.phase === 'lobby') {
      const e = +m.emo, c = +m.color;
      if (Number.isInteger(e) && e >= 0 && e < EMOJIS && !r.players.some(p => p !== me && p.emo === e)) me.emo = e;
      if (Number.isInteger(c) && c >= 0 && c < COLORS) me.color = c;
      // personalização (só vale se o campo veio na mensagem)
      if (m.fnt != null) me.fnt = look(m.fnt, N_FONT);
      if (m.cd != null) me.cd = look(m.cd, N_CARD);
      if (m.col != null) me.col = look(m.col, N_COL);
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
      readLocs();
      const ok = new Set(locNames);
      r.sel = (Array.isArray(m.selected) ? m.selected : []).filter(n => ok.has(n));
      return push(r);
    }
    // Fim da partida: o líder leva todo mundo de volta para a sala de espera (mantém ranking, histórico e localidades escolhidas)
    if (m.type === 'lobby' && r.phase === 'end' && isHost) {
      r.phase = 'lobby'; r.ready = {}; r.intents = {}; r.votes = {}; r.result = null;
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
    if (m.type === 'unintent' && r.phase === 'vote' && !r.votes[me.id]) { delete r.intents[me.id]; return push(r); }
    if (r.phase === 'vote' && !r.votes[me.id] && valid(r, me, m.target)) {
      if (m.type === 'intent') { r.intents[me.id] = m.target; return push(r); }
      if (m.type === 'vote') { r.votes[me.id] = m.target; r.intents[me.id] = m.target; return step(r); }
    }
  };

  // Limite de mensagens por segundo: o excesso é ignorado e, se for o dobro do limite, a conexão é derrubada
  let win = Date.now(), cnt = 0;
  ws.on('message', raw => {
    const now = Date.now();
    if (now - win >= 1000) { win = now; cnt = 0; }
    if (++cnt > MAX_MSGS_PER_SEC) {
      if (cnt === MAX_MSGS_PER_SEC + 1) console.warn('Conexão acima do limite de mensagens (' + ip + ')');
      if (cnt > MAX_MSGS_PER_SEC * 2) ws.terminate();
      return;
    }
    try { onMessage(raw); }
    catch (e) { console.error('Erro ao tratar mensagem:', e); err(ws, 'Algo deu errado. Tente novamente.'); }
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

// Limpeza: salas sem nenhuma atividade por muito tempo são encerradas e saem da memória
setInterval(() => {
  const now = Date.now();
  for (const r of Object.values(rooms)) if (now - (r.lastAct || 0) > ROOM_TTL) closeRoom(r, 'A sala foi encerrada por inatividade.');
  for (const [ip, h] of adminHits) if (!h.some(t => now - t < 60000)) adminHits.delete(ip);
}, +process.env.SWEEP_MS || 5 * 60 * 1000);

if (require.main === module) {
  server.listen(process.env.PORT || 3000, () => console.log('Rodando em http://localhost:' + (process.env.PORT || 3000)));
}
module.exports = { server, rooms };