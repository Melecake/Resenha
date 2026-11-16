const { drawWeighted } = require('./rand');
const ROLES = ['assassino', 'detetive', 'anjo'];
const NIGHT_MS = 15000;  // duração da noite
const SLEEP_MS = 5000;   // card "A cidade dorme" depois da votação
const counts = r => { const c = {}; Object.values(r.votes).forEach(t => { if (t !== 'skip') c[t] = (c[t] || 0) + 1; }); return c; };
const skipsOf = r => Object.values(r.votes).filter(t => t === 'skip').length;
const present = (r, id) => id != null && r.players.some(p => p.id === id);
const alive = r => r.players.filter(p => !r.dead[p.id]);
const idOf = (r, role) => { const k = Object.keys(r.roles).find(i => r.roles[i] === role); return k === undefined ? null : +k; };

function fresh(r) {
  clearTimeout(r.timer); clearTimeout(r.lt);
  Object.assign(r, { roles: {}, dead: {}, gone: {}, act: {}, inv: {}, miss: {}, nightEnd: 0, ready: {}, intents: {}, votes: {}, night: 0, dawn: null, lastVote: null, result: null, killerName: '' });
}
exports.init = r => { fresh(r); };

// Papéis sorteados pelo mesmo sistema ponderado dos outros jogos (histórico da sala)
function start(r) {
  const ids = r.players.map(p => p.id);
  const a = drawWeighted(r, 'c_assassino', ids);
  const d = drawWeighted(r, 'c_detetive', ids.filter(x => x !== a));
  const g = drawWeighted(r, 'c_anjo', ids.filter(x => x !== a && x !== d));
  fresh(r);
  ids.forEach(i => { r.roles[i] = 'cidadao'; });
  r.roles[a] = 'assassino'; r.roles[d] = 'detetive'; r.roles[g] = 'anjo';
  r.killerName = r.players.find(p => p.id === a).name;
  r.phase = 'roles';
}

// Quem venceu, ou null se o jogo continua (1 assassino: vence quando sobra só mais uma pessoa viva)
function winner(r) {
  const kid = idOf(r, 'assassino');
  if (!present(r, kid) || r.dead[kid]) return 'cidade';
  const others = alive(r).filter(p => p.id !== kid).length;
  return others <= 1 ? 'assassino' : null;
}

function finish(r, w) {
  clearTimeout(r.timer); clearTimeout(r.lt);
  const kid = idOf(r, 'assassino');
  r.result = { winner: w, killerName: r.killerName };
  r.phase = 'end';
  const pts = [];
  if (w === 'cidade') r.players.filter(p => p.id !== kid).forEach(p => pts.push([p, 1]));
  else { const k = r.players.find(p => p.id === kid); if (k) pts.push([k, 2]); }
  r._ctx.award(r, pts);
  r._ctx.push(r);
}

// Noite com tempo fixo: quem não escolheu ninguém simplesmente não age
function startNight(r) {
  clearTimeout(r.timer); clearTimeout(r.lt);
  r.phase = 'night'; r.act = {}; r.ready = {}; r.nightEnd = Date.now() + NIGHT_MS;
  const n = r.night;
  r.timer = setTimeout(() => { if (r.phase === 'night' && r.night === n) resolveNight(r); }, NIGHT_MS);
}

// "A cidade dorme" por alguns segundos antes da tela de ação
function startSleep(r) {
  clearTimeout(r.timer); clearTimeout(r.lt);
  r.night++; r.phase = 'sleep'; r.act = {}; r.ready = {};
  const n = r.night;
  r.lt = setTimeout(() => { if (r.phase === 'sleep' && r.night === n) { startNight(r); r._ctx.push(r); } }, SLEEP_MS);
}

function resolveNight(r) {
  clearTimeout(r.timer);
  const victim = r.act.assassino, prot = r.act.anjo, det = r.act.detetive, did = idOf(r, 'detetive');
  // Só o próprio jogador fica sabendo que não escolheu ninguém
  r.miss = {};
  ROLES.forEach(ro => { const id = idOf(r, ro); if (present(r, id) && !r.dead[id] && r.act[ro] == null) r.miss[id] = r.night; });
  if (present(r, did) && !r.dead[did] && det != null) {
    (r.inv[did] = r.inv[did] || []).push({ night: r.night, target: det, diff: r.roles[det] !== 'cidadao' });
  }
  const dead = [];
  if (victim != null && present(r, victim) && !r.dead[victim] && victim !== prot) { r.dead[victim] = true; dead.push(victim); }
  r.dawn = { night: r.night, dead };
  r.act = {};
  const w = winner(r);
  if (w) return finish(r, w);
  r.phase = 'day'; r.ready = {}; r._ctx.push(r);
}

function resolveVote(r, early) {
  const c = counts(r), max = Math.max(0, ...Object.values(c)), skips = skipsOf(r);
  const top = Object.keys(c).filter(k => c[k] === max).map(Number);
  // "Pular" funciona como um voto em ninguém: se empatar ou superar o mais votado, ninguém sai
  const out = top.length === 1 && max > skips ? top[0] : null;
  if (out != null) r.dead[out] = true;
  r.lastVote = { early, out, reason: out != null ? null : (skips >= max ? 'skip' : 'tie') };
  r.intents = {}; r.votes = {};
  const w = winner(r);
  if (w) return finish(r, w);
  startSleep(r); r._ctx.push(r);
}

function progress(r, ctx) {
  r._ctx = ctx;
  const al = alive(r);
  if (r.phase === 'roles') {
    if (al.every(p => r.ready[p.id])) { r.night = 1; startNight(r); }
    return ctx.push(r);
  }
  if (r.phase === 'day') {
    if (al.length && al.every(p => r.ready[p.id])) { r.phase = 'vote'; r.intents = {}; r.votes = {}; }
    return ctx.push(r);
  }
  if (r.phase === 'vote') {
    const c = counts(r), max = Math.max(0, ...Object.values(c));
    const need = Math.floor(al.length / 2) + 1, all = al.length > 0 && al.every(p => r.votes[p.id]);
    if (all || max >= need || skipsOf(r) >= need) return resolveVote(r, !all);
    return ctx.push(r);
  }
  ctx.push(r); // noite e "cidade dorme" são controladas por tempo
}

exports.view = (r, p) => {
  const ph = r.phase, me = p.id, started = ph !== 'lobby';
  const role = started ? r.roles[me] : null, isDead = started && !!r.dead[me];
  const v = { type: 'state', game: 'cidade', you: me, code: r.code, phase: ph, host: r.players[0].id,
    players: r.players.map(x => ({ id: x.id, name: x.name, emo: x.emo, color: x.color })),
    dead: started ? r.players.filter(x => r.dead[x.id]).map(x => x.id) : [],
    night: r.night, ready: Object.keys(r.ready).map(Number),
    intents: r.intents, voted: Object.keys(r.votes).map(Number), counts: counts(r),
    lastVote: r.lastVote, dawn: r.dawn, result: r.result };
  if (started) { v.role = role; v.isDead = isDead; }
  if (ph === 'vote') { v.skips = skipsOf(r); v.mySkip = r.votes[me] === 'skip'; }
  if (ph === 'day' && r.miss && r.miss[me]) v.missed = r.miss[me];
  if (started && (isDead || ph === 'end')) { v.roles = {}; r.players.forEach(x => { v.roles[x.id] = r.roles[x.id]; }); }
  if (started && role === 'detetive') v.inv = r.inv[me] || [];
  if (ph === 'night' && !isDead && ROLES.includes(role)) {
    const al = alive(r).map(x => x.id);
    v.act = { role, done: r.act[role] !== undefined, left: Math.max(0, r.nightEnd - Date.now()), targets: role === 'anjo' ? al : al.filter(i => i !== me) };
    if (role === 'detetive') { v.act.known = {}; (r.inv[me] || []).forEach(i => { v.act.known[i.target] = i.diff; }); }
  }
  return v;
};

exports.handle = (r, me, m, ctx) => {
  r._ctx = ctx;
  const leader = r.players[0] === me, ph = r.phase;
  const isAlive = r.roles[me.id] !== undefined && !r.dead[me.id];
  if (ph === 'lobby') {
    if (m.type === 'start' && leader) {
      if (r.players.length < 5) return ctx.err(me.ws, 'São necessários pelo menos 5 jogadores.');
      start(r); return ctx.push(r);
    }
    return;
  }
  if (ph === 'roles' && m.type === 'ack' && isAlive) { r.ready[me.id] = true; return progress(r, ctx); }
  if (ph === 'night' && m.type === 'nact' && isAlive) {
    const role = r.roles[me.id], t = +m.target;
    if (!ROLES.includes(role) || r.act[role] !== undefined) return;
    if (!present(r, t) || r.dead[t] || (role !== 'anjo' && t === me.id)) return;
    if (role === 'detetive' && (r.inv[me.id] || []).some(i => i.target === t)) return; // já investigado
    r.act[role] = t; return ctx.push(r);
  }
  if (ph === 'day' && m.type === 'ready' && isAlive) {
    if (m.ready) r.ready[me.id] = true; else delete r.ready[me.id];
    return progress(r, ctx);
  }
  if (ph === 'vote' && isAlive) {
    if (m.type === 'unintent' && !r.votes[me.id]) { delete r.intents[me.id]; return ctx.push(r); }
    if (m.type === 'skip' && !r.votes[me.id]) { r.votes[me.id] = 'skip'; delete r.intents[me.id]; return progress(r, ctx); }
    const t = +m.target;
    if (!r.votes[me.id] && present(r, t) && !r.dead[t] && t !== me.id) {
      if (m.type === 'intent') { r.intents[me.id] = t; return ctx.push(r); }
      if (m.type === 'vote') { r.votes[me.id] = t; r.intents[me.id] = t; return progress(r, ctx); }
    }
  }
  if (ph === 'end' && leader) {
    if (m.type === 'lobby') { fresh(r); r.phase = 'lobby'; return ctx.push(r); }
    if (m.type === 'again') {
      if (r.players.length < 5) return ctx.err(me.ws, 'São necessários pelo menos 5 jogadores.');
      start(r); return ctx.push(r);
    }
  }
};

exports.leave = (r, me, ctx) => {
  r._ctx = ctx;
  if (r.phase === 'lobby' || r.phase === 'end') return ctx.push(r);
  r.dead[me.id] = true; r.gone[me.id] = true;
  delete r.ready[me.id]; delete r.intents[me.id]; delete r.votes[me.id];
  for (const o of [r.intents, r.votes]) for (const k in o) if (o[k] === me.id) delete o[k];
  const w = winner(r);
  if (w) return finish(r, w);
  progress(r, ctx);
};