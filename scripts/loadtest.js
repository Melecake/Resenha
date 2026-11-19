// Teste de carga com jogadores falsos.
//
// Uso (com o servidor rodando, por exemplo: ADMIN_PASSWORD=senha1234 node server.js):
//   node scripts/loadtest.js --url ws://localhost:3000 --rooms 20 --players 8 --game locais --seconds 60
//
// Cada sala tem um líder e (players-1) jogadores que jogam sozinhos: clicam em "pronto", votam, o líder
// inicia nova rodada e assim por diante. No fim mostra conexões, erros, mensagens recebidas e o tempo de
// resposta (ida e volta de um "ping") em p50 / p95 / máximo.
//
// Jogos: locais | cidade (precisa de pelo menos 5 jogadores por sala). Pika e Perguntas não são jogados
// pelos bots; para esses, o teste só cria a sala e mantém os jogadores conectados.
// Como todos os bots saem do mesmo endereço, o limite de conexões por IP do servidor (80) vale para eles também:
// para testar mais que isso, suba o servidor local com MAX_PER_IP=1000 (ex.: MAX_PER_IP=1000 ADMIN_PASSWORD=senha1234 node server.js).
// ATENÇÃO: não rode contra o site publicado com muitas salas, para não prejudicar quem está jogando.
const WebSocket = require('ws');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg('url', 'ws://localhost:3000');
const ROOMS = +arg('rooms', 10), PLAYERS = Math.min(20, +arg('players', 6)), SECONDS = +arg('seconds', 40);
const GAME = arg('game', 'locais');
if (GAME === 'cidade' && PLAYERS < 5) { console.error('Cidade Dorme precisa de pelo menos 5 jogadores por sala.'); process.exit(1); }

const stats = { conectados: 0, caidos: 0, erros: 0, msgs: 0, bytes: 0, joinFail: 0, rounds: 0, lat: [] };
const bots = [];
const rnd = n => Math.random() * n | 0;
const later = (fn, min, max) => setTimeout(fn, min + rnd(max - min));

class Bot {
  constructor(room, idx) {
    this.room = room; this.idx = idx; this.leader = idx === 0;
    this.name = `Bot${room.n}-${idx}`; this.token = `loadtest-${room.n}-${idx}-${Math.random().toString(36).slice(2)}`;
    this.done = new Set(); this.pingAt = 0; this.S = null;
  }
  connect() {
    this.ws = new WebSocket(URL);
    this.ws.on('open', () => {
      stats.conectados++;
      this.ws.send(JSON.stringify(this.leader
        ? { type: 'create', name: this.name, game: GAME, token: this.token }
        : { type: 'join', name: this.name, code: this.room.code, game: GAME, token: this.token }));
      this.pinger = setInterval(() => { this.pingAt = Date.now(); this.send({ type: 'ping' }); }, 4000);
    });
    this.ws.on('message', raw => {
      stats.msgs++; stats.bytes += raw.length;
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'pong') { if (this.pingAt) stats.lat.push(Date.now() - this.pingAt); return; }
      if (m.type === 'error') { stats.erros++; if (!this.S) stats.joinFail++; return; }
      if (m.type === 'kicked') return;
      if (m.type !== 'state') return;
      this.S = m;
      if (this.leader && !this.room.code) { this.room.code = m.code; this.room.onCode(); }
      this.react(m);
    });
    this.ws.on('close', () => { stats.caidos++; clearInterval(this.pinger); });
    this.ws.on('error', () => { stats.erros++; });
  }
  send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
  once(key, fn) { if (this.done.has(key)) return; this.done.add(key); fn(); }
  react(m) {
    if (Date.now() > this.room.stopAt) return;
    const rk = `${m.phase}|${m.round || m.night || 0}|${stats.rounds && this.room.round}`;
    if (GAME === 'locais') return this.locais(m, rk);
    if (GAME === 'cidade') return this.cidade(m, rk);
  }
  others(m) { const ids = m.players.map(p => p.id).filter(i => i !== m.you && !(m.dead || []).includes(i)); return ids; }
  locais(m, rk) {
    if (m.phase === 'lobby' && this.leader && m.players.length === PLAYERS) this.once('start' + this.room.round, () => later(() => this.send({ type: 'start' }), 300, 900));
    if (m.phase === 'play') this.once('ready' + m.round, () => later(() => this.send({ type: 'ready', ready: true }), 200, 1500));
    if (m.phase === 'vote') this.once('vote' + m.round, () => later(() => { const o = this.others(m); this.send({ type: 'intent', target: o[rnd(o.length)] }); later(() => this.send({ type: 'vote', target: o[rnd(o.length)] }), 100, 600); }, 200, 1500));
    if (m.phase === 'end' && this.leader) this.once('again' + m.round, () => { stats.rounds++; this.room.round++; later(() => this.send({ type: 'again' }), 800, 1500); });
  }
  cidade(m, rk) {
    const g = this.room.round;
    if (m.phase === 'lobby' && this.leader && m.players.length === PLAYERS) this.once('start' + g, () => later(() => this.send({ type: 'start' }), 300, 900));
    if (m.phase === 'roles') this.once('ack' + g, () => later(() => this.send({ type: 'ack' }), 100, 800));
    if (m.phase === 'night' && m.act && !m.act.done) this.once('nact' + g + m.night, () => later(() => this.send({ type: 'nact', target: m.act.targets[rnd(m.act.targets.length)] }), 200, 4000));
    if (m.phase === 'day' && !m.isDead) this.once('ready' + g + m.night, () => later(() => this.send({ type: 'ready', ready: true }), 200, 1500));
    if (m.phase === 'vote' && !m.isDead) this.once('vote' + g + m.night, () => later(() => { const o = this.others(m); if (Math.random() < 0.2) this.send({ type: 'skip' }); else this.send({ type: 'vote', target: o[rnd(o.length)] }); }, 200, 2000));
    if (m.phase === 'end' && this.leader) this.once('again' + g, () => { stats.rounds++; this.room.round++; later(() => this.send({ type: 'again' }), 800, 1500); });
  }
}

function startRoom(n) {
  const room = { n, code: null, round: 0, stopAt: Date.now() + SECONDS * 1000 };
  const leader = new Bot(room, 0); bots.push(leader);
  room.onCode = () => { for (let i = 1; i < PLAYERS; i++) { const b = new Bot(room, i); bots.push(b); setTimeout(() => b.connect(), i * 40); } };
  leader.connect();
}

console.log(`Teste de carga: ${ROOMS} salas x ${PLAYERS} jogadores (${ROOMS * PLAYERS} conexões), jogo ${GAME}, ${SECONDS}s, ${URL}`);
for (let i = 0; i < ROOMS; i++) setTimeout(() => startRoom(i), i * 120);

const pct = (a, p) => a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;
const t0 = Date.now();
const tick = setInterval(() => {
  const s = Math.round((Date.now() - t0) / 1000);
  console.log(`[${s}s] conexões abertas: ${stats.conectados - stats.caidos} | msgs recebidas: ${stats.msgs} | rodadas: ${stats.rounds} | erros: ${stats.erros}`);
}, 5000);

setTimeout(() => {
  clearInterval(tick);
  const mem = process.memoryUsage().rss / 1048576;
  console.log('\n===== Resultado =====');
  console.log(`Conexões abertas com sucesso: ${stats.conectados} de ${ROOMS * PLAYERS}`);
  console.log(`Quedas de conexão: ${stats.caidos} | erros do servidor/socket: ${stats.erros} | falhas ao entrar: ${stats.joinFail}`);
  console.log(`Rodadas completas: ${stats.rounds}`);
  console.log(`Mensagens recebidas: ${stats.msgs} (${(stats.bytes / 1024).toFixed(0)} KB, média ${(stats.bytes / Math.max(1, stats.msgs)).toFixed(0)} bytes)`);
  console.log(`Tempo de resposta do ping: p50 ${pct(stats.lat, 0.5)} ms | p95 ${pct(stats.lat, 0.95)} ms | máx ${Math.max(0, ...stats.lat)} ms (${stats.lat.length} amostras)`);
  console.log(`Memória do script de teste: ${mem.toFixed(0)} MB`);
  bots.forEach(b => { try { b.ws.close(); } catch {} });
  setTimeout(() => process.exit(0), 500);
}, (SECONDS + 4 + ROOMS * 0.12) * 1000);