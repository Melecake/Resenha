const C={sel:null,k:''};
(()=>{const s=document.createElement('style');s.textContent=`
.pc.sel{border-color:var(--acc);background:rgba(255,194,51,.18)}
.nightcard{border-color:#3b4fa8;background:linear-gradient(180deg,#0e1a45,#070c24)}.nightcard::before{background:#6f86ff}
.moonbig{width:120px;height:120px;border-radius:50%;margin:10px auto 18px;background:var(--acc);box-shadow:inset -38px -8px 0 0 #0b1230,0 0 60px rgba(255,194,51,.5);animation:mfl 3s ease-in-out infinite alternate}
@keyframes mfl{from{transform:translateY(-4px)}to{transform:translateY(6px)}}
.dawncard{border-color:var(--acc);background:linear-gradient(180deg,#4a3a10,#1c1708)}.dawncard::before{background:var(--acc)}
.dawnt{font-family:var(--disp);font-size:clamp(1.6rem,5vw,2.6rem);color:var(--acc);margin:8px 0 12px;text-shadow:0 4px 0 var(--acc2)}`;document.head.appendChild(s)})();

const ROLE={
  assassino:{n:'Assassino',v:'eliminar',t:'Quem a cidade vai perder esta noite?',d:'A cada noite, escolha uma pessoa para eliminar. Você vence quando sobrar apenas mais uma pessoa viva além de você.'},
  detetive:{n:'Detetive',v:'investigar',t:'Quem você quer investigar?',d:'A cada noite, investigue uma pessoa e descubra se ela é o assassino. Use o que descobrir no debate.'},
  anjo:{n:'Anjo',v:'proteger',t:'Quem você quer proteger?',d:'A cada noite, proteja uma pessoa (pode ser você, e pode repetir a mesma pessoa). Se o assassino escolher quem você protegeu, ninguém morre.'},
  cidadao:{n:'Cidadão',v:'',t:'',d:'Você não tem poder especial. Debata com a cidade e vote para descobrir o assassino.'}
};
const dawnTxt=d=>!d?'':(d.dead.length===0?'Ninguém morreu':d.dead.length===1?'uma pessoa morreu':d.dead.length+' pessoas morreram');
const lastVoteTxt=lv=>lv.out!=null?`${nm(lv.out)} foi eliminado(a) pela cidade${lv.early?' (maioria)':''}.`:'Empate na votação: ninguém foi eliminado.';

function cidadeRender(){
  const key=S.phase+'|'+S.night;if(C.k!==key){C.k=key;C.sel=null}
  $('app').classList.toggle('wide',['lobby','day','vote','end'].includes(S.phase));
  $('app').innerHTML=cidadeView();trans('c|'+key);
}
function cSel(id){C.sel=id;render()}
function cNact(){if(C.sel==null||!S.act)return;const p=pl(C.sel);
  pikaAsk('Confirmar: '+ROLE[S.act.role].v+' '+p.name+'? Não dá para desfazer.',{type:'nact',target:C.sel})}

function cidadeView(){
  const s=S,ph=s.phase,leader=s.you===s.host,E=err?`<p class="err">${esc(err)}</p>`:'';
  const aliveP=s.players.filter(p=>!s.dead.includes(p.id)),dead=!!s.isDead;
  const rolesCard=()=>s.roles?`<div class="card"><label>Papéis de todos</label><ul>${s.players.map(p=>{const r=s.roles[p.id];return `<li><span class="nm">${av(p.id)}<span class="cn"><b>${esc(p.name)}</b>${s.dead.includes(p.id)?'<small>fora do jogo</small>':''}</span></span><span class="tag ${r==='assassino'?'off2':''}">${ROLE[r].n}</span></li>`}).join('')}</ul></div>`:'';
  const deadCard=()=>dead&&ph!=='end'?`<div class="card ctr"><label>Você está fora do jogo</label><p class="mut" style="margin:0">Você continua acompanhando como espectador e vê os papéis de todos. Não conte para ninguém!</p></div>`+rolesCard():'';
  let h=E;
  if(ph==='lobby'){
    const n=s.players.length;
    h+=`<div class="hero rel" style="padding:0 0 10px"><div class="eyebrow">Sala de espera</div><h1>Cidade Dorme</h1>${infoBtn('cidade')}</div>
    <div class="split" style="align-items:start"><div>
      <div class="card ctr"><label>Código da sala</label><div class="code">${s.code}</div><p class="mut">Compartilhe o código com os amigos</p>${inviteBtn()}${players()}</div>${rankCard()}${profileCard()}
      ${leader?`<button style="width:100%;padding:18px;font-size:1.1rem" ${n>=5?'':'disabled'} onclick="tx({type:'start'})">Iniciar partida</button>${n<5?'<p class="mut">São necessários 5 jogadores (o jogo fica melhor com 6 ou mais).</p>':n<6?'<p class="mut">Dica: com 6 ou mais jogadores o jogo fica melhor.</p>':''}`:'<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">Aguardando o líder iniciar…</p></div>'}</div>
    <div class="card"><label>Papéis desta partida</label><ul>
      <li><span class="nm"><b>Assassino</b> (1)</span></li><li><span class="nm"><b>Detetive</b> (1)</span></li><li><span class="nm"><b>Anjo</b> (1)</span></li><li><span class="nm"><b>Cidadãos</b> (os demais)</span></li></ul>
      <p class="mut" style="font-size:.85rem;margin:14px 0 0">O narrador é o servidor. Os papéis são sorteados e só você vê o seu. Toque no "i" para ler as regras.</p></div></div>`;
  }else if(ph==='roles'){
    const R=ROLE[s.role],acked=s.ready.includes(s.you);
    h+=`<div class="card ctr nightcard"><label>Seu papel (só você vê)</label><div class="rtitle" style="color:var(--acc)">${R.n}</div><p>${R.d}</p>
      ${acked?'<p class="mut" style="margin:0">Aguardando os outros jogadores…</p>':`<button style="width:100%" onclick="tx({type:'ack'})">Entendi, pode dormir</button>`}</div>
      <div class="card"><label>Prontos (${s.ready.length}/${s.players.length})</label><ul>${s.players.map(p=>`<li><span class="nm">${av(p.id)}${esc(p.name)}</span>${s.ready.includes(p.id)?'<span class="tag">pronto</span>':''}</li>`).join('')}</ul></div>`;
  }else if(ph==='night'){
    const lv=s.lastVote?`<p class="mut" style="margin:0 0 8px">${lastVoteTxt(s.lastVote)}</p>`:'';
    if(dead)h+=`<div class="card ctr nightcard"><label>Noite ${s.night}</label><h2>A cidade dorme</h2>${lv}</div>`+deadCard();
    else if(s.act&&!s.act.done){const R=ROLE[s.act.role];
      h+=`<div class="card ctr nightcard"><label>Noite ${s.night} · ${R.n}</label><h2>${R.t}</h2>${lv}<p>Escolha uma pessoa e confirme.</p>
        <div class="sus" style="margin:16px 0">${s.act.targets.map(id=>`<div class="pc ${C.sel===id?'sel':''}" onclick="cSel(${id})">${av(id)}<div class="cn"><b>${nm(id)}</b>${id===s.you?'<small>(você)</small>':''}</div></div>`).join('')}</div>
        <button style="width:100%" ${C.sel==null?'disabled':''} onclick="cNact()">Confirmar escolha</button></div>`;
    }else h+=`<div class="card ctr nightcard"><label>Noite ${s.night}</label><div class="moonbig"></div><h2>A cidade dorme</h2>${lv}<p class="mut" style="margin:0">${s.act&&s.act.done?'Sua ação foi registrada. ':''}Aguardando a cidade…</p></div>`;
  }else if(ph==='day'){
    const d=s.dawn,rdy=s.ready,mine=rdy.includes(s.you);
    h+=`<div class="card ctr dawncard"><label>Amanhecer</label><div class="dawnt">Cidade acorda: ${dawnTxt(d)}</div>${d&&d.dead.length?`<div class="chips" style="margin-top:0">${d.dead.map(id=>`<span class="chip">${av(id)}<b>${nm(id)}</b></span>`).join('')}</div>`:''}</div>`;
    if(s.role==='detetive'&&s.inv)h+=`<div class="card"><label>Suas investigações (só você vê)</label>${s.inv.length?`<ul>${s.inv.map(i=>`<li><span class="nm">Noite ${i.night}: ${av(i.target)}<b>${nm(i.target)}</b></span><span class="tag ${i.killer?'off2':''}">${i.killer?'é o assassino':'não é o assassino'}</span></li>`).join('')}</ul>`:'<p class="mut" style="margin:0">Nenhuma ainda.</p>'}</div>`;
    h+=deadCard();
    h+=`<div class="card"><label>Prontos para votar</label><b style="font-family:var(--disp);font-size:1.5rem;color:var(--acc)">${rdy.length}/${aliveP.length}</b>
      ${dead?'':`<button style="width:100%;margin:12px 0 10px" class="${mine?'cx':''}" onclick="tx({type:'ready',ready:${!mine}})">${mine?'Cancelar':'Pronto para votar'}</button>`}
      <ul class="rl">${aliveP.map(p=>`<li><span class="nm">${av(p.id)}${esc(p.name)}${p.away?'<span class="tag off2">offline</span>':''}</span>${rdy.includes(p.id)?'<span class="tag">pronto</span>':''}</li>`).join('')}</ul></div>`;
  }else if(ph==='vote'){
    h+=`<div class="card ctr"><label>Votação</label><h2>Quem é o assassino?</h2><p class="mut" style="margin:0">${dead?'Você está fora do jogo e não vota.':'Declare sua intenção e vote. Em caso de empate, ninguém é eliminado.'}${s.voted.includes(s.you)?' Você já votou.':''}</p></div>`;
    h+=board({...s,players:aliveP,voted:dead?s.voted.concat(s.you):s.voted},aliveP.map(p=>({id:p.id,name:p.name})),false);
    if(dead)h+=rolesCard();
  }else{
    const r=s.result,win=r.winner==='cidade',lead=leader;
    h+=`<div class="card ctr resultcard ${win?'win':'lose'}"><label>Resultado da partida</label><div class="rtitle">${win?'A cidade venceu!':'O assassino venceu!'}</div><p>O assassino era <b>${esc(r.killerName)}</b>.</p>
      ${lead?`<div class="row" style="max-width:560px;margin:12px auto 0"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera?',{type:'lobby'})">Nova partida</button><button onclick="pikaAsk('Jogar de novo com os mesmos jogadores? Os papéis serão sorteados de novo.',{type:'again'})">Jogar novamente</button></div>`:'<p class="mut">Aguardando o líder…</p>'}</div>`+rankCard()+rolesCard();
  }
  return h;
}