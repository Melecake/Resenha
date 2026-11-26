// ===== Login: PARTE VISUAL (ainda sem servidor) =====
// Este arquivo só desenha as telas. As ações de verdade (entrar, criar conta, salvar, apagar) estão nas funções
// marcadas com "SERVIDOR:" abaixo: hoje elas só avisam que o recurso chega em breve. Quando o login existir,
// é nelas que se liga o servidor, e AUTH_LIVE passa a true.
//
// Enquanto AUTH_PUBLIC for false, o botão "Entrar" fica escondido. Para ver as telas, abra o site com ?preview=1
// (ex.: https://seu-site/?preview=1); o modo vale até fechar a aba. Na tela de login aparece então um botão que "entra"
// como um usuário de exemplo, só para ver o perfil e as configurações. Nada disso vai para o servidor.

const AUTH_LIVE = false;
// Mostra o botão "Entrar" para todo mundo. Enquanto for false, o botão (e o acesso às telas de conta) só aparece com ?preview=1.
const AUTH_PUBLIC = false;
const TERMS_VERSION = '2026-11-25'; // versão dos termos aceita no cadastro (o servidor deverá guardar junto com a data/hora)
const AUTH_SCREENS = ['login', 'register', 'profile', 'settings'];
const DEMO_USER = { username: 'visitante_teste', name: 'Visitante Teste', emo: 3, color: 5, fnt: 1, col: 0, cd: 6, since: 'novembro de 2026', termsVersion: TERMS_VERSION, useLook: true };
const AUTH = { user: null, menu: false, preview: false, showPw: {}, draft: null, dirty: false, pv: 'sala', pwWarn: false,
  form: { user: '', pw: '', pw2: '', accept: false, tried: false },
  lform: { user: '', pw: '', tried: false } };

(() => { try {
  if (new URLSearchParams(location.search).get('preview') === '1') sessionStorage.setItem('authPrev', '1');
  AUTH.preview = sessionStorage.getItem('authPrev') === '1';
  if (AUTH.preview) { const u = sessionStorage.getItem('authUser'); if (u) AUTH.user = JSON.parse(u); }
} catch (e) {} })();


// ---------- peças reutilizáveis ----------
const aAv = (u, s = 44) => `<span class="av" style="width:${s}px;height:${s}px;flex:0 0 ${s}px;font-size:${Math.round(s * .5)}px;background:hsl(${HUES[u.color] ?? 200} 55% 32%)">${EMOTES[u.emo] ?? '?'}</span>`;
const aCls = u => { const f = u.fnt | 0, k = u.col | 0; return (f ? 'f' + f : '') + (k ? (f ? ' ' : '') + 'k' + k : ''); };
const aChip = u => `<span class="chip"${(u.cd | 0) ? ` data-cs="${u.cd | 0}"` : ''}>${aAv(u, 44)}<span class="cn"><b class="${aCls(u)}">${esc(u.name || 'Seu nome')}</b></span></span>`;
// Nome de usuário: único, de 3 a 20 caracteres (letras, números, "_" e "."). O servidor confere se já existe e aplica o filtro de nomes.
const aUserOk = u => /^[A-Za-z0-9_.]{3,20}$/.test(u);
const A_USER_MSG = 'Use de 3 a 20 caracteres: letras, números, "_" ou ".".';
const aSave = () => { try { if (AUTH.preview) { if (AUTH.user) sessionStorage.setItem('authUser', JSON.stringify(AUTH.user)); else sessionStorage.removeItem('authUser'); } } catch (e) {} };
function aModal(html, w = 420) {
  $('ntc').innerHTML = `<div class="modal" onclick="if(event.target===this)closeNote()"><div class="box" style="max-width:${w}px;text-align:left"><button class="xbtn" aria-label="Fechar" title="Fechar (Esc)" onclick="closeNote()">×</button>${html}</div></div>`;
}
function aSoon(what) {
  aModal(`<h3 style="margin:0 0 10px">Em breve</h3><p style="margin:0 0 18px;color:#cfd8f5;line-height:1.5">${esc(what)} ainda não está disponível. Por enquanto esta é só a parte visual do login; a conta de verdade chega em breve.</p><div style="text-align:center"><button onclick="closeNote()">Entendi</button></div>`);
}

// Prévia do visual: "Sala de espera" (card pequeno) e "Votação" (card grande, como aparece na hora de votar)
function aPv(m) { AUTH.pv = m; render(); }
function aVoteSample(u) {
  const sa = (e, c, cls) => `<span class="av ${cls}" style="background:hsl(${HUES[c]} 55% 32%)">${EMOTES[e]}</span>`;
  return `<div class="pvvote"><div class="vc"${(u.cd | 0) ? ` data-cs="${u.cd | 0}"` : ''}><span class="vcnt">1 voto</span>
    <div class="vh">${aAv(u, 44)}<span class="cn"><b class="${aCls(u)}">${esc(u.name || 'Seu nome')}</b><small>(você)</small></span></div>
    <div class="mv" style="--c:3;--h:62px">${sa(1, 2, 'cv')}${sa(5, 6, 'iv')}${sa(9, 9, 'iv')}</div>
    <div class="vb"><button class="sec" tabindex="-1">Declarar intenção</button><button tabindex="-1">Votar</button></div></div></div>`;
}
function aPreviewBox(u) {
  return `<div class="prevbox"><div class="lbls"><button class="lb nobusy ${AUTH.pv === 'sala' ? 'sel' : ''}" onclick="aPv('sala')">Sala de espera</button><button class="lb nobusy ${AUTH.pv === 'votacao' ? 'sel' : ''}" onclick="aPv('votacao')">Votação</button></div>${AUTH.pv === 'votacao' ? aVoteSample(u) : aChip(u)}</div>`;
}
function aDocs(u) {
  return `<a class="doclink" href="/termos" target="_blank" rel="noopener">Termos de Uso e Condições<span>↗</span></a><a class="doclink" href="/termos#s7" target="_blank" rel="noopener">Privacidade e dados pessoais<span>↗</span></a><p class="mut small" style="margin:12px 0 0">Você aceitou a versão ${esc((u && u.termsVersion) || TERMS_VERSION)} dos termos ao criar a conta.</p>`;
}

// ---------- navegação ----------
function aGo(s) {
  AUTH.menu = false; err = '';
  if (s === 'settings') { AUTH.draft = { ...AUTH.user }; AUTH.dirty = false; }
  if (s === 'register') AUTH.form.tried = false;
  screen = s; render();
}
function aMenu(e) { e.stopPropagation(); AUTH.menu = !AUTH.menu; render(); }
document.addEventListener('click', e => { if (AUTH.menu && !e.target.closest('.acct')) { AUTH.menu = false; render(); } });
function aLogout() {
  // SERVIDOR: encerrar a sessão no servidor
  AUTH.user = null; AUTH.menu = false; AUTH.draft = null; aSave(); screen = 'home'; render(); toast('Você saiu da conta.');
}
function aPreviewLogin(extra) {
  AUTH.user = { ...DEMO_USER, ...(extra || {}) }; aSave(); screen = 'profile'; render();
}

// ---------- botão da página inicial ----------
function accountBar() {
  if (!AUTH_PUBLIC && !AUTH.preview) return '';
  const u = AUTH.user;
  if (!u) return `<div class="acct"><button class="nbtn nobusy" onclick="aGo('login')"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>Entrar</button></div>`;
  return `<div class="acct"><button class="acctchip nobusy" onclick="aMenu(event)" aria-haspopup="true" aria-expanded="${AUTH.menu}">${aAv(u, 34)}<b class="${aCls(u)}">${esc(u.name)}</b><span class="car">▾</span></button>${AUTH.menu ? `<div class="acctmenu"><button class="nobusy" onclick="aGo('profile')">Meu perfil</button><button class="nobusy" onclick="aGo('settings')">Configurações</button><hr><button class="nobusy out" onclick="aLogout()">Sair</button></div>` : ''}</div>`;
}

// ---------- LOGIN ----------
function aIn(form, key, val) { AUTH[form][key] = val; }          // digitando: só guarda (sem redesenhar)
function aInR(form, key, val) { AUTH[form][key] = val; render(); } // digitando no cadastro: redesenha (erros e botão)
function aEye(k) { AUTH.showPw[k] = !AUTH.showPw[k]; render(); }
function aLogin() {
  const f = AUTH.lform; f.tried = true;
  if (!aUserOk(f.user.trim()) || !f.pw) { render(); return; }
  // SERVIDOR: enviar { username, senha } e abrir a sessão
  if (AUTH.preview) { aPreviewLogin({ username: f.user.trim(), name: f.user.trim() }); return; }
  aSoon('Entrar na conta');
}
function loginPage() {
  const f = AUTH.lform, eU = f.tried && !aUserOk(f.user.trim()) ? A_USER_MSG : '', eP = f.tried && !f.pw ? 'Digite a sua senha.' : '';
  return `<div class="authwrap"><div class="card ctr authcard">
    <div class="eyebrow">Resenha da Madrugada</div><h1 class="ah">Entrar</h1>
    <p class="mut" style="margin:0 0 6px">Entre para salvar o seu visual e acompanhar as suas partidas.</p>
    <div class="fld"><label for="l-user">Nome de usuário</label><input id="l-user" class="${eU ? 'bad' : ''}" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="seu_usuario" value="${esc(f.user)}" oninput="aIn('lform','user',this.value)">${eU ? `<p class="ferr">${eU}</p>` : ''}</div>
    <div class="fld"><label for="l-pw">Senha</label><div class="pwrow"><input id="l-pw" type="${AUTH.showPw.l ? 'text' : 'password'}" class="${eP ? 'bad' : ''}" autocomplete="current-password" placeholder="Sua senha" value="${esc(f.pw)}" oninput="aIn('lform','pw',this.value)" onkeydown="if(event.key==='Enter')aLogin()"><button type="button" class="eye nobusy" onclick="aEye('l')">${AUTH.showPw.l ? 'Ocultar' : 'Mostrar'}</button></div>${eP ? `<p class="ferr">${eP}</p>` : ''}</div>
    <button style="width:100%;margin-top:6px" onclick="aLogin()">Entrar</button>
    ${AUTH.preview ? `<button class="sec nobusy" style="width:100%;margin-top:12px;border-style:dashed" onclick="aPreviewLogin()">Modo de teste: entrar como usuário de exemplo</button>` : ''}
    <p class="mut" style="margin:20px 0 0">Ainda não tem conta? <a href="#" onclick="event.preventDefault();aGo('register')">Criar conta</a></p>
    <p class="mut small" style="margin:10px 0 0">Você também pode jogar sem conta: é só voltar para o início.</p>
  </div></div>`;
}

// ---------- CADASTRO (só nome de usuário e senha; o e-mail fica para uma etapa futura) ----------
function aRegErrors(f) {
  const e = {};
  if (!aUserOk(f.user.trim())) e.user = A_USER_MSG;
  if (f.pw.length < 8) e.pw = 'A senha precisa ter pelo menos 8 caracteres.';
  if (!f.pw2 || f.pw2 !== f.pw) e.pw2 = 'As senhas não são iguais.';
  return e;
}
function aStrength(p) {
  if (!p) return 0;
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(1, s);
}
function aAccept(v) { AUTH.form.accept = v; render(); }
function aPwWarn() { if (!AUTH.pwWarn) { AUTH.pwWarn = true; render(); } } // ao clicar no campo da senha, mostra o aviso
// Aviso mostrado ao criar/trocar a senha (texto na primeira pessoa: quem fala é quem administra o site)
const PW_WARN = '<b>Use uma senha diferente das que você costuma usar.</b> Escolha uma senha que você não usa em outros sites e apps. Apesar de ser pouco provável um ataque ou um vazamento de dados, e de eu me dedicar para manter o site seguro, reconheço que podem existir brechas, e não quero que você seja prejudicado de nenhuma maneira.';
function aRegister() {
  const f = AUTH.form; f.tried = true;
  if (!f.accept) { render(); return; }
  if (Object.keys(aRegErrors(f)).length) { render(); return; }
  // SERVIDOR: criar a conta enviando { username, senha, termsAccepted: true, termsVersion: TERMS_VERSION }.
  // O servidor deve recusar nome de usuário já existente (sem diferenciar maiúsculas) e aplicar o filtro de nomes.
  if (AUTH.preview) { aPreviewLogin({ username: f.user.trim(), name: f.user.trim(), termsVersion: TERMS_VERSION }); return; }
  aSoon('Criar a conta');
}
function registerPage() {
  const f = AUTH.form, er = aRegErrors(f), sh = k => (f.tried && er[k]) ? `<p class="ferr">${er[k]}</p>` : '', bad = k => (f.tried && er[k]) ? 'bad' : '';
  const sc = aStrength(f.pw), lbl = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][sc];
  const noTerms = f.tried && !f.accept;
  return `<div class="authwrap"><div class="card ctr authcard">
    <div class="eyebrow">Resenha da Madrugada</div><h1 class="ah">Criar conta</h1>
    <p class="mut" style="margin:0 0 6px">Salve o seu visual e acompanhe as suas partidas em qualquer aparelho.</p>
    <div class="fld"><label for="r-user">Nome de usuário</label><input id="r-user" class="${bad('user')}" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Escolha um nome de usuário único" value="${esc(f.user)}" oninput="aInR('form','user',this.value)"><p class="fhint">Precisa ser único e é usado para entrar. Depois você pode escolher outro nome para aparecer nas partidas. Nomes ofensivos ou preconceituosos não são aceitos.</p>${sh('user')}</div>
    <div class="fld"><label for="r-pw">Senha</label><div class="pwrow"><input id="r-pw" type="${AUTH.showPw.r ? 'text' : 'password'}" class="${bad('pw')}" autocomplete="new-password" placeholder="Pelo menos 8 caracteres" value="${esc(f.pw)}" onfocus="aPwWarn()" oninput="aInR('form','pw',this.value)"><button type="button" class="eye nobusy" onclick="aEye('r')">${AUTH.showPw.r ? 'Ocultar' : 'Mostrar'}</button></div>
      ${AUTH.pwWarn ? `<div class="pwwarn" role="note">${PW_WARN}</div>` : ''}
      ${f.pw ? `<div class="pwm s${sc}"><i></i><i></i><i></i><i></i></div><p class="fhint">Força da senha: ${lbl}</p>` : ''}${sh('pw')}
      <p class="fhint">Guarde bem a sua senha: por enquanto não há recuperação por e-mail.</p></div>
    <div class="fld"><label for="r-pw2">Confirmar senha</label><input id="r-pw2" type="${AUTH.showPw.r ? 'text' : 'password'}" class="${bad('pw2')}" autocomplete="new-password" placeholder="Repita a senha" value="${esc(f.pw2)}" oninput="aInR('form','pw2',this.value)">${sh('pw2')}</div>
    <label class="chk ${noTerms ? 'bad' : ''}"><input type="checkbox" class="cb2" ${f.accept ? 'checked' : ''} onchange="aAccept(this.checked)"><span>Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de Uso e Condições</a>, incluindo como os meus dados são tratados.</span></label>
    ${noTerms ? '<p class="ferr">Para criar a conta você precisa aceitar os termos.</p>' : ''}
    <button id="r-go" style="width:100%;margin-top:16px" ${f.accept ? '' : 'disabled'} onclick="aRegister()">Criar conta</button>
    ${f.accept ? '' : '<p class="fhint" style="text-align:center">Marque a aceitação dos termos para liberar o cadastro.</p>'}
    <p class="mut" style="margin:18px 0 0">Já tem conta? <a href="#" onclick="event.preventDefault();aGo('login')">Entrar</a></p>
  </div></div>`;
}

// ---------- PERFIL ----------
function profilePage() {
  const u = AUTH.user; if (!u) return loginPage();
  const f = FONTS[u.fnt | 0], k = COLS[u.col | 0], c = CARDS[u.cd | 0];
  return `<div class="authwrap wide">
    <div class="card ctr pcard"><div class="pbig">${aAv(u, 104)}</div>
      <div class="pname ${aCls(u)}">${esc(u.name)}</div>
      <p class="mut" style="margin:0">@${esc(u.username || '')}</p><p class="mut small" style="margin:6px 0 0">Membro desde ${esc(u.since || '')}</p>
      <div class="row" style="max-width:420px;margin:20px auto 0"><button onclick="aGo('settings')">Editar perfil</button><button class="sec" onclick="aLogout()">Sair</button></div>
    </div>
    <div class="card"><label>Seu visual nas partidas</label>
      ${aPreviewBox(u)}
      <p class="mut small" style="margin:8px 0 14px">Fonte: ${f} · Cor do nome: ${k} · Card: ${c}</p>
      <button class="sec" style="width:100%" onclick="aGo('settings')">Mudar visual</button></div>
    <div class="card"><label>Estatísticas</label>
      <div class="stats"><div class="stat"><b>—</b><span>Partidas</span></div><div class="stat"><b>—</b><span>Vitórias</span></div><div class="stat"><b>—</b><span>Pontos totais</span></div></div>
      <p class="mut small" style="margin:14px 0 0">Em breve: as suas partidas, vitórias e pontos vão aparecer aqui.</p></div>
    <div class="card"><label>Termos e privacidade</label>${aDocs(u)}</div>
  </div>`;
}

// ---------- CONFIGURAÇÕES ----------
function aSet(k, v) { AUTH.draft[k] = v; AUTH.dirty = true; render(); }
function aTgl(k) { aSet(k, !AUTH.draft[k]); }
function aSaveSettings() {
  const d = AUTH.draft, n = (d.name || '').trim();
  if (n.length < 2 || n.length > 30) { toast('O nome precisa ter de 2 a 30 caracteres.'); return; }
  // SERVIDOR: salvar o perfil (nome, visual e preferências)
  if (AUTH.preview) { AUTH.user = { ...d, name: n }; aSave(); AUTH.dirty = false; render(); toast('Alterações salvas (modo de teste).'); return; }
  aSoon('Salvar as alterações');
}
function aCancelSettings() { AUTH.draft = null; AUTH.dirty = false; screen = 'profile'; render(); }
function aPwModal() {
  aModal(`<h3 style="margin:0 0 12px">Alterar senha</h3>
    <div class="pwwarn" role="note" style="margin:0 0 6px">${PW_WARN}</div>
    <div class="fld" style="margin:10px 0"><label for="pw0">Senha atual</label><input id="pw0" type="password" autocomplete="current-password"></div>
    <div class="fld" style="margin:10px 0"><label for="pw1">Nova senha</label><input id="pw1" type="password" autocomplete="new-password" placeholder="Pelo menos 8 caracteres"></div>
    <div class="fld" style="margin:10px 0"><label for="pw2">Confirmar nova senha</label><input id="pw2" type="password" autocomplete="new-password"></div>
    <p id="pwerr" class="ferr" style="min-height:1.3em"></p>
    <div class="row"><button class="sec" onclick="closeNote()">Cancelar</button><button onclick="aChangePw()">Alterar</button></div>`);
}
function aChangePw() {
  const a = $('pw0').value, b = $('pw1').value, c = $('pw2').value, e = $('pwerr');
  if (!a) return e.textContent = 'Digite a senha atual.';
  if (b.length < 8) return e.textContent = 'A nova senha precisa ter pelo menos 8 caracteres.';
  if (b !== c) return e.textContent = 'As senhas novas não são iguais.';
  // SERVIDOR: trocar a senha
  aSoon('Alterar a senha');
}
function aDelModal() {
  aModal(`<h3 style="margin:0 0 10px;color:#ff8a8a">Apagar conta?</h3>
    <p style="margin:0 0 14px;color:#cfd8f5;line-height:1.5">Isso apaga o seu perfil, o seu visual e as suas estatísticas. Não dá para desfazer.</p>
    <label for="del-in">Digite APAGAR para confirmar</label><input id="del-in" autocomplete="off" oninput="$('del-go').disabled=this.value.trim().toUpperCase()!=='APAGAR'">
    <div class="row" style="margin-top:16px"><button class="sec" onclick="closeNote()">Cancelar</button><button class="cx" id="del-go" disabled onclick="aDelete()">Apagar conta</button></div>`);
}
function aDelete() {
  // SERVIDOR: apagar a conta e os dados da pessoa
  if (AUTH.preview) { closeNote(); aLogout(); return; }
  aSoon('Apagar a conta');
}
function settingsPage() {
  const u = AUTH.user; if (!u) return loginPage();
  const d = AUTH.draft || (AUTH.draft = { ...u }), nameBad = (d.name || '').trim().length < 2;
  const tg = k => `<button type="button" class="tgl nobusy ${d[k] ? 'on' : ''}" role="switch" aria-checked="${!!d[k]}" onclick="aTgl('${k}')"></button>`;
  return `<div class="authwrap wide">
    <h1 class="ah" style="text-align:left;margin:0 0 4px">Configurações</h1>
    <p class="mut" style="text-align:left;margin:0 0 6px">Ajuste o seu perfil e o seu visual nas partidas.</p>

    <div class="card setsec"><h3>Conta</h3>
      <div class="fld" style="margin-top:0"><label for="s-name">Nome de exibição</label><input id="s-name" class="${nameBad ? 'bad' : ''}" maxlength="30" value="${esc(d.name || '')}" oninput="aSet('name',this.value)"><p class="fhint">É o nome que os outros jogadores veem nas partidas.</p>${nameBad ? '<p class="ferr">Use de 2 a 30 caracteres.</p>' : ''}</div>
      <div class="fld"><label for="s-user">Nome de usuário</label><input id="s-user" value="${esc(d.username || '')}" disabled><p class="fhint">É o que você usa para entrar e não pode ser trocado.</p></div>
      <button class="sec" onclick="aPwModal()">Alterar senha</button>
      <p class="fhint">Por enquanto não há recuperação de senha por e-mail. Guarde bem a sua senha.</p>
    </div>

    <div class="card setsec"><h3>Visual nas partidas</h3>
      ${aPreviewBox(d)}
      <label style="margin-top:16px">Ícone</label><div class="emos">${EMOTES.map((e, i) => `<button class="eb ${d.emo === i ? 'sel' : ''}" onclick="aSet('emo',${i})">${e}</button>`).join('')}</div>
      <label style="margin-top:16px">Cor do ícone</label><div class="cols">${HUES.map((h, i) => `<button class="cb ${d.color === i ? 'sel' : ''}" style="background:hsl(${h} 55% 40%)" aria-label="Cor ${i + 1}" onclick="aSet('color',${i})"></button>`).join('')}</div>
      <label style="margin-top:16px">Fonte</label><div class="opts">${FONTS.map((n, i) => `<button class="opt ${(d.fnt | 0) === i ? 'sel' : ''}" onclick="aSet('fnt',${i})"><span class="${i ? 'f' + i : ''}${(d.col | 0) ? ' k' + (d.col | 0) : ''}">${esc(d.name || 'Nome')}</span><small>${n}</small></button>`).join('')}</div>
      <label style="margin-top:16px">Cor do nome</label><div class="sws">${COLS.map((n, i) => `<button class="sw ${i ? '' : 'auto'} ${(d.col | 0) === i ? 'sel' : ''}" ${i ? `style="background:${COLHEX[i]}"` : ''} title="${n}" aria-label="${n}" onclick="aSet('col',${i})">${i ? '' : 'A'}</button>`).join('')}</div>
      <label style="margin-top:16px">Card</label><div class="opts">${CARDS.map((n, i) => `<button class="opt ${(d.cd | 0) === i ? 'sel' : ''}"${i ? ` data-cs="${i}"` : ''} onclick="aSet('cd',${i})">${i ? `<span>${n}</span>` : `<span>${n}</span><small>card azul</small>`}</button>`).join('')}</div>
    </div>

    <div class="card setsec"><h3>Preferências</h3>
      <div class="setrow"><div class="tx"><b>Entrar nas salas com o meu visual</b><small class="mut" style="text-align:left">Usa o visual salvo na conta ao criar ou entrar em uma sala.</small></div>${tg('useLook')}</div>
    </div>

    <div class="card setsec"><h3>Termos e privacidade</h3>${aDocs(u)}</div>

    <div class="card setsec danger"><h3 style="color:#ff8a8a">Zona de perigo</h3>
      <p class="mut" style="text-align:left;margin:0 0 14px;line-height:1.5">Apagar a conta remove o seu perfil, o seu visual e as suas estatísticas.</p>
      <button class="cx" onclick="aDelModal()">Apagar minha conta</button>
    </div>

    <div class="savebar ${AUTH.dirty ? 'dirty' : ''}"><span class="msg ${AUTH.dirty ? 'dirty' : ''}">${AUTH.dirty ? 'Você tem alterações não salvas.' : 'Nenhuma alteração.'}</span>
      <div class="row"><button class="sec" onclick="aCancelSettings()">Cancelar</button><button ${AUTH.dirty && !nameBad ? '' : 'disabled'} onclick="aSaveSettings()">Salvar alterações</button></div></div>
  </div>`;
}

// ---------- chamado pelo app.js ----------
function authHtml() {
  if (screen === 'login') return loginPage();
  if (screen === 'register') return registerPage();
  if (screen === 'profile') return profilePage();
  if (screen === 'settings') return settingsPage();
  return '';
}