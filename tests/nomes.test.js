const test = require('node:test');
const assert = require('node:assert/strict');
const { blocked } = require('../nomes');

test('bloqueia palavras preconceituosas, inclusive disfarçadas', () => {
  const ruins = ['nigga', 'NIGGER', 'N1gg4', 'n.i.g.g.a', 'n i g g a', 'ni gga', 'niiiigga', 'xxniggxx',
    'viado', 'V1ad0', 'sapatão', 'Hitler', 'heil hitler', 'nazista', 'kkk', 'K K K', 'fag', 'faggot',
    'retardado', 'macaco', 'macaco!', 'traveco', 'chink', 'bicha', 'paneleiro', 'wetback', 'Nazi'];
  for (const n of ruins) assert.equal(blocked(n), true, 'deveria bloquear: ' + n);
});

test('bloqueia a sequência 1488', () => {
  assert.equal(blocked('joao1488'), true);
});

test('não bloqueia nomes comuns nem palavras que só parecem ruins', () => {
  const bons = ['João', 'Maria', 'Ana Clara', 'Pedro Henrique', 'Fagundes', 'João Fagundes', 'Bichara',
    'Silvia Dorta', 'Ubi Chaves', 'Dani Gabriel', 'Spice', 'Special', 'Raccoon', 'Nigel', 'Sérgio Gomes',
    'Mônica', 'Zé', 'Gabriel_10', 'Lucas123', 'Cocoon', 'Analista', 'Hitchcock'];
  for (const n of bons) assert.equal(blocked(n), false, 'não deveria bloquear: ' + n);
});

test('entradas estranhas não quebram', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, '🙂🙂', '\u200b\u200b']) assert.equal(typeof blocked(v), 'boolean');
});