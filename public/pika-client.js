const ALPHA='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const P={ph:'',theme:undefined,text:'',cur:'?',n:3,confirm:null,t:null};

function pikaRender(nav){
  const e0=document.activeElement,fid=e0&&e0.id,st=e0&&e0.selectionStart;
  $('app').classList.toggle('wide',['lobby','vote','end'].includes(S.phase));
  $('app').innerHTML=nav+pikaView();pikaAfter();trans('pika|'+S.phase);
  if(fid&&fid!=='vsel'&&$(fid)){const e=$(fid);e.focus();if(st!=null&&e.setSelectionRange)e.setSelectionRange(st,st)}
}
function pikaAfter(){
  const ph=S.phase;if(ph===P.ph)return;P.ph=ph;P.confirm=null;
  if(ph==='lobby')P.theme=undefined;
  if(ph==='roulette')spin();else if(ph==='countdown')cd();
}
function spin(){
  const pool=ALPHA.filter(l=>!S.excluded.includes(l));let t=0,d=50;P.cur='?';
  const step=()=>{if(!S||S.phase!=='roulette')return;t+=d;
    if(t>=3000)P.cur=S.letter;else{P.cur=pool[Math.random()*pool.length|0];d+=14;setTimeout(step,d)}
    const el=$('spin');if(el)el.textContent=P.cur};step();
}
function cd(){
  P.n=3;const t=setInterval(()=>{if(!S||S.phase!=='countdown'){clearInterval(t);return}
    P.n--;if(P.n<1){clearInterval(t);return}const el=$('cd');if(el)el.textContent=P.n},1000);
}
const pikaSend0=()=>tx({type:'cfg',theme:P.theme??S.theme,excluded:S.excluded});
function pikaCfg(){clearTimeout(P.t);P.t=setTimeout(pikaSend0,300)}
function pikaLetter(l){const ex=S.excluded;tx({type:'cfg',theme:P.theme??S.theme,excluded:ex.includes(l)?ex.filter(x=>x!==l):[...ex,l]})}
function pikaStart(){clearTimeout(P.t);pikaSend0();tx({type:'start'})}
function pikaSend(){const t=P.text.trim();if(!t)return;tx({type:'submit',text:t});P.text=''}
function pikaAsk(text,msg){P.confirm={text,msg};render()}
function pikaVote(id){const p=S.players.find(x=>x.id===id);pikaAsk('Votar em '+(p?p.name:'?')+'? Não dá para desfazer.',{type:'vote',target:id})}
function pikaOk(){tx(P.confirm.msg);P.confirm=null;render()}

// Componentes compartilhados com o Impostor - Locais e o Impostor - Perguntas
function modalHtml(){return P.confirm?`<div class="modal"><div class="box"><p style="font-size:1.1rem;margin:0 0 18px">${esc(P.confirm.text)}</p><div class="row"><button class="sec" onclick="P.confirm=null;render()">Cancelar</button><button onclick="pikaOk()">Confirmar</button></div></div></div>`:''}
let VSEL=null;
function board(s,items,end){
  const voted=s.voted.includes(s.you);
  const cand=items.filter(e=>e.id!==s.you||s.players.length===1);
  const canVote=!end&&!voted&&cand.length>0;
  if(!cand.some(e=>e.id===VSEL))VSEL=cand.length?cand[0].id:null;
  const sel=canVote?`<div class="vsel card"><label>Escolha o jogador</label><select id="vsel" onchange="VSEL=+this.value;this.blur()">${cand.map(e=>`<option value="${e.id}" ${e.id===VSEL?'selected':''}>${esc(e.name)}${e.text!=null?' — '+esc(e.text):''}</option>`).join('')}</select>
    <div class="vb"><button class="sec" onclick="tx({type:'intent',target:VSEL})">Declarar intenção</button><button onclick="pikaVote(VSEL)">Votar</button></div></div>`:'';
  return sel+`<div class="vgrid">${items.map(e=>{
    const me=e.id===s.you,c=s.counts[e.id]||0,who=Object.keys(s.intents).filter(k=>s.intents[k]===e.id);
    const n=who.length,cols=n>9?Math.ceil(Math.sqrt(n)):3,rows=Math.max(3,Math.ceil(n/cols));
    const can=!end&&(!me||s.players.length===1)&&!voted;
    return `<div class="vc">${c?`<span class="vcnt">${c} voto${c>1?'s':''}</span>`:''}
      <div class="vh">${av(e.id)}<span class="cn"><b>${esc(e.name)}</b>${me?'<small>(você)</small>':''}</span></div>
      ${e.text!=null?`<div class="vt">${esc(e.text)}</div>`:''}
      <div class="mv" style="--c:${cols};--h:${rows*34+(rows-1)*6+16}px">${who.map(k=>av(+k)).join('')}</div>
      ${can?`<div class="vb"><button class="sec" onclick="tx({type:'intent',target:${e.id}})">Declarar intenção</button><button onclick="pikaVote(${e.id})">Votar</button></div>`:''}</div>`}).join('')}</div>`;
}

function pikaView(){
  const s=S,host=s.you===s.host,ph=s.phase,E=err?`<p class="err">${esc(err)}</p>`:'';
  const nm=id=>{const p=s.players.find(x=>x.id===id);return p?esc(p.name):'?'};
  const head=`<div class="card ctr"><label>Tema</label><h2 style="margin:4px 0 14px">${esc(s.theme)}</h2><label>Letra</label><div class="big" style="font-size:3.4rem">${s.letter||''}</div></div>`;
  let h=E;
  if(ph==='lobby'){
    h+=`<div class="hero rel" style="padding:0 0 10px"><div class="eyebrow">Sala de espera</div><h1>O meu é mais Pika</h1>${infoBtn('pika')}</div>
    <div class="split" style="align-items:start"><div>
      <div class="card ctr"><label>Código da sala</label><div class="code">${s.code}</div><p class="mut">Compartilhe o código com os amigos</p>${players()}</div>${profileCard()}
      ${host?'<button style="width:100%;padding:18px;font-size:1.1rem" onclick="pikaStart()">Iniciar partida</button>':'<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">Aguardando o líder iniciar…</p></div>'}</div>
    <div><div class="card"><label>Tema</label>${host?`<input id="theme" maxlength="60" placeholder="Ex.: Comidas, Animais, Filmes…" value="${esc(P.theme??s.theme)}" oninput="P.theme=this.value;pikaCfg()">`:`<p style="font-size:1.4rem;margin:8px 0">${s.theme?esc(s.theme):'<span class="mut">Aguardando o líder escolher…</span>'}</p>`}
      <label style="margin-top:18px">Letras</label><p style="color:var(--mut);font-size:.85rem;margin:0 0 12px">${host?'Toque em uma letra para excluí-la do sorteio.':'Letras riscadas foram excluídas.'}</p>
      <div class="letters">${ALPHA.map(l=>`<div class="lt ${s.excluded.includes(l)?'off':''}" ${host?`onclick="pikaLetter('${l}')"`:''}>${l}</div>`).join('')}</div></div></div></div>`;
  }else if(ph==='roulette'){
    h+=`<div class="card ctr"><p class="mut">Sorteando a letra…</p><label>Letra</label><div id="spin" class="big">${P.cur}</div></div>`;
  }else if(ph==='countdown'){
    h+=`<div class="card ctr"><label>Tema</label><h2>${esc(s.theme)}</h2><label>Letra</label><div class="big">${s.letter}</div><p class="mut">Começando em</p><div id="cd" class="big" style="font-size:4rem">${P.n}</div></div>`;
  }else if(ph==='write'){
    const done=s.entries.some(e=>e.id===s.you),inq=s.queue.includes(s.you),first=s.queue[0]===s.you;
    const ctl=done?'<p class="mut" style="margin:0">Você já enviou sua palavra.</p>'
      :!inq?`<button style="width:100%;padding:18px;font-size:1.2rem" onclick="tx({type:'have'})">Eu tenho!</button>`
      :first?`<input id="txt" class="ctr" maxlength="60" placeholder="Digite sua palavra" value="${esc(P.text)}" oninput="P.text=this.value" onkeydown="if(event.key==='Enter')pikaSend()"><button style="width:100%;margin-top:12px" onclick="pikaSend()">Enviar</button>`
      :`<p class="mut" style="margin:0">Aguardando ${nm(s.queue[0])} escrever… (você é o ${s.queue.indexOf(s.you)+1}º da fila)</p>`;
    h+=head+`<div class="card">${ctl}</div>
    <div class="card"><label>Fila</label>${s.queue.length?`<ul>${s.queue.map((id,i)=>`<li><span class="nm">${i+1}. ${av(id)} ${nm(id)}</span></li>`).join('')}</ul>`:'<p class="mut" style="margin:6px 0 0">Ninguém na fila ainda.</p>'}</div>
    <div class="card"><label>Palavras enviadas</label><ul>${s.entries.map(e=>`<li><span class="nm">${av(e.id)} <b>${esc(e.name)}</b>: ${esc(e.text)}</span></li>`).join('')}</ul></div>`;
  }else{
    const end=ph==='end',voted=s.voted.includes(s.you);
    h+=head;
    if(end){const r=s.result;
      h+=`<div class="card ctr"><label>${r.losers.length>1?'As piores escolhas foram:':'A pior escolha foi:'}</label>${r.losers.map(l=>`<div class="worst">“${esc(l.text)}” <span>- ${esc(l.name)}</span></div>`).join('')}<p class="mut">${r.max} voto${r.max>1?'s':''}</p>
      ${host?`<div class="row" style="max-width:560px;margin:12px auto 0"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera para mudar o tema e as letras?',{type:'lobby'})">Nova partida</button><button onclick="pikaAsk('Jogar novamente o mesmo tema, com uma nova letra?',{type:'replay'})">Jogar novamente o mesmo tema</button></div>`:'<p class="mut">Aguardando o líder…</p>'}</div>`;
    }else h+=`<p class="mut">Declare sua intenção e vote no pior nome. ${voted?'Você já votou.':''}</p>`;
    h+=board(s,s.entries,end);
  }
  return h+modalHtml();
}