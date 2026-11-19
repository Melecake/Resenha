const test = require('node:test');
const assert = require('node:assert/strict');
const { draw, drawWeighted } = require('../rand');

test('draw: em cada ciclo todos saem uma vez, sem repetir', () => {
  const r = {}, items = ['a', 'b', 'c', 'd'];
  for (let ciclo = 0; ciclo < 5; ciclo++) {
    const saiu = Array.from({ length: items.length }, () => draw(r, 'k', items));
    assert.deepEqual([...saiu].sort(), [...items].sort());
  }
});

test('draw: o último de um ciclo não abre o ciclo seguinte', () => {
  for (let i = 0; i < 300; i++) {
    const r = {}, items = ['a', 'b', 'c'];
    const seq = Array.from({ length: 12 }, () => draw(r, 'k', items));
    for (let j = 1; j < seq.length; j++) assert.notEqual(seq[j], seq[j - 1]);
  }
});

test('draw: quem sai da lista deixa de ser sorteado e quem entra passa a ser', () => {
  const r = {};
  draw(r, 'k', ['a', 'b', 'c']);
  const depois = Array.from({ length: 6 }, () => draw(r, 'k', ['b', 'c', 'd']));
  assert.ok(!depois.includes('a'));
  assert.ok(depois.includes('d'));
});

test('draw: com um item só, devolve sempre ele', () => {
  const r = {};
  for (let i = 0; i < 5; i++) assert.equal(draw(r, 'k', ['x']), 'x');
});

test('drawWeighted: só devolve itens da lista e guarda no máximo 10 no histórico', () => {
  const r = {}, ids = [1, 2, 3, 4];
  for (let i = 0; i < 50; i++) assert.ok(ids.includes(drawWeighted(r, 'k', ids)));
  assert.equal(r.hist.k.length, 10);
});

test('drawWeighted: quem acabou de ser sorteado tem chance menor (peso 1/(1+0,8) ≈ 0,56 com um sorteio)', () => {
  // histórico: jogador 1 foi o último sorteado, uma vez -> peso 1/(1+0,6+0,8)=0,4167; os outros 2 têm peso 1
  let n1 = 0; const N = 20000;
  for (let i = 0; i < N; i++) {
    const r = { hist: { k: [1] } };
    if (drawWeighted(r, 'k', [1, 2, 3]) === 1) n1++;
  }
  const esperado = 0.4167 / (0.4167 + 2);
  assert.ok(Math.abs(n1 / N - esperado) < 0.02, `esperado ~${esperado.toFixed(3)}, veio ${(n1 / N).toFixed(3)}`);
});

test('drawWeighted: ninguém tem chance zero', () => {
  const vistos = new Set();
  for (let i = 0; i < 4000; i++) {
    const r = { hist: { k: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] } };
    vistos.add(drawWeighted(r, 'k', [1, 2]));
  }
  assert.deepEqual([...vistos].sort(), [1, 2]);
});

test('drawWeighted: jogador novo (sem histórico) tem o peso máximo', () => {
  let novo = 0; const N = 20000;
  for (let i = 0; i < N; i++) {
    const r = { hist: { k: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2] } };
    if (drawWeighted(r, 'k', [1, 2, 3]) === 3) novo++;
  }
  assert.ok(novo / N > 0.5, 'o novato deveria ser o mais provável, veio ' + (novo / N).toFixed(3));
});