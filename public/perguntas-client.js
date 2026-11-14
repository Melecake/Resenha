const Q={qn:'',qi:'',a:''};
const PH=['Fulano: resposta escondida','Ciclano: uma resposta bem curtinha','Beltrano: aqui vai uma resposta um pouco mais comprida'];
(()=>{const s=document.createElement('style');s.textContent=`
.areas{display:grid;gap:0}
.slot{border:2px dashed var(--line);border-radius:14px;padding:18px;text-align:center;color:var(--mut)}
.slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:12px;margin-top:8px}
.ans{padding:14px 16px;background:#0a1230;border:2px solid var(--line);border-radius:14px;word-break:break-word}.ans b{color:var(--acc)}
.ans.new{animation:unb .9s both}
.ans.blur{filter:blur(7px);opacity:.55;user-select:none;pointer-events:none;animation:flt 2.4s ease-in-out infinite alternate}
@keyframes unb{from{filter:blur(9px);transform:scale(.94);opacity:.4}to{filter:none;transform:none;opacity:1}}
@keyframes flt{from{opacity:.4}to{opacity:.7}}
.qbox{font-size:1.4rem;font-weight:700;padding:16px;background:#0a1230;border-radius:14px;margin-top:6px;word-break:break-word}
.qbox.blurq{filter:blur(8px);user-select:none;opacity:.6}.qbox.blurq.glow{animation:flt .8s ease-in-out infinite alternate}
.qnew{animation:unb .9s both}
.dd i{display:inline-block;width:9px;height:9px;margin:0 4px;border-radius:50%;background:var(--acc);animation:bnc 1s infinite ease-in-out}
.dd i:nth-child(2){animation-delay:.15s}.dd i:nth-child(3){animation-delay:.3s}
@keyframes bnc{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}
.qpair{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0 10px}.qpair.one{grid-template-columns:1fr}@media(max-width:700px){.qpair{grid-template-columns:1fr}}
.qc{position:relative;border:2px solid var(--line);border-radius:18px;padding:24px 18px 18px;text-align:center;background:linear-gradient(180deg,var(--n2),var(--n1));opacity:.7}
.qc.mine{opacity:1;border-width:3px}
.qc.inn label{color:#3ddc97}.qc.imp label{color:#ff8a8a}
.qc.inn.mine{border-color:#2dbd78;box-shadow:0 0 0 5px rgba(45,189,120,.18)}.qc.imp.mine{border-color:#ef4444;box-shadow:0 0 0 5px rgba(239,68,68,.18)}
.qc .mt{position:absolute;top:-13px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:4px 12px;font-size:.7rem}
.qc.inn .mt{background:#2dbd78;color:#04210f}.qc.imp .mt{background:#ef4444;color:#fff}`;document.head.appendChild(s)})();

function perguntasRender(){
  const e0=document.activeElement,fid=e0&&e0.id,st=e0&&e0.selectionStart;
  if(S.phase==='answer')Q.qn=Q.qi='';
  $('app').classList.toggle('wide',['lobby','vote','end'].includes(S.phase));
  $('app').innerHTML=perguntasView();trans('q|'+S.phase);
  if(fid&&fid!=='vsel'&&$(fid)){const e=$(fid);e.focus();if(st!=null&&e.setSelectionRange)e.setSelectionRange(st,st)}
}
const qSend=()=>tx({type:'questions',qn:Q.qn,qi:Q.qi});
function qAnswer(){const t=Q.a.trim();if(!t)return;tx({type:'answer',text:t});Q.a=''}

function perguntasView(){
  const s=S,ph=s.phase,leader=s.you===s.host,isHost=s.you===s.hostId;
  const hostP=s.players.find(p=>p.id===s.hostId),vs=s.players.filter(p=>p.id!==s.hostId);
  const E=err?`<p class="err">${esc(err)}</p>`:'';
  const chip=p=>`<span class="chip">${av(p.id)}<span class="cn"><b>${esc(p.name)}</b>${tags(p)}</span></span>`;
  const qbox=(l,t,c='')=>`<div class="card ctr ${c}"><label>${l}</label><div class="qbox">${esc(t??'')}</div></div>`;
  const wait=t=>`<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">${t}</p></div>`;
  const impCard=()=>`<div class="card ctr"><label>O impostor é</label><div class="worst" style="margin:6px 0 0">${esc(pl(s.impostor).name||'?')}</div></div>`;
  let h=E;
  if(ph==='lobby'){
    h+=`<div class="hero rel" style="padding:0 0 10px"><div class="eyebrow">Sala de espera</div><h1>Impostor - Perguntas</h1>${infoBtn('perguntas')}</div>
    <div class="split" style="align-items:start"><div>
      <div class="card ctr"><label>Código da sala</label><div class="code">${s.code}</div><p class="mut">Compartilhe o código com os amigos</p>${inviteBtn()}</div>${rankCard()}${profileCard()}
      ${leader?`<button style="width:100%;padding:18px;font-size:1.1rem" ${hostP&&vs.length?'':'disabled'} onclick="tx({type:'start'})">Iniciar partida</button>${hostP?'':'<p class="mut">Escolha um host para poder começar.</p>'}`:'<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">Aguardando o líder iniciar…</p></div>'}</div>
    <div class="areas"><div class="card ctr"><label>Host</label>${hostP?`<div class="chips" style="margin:0">${chip(hostP)}</div>`:'<div class="slot">Área vazia</div>'}
        ${isHost?`<button class="sec" style="margin-top:16px" onclick="tx({type:'toPlayers'})">Sair do host</button>`:!hostP?`<button style="margin-top:16px" onclick="tx({type:'toHost'})">Ser o host</button>`:''}
        <p class="mut" style="font-size:.85rem;margin:14px 0 0">O host escreve as perguntas e acompanha a partida como espectador.</p></div>
      <div class="card ctr"><label>Jogadores</label><div class="chips" style="margin:0">${vs.map(chip).join('')||'<div class="slot" style="width:100%">Ninguém aqui</div>'}</div></div></div></div>`;
  }else if(ph==='write_q'){
    h+=isHost?`<div class="card"><label>Pergunta para os inocentes</label><input id="qn" maxlength="200" placeholder="Ex.: Qual é a sua comida favorita?" value="${esc(Q.qn)}" oninput="Q.qn=this.value">
      <label style="margin-top:18px">Pergunta para o impostor</label><input id="qi" maxlength="200" placeholder="Ex.: Qual é a sua sobremesa favorita?" value="${esc(Q.qi)}" oninput="Q.qi=this.value">
      <p class="mut" style="margin:14px 0">Dica: deixe a pergunta do impostor parecida com a dos inocentes, para ele não perceber.</p><button style="width:100%" onclick="qSend()">Começar rodada</button></div>`
      :wait('Esperando o Host escrever as perguntas');
  }else if(ph==='answer'){
    const done=s.answered.length,tot=s.total;
    if(isHost)h+=qbox('Pergunta dos inocentes',s.qn)+qbox('Pergunta do impostor',s.qi)+impCard()
      +`<div class="card"><label>Respostas enviadas (${done}/${tot})</label><ul>${vs.map(p=>`<li><span class="nm">${av(p.id)}<span class="cn"><b>${esc(p.name)}</b>${p.away?'<span class="tag off2">offline</span>':''}</span></span>${s.answered.includes(p.id)?'<span class="tag">respondeu</span>':'<span class="tag off2">falta responder</span>'}</li>`).join('')}</ul></div>`;
    else if(s.answered.includes(s.you))h+=wait(`Resposta enviada. Aguardando os outros jogadores (${done}/${tot})…`);
    else h+=`<div class="card ctr"><label>Sua pergunta</label><div class="qbox">${esc(s.myQ??'')}</div>
      <input id="ans" class="ctr" style="margin-top:16px" maxlength="120" placeholder="Digite sua resposta" value="${esc(Q.a)}" oninput="Q.a=this.value" onkeydown="if(event.key==='Enter')qAnswer()">
      <button style="width:100%;margin-top:12px" onclick="qAnswer()">Enviar</button><p class="mut" style="margin:14px 0 0">Respostas enviadas: ${done}/${tot}</p></div>`;
  }else if(ph==='reveal'){
    const n=s.slots.filter(Boolean).length;
    h+=`<div class="card"><label>Respostas (${n}/${s.count})</label><div class="slots">${s.slots.map((a,i)=>a?`<div class="ans ${a.id===s.last?'new':''}"><b>${esc(a.name)}</b>: ${esc(a.text)}</div>`:`<div class="ans blur"><b>${PH[i%3].split(':')[0]}</b>:${PH[i%3].split(':')[1]}</div>`).join('')}</div></div>`;
    h+=s.showQ?qbox('A pergunta dos inocentes era',s.qn,'qnew')+`<p class="mut"><span class="dd"><i></i><i></i><i></i></span><br>A votação começa em instantes</p>`
      :`<div class="card ctr"><label>A pergunta dos inocentes era</label><div class="qbox blurq ${s.qReady?'glow':''}">Aqui vai aparecer a pergunta dos inocentes</div></div>`;
    if(isHost)h+=impCard()+qbox('Pergunta do impostor',s.qi);
  }else{
    const end=ph==='end',voted=s.voted.includes(s.you);
    const showImp=s.me==='host'||s.me==='imp'||end;
    const pair=`<div class="qpair ${showImp?'':'one'}"><div class="qc inn ${s.me==='inn'?'mine':''}">${s.me==='inn'?'<span class="tag mt">Você recebeu esta</span>':''}<label>Pergunta dos inocentes</label><div class="qbox">${esc(s.qn??'')}</div></div>
      ${showImp?`<div class="qc imp ${s.me==='imp'?'mine':''}">${s.me==='imp'?'<span class="tag mt">Você recebeu esta</span>':''}<label>Pergunta do impostor</label><div class="qbox">${esc(s.qi??'')}</div></div>`:''}</div>`;
    if(end){const r=s.result;
      h+=`<div class="card ctr"><h2 style="color:var(--acc)">${r.caught?'Os jogadores venceram!':'O impostor venceu!'}</h2>
      <p>${r.caught?`<b>${esc(r.impostor)}</b> era o impostor.`:`O impostor era <b>${esc(r.impostor)}</b> e ganhou a partida.`}</p>
      <p class="mut">Mais votado: ${r.top.map(esc).join(' e ')} (${r.max} voto${r.max>1?'s':''})${r.early?' · Votação encerrada por maioria':''}</p>
      ${leader?`<div class="row" style="max-width:560px;margin:12px auto 0"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera? Você poderá trocar o host.',{type:'lobby'})">Nova partida</button><button onclick="pikaAsk('Jogar de novo com o mesmo host? Ele escreve novas perguntas.',{type:'again'})">Jogar novamente</button></div>`:'<p class="mut">Aguardando o líder…</p>'}</div>`+rankCard()+pair;
    }else{
      h+=pair;
      if(isHost)h+=impCard();
      h+=`<p class="mut">${isHost?'Você é o host: acompanhe a votação.':'Quem é o impostor? Declare sua intenção e vote.'} ${voted?'Você já votou.':''}</p>`;
    }
    if(!end)h+=board({...s,players:vs,voted:isHost?s.voted.concat(s.you):s.voted},s.entries,false);
  }
  return h;
}