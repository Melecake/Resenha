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
const TERMS_VERSION = '2026-11-22'; // versão dos termos aceita no cadastro (o servidor deverá guardar junto com a data/hora)
const AUTH_SCREENS = ['login', 'register', 'profile', 'settings'];
const DEMO_USER = { name: 'Visitante Teste', email: 'teste@exemplo.com', emo: 3, color: 5, fnt: 1, col: 0, cd: 6, since: 'novembro de 2026', statsPublic: true, useLook: true };
const AUTH = { user: null, menu: false, preview: false, showPw: {}, draft: null, dirty: false,
  form: { name: '', email: '', pw: '', pw2: '', accept: false, tried: false },
  lform: { email: '', pw: '', tried: false } };

(() => { try {
  if (new URLSearchParams(location.search).get('preview') === '1') sessionStorage.setItem('authPrev', '1');
  AUTH.preview = sessionStorage.getItem('authPrev') === '1';
  if (AUTH.preview) { const u = sessionStorage.getItem('authUser'); if (u) AUTH.user = JSON.parse(u); }
} catch (e) {} })();

const G_ICON = '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const D_ICON = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>';

// ---------- peças reutilizáveis ----------
const aAv = (u, s = 44) => `<span class="av" style="width:${s}px;height:${s}px;flex:0 0 ${s}px;font-size:${Math.round(s * .5)}px;background:hsl(${HUES[u.color] ?? 200} 55% 32%)">${EMOTES[u.emo] ?? '?'}</span>`;
const aCls = u => { const f = u.fnt | 0, k = u.col | 0; return (f ? 'f' + f : '') + (k ? (f ? ' ' : '') + 'k' + k : ''); };
const aChip = u => `<span class="chip"${(u.cd | 0) ? ` data-cs="${u.cd | 0}"` : ''}>${aAv(u, 44)}<span class="cn"><b class="${aCls(u)}">${esc(u.name || 'Seu nome')}</b></span></span>`;
const aEmailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const aSave = () => { try { if (AUTH.preview) { if (AUTH.user) sessionStorage.setItem('authUser', JSON.stringify(AUTH.user)); else sessionStorage.removeItem('authUser'); } } catch (e) {} };
function aModal(html, w = 420) {
  $('ntc').innerHTML = `<div class="modal" onclick="if(event.target===this)closeNote()"><div class="box" style="max-width:${w}px;text-align:left"><button class="xbtn" aria-label="Fechar" title="Fechar (Esc)" onclick="closeNote()">×</button>${html}</div></div>`;
}
function aSoon(what) {
  aModal(`<h3 style="margin:0 0 10px">Em breve</h3><p style="margin:0 0 18px;color:#cfd8f5;line-height:1.5">${esc(what)} ainda não está disponível. Por enquanto esta é só a parte visual do login; a conta de verdade chega em breve.</p><div style="text-align:center"><button onclick="closeNote()">Entendi</button></div>`);
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
  if (!aEmailOk(f.email.trim()) || !f.pw) { render(); return; }
  // SERVIDOR: enviar { email, senha } e abrir a sessão
  if (AUTH.preview) { aPreviewLogin({ email: f.email.trim(), name: DEMO_USER.name }); return; }
  aSoon('Entrar na conta');
}
function aOauth(provider, isRegister) {
  if (isRegister && !AUTH.form.accept) { AUTH.form.tried = true; render(); return; }
  // SERVIDOR: iniciar o login com o provedor (Google / Discord)
  aSoon('Entrar com ' + provider);
}
function loginPage() {
  const f = AUTH.lform, eE = f.tried && !aEmailOk(f.email.trim()) ? 'Digite um e-mail válido.' : '', eP = f.tried && !f.pw ? 'Digite a sua senha.' : '';
  return `<div class="authwrap"><div class="card ctr authcard">
    <div class="eyebrow">Resenha da Madrugada</div><h1 class="ah">Entrar</h1>
    <p class="mut" style="margin:0 0 18px">Entre para salvar o seu visual e acompanhar as suas partidas.</p>
    <button class="oauth google nobusy" onclick="aOauth('Google')">${G_ICON}Continuar com Google</button>
    <button class="oauth discord nobusy" onclick="aOauth('Discord')">${D_ICON}Continuar com Discord</button>
    <div class="or"><span>ou com e-mail</span></div>
    <div class="fld"><label for="l-email">E-mail</label><input id="l-email" type="email" class="${eE ? 'bad' : ''}" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" value="${esc(f.email)}" oninput="aIn('lform','email',this.value)">${eE ? `<p class="ferr">${eE}</p>` : ''}</div>
    <div class="fld"><label for="l-pw">Senha</label><div class="pwrow"><input id="l-pw" type="${AUTH.showPw.l ? 'text' : 'password'}" class="${eP ? 'bad' : ''}" autocomplete="current-password" placeholder="Sua senha" value="${esc(f.pw)}" oninput="aIn('lform','pw',this.value)" onkeydown="if(event.key==='Enter')aLogin()"><button type="button" class="eye nobusy" onclick="aEye('l')">${AUTH.showPw.l ? 'Ocultar' : 'Mostrar'}</button></div>${eP ? `<p class="ferr">${eP}</p>` : ''}</div>
    <p class="lnkrow"><a href="#" onclick="event.preventDefault();aSoon('Recuperar a senha')">Esqueci minha senha</a></p>
    <button style="width:100%" onclick="aLogin()">Entrar</button>
    ${AUTH.preview ? `<button class="sec nobusy" style="width:100%;margin-top:12px;border-style:dashed" onclick="aPreviewLogin()">Modo de teste: entrar como usuário de exemplo</button>` : ''}
    <p class="mut" style="margin:20px 0 0">Ainda não tem conta? <a href="#" onclick="event.preventDefault();aGo('register')">Criar conta</a></p>
    <p class="mut small" style="margin:10px 0 0">Você também pode jogar sem conta: é só voltar para o início.</p>
  </div></div>`;
}

// ---------- CADASTRO ----------
function aRegErrors(f) {
  const e = {}, n = f.name.trim();
  if (n.length < 2) e.name = 'Use pelo menos 2 caracteres.'; else if (n.length > 30) e.name = 'No máximo 30 caracteres.';
  if (!aEmailOk(f.email.trim())) e.email = 'Digite um e-mail válido.';
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
function aRegister() {
  const f = AUTH.form; f.tried = true;
  if (!f.accept) { render(); return; }
  if (Object.keys(aRegErrors(f)).length) { render(); return; }
  // SERVIDOR: criar a conta enviando { nome, email, senha, termsAccepted: true, termsVersion: TERMS_VERSION }
  if (AUTH.preview) { aPreviewLogin({ name: f.name.trim(), email: f.email.trim() }); return; }
  aSoon('Criar a conta');
}
function registerPage() {
  const f = AUTH.form, er = aRegErrors(f), sh = k => (f.tried && er[k]) ? `<p class="ferr">${er[k]}</p>` : '', bad = k => (f.tried && er[k]) ? 'bad' : '';
  const sc = aStrength(f.pw), lbl = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][sc];
  const noTerms = f.tried && !f.accept;
  return `<div class="authwrap"><div class="card ctr authcard">
    <div class="eyebrow">Resenha da Madrugada</div><h1 class="ah">Criar conta</h1>
    <p class="mut" style="margin:0 0 6px">Salve o seu visual e acompanhe as suas partidas em qualquer aparelho.</p>
    <div class="fld"><label for="r-name">Nome de exibição</label><input id="r-name" class="${bad('name')}" maxlength="30" autocomplete="nickname" placeholder="Como você quer aparecer nas partidas" value="${esc(f.name)}" oninput="aInR('form','name',this.value)"><p class="fhint">É o nome que os outros jogadores veem. Nomes ofensivos ou preconceituosos não são aceitos.</p>${sh('name')}</div>
    <div class="fld"><label for="r-email">E-mail</label><input id="r-email" type="email" class="${bad('email')}" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" value="${esc(f.email)}" oninput="aInR('form','email',this.value)">${sh('email')}</div>
    <div class="fld"><label for="r-pw">Senha</label><div class="pwrow"><input id="r-pw" type="${AUTH.showPw.r ? 'text' : 'password'}" class="${bad('pw')}" autocomplete="new-password" placeholder="Pelo menos 8 caracteres" value="${esc(f.pw)}" oninput="aInR('form','pw',this.value)"><button type="button" class="eye nobusy" onclick="aEye('r')">${AUTH.showPw.r ? 'Ocultar' : 'Mostrar'}</button></div>
      ${f.pw ? `<div class="pwm s${sc}"><i></i><i></i><i></i><i></i></div><p class="fhint">Força da senha: ${lbl}</p>` : ''}${sh('pw')}</div>
    <div class="fld"><label for="r-pw2">Confirmar senha</label><input id="r-pw2" type="${AUTH.showPw.r ? 'text' : 'password'}" class="${bad('pw2')}" autocomplete="new-password" placeholder="Repita a senha" value="${esc(f.pw2)}" oninput="aInR('form','pw2',this.value)">${sh('pw2')}</div>
    <label class="chk ${noTerms ? 'bad' : ''}"><input type="checkbox" class="cb2" ${f.accept ? 'checked' : ''} onchange="aAccept(this.checked)"><span>Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de Uso e Condições</a>, incluindo como os meus dados são tratados.</span></label>
    ${noTerms ? '<p class="ferr">Para criar a conta você precisa aceitar os termos.</p>' : ''}
    <button id="r-go" style="width:100%;margin-top:16px" ${f.accept ? '' : 'disabled'} onclick="aRegister()">Criar conta</button>
    ${f.accept ? '' : '<p class="fhint" style="text-align:center">Marque a aceitação dos termos para liberar o cadastro.</p>'}
    <div class="or"><span>ou cadastre com</span></div>
    <button class="oauth google nobusy" ${f.accept ? '' : 'disabled'} onclick="aOauth('Google',true)">${G_ICON}Cadastrar com Google</button>
    <button class="oauth discord nobusy" ${f.accept ? '' : 'disabled'} onclick="aOauth('Discord',true)">${D_ICON}Cadastrar com Discord</button>
    <p class="mut" style="margin:14px 0 0">Já tem conta? <a href="#" onclick="event.preventDefault();aGo('login')">Entrar</a></p>
  </div></div>`;
}

// ---------- PERFIL ----------
function profilePage() {
  const u = AUTH.user; if (!u) return loginPage();
  const f = FONTS[u.fnt | 0], k = COLS[u.col | 0], c = CARDS[u.cd | 0];
  return `<div class="authwrap wide">
    <div class="card ctr pcard"><div class="pbig">${aAv(u, 104)}</div>
      <div class="pname ${aCls(u)}">${esc(u.name)}</div>
      <p class="mut" style="margin:0">${esc(u.email || '')}</p><p class="mut small" style="margin:6px 0 0">Membro desde ${esc(u.since || '')}</p>
      <div class="row" style="max-width:420px;margin:20px auto 0"><button onclick="aGo('settings')">Editar perfil</button><button class="sec" onclick="aLogout()">Sair</button></div>
    </div>
    <div class="card"><label>Seu visual nas partidas</label>
      <div class="prevbox">${aChip(u)}</div>
      <p class="mut small" style="margin:8px 0 14px">Fonte: ${f} · Cor do nome: ${k} · Card: ${c}</p>
      <button class="sec" style="width:100%" onclick="aGo('settings')">Mudar visual</button></div>
    <div class="card"><label>Estatísticas</label>
      <div class="stats"><div class="stat"><b>—</b><span>Partidas</span></div><div class="stat"><b>—</b><span>Vitórias</span></div><div class="stat"><b>—</b><span>Aproveitamento</span></div><div class="stat"><b>—</b><span>Jogo favorito</span></div></div>
      <p class="mut small" style="margin:14px 0 0">Em breve: as suas partidas e vitórias vão aparecer aqui.</p></div>
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
      <div class="fld"><label for="s-mail">E-mail</label><input id="s-mail" type="email" value="${esc(d.email || '')}" disabled><p class="fhint">Para trocar o e-mail, fale com a gente (em breve será possível aqui).</p></div>
      <button class="sec" onclick="aPwModal()">Alterar senha</button>
    </div>

    <div class="card setsec"><h3>Visual nas partidas</h3>
      <div class="prevbox">${aChip(d)}</div>
      <label style="margin-top:16px">Ícone</label><div class="emos">${EMOTES.map((e, i) => `<button class="eb ${d.emo === i ? 'sel' : ''}" onclick="aSet('emo',${i})">${e}</button>`).join('')}</div>
      <label style="margin-top:16px">Cor do ícone</label><div class="cols">${HUES.map((h, i) => `<button class="cb ${d.color === i ? 'sel' : ''}" style="background:hsl(${h} 55% 40%)" aria-label="Cor ${i + 1}" onclick="aSet('color',${i})"></button>`).join('')}</div>
      <label style="margin-top:16px">Fonte</label><div class="opts">${FONTS.map((n, i) => `<button class="opt ${(d.fnt | 0) === i ? 'sel' : ''}" onclick="aSet('fnt',${i})"><span class="${i ? 'f' + i : ''}${(d.col | 0) ? ' k' + (d.col | 0) : ''}">${esc(d.name || 'Nome')}</span><small>${n}</small></button>`).join('')}</div>
      <label style="margin-top:16px">Cor do nome</label><div class="sws">${COLS.map((n, i) => `<button class="sw ${i ? '' : 'auto'} ${(d.col | 0) === i ? 'sel' : ''}" ${i ? `style="background:${COLHEX[i]}"` : ''} title="${n}" aria-label="${n}" onclick="aSet('col',${i})">${i ? '' : 'A'}</button>`).join('')}</div>
      <label style="margin-top:16px">Card</label><div class="opts">${CARDS.map((n, i) => `<button class="opt ${(d.cd | 0) === i ? 'sel' : ''}"${i ? ` data-cs="${i}"` : ''} onclick="aSet('cd',${i})">${i ? `<span>${n}</span>` : `<span>${n}</span><small>card azul</small>`}</button>`).join('')}</div>
    </div>

    <div class="card setsec"><h3>Preferências</h3>
      <div class="setrow"><div class="tx"><b>Entrar nas salas com o meu visual</b><small class="mut" style="text-align:left">Usa o visual salvo na conta ao criar ou entrar em uma sala.</small></div>${tg('useLook')}</div>
      <div class="setrow"><div class="tx"><b>Mostrar minhas estatísticas</b><small class="mut" style="text-align:left">Deixa os outros jogadores verem as suas partidas e vitórias.</small></div>${tg('statsPublic')}</div>
    </div>

    <div class="card setsec danger"><h3 style="color:#ff8a8a">Zona de perigo</h3>
      <p class="mut" style="text-align:left;margin:0 0 14px;line-height:1.5">Apagar a conta remove o seu perfil, o seu visual e as suas estatísticas.</p>
      <button class="cx" onclick="aDelModal()">Apagar minha conta</button>
    </div>

    <div class="savebar"><span class="msg ${AUTH.dirty ? 'dirty' : ''}">${AUTH.dirty ? 'Você tem alterações não salvas.' : 'Nenhuma alteração.'}</span>
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