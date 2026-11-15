// Sorteio por ciclos: cada item sai uma vez por ciclo; só depois o ciclo recomeça.
// Na virada do ciclo, o último sorteado não pode ser o primeiro do ciclo seguinte.
// (Usado no local e em quem começa perguntando.)
exports.draw = function (r, key, items) {
  r.bags = r.bags || {};
  const b = r.bags[key] || (r.bags[key] = { left: [], done: [], last: null });
  b.left = b.left.filter(x => items.includes(x));
  b.done = b.done.filter(x => items.includes(x));
  items.forEach(x => { if (!b.left.includes(x) && !b.done.includes(x)) b.left.push(x); });
  if (!b.left.length) { b.left = items.slice(); b.done = []; }
  let pool = b.left;
  if (b.last != null && b.done.length === 0 && pool.length > 1) pool = pool.filter(x => x !== b.last);
  const pick = pool[Math.random() * pool.length | 0];
  b.left = b.left.filter(x => x !== pick);
  b.done.push(pick); b.last = pick;
  return pick;
};

// Sorteio ponderado pelo histórico recente da sala (usado no espião e no impostor).
// Peso = 1 / (1 + 0,6·C + 0,8·R)
//   C = vezes que o jogador foi sorteado nas últimas 10 partidas da sala
//   R = 1 se foi sorteado na última partida, senão 0
// Qualquer um pode repetir, ninguém tem chance zero. O histórico fica em r.hist e some com a sala.
exports.drawWeighted = function (r, key, items) {
  r.hist = r.hist || {};
  const h = r.hist[key] || (r.hist[key] = []);
  const recent = h.slice(-10), last = recent.length ? recent[recent.length - 1] : null;
  const w = items.map(id => 1 / (1 + 0.6 * recent.filter(x => x === id).length + 0.8 * (id === last ? 1 : 0)));
  let t = Math.random() * w.reduce((a, b) => a + b, 0), pick = items[items.length - 1];
  for (let i = 0; i < items.length; i++) { t -= w[i]; if (t <= 0) { pick = items[i]; break; } }
  h.push(pick); if (h.length > 10) h.shift();
  return pick;
};