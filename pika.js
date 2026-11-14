const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const T1 = 10000, T2 = 15000; // 10 s de tempo; aos 15 s a pessoa vai para o fim da fila
const cl = s => String(s || '').trim().slice(0, 60);
const reset = r => { clearTimeout(r.qt); r.turnId = null; r.turnAt = null; r.entries = []; r.queue = []; r.intents = {}; r.votes = {}; r.result = null; r.letter = null; };
const counts = r => { const c = {}; Object.values(r.votes).forEach(t => c[t] = (c[t] || 0) + 1); return c; };
const valid = (r, me, t) => (t !== me.id || r.players.length === 1) && r.players.some(p => p.id === t);

exports.init = r => { r.theme = ''; r.excluded = []; reset(r); };

exports.view = (r, p) => {
  const now = Date.now(), tid = r.phase === 'write' && r.queue.length ? r.queue[0] : null, ok = tid != null && r.turnAt;
  return {
    type: 'state', game: 'pika', you: p.id, code: r.code, phase: r.phase, host: r.players[0].id,
    players: r.players.map(x => ({ id: x.id, name: x.name, emo: x.emo, color: x.color })),
    theme: r.theme || '', excluded: r.excluded || [],
    letter: r.phase === 'lobby' ? null : r.letter, queue: r.queue || [],
    entries: (r.entries || []).filter(e => r.players.some(p => p.id === e.id)),
    intents: r.intents || {}, voted: Object.keys(r.votes || {}).map(Number), counts: counts(r), result: r.result,
    tid, tl1: ok ? Math.max(0, r.turnAt + T1 - now) : T1, tl2: ok ? Math.max(0, r.turnAt + T2 - now) : T2
  };
};

// Controla o tempo de quem está na frente da fila.
function arm(r, ctx) {
  clearTimeout(r.qt);
  const id = r.queue[0];
  if (r.phase !== 'write' || id === undefined) { r.turnId = null; r.turnAt = null; return; }
  if (r.turnId !== id || !r.turnAt) { r.turnId = id; r.turnAt = Date.now(); }
  const left = Math.max(0, r.turnAt + T2 - Date.now());
  r.qt = setTimeout(() => {
    if (r.phase !== 'write' || r.queue[0] !== id || !r.players.length) return;
    r.queue.push(r.queue.shift()); r.turnId = null; r.turnAt = null;
    arm(r, ctx); ctx.push(r);
  }, left);
}

function round(r, ctx) {
  clearTimeout(r.timer); reset(r);
  const pool = ALPHA.filter(l => !r.excluded.includes(l));
  r.letter = pool[Math.random() * pool.length | 0]; r.phase = 'roulette'; ctx.push(r);
  r.timer = setTimeout(() => {
    if (!r.players.length || r.phase !== 'roulette') return;
    r.phase = 'countdown'; ctx.push(r);
    r.timer = setTimeout(() => {
      if (!r.players.length || r.phase !== 'countdown') return;
      r.phase = 'write'; ctx.push(r);
    }, 3000);
  }, 3500);
}

function after(r, ctx) {
  if (r.phase === 'write' && r.players.every(p => r.entries.some(e => e.id === p.id))) {
    r.phase = 'vote'; clearTimeout(r.qt); r.turnId = null; r.turnAt = null;
  } else if (r.phase === 'vote') {
    const c = counts(r), max = Math.max(0, ...Object.values(c));
    const need = Math.floor(r.players.length / 2) + 1, all = r.players.every(p => r.votes[p.id]);
    if (all || max >= need) {
      r.result = { max, early: !all, losers: Object.keys(c).filter(k => c[k] === max).map(k => {
        const e = r.entries.find(e => e.id == k) || {};
        return { id: +k, name: e.name || '?', text: e.text || '' };
      }) };
      r.phase = 'end';
    }
  }
  if (r.phase === 'write') arm(r, ctx);
  ctx.push(r);
}

exports.handle = (r, me, m, ctx) => {
  const host = r.players[0] === me;
  if (host && r.phase === 'lobby') {
    if (m.type === 'cfg') {
      if (typeof m.theme === 'string') r.theme = cl(m.theme);
      if (Array.isArray(m.excluded)) r.excluded = [...new Set(m.excluded.filter(l => ALPHA.includes(l)))];
      return ctx.push(r);
    }
    if (m.type === 'start') {
      if (!r.theme) return ctx.err(me.ws, 'Digite um tema.');
      if (r.excluded.length >= ALPHA.length) return ctx.err(me.ws, 'Deixe pelo menos uma letra.');
      return round(r, ctx);
    }
  }
  if (host && r.phase === 'end') {
    if (m.type === 'lobby') { reset(r); r.phase = 'lobby'; return ctx.push(r); }
    if (m.type === 'replay') return round(r, ctx);
  }
  if (r.phase === 'write') {
    if (m.type === 'have' && !r.queue.includes(me.id) && !r.entries.some(e => e.id === me.id)) { r.queue.push(me.id); arm(r, ctx); return ctx.push(r); }
    if (m.type === 'skip' && r.queue.length && (r.queue[0] === me.id || host)) { r.queue.shift(); arm(r, ctx); return ctx.push(r); }
    if (m.type === 'submit' && r.queue[0] === me.id) {
      const t = cl(m.text); if (!t) return;
      r.entries.push({ id: me.id, name: me.name, text: t }); r.queue.shift(); return after(r, ctx);
    }
  }
  if (r.phase === 'vote' && !r.votes[me.id] && valid(r, me, m.target)) {
    if (m.type === 'intent') { r.intents[me.id] = m.target; return ctx.push(r); }
    if (m.type === 'vote') { r.votes[me.id] = m.target; r.intents[me.id] = m.target; return after(r, ctx); }
  }
};

exports.leave = (r, me, ctx) => {
  r.queue = r.queue.filter(i => i !== me.id);
  delete r.intents[me.id]; delete r.votes[me.id];
  for (const k in r.intents) if (r.intents[k] === me.id) delete r.intents[k];
  for (const k in r.votes) if (r.votes[k] === me.id) delete r.votes[k];
  after(r, ctx);
};