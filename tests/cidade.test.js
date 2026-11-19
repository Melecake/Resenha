const test = require('node:test');
const assert = require('node:assert/strict');
const cidade = require('../cidade');

// Sala de mentira: não usa rede. O "ctx" imita o do servidor.
function sala(n = 6, nightSec = 0.02) {
  const r = { code: 'TEST', game: 'cidade', phase: 'lobby', players: [], scores: {}, rounds: 0 };
  for (let i = 1; i <= n; i++) r.players.push({ id: i, name: 'J' + i, token: 'tok' + i, ws: { i } });
  const pushes = [], errs = [];
  const ctx = { push: () => pushes.push(r.phase), err: (_w, m) => errs.push(m),
    award: (rr, list) => { rr.gain = {}; list.forEach(([p, pts]) => { rr.gain[p.id] = (rr.gain[p.id] || 0) + pts; }); rr.rounds++; } };
  cidade.init(r);
  r.nightSec = nightSec; // noite curta só para o teste (o servidor só aceita 10, 15, 20...)
  return { r, ctx, pushes, errs, p: id => r.players.find(x => x.id === id) };
}
const parar = r => { clearTimeout(r.timer); clearTimeout(r.lt); };
const espera = ms => new Promise(ok => setTimeout(ok, ms));
const quem = (r, papel) => +Object.keys(r.roles).find(i => r.roles[i] === papel);
function comecar(s) {
  cidade.handle(s.r, s.r.players[0], { type: 'start' }, s.ctx);
  s.r.players.forEach(p => cidade.handle(s.r, p, { type: 'ack' }, s.ctx));
}

test('precisa de pelo menos 5 jogadores', () => {
  const s = sala(4);
  cidade.handle(s.r, s.r.players[0], { type: 'start' }, s.ctx);
  assert.equal(s.r.phase, 'lobby');
  assert.equal(s.errs.length, 1);
});

test('só o líder escolhe a duração da noite e só valores permitidos', () => {
  const s = sala(5);
  cidade.handle(s.r, s.r.players[1], { type: 'cfg', sec: 30 }, s.ctx);
  assert.notEqual(s.r.nightSec, 30);
  cidade.handle(s.r, s.r.players[0], { type: 'cfg', sec: 7 }, s.ctx);
  assert.notEqual(s.r.nightSec, 7);
  cidade.handle(s.r, s.r.players[0], { type: 'cfg', sec: 30 }, s.ctx);
  assert.equal(s.r.nightSec, 30);
});

test('sorteia 1 assassino, 1 detetive, 1 anjo e o resto cidadãos', () => {
  const s = sala(7);
  cidade.handle(s.r, s.r.players[0], { type: 'start' }, s.ctx);
  const papeis = Object.values(s.r.roles);
  assert.equal(papeis.filter(x => x === 'assassino').length, 1);
  assert.equal(papeis.filter(x => x === 'detetive').length, 1);
  assert.equal(papeis.filter(x => x === 'anjo').length, 1);
  assert.equal(papeis.filter(x => x === 'cidadao').length, 4);
  assert.equal(s.r.phase, 'roles');
});

test('a noite só começa quando todos clicam "Entendi"', () => {
  const s = sala(5);
  cidade.handle(s.r, s.r.players[0], { type: 'start' }, s.ctx);
  s.r.players.slice(0, 4).forEach(p => cidade.handle(s.r, p, { type: 'ack' }, s.ctx));
  assert.equal(s.r.phase, 'roles');
  cidade.handle(s.r, s.r.players[4], { type: 'ack' }, s.ctx);
  assert.equal(s.r.phase, 'night');
  parar(s.r);
});

test('quem não agiu a tempo tem o alvo sorteado e só o próprio jogador fica sabendo', async () => {
  const s = sala(6);
  comecar(s);
  await espera(120); // a noite curta termina sozinha
  parar(s.r);
  const a = quem(s.r, 'assassino'), d = quem(s.r, 'detetive'), g = quem(s.r, 'anjo');
  assert.equal(s.r.log[a].length, 1);
  assert.equal(s.r.log[g].length, 1);
  assert.equal(s.r.inv[d].length, 1);
  assert.ok(s.r.miss[a] && s.r.miss[d] && s.r.miss[g]);
  // quem é cidadão não vê o aviso e não recebe histórico
  const c = quem(s.r, 'cidadao');
  const v = cidade.view(s.r, s.p(c));
  assert.equal(v.missed, undefined);
  assert.equal(v.log, undefined);
  assert.equal(v.inv, undefined);
});

test('alvo automático: assassino e detetive nunca caem em si mesmos; detetive não repete investigado', async () => {
  for (let i = 0; i < 40; i++) {
    const s = sala(6, 0.005);
    comecar(s);
    await espera(40);
    parar(s.r);
    const a = quem(s.r, 'assassino'), d = quem(s.r, 'detetive');
    assert.notEqual(s.r.log[a][0].target, a);
    assert.notEqual(s.r.inv[d][0].target, d);
  }
});

test('o anjo protegendo a vítima evita a morte; sem proteção, a vítima morre', async () => {
  for (const protegido of [true, false]) {
    const s = sala(6, 0.05);
    comecar(s);
    const a = quem(s.r, 'assassino'), g = quem(s.r, 'anjo');
    const ids = s.r.players.map(p => p.id).filter(i => i !== a);
    const vitima = ids[0], outro = ids.find(i => i !== vitima);
    cidade.handle(s.r, s.p(a), { type: 'nact', target: vitima }, s.ctx);
    cidade.handle(s.r, s.p(g), { type: 'nact', target: protegido ? vitima : outro }, s.ctx);
    await espera(200); // a noite curta termina sozinha
    parar(s.r);
    assert.equal(!!s.r.dead[vitima], !protegido);
    assert.equal(s.r.dawn.dead.length, protegido ? 0 : 1);
  }
});

test('a visão não vaza segredos: cidadão não vê papéis; morto vê; a intenção de pular fica separada', () => {
  const s = sala(6);
  comecar(s);
  const c = quem(s.r, 'cidadao');
  let v = cidade.view(s.r, s.p(c));
  assert.equal(v.roles, undefined);
  assert.equal(v.act, undefined);
  s.r.dead[c] = true;
  v = cidade.view(s.r, s.p(c));
  assert.equal(Object.keys(v.roles).length, 6);
  // votação: intenção de pular não entra em "intents"
  s.r.phase = 'vote'; s.r.intents = { 1: 'skip', 2: 3 }; s.r.votes = { 4: 'skip' };
  v = cidade.view(s.r, s.p(1));
  assert.deepEqual(v.intents, { 2: 3 });
  assert.deepEqual(v.skipI, [1]);
  assert.deepEqual(v.skipV, [4]);
  parar(s.r);
});

test('votação: todos pulam -> ninguém é eliminado; maioria em um alvo -> encerra na hora', () => {
  let s = sala(5);
  comecar(s); parar(s.r);
  s.r.phase = 'vote'; s.r.intents = {}; s.r.votes = {};
  s.r.players.forEach(p => cidade.handle(s.r, p, { type: 'skip' }, s.ctx));
  assert.equal(s.r.lastVote.out, null);
  assert.equal(s.r.lastVote.reason, 'skip');
  assert.equal(Object.keys(s.r.dead).length, 0);
  parar(s.r);

  s = sala(5);
  comecar(s); parar(s.r);
  s.r.phase = 'vote'; s.r.intents = {}; s.r.votes = {};
  const alvo = s.r.players[4];
  [0, 1, 2].forEach(i => cidade.handle(s.r, s.r.players[i], { type: 'vote', target: alvo.id }, s.ctx));
  assert.equal(s.r.dead[alvo.id], true);
  assert.equal(s.r.lastVote.early, true);
  parar(s.r);
});

test('eliminar o assassino dá a vitória à cidade (cidadãos e especiais pontuam 1, assassino 0)', () => {
  const s = sala(6);
  comecar(s); parar(s.r);
  s.r.phase = 'vote'; s.r.intents = {}; s.r.votes = {};
  const a = quem(s.r, 'assassino');
  s.r.players.filter(p => p.id !== a).slice(0, 4).forEach(p => cidade.handle(s.r, p, { type: 'vote', target: a }, s.ctx));
  assert.equal(s.r.phase, 'end');
  assert.equal(s.r.result.winner, 'cidade');
  assert.equal(s.r.gain[a], undefined);
  assert.equal(s.r.gain[s.r.players.find(p => p.id !== a).id], 1);
});

test('quem sai da sala conta como morto; se for o assassino, a cidade vence', () => {
  const s = sala(6);
  comecar(s); parar(s.r);
  const a = quem(s.r, 'assassino');
  cidade.leave(s.r, s.p(a), s.ctx);
  assert.equal(s.r.phase, 'end');
  assert.equal(s.r.result.winner, 'cidade');
});