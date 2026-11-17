// Filtro de nomes: bloqueia palavras preconceituosas (português e inglês), inclusive disfarçadas:
// letras repetidas (niiigga), números/símbolos no lugar de letras (n1gg4), acentos, espaços e pontos no meio (n.i.g.g.a).
//
// Para ajustar a lista:
//  - SUB: trecho bloqueado em qualquer parte do nome ("nigg" bloqueia "nigga", "niggaz", "xniggx"...).
//  - WORD: bloqueado só quando é uma palavra inteira do nome. Usado para palavras curtas ou ambíguas,
//    para não barrar nomes normais (ex.: o sobrenome "Fagundes" tem "fag", e "Bichara" tem "bicha").

const SUB = [
  // inglês
  'nigg', 'niqq', 'wetback', 'faggot', 'tranny', 'shemale', 'retard', 'towelhead', 'raghead', 'cripple',
  'jigaboo', 'zipperhead', 'slanteye', 'chingchong', 'porchmonkey', 'shitskin', 'sandmonkey',
  // português
  'viado', 'viadao', 'sapatao', 'sapatona', 'traveco', 'boiola', 'baitola', 'paneleiro', 'crioul',
  'favelad', 'retardad', 'mongoloid', 'aleijad', 'debiloid', 'carcamano',
  // nazismo / supremacismo
  'nazista', 'neonazi', 'hitler', 'heilhitler', 'siegheil', 'feminazi', 'sionazi', 'holohoax',
  'whitepower', 'whitepride', 'supremaciabranca', 'supremacist'
];
const WORD = [
  'chink', 'chinks', 'gook', 'gooks', 'spic', 'spick', 'kike', 'kyke', 'coon', 'coons', 'beaner', 'beaners',
  'fag', 'fags', 'dyke', 'spaz', 'paki', 'darkie', 'wop', 'dago', 'heeb',
  'bicha', 'bichas', 'bichinha', 'maricas', 'macaco', 'macaca', 'mongol', 'nazi', 'nazis', 'kkk'
];
// Trechos curtos que também são conferidos com o nome inteiro "colado" (ex.: "ni gga"). Os demais
// só são conferidos assim quando têm 6+ letras, para evitar falsos positivos entre palavras vizinhas.
const FORCE = new Set(['nigg', 'niqq']);

// cada letra pode se repetir: "nigg" vira /n+i+g+g+/
const rep = (w, exact) => new RegExp((exact ? '^' : '') + [...w].map(c => c + '+').join('') + (exact ? '$' : ''));
const SUBRE = SUB.map(w => rep(w, false));
const SQRE = SUB.filter(w => w.length >= 6 || FORCE.has(w)).map(w => rep(w, false));
const WORDRE = WORD.map(w => rep(w, true));
const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'i' };

exports.blocked = function (name) {
  const raw = String(name || '');
  if (/1488/.test(raw)) return true;
  const s = raw.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/[013457@$!|]/g, c => LEET[c]);
  const toks = s.split(/[^a-z]+/).filter(Boolean);
  // letras soltas em sequência ("n i g g a" ou "n.i.g.g.a") viram uma palavra só
  const extra = []; let run = '';
  for (const t of toks) {
    if (t.length === 1) run += t;
    else { if (run.length > 1) extra.push(run); run = ''; }
  }
  if (run.length > 1) extra.push(run);
  const all = toks.concat(extra);
  const squashed = s.replace(/[^a-z]/g, '');
  return all.some(t => SUBRE.some(re => re.test(t)) || WORDRE.some(re => re.test(t)))
    || SQRE.some(re => re.test(squashed));
};