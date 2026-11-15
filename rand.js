// Sorteio justo por ciclos: cada item sai uma vez por ciclo; só depois o ciclo recomeça.
// Na virada do ciclo, o último sorteado não pode ser o primeiro do ciclo seguinte.
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