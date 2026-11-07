const Q={qn:'',qi:'',a:''};
(()=>{const s=document.createElement('style');s.textContent=`
.areas{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.areas{grid-template-columns:1fr}}
.slot{border:2px dashed var(--line);border-radius:14px;padding:18px;text-align:center;color:var(--mut)}
.ans{padding:14px 16px;background:#0a1230;border:2px solid var(--line);border-radius:14px;margin:10px 0;word-break:break-word}.ans b{color:var(--acc)}
.ans.new{animation:pop .4s both}
.qbox{font-size:1.4rem;font-weight:700;padding:16px;background:#0a1230;border-radius:14px;margin-top:6px;word-break:break-word}.ld{position:relative;overflow:hidden;padding:18px 16px;border:2px dashed var(--line);border-radius:14px;margin:10px 0;color:var(--mut);text-align:center}
.ld::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,194,51,.14),transparent);transform:translateX(-100%);animation:shm 1.4s infinite}
@keyframes shm{to{transform:translateX(100%)}}
.ld.q{border-style:solid;border-color:var(--acc);padding:30px 16px;margin:16px 0;color:var(--txt);font-weight:700;font-size:1.1rem;background:linear-gradient(180deg,var(--n2),var(--n1))}
.dd i{display:inline-block;width:9px;height:9px;margin:0 4px;border-radius:50%;background:var(--acc);animation:bnc 1s infinite ease-in-out}
.dd i:nth-child(2){animation-delay:.15s}.dd i:nth-child(3){animation-delay:.3s}
@keyframes bnc{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}
.ld .pb{height:6px;background:#0a1230;border-radius:4px;margin-top:14px;overflow:hidden}
.ld .pb i{display:block;height:100%;width:0;background:var(--acc);border-radius:4px;animation:fillb var(--ms) linear forwards}
@keyframes fillb{to{width:100%}}
.qnew{animation:pop .5s both}`;document.head.appendChild(s)})();



function perguntasRender(){
  const e0=document.activeElement,fid=e0&&e0.id,st=e0&&e0.selectionStart;
  if(S.phase==='answer')Q.qn=Q.qi='';
  $('app').classList.toggle('wide',S.phase==='vote'||S.phase==='end');
  $('app').innerHTML=perguntasView()+modalHtml();trans('q|'+S.phase);
  if(fid&&$(fid)){const e=$(fid);e.focus();if(st!=null&&e.setSelectionRange)e.setSelectionRange(st,st)}
}
const qSend=()=>tx({type:'questions',qn:Q.qn,qi:Q.qi});
function qAnswer(){const t=Q.a.trim();if(!t)return;tx({type:'answer',text:t});Q.a=''}

function perguntasView(){
  const s=S,ph=s.phase,leader=s.you===s.host,isHost=s.you===s.hostId;
  const hostP=s.players.find(p=>p.id===s.hostId),vs=s.players.filter(p=>p.id!==s.hostId);
  const E=err?`<p class="err">${esc(err)}</p>`:'';
  const chip=p=>`<span class="chip">${av(p.id)}${esc(p.name)}${p.id===s.host?'<span class="tag">líder</span>':''}${p.id===s.you?'<small>(você)</small>':''}</span>`;
  const qbox=(l,t,c='')=>`<div class="card ctr ${c}"><label>${l}</label><div class="qbox">${esc(t)}</div></div>`;
  const ld=(t,ms,q)=>`<div class="ld ${q?'q':''}" style="--ms:${ms}"><span class="dd"><i></i><i></i><i></i></span><div style="margin-top:10px">${t}</div><div class="pb"><i></i></div></div>`;
  const wait=t=>`<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">${t}</p></div>`;
  const impCard=()=>`<div class="card ctr"><label>O impostor é</label><div class="worst" style="margin:6px 0 0">${esc(pl(s.impostor).name||'?')}</div></div>`;
  let h=E;
  if(ph==='lobby'){
    h+=`<div class="hero" style="padding:0 0 6px"><div class="eyebrow">Sala de espera</div><h1>Impostor - Perguntas</h1></div>
    <div class="card ctr"><label>Código da sala</label><div class="code">${s.code}</div><p class="mut">Compartilhe o código com os amigos</p></div>${profileCard()}
    <div class="areas"><div class="card ctr"><label>Host</label>${hostP?`<div class="chips" style="margin:0">${chip(hostP)}</div>`:'<div class="slot">Área vazia</div>'}
      ${isHost?`<button class="sec" style="margin-top:16px" onclick="tx({type:'toPlayers'})">Sair do host</button>`:!hostP?`<button style="margin-top:16px" onclick="tx({type:'toHost'})">Ser o host</button>`:''}</div>
      <div class="card ctr"><label>Jogadores</label><div class="chips" style="margin:0">${vs.map(chip).join('')||'<div class="slot" style="width:100%">Ninguém aqui</div>'}</div></div></div>
    <p class="mut" style="font-size:.85rem">O host escreve as perguntas e acompanha a partida como espectador.</p>
    ${leader?`<button style="width:100%;padding:18px;font-size:1.1rem" ${hostP&&vs.length?'':'disabled'} onclick="tx({type:'start'})">Iniciar partida</button>${hostP?'':'<p class="mut">Escolha um host para poder começar.</p>'}`:'<p class="mut">Aguardando o líder iniciar…</p>'}`;
  }else if(ph==='write_q'){
    h+=isHost?`<div class="card"><label>Pergunta para os inocentes</label><input id="qn" maxlength="200" placeholder="Ex.: Qual é a sua comida favorita?" value="${esc(Q.qn)}" oninput="Q.qn=this.value">
      <label style="margin-top:18px">Pergunta para o impostor</label><input id="qi" maxlength="200" placeholder="Ex.: Qual é a sua sobremesa favorita?" value="${esc(Q.qi)}" oninput="Q.qi=this.value">
      <p class="mut" style="margin:14px 0">Dica: deixe a pergunta do impostor parecida com a dos inocentes, para ele não perceber.</p><button style="width:100%" onclick="qSend()">Começar rodada</button></div>`
      :wait('Esperando o Host escrever as perguntas');
  }else if(ph==='answer'){
    const done=s.answered.length,tot=s.total;
    if(isHost)h+=qbox('Pergunta dos inocentes',s.qn)+qbox('Pergunta do impostor',s.qi)+impCard()+`<div class="card ctr"><label>Respostas enviadas</label><b style="font-family:var(--disp);font-size:1.6rem;color:var(--acc)">${done}/${tot}</b></div>`;
    else if(s.answered.includes(s.you))h+=wait(`Resposta enviada. Aguardando os outros jogadores (${done}/${tot})…`);
    else h+=`<div class="card ctr"><label>Sua pergunta</label><div class="qbox">${esc(s.myQ)}</div>
      <input id="ans" class="ctr" style="margin-top:16px" maxlength="120" placeholder="Digite sua resposta" value="${esc(Q.a)}" oninput="Q.a=this.value" onkeydown="if(event.key==='Enter')qAnswer()">
      <button style="width:100%;margin-top:12px" onclick="qAnswer()">Enviar</button><p class="mut" style="margin:14px 0 0">Respostas enviadas: ${done}/${tot}</p></div>`;
  }else if(ph==='reveal'){
    const n=s.revealed.length,tot=s.count||n,ms=(s.wait||4000)+'ms',allIn=n>=tot;
    h+=`<div class="card"><label>Respostas (${n}/${tot})</label>${s.revealed.map((a,i)=>`<div class="ans ${i===n-1?'new':''}"><b>${esc(a.name)}</b>: ${esc(a.text)}</div>`).join('')}${allIn?'':ld(`Revelando a resposta ${n+1} de ${tot}`,ms)}</div>`;
    if(allIn&&!s.showQ)h+=ld('Revelando a pergunta dos inocentes',ms,true);
    if(s.showQ)h+=qbox('A pergunta dos inocentes era',s.qn,'qnew')+ld('A votação começa em instantes',ms);
    if(isHost)h+=impCard()+qbox('Pergunta do impostor',s.qi);
  }else{
    const end=ph==='end',voted=s.voted.includes(s.you);
    h+=qbox('A pergunta dos inocentes era',s.qn);
    if(end){const r=s.result;
      h+=`<div class="card ctr"><h2 style="color:var(--acc)">${r.caught?'Os jogadores venceram!':'O impostor venceu!'}</h2>
      <p>${r.caught?`<b>${esc(r.impostor)}</b> era o impostor.`:`O impostor era <b>${esc(r.impostor)}</b> e ganhou a partida.`}</p>
      <p class="mut">Mais votado: ${r.top.map(esc).join(' e ')} (${r.max} voto${r.max>1?'s':''})</p></div>`+qbox('Pergunta do impostor',s.qi)
      +(leader?`<div class="row" style="max-width:560px;margin:12px auto 0"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera? Você poderá trocar o host.',{type:'lobby'})">Nova partida</button><button onclick="pikaAsk('Jogar de novo com o mesmo host? Ele escreve novas perguntas.',{type:'again'})">Jogar novamente</button></div>`:'<p class="mut">Aguardando o líder…</p>');
    }else{
      if(isHost)h+=impCard();
      h+=`<p class="mut">${isHost?'Você é o host: acompanhe a votação.':'Quem é o impostor? Declare sua intenção e vote.'} ${voted?'Você já votou.':''}</p>`;
    }
    h+=board({...s,players:vs,voted:isHost?s.voted.concat(s.you):s.voted},s.entries,end);
  }
  return h;
}