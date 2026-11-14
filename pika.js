const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const T1 = 10000, T2 = 15000, T3 = 20000; // 10 s de tempo; aos 15 s vai para o fim da fila; o último a escrever tem 20 s
const cl = s => String(s || '').trim().slice(0, 60);
const voters = r => r.players.filter(p => !r.out[p.id]);
const pending = r => r.players.filter(p => !r.out[p.id] && !r.entries.some(e => e.id === p.id));
const reset = r => {
  clearTimeout(r.qt); clearTimeout(r.lt);
  r.turnId = null; r.turnAt = null; r.lastId = null; r.lastAt = null; r.out = {};
  r.entries = []; r.queue = []; r.intents = {}; r.votes = {}; r.result = null; r.letter = null;
};
const counts = r => { const c = {}; Object.values(r.votes).forEach(t => c[t] = (c[t] || 0) + 1); return c; };
const valid = (r, me, t) => !r.out[me.id] && r.entries.some(e => e.id === t) && r.players.some(p => p.id === t) && (t !== me.id || voters(r).length === 1);

exports.init = r => { r.theme = ''; r.excluded = []; r.used = []; reset(r); };

exports.view = (r, p) => {
  const now = Date.now(), tid = r.phase === 'write' && r.queue.length ? r.queue[0] : null, ok = tid != null && r.turnAt;
  const pend = r.phase === 'write' ? pending(r) : [];
  return {
    type: 'state', game: 'pika', you: p.id, code: r.code, phase: r.phase, host: r.players[0].id,
    players: r.players.map(x => ({ id: x.id, name: x.name, emo: x.emo, color: x.color })),
    theme: r.theme || '', excluded: r.excluded || [],
    letter: r.phase === 'lobby' ? null : r.letter, queue: r.queue || [],
    entries: (r.entries || []).filter(e => r.players.some(q => q.id === e.id)),
    out: Object.keys(r.out || {}).map(Number),
    intents: r.intents || {}, voted: Object.keys(r.votes || {}).map(Number), counts: counts(r), result: r.result,
    tid, tl1: ok ? Math.max(0, r.turnAt + T1 - now) : T1, tl2: ok ? Math.max(0, r.turnAt + T2 - now) : T2,
    last: pend.length === 1 && r.lastAt ? { id: pend[0].id, left: Math.max(0, r.lastAt + T3 - now) } : null,
    cdLeft: r.phase === 'countdown' ? Math.max(0, (r.cdEnd || 0) - now) : 0
  };
};

// Tempo de quem está na frente da fila (não vale para o último a escrever)
function arm(r, ctx) {
  clearTimeout(r.qt);
  const id = r.queue[0];
  if (r.phase !== 'write' || id === undefined) { r.turnId = null; r.turnAt = null; return; }
  if (r.lastId === id) { r.turnId = id; r.turnAt = r.lastAt; return; }
  if (r.turnId !== id || !r.turnAt) { r.turnId = id; r.turnAt = Date.now(); }
  const left = Math.max(0, r.turnAt + T2 - Date.now());
  r.qt = setTimeout(() => {
    if (r.phase !== 'write' || r.queue[0] !== id || !r.players.length) return;
    r.queue.push(r.queue.shift()); r.turnId = null; r.turnAt = null;
    arm(r, ctx); ctx.push(r);
  }, left);
}

// Último a escrever: 20 s, senão fica fora da rodada
function armLast(r, ctx) {
  const pend = pending(r);
  if (r.phase !== 'write' || pend.length !== 1) { clearTimeout(r.lt); r.lastId = null; r.lastAt = null; return; }
  const id = pend[0].id;
  if (r.lastId === id) return;
  clearTimeout(r.lt); r.lastId = id; r.lastAt = Date.now();
  r.lt = setTimeout(() => {
    if (r.phase !== 'write' || r.lastId !== id) return;
    r.out[id] = true; r.queue = r.queue.filter(x => x !== id); r.lastId = null; r.lastAt = null;
    after(r, ctx);
  }, T3);
}

function round(r, ctx) {
  clearTimeout(r.timer); reset(r);
  const pool = ALPHA.filter(l => !r.excluded.includes(l));
  let fresh = pool.filter(l => !r.used.includes(l));
  if (!fresh.length) { r.used = []; fresh = pool; }
  r.letter = fresh[Math.random() * fresh.length | 0]; r.used.push(r.letter);
  r.phase = 'roulette'; ctx.push(r);
  r.timer = setTimeout(() => {
    if (!r.players.length || r.phase !== 'roulette') return;
    r.phase = 'countdown'; r.cdEnd = Date.now() + 3000; ctx.push(r);
    r.timer = setTimeout(() => {
      if (!r.players.length || r.phase !== 'countdown') return;
      r.phase = 'write'; armLast(r, ctx); ctx.push(r);
    }, 3000);
  }, 3500);
}

function after(r, ctx) {
  if (r.phase === 'write' && pending(r).length === 0) {
    clearTimeout(r.qt); clearTimeout(r.lt); r.turnId = null; r.turnAt = null; r.lastId = null; r.lastAt = null;
    if (!r.entries.length) { reset(r); r.phase = 'lobby'; return ctx.push(r); }
    r.phase = 'vote';
  } else if (r.phase === 'vote') {
    const vs = voters(r), c = counts(r), max = Math.max(0, ...Object.values(c));
    const need = Math.floor(vs.length / 2) + 1, all = vs.length > 0 && vs.every(p => r.votes[p.id]);
    if (all || max >= need) {
      const losers = Object.keys(c).filter(k => c[k] === max).map(k => {
        const e = r.entries.find(e => e.id == k) || {};
        return { id: +k, name: e.name || '?', text: e.text || '' };
      });
      r.result = { max, early: !all, losers };
      r.phase = 'end';
      const lose = new Set(losers.map(l => l.id));
      ctx.award(r, vs.filter(p => !lose.has(p.id)).map(p => [p, 1]));
    }
  }
  if (r.phase === 'write') { armLast(r, ctx); arm(r, ctx); }
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
    if (m.type === 'lobby') { reset(r); r.used = []; r.phase = 'lobby'; return ctx.push(r); }
    if (m.type === 'replay') return round(r, ctx);
  }
  if (r.phase === 'write' && !r.out[me.id]) {
    if (m.type === 'have' && !r.queue.includes(me.id) && !r.entries.some(e => e.id === me.id)) { r.queue.push(me.id); arm(r, ctx); return ctx.push(r); }
    if (m.type === 'unq' && r.queue.includes(me.id)) { r.queue = r.queue.filter(i => i !== me.id); arm(r, ctx); return ctx.push(r); }
    if (m.type === 'submit' && r.queue[0] === me.id) {
      const t = cl(m.text); if (!t) return;
      r.entries.push({ id: me.id, name: me.name, text: t }); r.queue.shift(); return after(r, ctx);
    }
  }
  if (r.phase === 'vote' && m.type === 'unintent' && !r.votes[me.id]) { delete r.intents[me.id]; return ctx.push(r); }
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