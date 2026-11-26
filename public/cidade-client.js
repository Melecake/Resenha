const C={sel:null,k:'',s:null,end:0};
const NIGHTS=[10,15,20,30,45,60];
(()=>{const s=document.createElement('style');s.textContent=`
.pc.sel{border-color:var(--acc);background:rgba(255,194,51,.18)}
.pc.known{opacity:.4;filter:grayscale(.6);cursor:default;pointer-events:none}
.nightcard{border-color:#3b4fa8;background:linear-gradient(180deg,#0e1a45,#070c24)}.nightcard::before{background:#6f86ff}
.nightcard .rtitle{color:var(--acc)}
.moonbig{width:120px;height:120px;border-radius:50%;margin:10px auto 18px;background:var(--acc);box-shadow:inset -38px -8px 0 0 #0b1230,0 0 60px rgba(255,194,51,.5);animation:mfl 3s ease-in-out infinite alternate}
@keyframes mfl{from{transform:translateY(-4px)}to{transform:translateY(6px)}}
.dawncard{border-color:var(--acc);background:linear-gradient(180deg,#4a3a10,#1c1708)}.dawncard::before{background:var(--acc)}
.dawnt{font-family:var(--disp);font-size:clamp(1.6rem,5vw,2.6rem);color:var(--acc);margin:8px 0 12px;text-shadow:0 4px 0 var(--acc2)}
.card.t-assassino{border-color:#c2323c}.card.t-assassino::before{background:#e0454f}
.card.t-detetive{border-color:#35b8c4}.card.t-detetive::before{background:#58c8d0}
.card.t-anjo{border-color:#f2e4a6}.card.t-anjo::before{background:#fff0b3}
.card.t-dead{opacity:.72}.card.t-dead::before{background:var(--line)}
.card.t-assassino .rtitle{color:#ff7b84}.card.t-detetive .rtitle{color:#6fdde6}.card.t-anjo .rtitle{color:#fff3b0}
.t-assassino .pc.sel{border-color:#e0454f;background:rgba(224,69,79,.22)}
.t-detetive .pc.sel{border-color:#58c8d0;background:rgba(88,200,208,.2)}
.t-anjo .pc.sel{border-color:#fff0b3;background:rgba(255,240,179,.2)}
.orb{width:104px;height:104px;border-radius:50%;margin:10px auto 18px;position:relative;animation:mfl 3s ease-in-out infinite alternate}
.orb.assassino{background:#e0454f;box-shadow:inset -36px -8px 0 0 #12060a,0 0 55px rgba(224,69,79,.55)}
.orb.detetive{margin-bottom:42px;border:10px solid #58c8d0;box-shadow:0 0 40px rgba(88,200,208,.45),inset 0 0 20px rgba(88,200,208,.3)}
.orb.detetive::after{content:"";position:absolute;width:12px;height:44px;background:#58c8d0;border-radius:6px;right:-16px;bottom:-30px;transform:rotate(-35deg)}
.orb.anjo{margin-top:40px;background:radial-gradient(circle,#fffbe0,#f2d76a);box-shadow:0 0 60px rgba(255,240,170,.7)}
.orb.anjo::before{content:"";position:absolute;left:50%;top:-18px;width:70px;height:18px;margin-left:-35px;border:5px solid #fff3b0;border-radius:50%;box-shadow:0 0 14px rgba(255,243,176,.9)}
.orb.dead{background:rgba(143,160,207,.4);opacity:.6;box-shadow:0 0 30px rgba(143,160,207,.25)}
.rolebar{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border:2px solid var(--line);border-radius:14px;margin:0 0 12px;font:700 .8rem Rubik,sans-serif;letter-spacing:2px;text-transform:uppercase;background:var(--n1)}
.rolebar span{color:var(--mut)}
.rb-neutral b{color:var(--txt)}
.rb-assassino{border-color:#e0454f;background:#2a0a0f}.rb-assassino b{color:#ff7b84}
.rb-detetive{border-color:#35b8c4;background:#082229}.rb-detetive b{color:#6fdde6}
.rb-anjo{border-color:#f2e4a6;background:#2e2a13}.rb-anjo b{color:#fff3b0}
.rb-dead{opacity:.72}.rb-dead b{color:var(--mut)}
.tag.r-assassino{background:#e0454f;color:#fff}.tag.r-detetive{background:#35b8c4;color:#04252a}
.tag.r-anjo{background:#fff0b3;color:#4a3d00}.tag.r-cidadao{background:#3a4468;color:#cfd8f5}
.tag.rc-comum{background:#3a4468;color:#cfd8f5}.tag.rc-dif{background:#58c8d0;color:#06222a}
button.bdet{background:#35b8c4;color:#04252a;border-color:#1c6e76;box-shadow:0 5px 0 #1c6e76}
button.bang{background:#fff0b3;color:#4a3d00;border-color:#a8963a;box-shadow:0 5px 0 #a8963a}
.ctimer{font-family:var(--disp);font-size:1.5rem;color:var(--acc);margin:0 0 8px}.ctimer.late{color:#ff7b7b}`;document.head.appendChild(s)})();

const ROLE={
  assassino:{n:'Assassino',v:'matar',t:'Quem você quer matar?',d:'A cada noite, escolha uma pessoa para eliminar. Você vence quando sobrar apenas mais uma pessoa viva além de você.'},
  detetive:{n:'Detetive',v:'investigar',t:'Quem você quer investigar?',d:'A cada noite, investigue uma pessoa e descubra se ela é um cidadão comum ou alguém diferente. Você não saberá a função dela. Cada pessoa só pode ser investigada uma vez.'},
  anjo:{n:'Anjo',v:'proteger',t:'Quem você quer proteger?',d:'A cada noite, proteja uma pessoa (pode ser você, e pode repetir a mesma pessoa). Se o assassino escolher quem você protegeu, ninguém morre.'},
  cidadao:{n:'Cidadão',v:'',t:'',d:'Você não tem poder especial. Debata com a cidade e vote para descobrir o assassino.'}
};
const BTN={assassino:'cx',detetive:'bdet',anjo:'bang'};
const dawnTxt=d=>!d?'':(d.dead.length===0?'Ninguém morreu':d.dead.length===1?'uma pessoa morreu':d.dead.length+' pessoas morreram');
const lastVoteTxt=lv=>{if(!lv)return '';if(lv.out!=null)return `${nm(lv.out)} foi eliminado(a) pela cidade${lv.early?' (maioria)':''}.`;
  return lv.reason==='skip'?'A cidade decidiu não eliminar ninguém.':'Empate na votação: ninguém foi eliminado.'};
const kTxt=d=>d?'Não é cidadão comum':'Cidadão comum';
const kCls=d=>d?'rc-dif':'rc-comum';
const tleft=()=>Math.max(0,Math.ceil((C.end-Date.now())/1000));
function tick(){const e=document.getElementById('ctimer');if(!e)return;const s=tleft();e.textContent=s+'s';e.classList.toggle('late',s<=5)}
setInterval(tick,250);

function cidadeRender(){
  // Cidadãos comuns e mortos veem a mesma tela em "sleep" e "night": só o texto muda, sem animação de entrada.
  // (Quem tem ação à noite continua trocando de tela de verdade.)
  const calm=(S.phase==='sleep'||S.phase==='night')&&(S.isDead||S.role==='cidadao');
  const key=calm?'sn|'+S.night:S.phase+'|'+S.night;if(C.k!==key){C.k=key;C.sel=null}
  if(C.s!==S){C.s=S;C.end=Date.now()+((S.act&&S.act.left)||0)}
  $('app').classList.toggle('wide',['lobby','day','vote','end'].includes(S.phase));
  $('app').innerHTML=cidadeView();trans('c|'+key);tick();
}
function cSel(id){C.sel=id;render()}
// Sem janela de confirmação: o botão "Confirmar escolha" do card já é a confirmação
function cNact(){if(C.sel==null||!S.act)return;tx({type:'nact',target:C.sel})}

function cidadeView(){
  const s=S,ph=s.phase,leader=s.you===s.host,E=err?`<p class="err">${esc(err)}</p>`:'';
  const aliveP=s.players.filter(p=>!s.dead.includes(p.id)),dead=!!s.isDead,dc=(dead&&ph!=='end')?' t-dead':'';
  const role=s.role||'cidadao';
  const rolesCard=()=>s.roles?`<div class="card${dc}"><label>Papéis de todos</label><ul>${s.players.map(p=>{const r=s.roles[p.id];return `<li><span class="nm">${av(p.id)}<span class="cn"><b>${esc(p.name)}</b>${s.dead.includes(p.id)?'<small>fora do jogo</small>':''}</span></span><span class="tag r-${r}">${ROLE[r].n}</span></li>`}).join('')}</ul></div>`:'';
  const deadCard=()=>dead&&ph!=='end'?`<div class="card ctr t-dead"><label>Você está fora do jogo</label><p class="mut" style="margin:0">Você continua acompanhando como espectador e vê os papéis de todos. Não conte para ninguém!</p></div>`+rolesCard():'';
  // Cor do papel só na noite (fase secreta). Nas fases em que todos olham a tela, o papel aparece em tom neutro.
  const bar=()=>{if(ph==='lobby'||ph==='roles'||ph==='end')return '';
    if(dead)return `<div class="rolebar rb-dead"><span>Situação</span><b>Fora do jogo</b></div>`;
    return `<div class="rolebar ${ph==='night'?'rb-'+role:'rb-neutral'}"><span>Seu papel</span><b>${ROLE[role].n}</b></div>`};
  const sleepCard=(extra)=>`<div class="card ctr nightcard${dc}"><label>Noite ${s.night}</label><div class="${dead?'orb dead':'moonbig'}" style="animation-delay:-${((Date.now()%6000)/1000).toFixed(2)}s"></div><h2>A cidade dorme</h2>${extra||''}</div>`;
  // Histórico das ações do próprio jogador (só ele vê). Só o detetive recebe o resultado.
  const histCard=(title,rows)=>`<div class="card${dc}"><label>${title} (só você vê)</label>${rows.length?`<ul>${rows.map(i=>`<li><span class="nm">Noite ${i.night}: ${av(i.target)}<b>${nm(i.target)}</b></span>${i.tag||''}</li>`).join('')}</ul>`:'<p class="mut" style="margin:0">Nenhum ainda.</p>'}</div>`;
  let h=E+bar();
  if(ph==='lobby'){
    const n=s.players.length;
    h+=`<div class="hero rel" style="padding:0 0 10px"><div class="eyebrow">Sala de espera</div><h1>Cidade Dorme</h1>${infoBtn('cidade')}</div>
    <div class="split" style="align-items:start"><div>
      <div class="card ctr"><label>Código da sala</label><div class="code">${s.code}</div><p class="mut">Compartilhe o código com os amigos</p>${inviteBtn()}${players()}</div>${rankCard()}${profileCard()}
      ${leader?`<button style="width:100%;padding:18px;font-size:1.1rem" ${n>=5?'':'disabled'} onclick="tx({type:'start'})">Iniciar partida</button>${n<5?'<p class="mut">São necessários 5 jogadores (o jogo fica melhor com 6 ou mais).</p>':n<6?'<p class="mut">Dica: com 6 ou mais jogadores o jogo fica melhor.</p>':''}`:'<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">Aguardando o líder iniciar…</p></div>'}</div>
    <div class="card ctr"><label>Duração da noite</label>
      ${leader?`<div class="lbls" style="justify-content:center">${NIGHTS.map(x=>`<button class="lb ${s.nightSec===x?'sel':''}" onclick="tx({type:'cfg',sec:${x}},1)">${x} s</button>`).join('')}</div>
      <p class="mut" style="font-size:.85rem;margin:6px 0 0">Todos veem o mesmo tempo. A noite sempre dura o tempo inteiro, mesmo que todos já tenham agido, para ninguém deduzir quem tem poder pelo tempo.</p>`
      :`<div class="code" style="font-size:2.6rem;letter-spacing:2px">${s.nightSec} s</div><p class="mut" style="font-size:.85rem;margin:6px 0 0">Tempo definido pelo líder. Toque no "i" para ler as regras.</p>`}</div></div>`;
  }else if(ph==='roles'){
    const R=ROLE[s.role],acked=s.ready.includes(s.you),sp=s.role!=='cidadao';
    h+=`<div class="card ctr nightcard t-${s.role}"><label>Seu papel (só você vê)</label>${sp?`<div class="orb ${s.role}"></div>`:''}<div class="rtitle">${R.n}</div><p>${R.d}</p>
      <p class="mut">Cada noite dura ${s.nightSec} segundos.${sp?' Você precisa escolher alguém nesse tempo. Se não escolher, uma pessoa será sorteada para a sua ação.':' Durante a noite, aguarde enquanto os outros jogadores agem em segredo.'}</p>
      ${acked?'<p class="mut" style="margin:0">Aguardando os outros jogadores…</p>':`<button style="width:100%" onclick="tx({type:'ack'})">Entendi, pode dormir</button>`}</div>
      <div class="card"><label>Prontos (${s.ready.length}/${s.players.length})</label><ul>${s.players.map(p=>`<li><span class="nm">${av(p.id)}${esc(p.name)}</span>${s.ready.includes(p.id)?'<span class="tag">pronto</span>':''}</li>`).join('')}</ul></div>`;
  }else if(ph==='sleep'){
    h+=sleepCard(`<p>${lastVoteTxt(s.lastVote)}</p><p class="mut" style="margin:0">A noite vai começar…</p>`)+deadCard();
  }else if(ph==='night'){
    const lv=s.lastVote?`<p class="mut" style="margin:0 0 8px">${lastVoteTxt(s.lastVote)}</p>`:'';
    if(dead)h+=sleepCard(lv)+deadCard();
    else if(s.act){const a=s.act,R=ROLE[a.role],k=a.known||{};
      if(!a.done)h+=`<div class="card ctr nightcard t-${a.role}"><label>Noite ${s.night} · ${R.n}</label><div class="orb ${a.role}"></div><h2>${R.t}</h2><div class="ctimer" id="ctimer"></div>${lv}<p>Escolha uma pessoa e confirme.</p>
        <div class="sus" style="margin:16px 0">${a.targets.map(id=>{const kn=k[id]!==undefined;return `<div class="pc ${kn?'known':C.sel===id?'sel':''}" ${kn?'':`onclick="cSel(${id})"`}>${av(id)}<div class="cn"><b>${nm(id)}</b>${id===s.you?'<small>(você)</small>':''}${kn?`<span class="tag ${kCls(k[id])}">${kTxt(k[id])}</span>`:''}</div></div>`}).join('')}</div>
        <button class="${BTN[a.role]}" style="width:100%" ${C.sel==null?'disabled':''} onclick="cNact()">Confirmar escolha</button></div>`;
      else h+=`<div class="card ctr nightcard t-${a.role}"><label>Noite ${s.night} · ${R.n}</label><div class="orb ${a.role}"></div><h2>Ação registrada</h2><div class="ctimer" id="ctimer"></div><p class="mut" style="margin:0">Aguardando a cidade…</p></div>`;
    }else h+=sleepCard(lv+'<p class="mut" style="margin:0">Aguardando a cidade…</p>');
  }else if(ph==='day'){
    const d=s.dawn,rdy=s.ready,mine=rdy.includes(s.you);
    h+=`<div class="card ctr dawncard"><label>Amanhecer</label><div class="dawnt">Cidade acorda: ${dawnTxt(d)}</div>${d&&d.dead.length?`<div class="chips" style="margin-top:0">${d.dead.map(id=>`<span class="chip">${av(id)}<b>${nm(id)}</b></span>`).join('')}</div>`:''}</div>`;
    if(s.missed)h+=`<div class="card ctr${dc}"><p class="mut" style="margin:0">Você não escolheu a tempo na noite ${s.missed}, então a sua ação foi sorteada.</p></div>`;
    if(role==='detetive'&&s.inv)h+=histCard('Suas investigações',s.inv.map(i=>({night:i.night,target:i.target,tag:`<span class="tag ${kCls(i.diff)}">${kTxt(i.diff)}</span>`})));
    else if(role==='anjo'&&s.log)h+=histCard('Quem você protegeu',s.log);
    else if(role==='assassino'&&s.log)h+=histCard('Quem você matou ou tentou matar',s.log);
    h+=deadCard();
    h+=`<div class="card${dc}"><label>Prontos para votar</label><b style="font-family:var(--disp);font-size:1.5rem;color:var(--acc)">${rdy.length}/${aliveP.length}</b>
      ${dead?'':`<button style="width:100%;margin:12px 0 10px" class="${mine?'cx':''}" onclick="tx({type:'ready',ready:${!mine}})">${mine?'Cancelar':'Pronto para votar'}</button>`}
      <ul class="rl">${aliveP.map(p=>`<li><span class="nm">${av(p.id)}${esc(p.name)}${p.away?'<span class="tag off2">offline</span>':''}</span>${rdy.includes(p.id)?'<span class="tag">pronto</span>':''}</li>`).join('')}</ul></div>`;
  }else if(ph==='vote'){
    const voted=s.voted.includes(s.you),sv=s.skipV||[],si=s.skipI||[],mine=si.includes(s.you),canSkip=!dead&&!voted;
    const skAv=sv.map(id=>av(id,'cv')).concat(si.map(id=>av(id,'iv'))).join('');
    h+=`<div class="card ctr${dc}"><label>Votação</label><h2>Quem é o assassino?</h2><p class="mut" style="margin:0">${dead?'Você está fora do jogo e não vota.':'Declare sua intenção e vote. Você também pode pular a votação. Em caso de empate, ninguém é eliminado. Se a maioria pular, ninguém é eliminado.'}${(!dead&&voted)?(s.mySkip?' Você pulou a votação.':' Você já votou.'):''}</p>
      ${canSkip?`<div class="row" style="max-width:440px;margin:16px auto 0"><button class="${mine?'cx':'sec'}" onclick="${mine?`tx({type:'unintent'},1)`:`tx({type:'intent',target:'skip'},1)`}">${mine?'Cancelar intenção':'Declarar intenção de pular'}</button><button onclick="pikaSkip()">Pular votação</button></div>`:''}
      ${skAv?`<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px">${skAv}</div>`:''}</div>`;
    h+=board({...s,players:aliveP,voted:dead?s.voted.concat(s.you):s.voted},aliveP.map(p=>({id:p.id,name:p.name})),false);
    if(dead)h+=rolesCard();
  }else{
    const r=s.result,win=r.winner==='cidade',lead=leader;
    h+=`<div class="card ctr resultcard ${win?'win':'lose'}"><label>Resultado da partida</label><div class="rtitle">${win?'A cidade venceu!':'O assassino venceu!'}</div><p>O assassino era <b>${esc(r.killerName)}</b>.</p>
      ${lead?`<div class="row" style="max-width:560px;margin:12px auto 0"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera?',{type:'lobby'})">Nova partida</button><button onclick="pikaAsk('Jogar de novo com os mesmos jogadores? Os papéis serão sorteados de novo.',{type:'again'})">Jogar novamente</button></div>`:'<p class="mut">Aguardando o líder…</p>'}</div>`+rankCard()+rolesCard();
  }
  return h;
}