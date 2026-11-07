const cl = (s, n) => String(s || '').trim().slice(0, n);
const voters = r => r.players.filter(p => p.id !== r.hostId);
const counts = r => { const c = {}; Object.values(r.votes).forEach(t => c[t] = (c[t] || 0) + 1); return c; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const okTarget = (r, me, t) => { const vs = voters(r); return vs.some(p => p.id === t) && (t !== me.id || vs.length === 1); };
const reset = r => {
  clearTimeout(r.timer);
  Object.assign(r, { qi: '', qn: '', impostor: null, impName: '', impGone: false, answers: {}, names: {}, order: [], revealed: 0, showQ: false, intents: {}, votes: {}, result: null });
};

exports.init = r => { r.hostId = null; reset(r); };

exports.view = (r, p) => {
  const ph = r.phase, isHost = p.id === r.hostId, vs = voters(r).map(x => x.id);
  const row = id => ({ id, name: r.names[id] || '', text: r.answers[id] });
  const v = { type: 'state', game: 'perguntas', you: p.id, code: r.code, phase: ph, host: r.players[0].id, hostId: r.hostId,
    players: r.players.map(x => ({ id: x.id, name: x.name, emo: x.emo, color: x.color })),
    answered: Object.keys(r.answers).map(Number), total: vs.length,
    intents: r.intents, voted: Object.keys(r.votes).map(Number), counts: counts(r), result: r.result };
  if ((ph === 'answer' || ph === 'reveal') && !isHost) v.myQ = p.id === r.impostor ? r.qi : r.qn;
  if ((isHost && ph !== 'lobby') || ph === 'end') { v.qn = r.qn; v.qi = r.qi; v.impostor = r.impostor; }
  if (ph === 'reveal') { v.revealed = r.order.slice(0, r.revealed).map(row); v.showQ = r.showQ; if (r.showQ) v.qn = r.qn; }
  if (ph === 'vote' || ph === 'end') { v.qn = r.qn; v.entries = r.order.filter(id => vs.includes(id)).map(row); }
  return v;
};

function reveal(r, ctx) {
  r.order = shuffle(Object.keys(r.answers).map(Number)); r.revealed = 0; r.showQ = false; r.phase = 'reveal'; ctx.push(r);
  const tick = () => {
    if (!r.players.length || r.phase !== 'reveal') return;
    if (r.revealed < r.order.length) { r.revealed++; ctx.push(r); r.timer = setTimeout(tick, 3500); }
    else if (!r.showQ) { r.showQ = true; ctx.push(r); r.timer = setTimeout(tick, 6000); }
    else { r.phase = 'vote'; ctx.push(r); }
  };
  r.timer = setTimeout(tick, 1500);
}

function check(r, ctx) {
  const vs = voters(r);
  if (r.phase === 'answer' && vs.length && vs.every(p => r.answers[p.id] !== undefined)) return reveal(r, ctx);
  if (r.phase === 'vote' && vs.length && vs.every(p => r.votes[p.id])) {
    const c = counts(r), max = Math.max(...Object.values(c));
    const top = Object.keys(c).filter(k => c[k] === max).map(Number);
    const nm = id => (r.players.find(p => p.id === id) || {}).name || r.names[id] || '?';
    r.result = { caught: !r.impGone && top.length === 1 && top[0] === r.impostor, top: top.map(nm), max,
      impostor: r.impName + (r.impGone ? ' (saiu da partida)' : '') };
    r.phase = 'end';
  }
  ctx.push(r);
}

exports.handle = (r, me, m, ctx) => {
  const leader = r.players[0] === me, isHost = me.id === r.hostId, ph = r.phase;
  if (ph === 'lobby') {
    if (m.type === 'toHost' && r.hostId == null) { r.hostId = me.id; return ctx.push(r); }
    if (m.type === 'toPlayers' && isHost) { r.hostId = null; return ctx.push(r); }
    if (m.type === 'start' && leader) {
      if (r.hostId == null) return ctx.err(me.ws, 'Escolha um host antes de começar.');
      if (!voters(r).length) return ctx.err(me.ws, 'É preciso ao menos um jogador além do host.');
      reset(r); r.phase = 'write_q'; return ctx.push(r);
    }
    return;
  }
  if (ph === 'write_q' && isHost && m.type === 'questions') {
    const qn = cl(m.qn, 200), qi = cl(m.qi, 200);
    if (!qn || !qi) return ctx.err(me.ws, 'Escreva as duas perguntas.');
    const vs = voters(r), imp = vs[Math.random() * vs.length | 0];
    r.qn = qn; r.qi = qi; r.impostor = imp.id; r.impName = imp.name; r.impGone = false; r.phase = 'answer';
    return ctx.push(r);
  }
  if (ph === 'answer' && !isHost && m.type === 'answer' && r.answers[me.id] === undefined) {
    const t = cl(m.text, 120); if (!t) return;
    r.answers[me.id] = t; r.names[me.id] = me.name; return check(r, ctx);
  }
  if (ph === 'vote' && !isHost && !r.votes[me.id] && okTarget(r, me, m.target)) {
    if (m.type === 'intent') { r.intents[me.id] = m.target; return ctx.push(r); }
    if (m.type === 'vote') { r.votes[me.id] = m.target; r.intents[me.id] = m.target; return check(r, ctx); }
  }
  if (ph === 'end' && leader) {
    if (m.type === 'lobby') { reset(r); r.phase = 'lobby'; return ctx.push(r); }
    if (m.type === 'again') {
      if (r.hostId == null) return ctx.err(me.ws, 'O host saiu. Volte para a sala de espera e escolha um novo host.');
      reset(r); r.phase = 'write_q'; return ctx.push(r);
    }
  }
};

exports.leave = (r, me, ctx) => {
  if (me.id === r.hostId) {
    r.hostId = null;
    if (r.phase === 'write_q') { reset(r); r.phase = 'lobby'; return ctx.push(r); }
  }
  if (me.id === r.impostor) r.impGone = true;
  delete r.intents[me.id]; delete r.votes[me.id];
  for (const o of [r.intents, r.votes]) for (const k in o) if (o[k] === me.id) delete o[k];
  if (r.phase !== 'lobby' && !voters(r).length) { reset(r); r.phase = 'lobby'; return ctx.push(r); }
  check(r, ctx);
};