const ALPHA='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const P={ph:'',theme:undefined,text:'',cur:'?',n:3,confirm:null,t:null};

function pikaRender(nav){
  const e0=document.activeElement,fid=e0&&e0.id,st=e0&&e0.selectionStart;
  $('app').classList.toggle('wide',S.phase==='vote'||S.phase==='end');
  $('app').innerHTML=nav+pikaView();pikaAfter();trans('pika|'+S.phase);
  if(fid&&$(fid)){const e=$(fid);e.focus();if(st!=null&&e.setSelectionRange)e.setSelectionRange(st,st)}
}
function pikaAfter(){
  const ph=S.phase;if(ph===P.ph)return;P.ph=ph;P.confirm=null;
  if(ph==='lobby'){P.theme=undefined}
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
function pikaVote(id){const p=S.players.find(x=>x.id===id);pikaAsk('Votar no nome de '+(p?p.name:'?')+'? Não dá para desfazer.',{type:'vote',target:id})}
function pikaOk(){tx(P.confirm.msg);P.confirm=null;render()}

function pikaView(){
  const s=S,host=s.you===s.host,ph=s.phase,E=err?`<p class="err">${esc(err)}</p>`:'';
  const nm=id=>{const p=s.players.find(x=>x.id===id);return p?esc(p.name):'?'};
  const head=`<div class="card" style="text-align:center"><label>Tema</label><h2 style="margin:4px 0 14px">${esc(s.theme)}</h2><label>Letra</label><div class="big" style="font-size:3.4em">${s.letter||''}</div></div>`;  let h=E;
  if(ph==='lobby'){
    h+=`<h1>SALA</h1><div class="card"><div class="code">${s.code}</div><ul style="margin-top:10px">${s.players.map(p=>`<li><span class="nm">${av(p.id)} ${esc(p.name)}${p.id===s.host?' <span class="tag">líder</span>':''}${p.id===s.you?' (você)':''}</span></li>`).join('')}</ul></div>
    <div class="card"><b>Tema</b>${host?`<div class="row"><input id="theme" maxlength="60" placeholder="Ex.: Comidas, Animais, Filmes…" value="${esc(P.theme??s.theme)}" oninput="P.theme=this.value;pikaCfg()"></div>`:`<p style="font-size:1.3em;margin:8px 0">${s.theme?esc(s.theme):'<span style="opacity:.6">Aguardando o líder escolher…</span>'}</p>`}
    <b>Letras</b><p style="opacity:.6;font-size:.85em;margin:4px 0 10px">${host?'Toque em uma letra para excluí-la do sorteio.':'Letras riscadas foram excluídas.'}</p>
    <div class="letters">${ALPHA.map(l=>`<div class="lt ${s.excluded.includes(l)?'off':''}" ${host?`onclick="pikaLetter('${l}')"`:''}>${l}</div>`).join('')}</div></div>
    ${host?'<button style="width:100%;padding:14px" onclick="pikaStart()">Iniciar partida</button>':'<p style="text-align:center;opacity:.6">Aguardando o líder iniciar…</p>'}`;
  }else if(ph==='roulette'){
    h+=`<div class="card" style="text-align:center"><p>Sorteando a letra…</p><label>Letra</label><div id="spin" class="big">${P.cur}</div></div>`;
  }else if(ph==='countdown'){
    h+=`<div class="card" style="text-align:center"><label>Tema</label><h2>${esc(s.theme)}</h2><label>Letra</label><div class="big">${s.letter}</div><p>Começando em</p><div id="cd" class="big" style="font-size:3em">${P.n}</div></div>`;
  }else if(ph==='write'){
    const done=s.entries.some(e=>e.id===s.you),inq=s.queue.includes(s.you),first=s.queue[0]===s.you;
    const ctl=done?'<p style="text-align:center">Você já enviou sua palavra.</p>'
      :!inq?`<button style="width:100%;padding:16px;font-size:1.2em" onclick="tx({type:'have'})">Eu tenho!</button>`
      :first?`<input id="txt" maxlength="60" placeholder="Digite sua palavra" value="${esc(P.text)}" oninput="P.text=this.value" onkeydown="if(event.key==='Enter')pikaSend()" style="width:100%"><button style="width:100%;margin-top:8px" onclick="pikaSend()">Enviar</button>`
      :`<p style="text-align:center">Aguardando ${nm(s.queue[0])} escrever… (você é o ${s.queue.indexOf(s.you)+1}º da fila)</p>`;
    h+=head+`<div class="card">${ctl}</div>
    <div class="card"><b>Fila</b>${s.queue.length?`<ul>${s.queue.map((id,i)=>`<li><span class="nm">${i+1}. ${av(id)} ${nm(id)}</span></li>`).join('')}</ul>`:'<p style="opacity:.6;margin:6px 0 0">Ninguém na fila ainda.</p>'}</div>
    <div class="card"><b>Palavras enviadas</b><ul>${s.entries.map(e=>`<li><span class="nm">${av(e.id)} <b>${esc(e.name)}</b>: ${esc(e.text)}</span></li>`).join('')}</ul></div>`;
  }else{
    const end=ph==='end',voted=s.voted.includes(s.you);
    h+=head;
    if(end){const r=s.result;
      h+=`<div class="card" style="text-align:center"><h2>${r.losers.length>1?'Empate! Os piores nomes foram de':'O pior nome foi de'}</h2><div style="font-size:1.6em;font-weight:700">${r.losers.map(l=>esc(l.name)).join(' e ')}</div><p style="opacity:.7">${r.max} voto(s)</p>
      ${host?`<div class="row"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera? Você poderá mudar o tema e as letras.',{type:'lobby'})">Jogar novamente</button><button onclick="pikaAsk('Jogar novamente o mesmo tema, com uma nova letra?',{type:'replay'})">Jogar novamente o tema</button></div>`:'<p style="opacity:.6">Aguardando o líder…</p>'}</div>`;
    }else h+=`<p style="text-align:center;opacity:.8">Declare sua intenção e vote no pior nome. ${voted?'Você já votou.':''}</p>`;
    h+=`<div class="sus">${s.entries.map(e=>{const me=e.id===s.you,c=s.counts[e.id]||0,who=Object.keys(s.intents).filter(k=>s.intents[k]===e.id);
      return `<div class="pc" style="flex-direction:column;align-items:stretch;cursor:default"><div style="display:flex;align-items:center;gap:10px">${av(e.id)}<b>${esc(e.name)}${me?' (você)':''}</b><span style="margin-left:auto">${c} voto${c==1?'':'s'}</span></div>
      <div style="font-size:1.2em;font-weight:700;margin:6px 0">${esc(e.text)}</div><div class="mv">${who.map(k=>av(+k)).join('')}</div>
      ${!end&&!me&&!voted?`<div class="row"><button class="sec" onclick="tx({type:'intent',target:${e.id}})">Declarar intenção</button><button onclick="pikaVote(${e.id})">Votar</button></div>`:''}</div>`}).join('')}</div>`;
  }
  if(P.confirm)h+=`<div class="modal"><div class="box"><p>${esc(P.confirm.text)}</p><div class="row"><button class="sec" onclick="P.confirm=null;render()">Cancelar</button><button onclick="pikaOk()">Confirmar</button></div></div></div>`;
  return h;
}