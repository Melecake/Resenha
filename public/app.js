// Capas dos jogos na página inicial: ficam na pasta public/images/covers/ e são definidas aqui, no código.
// Para trocar uma capa, substitua o arquivo (mesmo nome). Para um jogo novo, adicione o arquivo na pasta e coloque o nome em "img".
const cover=f=>encodeURI('/images/covers/'+f);
const GAMES=[
  {id:'locais',name:'Impostor - Locais',short:'Locais',img:cover('Impostor - Locais.webp'),ok:true,tag:'Descubra o espião antes que ele descubra o local.'},
  {id:'pika',name:'O meu é mais Pika',short:'Pika',img:cover('O meu é mais pika.webp'),ok:true,tag:'Uma letra, um tema: quem disser a pior palavra perde.'},
  {id:'perguntas',name:'Impostor - Perguntas',short:'Perguntas',img:cover('Impostor - Perguntas.webp'),ok:true,tag:'Duas perguntas, um impostor.'},
  {id:'cidade',name:'Cidade Dorme',short:'Cidade',img:cover('Cidade Dorme.webp'),ok:true,tag:'A cidade dorme e o assassino age. Descubra quem é.'}];
const VOTEINFO=`<li><b>Quem falta votar:</b> aparece em uma lista vertical no lado esquerdo da tela, fora da área principal (em telas pequenas, acima dos cards).</li><li><b>Intenção e voto:</b> a intenção aparece com borda tracejada e esmaecida. O voto confirmado aparece com borda dourada e um ✓. No card da pessoa em quem você declarou intenção, o botão vira <b>Cancelar intenção</b> (vermelho) para desistir sem escolher outro jogador.</li><li><b>Maioria:</b> se alguém receber mais da metade dos votos (metade + 1), a votação termina na hora, mesmo que falte gente votar, e uma animação avisa que a votação foi encerrada.</li>`;
const INFO={
locais:{brief:'Todos recebem o mesmo local, menos o espião. Façam perguntas uns aos outros, descubram quem não sabe onde está e votem. O espião tenta descobrir o local sem ser pego.',
full:`<h4>Objetivo</h4><p>Todos os jogadores recebem o mesmo <b>local</b>, menos um: o <b>espião</b>, que não sabe onde está. Os jogadores tentam descobrir quem é o espião. O espião tenta descobrir o local e não ser pego.</p>
<h4>Antes de começar</h4><ul><li><b>Ícone e cor:</b> cada jogador escolhe um emoji e uma cor. Dois jogadores não podem ter o mesmo emoji, mas as cores podem se repetir.</li><li><b>Nome:</b> não pode haver dois jogadores com o mesmo nome na sala, e nomes com palavras ofensivas ou preconceituosas não são aceitos.</li><li><b>Fonte e card:</b> na sala de espera, clique no lápis do seu card para escolher uma fonte para o seu nome (Neon, Pixel ou Marcador), uma cor e um desenho para o seu card (Galáxia, Chamas, Oceano, Flores, Floresta, Castelo, Carro, Halloween ou Natal) e uma cor para o nome. É só visual, e a sua escolha fica guardada neste aparelho.</li><li><b>Localidades:</b> o líder (quem criou a sala) marca quais localidades entram na partida, e todos veem a seleção.</li><li><b>Convite:</b> o botão "Copiar convite" gera um link que leva os amigos direto para a entrada da sala.</li><li><b>Iniciar:</b> só o líder inicia a partida.</li></ul>
<h4>Sorteios</h4><ul><li>O <b>local</b> e <b>quem começa perguntando</b> são sorteados por ciclos: só se repetem depois que todos os outros já tiveram a sua vez.</li><li>O <b>espião</b> é sorteado com chances ajustadas pelo histórico recente da sala: quem foi espião há pouco tempo, ou várias vezes nas últimas 10 partidas, tem menos chance de ser sorteado de novo, mas qualquer um pode se repetir. O histórico vale enquanto a sala existir.</li></ul>
<h4>Durante a partida</h4><ul><li><b>Seu cartão:</b> mostra o local, ou "Espião" se você for o espião.</li><li><b>Quem começa:</b> no início de cada rodada, uma janela mostra quem faz a primeira pergunta.</li><li><b>Conversa:</b> façam perguntas uns aos outros sobre o local, sem entregar demais.</li><li><b>Anotações:</b> o botão <b>Anotações</b> abre uma caixa de texto só sua, vazia, onde você escreve o que quiser, como quem perguntou o quê e as respostas. Ninguém mais vê, e o texto é apagado a cada rodada.</li><li><b>Quadro de suspeitos:</b> só você vê. Clique em um jogador para alternar entre Na dúvida, Suspeito e Inocente. É só uma anotação sua, e o seu próprio card não muda. O espião não tem esse quadro, mas também pode usar as anotações.</li><li><b>Possíveis localidades:</b> toque em uma localidade para riscá-la e lembrar o que já descartou.</li></ul>
<h4>Votação</h4><ul><li><b>Pronto para votar:</b> quando achar que já deu, clique no botão. Se mudar de ideia, clique em Cancelar. A votação só abre quando todos estiverem prontos.</li><li><b>Declarar intenção:</b> seu emoji aparece no card da pessoa escolhida, para a turma ver em quem a maioria quer votar. Você pode mudar de alvo quantas vezes quiser.</li><li><b>Votar:</b> abre uma confirmação só para você, e o voto é definitivo. Quando a votação termina, o mais votado é revelado.</li>${VOTEINFO}</ul>
<h4>Quem vence e pontos</h4><ul><li>Se o espião for o único mais votado, <b>os jogadores vencem</b> e todos os inocentes ganham 1 ponto, mesmo quem não chegou a votar porque a votação terminou por maioria.</li><li>Se outra pessoa for a mais votada, ou houver empate, <b>o espião vence</b> e ganha 2 pontos.</li><li><b>Ranking:</b> os pontos só contam quando a partida termina, ficam guardados enquanto a sala existir e aparecem na tela final (com um selo +1 ou +2 em quem pontuou) e na sala de espera.</li></ul>
<h4>Outras regras</h4><ul><li>Se alguém sair, a partida continua. <b>Se o espião sair da sala, a rodada recomeça</b> com novo local e novo espião. Se a sua conexão cair, você tem 60 segundos para voltar sozinho à partida.</li><li>O painel <b>Jogadores</b> mostra quem está na sala. O líder o vê aberto em telas grandes e pode remover quem estiver parado, ou minimizá-lo.</li><li>Não é possível entrar em uma partida em andamento.</li><li>No fim, o líder escolhe <b>Nova partida</b> (todos voltam para a sala de espera, onde dá para trocar as localidades e entrar novos jogadores) ou <b>Jogar novamente</b> (novo espião e novo local com os mesmos jogadores). Os dois pedem confirmação.</li></ul>`},
pika:{brief:'O líder escolhe um tema e uma letra é sorteada. Cada jogador diz uma palavra do tema que comece com a letra, e todos votam na pior resposta.',
full:`<h4>Objetivo</h4><p>Uma letra é sorteada e existe um tema. Cada jogador diz uma palavra do tema que comece com essa letra. No fim, a turma vota na <b>pior palavra</b>, e quem a escreveu perde.</p>
<h4>Sala de espera</h4><ul><li><b>Ícone e cor:</b> cada jogador escolhe um emoji (único na sala) e uma cor.</li><li><b>Nome:</b> não pode haver dois jogadores com o mesmo nome na sala, e nomes com palavras ofensivas ou preconceituosas não são aceitos.</li><li><b>Fonte e card:</b> na sala de espera, clique no lápis do seu card para escolher uma fonte para o seu nome (Neon, Pixel ou Marcador), uma cor e um desenho para o seu card (Galáxia, Chamas, Oceano, Flores, Floresta, Castelo, Carro, Halloween ou Natal) e uma cor para o nome. É só visual, e a sua escolha fica guardada neste aparelho.</li><li><b>Tema:</b> o líder (quem criou a sala) digita o tema ou escolhe uma <b>sugestão</b> na lista, e todos veem.</li><li><b>Letras:</b> só o líder pode excluir letras do sorteio, tocando nelas. Letras riscadas não entram.</li><li><b>Convite:</b> o botão "Copiar convite" gera um link que leva os amigos direto para a entrada da sala.</li><li><b>Iniciar:</b> só o líder inicia a partida.</li></ul>
<h4>Rodada</h4><ul><li><b>Roleta:</b> uma animação sorteia a letra entre as que não foram excluídas. Uma letra só volta a ser sorteada depois que todas as outras já saíram.</li><li><b>Tema e letra:</b> aparecem na tela, seguidos de uma contagem de 3 segundos.</li><li><b>Eu tenho!:</b> quando você pensar em uma palavra, clique no botão. Você entra na fila pela ordem dos cliques, e a fila fica visível para todos. Quem quiser pode clicar em <b>Sair da fila</b>.</li><li><b>Escrever:</b> só a pessoa que está na frente da fila escreve por vez, para ninguém repetir a mesma palavra. Quando ela envia, o nome e a palavra aparecem para todos, e o próximo da fila é liberado.</li><li><b>Tempo:</b> quando chega a sua vez, você tem 10 segundos. Depois disso aparece "Tempo esgotado", e aos 15 segundos sem enviar você vai para o fim da fila.</li><li><b>Último a escrever:</b> quando só falta uma pessoa, ela tem 20 segundos. Se não enviar a palavra, fica fora da rodada: não vota e não pontua.</li></ul>
<h4>Votação</h4><ul><li>Começa quando todos enviaram suas palavras (ou ficaram de fora), sem limite de tempo.</li><li><b>Declarar intenção:</b> seu emoji aparece no card escolhido, para a turma ver em quem a maioria quer votar.</li><li><b>Votar:</b> abre uma confirmação só para você, e o voto é definitivo. O contador de votos aparece no card assim que alguém recebe um voto.</li>${VOTEINFO}<li>Quando a votação termina, o mais votado é o perdedor, e o card da pior escolha ganha destaque. Em caso de empate, todos os empatados perdem.</li></ul>
<h4>Pontos e ranking</h4><ul><li>Quem não teve a pior escolha ganha 1 ponto, mesmo que não tenha votado porque a votação terminou por maioria. Quem ficou de fora da rodada não pontua.</li><li>Quem teve a pior escolha (o mais votado, ou todos os empatados) <b>perde 1 ponto</b>, então o placar pode ficar negativo.</li><li>Os pontos ficam guardados enquanto a sala existir e aparecem na tela final (com um selo +1 ou -1 em quem mudou de pontuação) e na sala de espera.</li></ul>
<h4>Depois da rodada</h4><ul><li><b>Nova partida:</b> volta à sala de espera para trocar o tema e as letras.</li><li><b>Jogar novamente o mesmo tema:</b> sorteia uma nova letra e começa outra rodada. Os dois botões são do líder e pedem confirmação.</li><li>Se a sua conexão cair, você tem 60 segundos para voltar sozinho. O líder vê o painel <b>Jogadores</b> aberto em telas grandes e pode remover quem estiver parado.</li></ul>`},
perguntas:{brief:'Um host escreve duas perguntas parecidas: uma para os inocentes e outra para o impostor. Todos respondem, as respostas são reveladas e vocês votam em quem recebeu a pergunta diferente.',
full:`<h4>Objetivo</h4><p>O <b>host</b> escreve duas perguntas parecidas: uma para os <b>inocentes</b> e outra para o <b>impostor</b>. Todos respondem sem saber que existem duas perguntas. Os jogadores tentam descobrir quem respondeu à pergunta diferente. O impostor tenta passar despercebido.</p>
<h4>Sala de espera</h4><ul><li><b>Áreas:</b> a sala tem duas áreas, <b>Host</b> e <b>Jogadores</b>. A área Host começa vazia e comporta só uma pessoa. Para trocar o host, quem está nela clica em "Sair do host" e outra pessoa clica em "Ser o host".</li><li><b>Convite:</b> o botão "Copiar convite" gera um link que leva os amigos direto para a entrada da sala.</li><li><b>Iniciar:</b> só o líder (quem criou a sala) inicia, e apenas se houver alguém como host e ao menos um jogador.</li><li><b>Ícone e cor:</b> cada jogador escolhe um emoji (único na sala) e uma cor.</li><li><b>Nome:</b> não pode haver dois jogadores com o mesmo nome na sala, e nomes com palavras ofensivas ou preconceituosas não são aceitos.</li><li><b>Fonte e card:</b> na sala de espera, clique no lápis do seu card para escolher uma fonte para o seu nome (Neon, Pixel ou Marcador), uma cor e um desenho para o seu card (Galáxia, Chamas, Oceano, Flores, Floresta, Castelo, Carro, Halloween ou Natal) e uma cor para o nome. É só visual, e a sua escolha fica guardada neste aparelho.</li></ul>
<h4>Rodada</h4><ul><li><b>Host escreve:</b> os jogadores veem "Esperando o Host escrever as perguntas". O host escreve a pergunta dos inocentes e a do impostor.</li><li><b>Sorteio:</b> o impostor é sorteado entre os jogadores com chances ajustadas pelo histórico recente da sala (quem foi impostor há pouco tempo, ou várias vezes nas últimas 10 partidas, tem menos chance, mas pode se repetir). Todos os outros recebem a pergunta dos inocentes.</li><li><b>Respostas:</b> cada jogador vê só a sua pergunta, escreve a resposta e clica em Enviar.</li><li><b>Host espectador:</b> o host não joga. Ele acompanha a partida, vê quem é o impostor e as duas perguntas, e vê quem já respondeu e quem falta responder, mas não pode votar.</li></ul>
<h4>Revelação</h4><ul><li>Quando todos enviarem, as respostas aparecem embaçadas e são reveladas <b>uma por vez</b>, em ordem aleatória, com os nomes.</li><li>Só depois da última resposta a <b>pergunta dos inocentes</b> é revelada. É nesse momento que o impostor descobre que era o impostor.</li></ul>
<h4>Votação</h4><ul><li>Os inocentes veem só a pergunta dos inocentes. O impostor e o host veem as duas, e para o impostor a pergunta dele fica destacada.</li><li><b>Declarar intenção:</b> seu emoji aparece no card escolhido, para a turma ver em quem a maioria quer votar.</li><li><b>Votar:</b> abre uma confirmação só para você, e o voto é definitivo. O host não vota, mas vê quem já votou e quem falta. A maioria é calculada só entre os jogadores.</li>${VOTEINFO}</ul>
<h4>Resultado e pontos</h4><ul><li>Se o mais votado for o impostor, <b>os jogadores vencem</b> e todos os inocentes ganham 1 ponto, mesmo quem não chegou a votar porque a votação terminou por maioria.</li><li>Se não, aparece o nome do impostor e que <b>ele ganhou a partida</b>, e ele ganha 2 pontos. Empate também dá vitória ao impostor. O host não pontua.</li><li>No fim, aparecem o card de resultado, o ranking da sala (com um selo +1 ou +2 em quem pontuou) e as duas perguntas. O líder escolhe <b>Nova partida</b> (volta à sala de espera, para trocar o host) ou <b>Jogar novamente</b> (mesmo host, perguntas novas).</li><li>Os pontos ficam guardados enquanto a sala existir.</li><li>Se a sua conexão cair, você tem 60 segundos para voltar sozinho. O líder vê o painel <b>Jogadores</b> aberto em telas grandes e pode remover quem estiver parado.</li></ul>`},
cidade:{brief:'A cidade dorme e um assassino age em segredo. Todo dia a cidade debate e vota em quem acha que é o assassino. Há também um detetive e um anjo. O narrador é o servidor.',
full:`<h4>Objetivo</h4><p>A cidade dorme e um <b>assassino</b> age em segredo. Os moradores precisam descobrir quem é o assassino antes que sobrem poucos vivos. O narrador é o próprio servidor.</p>
<h4>Antes de começar</h4><ul><li>São necessários <b>5 jogadores</b> (o jogo fica melhor com 6 ou mais). Só o líder inicia.</li><li><b>Duração da noite:</b> o líder escolhe na sala de espera (10, 15, 20, 30, 45 ou 60 segundos; o padrão é 15). Todos veem o mesmo tempo.</li><li><b>Nome:</b> não pode haver dois jogadores com o mesmo nome na sala, e nomes com palavras ofensivas ou preconceituosas não são aceitos.</li><li><b>Fonte e card:</b> na sala de espera, clique no lápis do seu card para escolher uma fonte para o seu nome (Neon, Pixel ou Marcador), uma cor e um desenho para o seu card (Galáxia, Chamas, Oceano, Flores, Floresta, Castelo, Carro, Halloween ou Natal) e uma cor para o nome. É só visual, e a sua escolha fica guardada neste aparelho.</li><li>Os papéis são sorteados com o mesmo sistema ponderado dos outros jogos (histórico da sala), e só você vê o seu.</li></ul>
<h4>Papéis</h4><ul><li><b>Assassino:</b> há 1 por partida. A cada noite escolhe alguém para eliminar.</li><li><b>Detetive:</b> há 1 por partida. A cada noite investiga alguém e descobre, só para ele, se a pessoa é um cidadão comum ou alguém diferente (assassino ou anjo), sem saber a função. Cada pessoa só pode ser investigada uma vez.</li><li><b>Anjo:</b> há 1 por partida. A cada noite protege alguém. Pode proteger a si mesmo e pode repetir a mesma pessoa. Se o assassino escolher quem está protegido, ninguém morre.</li><li><b>Cidadãos:</b> são todos os demais jogadores. Não têm poder especial; debatem e votam.</li></ul>
<h4>Como funciona uma rodada</h4><ul><li><b>Papéis:</b> cada um vê o seu papel e clica "Entendi, pode dormir". Quando todos clicam, começa a noite.</li><li><b>Noite:</b> todos veem "A cidade dorme". Assassino, detetive e anjo vivos escolhem seus alvos: basta tocar na pessoa e clicar em <b>Confirmar escolha</b>, e a escolha é definitiva. A noite dura o tempo definido pelo líder e sempre vai até o fim, mesmo que todos já tenham agido, para ninguém deduzir quem tem poder pelo tempo. Assassino, detetive e anjo sempre agem: quem não escolher a tempo tem o alvo sorteado entre as opções válidas do seu papel (o detetive não cai em quem já investigou), e só essa pessoa sabe disso.</li><li><b>Amanhecer:</b> aparece "Cidade acorda: Ninguém morreu" ou "Cidade acorda: uma pessoa morreu" (ou "N pessoas morreram"), com o nome de quem morreu. O papel de quem morre não é revelado.</li><li><b>Histórico:</b> de dia, o detetive vê quem investigou (com o resultado), o anjo vê quem protegeu e o assassino vê quem matou ou tentou matar. Só a própria pessoa vê o seu histórico, e só o do detetive mostra resultado.</li><li><b>Dia:</b> a cidade debate (por voz ou presencialmente, o site não tem chat). Quando todos os vivos clicam em <b>Pronto para votar</b>, abre a votação.</li><li><b>Votação:</b> cada vivo declara intenção e vota. Quem tiver mais votos é eliminado. Em caso de empate, ninguém é eliminado. Quem quiser pode <b>pular a votação</b> (não votar em ninguém), e também pode declarar a intenção de pular antes de confirmar. Quem declarou intenção ou pulou aparece no card "Pular votação", do mesmo jeito que os votos aparecem nos jogadores. Se os votos para pular empatarem ou superarem o mais votado, ninguém é eliminado. Depois da votação aparece "A cidade dorme" com o resultado por 5 segundos e a noite recomeça.</li></ul>
<h4>Votação</h4><ul>${VOTEINFO}</ul>
<h4>Quem morre</h4><ul><li>Quem morre (ou é eliminado) vira espectador: continua vendo a tela e <b>vê os papéis de todos</b>. Não conte para ninguém!</li><li>Quem sair da sala é tratado como morto.</li></ul>
<h4>Como se vence e pontos</h4><ul><li><b>A cidade vence</b> quando o assassino é eliminado (ou sai da sala). Todos os que não são o assassino ganham 1 ponto, mesmo os mortos.</li><li><b>O assassino vence</b> quando sobra apenas mais uma pessoa viva além dele, e ganha 2 pontos.</li><li>No fim, o papel de todos é revelado, e o ranking da sala é atualizado.</li></ul>`}};
const EMOTES=["😎","🤠","🥸","🤓","😈","👻","🤖","👽","🦊","🐸","🐙","🦄","🐼","🦁","🐵","🐲","🐶","🐱","🦉","🐧"];
const HUES=[0,24,45,75,130,165,190,215,245,275,305,335];
const LSK=new Set(['name','fnt','cd','col']);
const store={get:(k,d)=>{try{return JSON.parse((LSK.has(k)?localStorage:sessionStorage).getItem(k))??d}catch{return d}},set:(k,v)=>{try{(LSK.has(k)?localStorage:sessionStorage).setItem(k,JSON.stringify(v))}catch{}}};const TOKEN=(()=>{let t=sessionStorage.getItem('tk');if(!t){t=((window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2)+Date.now())+'';sessionStorage.setItem('tk',t)}return t})();
let LOCS=null,RLOCS=null,T0=Date.now(),S=null,err='',struck=new Set(),marks={},mode='menu',screen='home',game='locais',ready=false,lastKey='',lt,invCode='',ppOpen=null;
(()=>{const q=new URLSearchParams(location.search),c=(q.get('sala')||'').toUpperCase().slice(0,4),g=q.get('jogo');
  if(c){if(GAMES.some(x=>x.id===g&&x.ok))game=g;invCode=c;if(!store.get('inroom',false)){screen='game';mode='join'}history.replaceState(null,'',location.pathname)}})();

const busy=on=>document.body.classList.toggle('loading',on);
let ws,retry=0,cTimer,lastPong=0,hb,wd,rcT;
// A barra "Reconectando…" só aparece se a conexão ficar fora por mais de ~1 s (evita piscar em quedas rápidas)
const rcShow=on=>{clearTimeout(rcT);if(on)rcT=setTimeout(()=>$('rc').classList.add('on'),900);else $('rc').classList.remove('on')};
function lost(){clearTimeout(wd);clearInterval(hb);rcShow(true);busy(false);clearTimeout(cTimer);cTimer=setTimeout(connect,Math.min(800*2**retry++,5000))}
function drop(w){w.onopen=w.onmessage=w.onclose=null;try{w.close()}catch(e){}if(ws===w)ws=null;lost()}
function connect(){
  clearTimeout(cTimer);
  if(ws&&ws.readyState===1)return;
  if(ws&&ws.readyState===0)return;
  const w=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);ws=w;
  // Conexão que nunca termina de abrir (comum no celular ao trocar de rede): desiste depois de 8 s e tenta de novo
  clearTimeout(wd);wd=setTimeout(()=>{if(ws===w&&w.readyState===0)drop(w)},8000);
  w.onopen=()=>{if(ws!==w)return;clearTimeout(wd);ready=true;retry=0;rcShow(false);startHb();
    if(store.get('inroom',false))w.send(JSON.stringify({type:'resume',token:TOKEN}));
    render()};
  w.onmessage=e=>{if(ws===w)onMsg(e)};
  w.onclose=()=>{if(ws===w){ws=null;lost()}};
  w.onerror=()=>{};
}
// Batimento: a cada 20 s (com a aba visível) confere se o servidor responde; conexão "meio morta" é derrubada e refeita
function startHb(){clearInterval(hb);hb=setInterval(()=>{if(!ws||ws.readyState!==1||document.hidden)return;const w=ws,t=Date.now();w.send(JSON.stringify({type:'ping'}));setTimeout(()=>{if(ws===w&&w.readyState===1&&lastPong<t)drop(w)},8000)},20000)}
function reopen(){if(ws){ws.onopen=ws.onmessage=ws.onclose=null;try{ws.close()}catch(e){}ws=null}retry=0;rcShow(true);connect()}
// "quiet" não mostra a barra de carregamento (usado em ações leves, como configurar a sala)
const tx=(o,quiet)=>{if(!ws||ws.readyState!==1){toast('Sem conexão. Reconectando…');return}ws.send(JSON.stringify(o));if(!quiet){busy(true);clearTimeout(lt);lt=setTimeout(()=>busy(false),4000)}};
function onMsg(e){busy(false);const m=JSON.parse(e.data);let closing=false;
  if(m.type==='pong'){lastPong=Date.now();return}
  if(m.type==='info'){notify(m.msg);return}
  if(m.type==='resumed'){screen='game';if(m.gid)game=m.gid;return}
  if(m.type==='resume_failed'){store.set('inroom',false);S=null;notify('A sala em que você estava não existe mais, ou o tempo para reconectar acabou.');render();return}
  if(m.type==='kicked'){store.set('inroom',false);S=null;screen='home';mode='menu';if(typeof closeConfirm==='function')closeConfirm();$('fx').innerHTML='';NT.open=false;drawNotes();notify(m.msg||'Você saiu da sala.');render();return}
  if(m.type==='error'){if(m.alert)notify(m.msg);else err=m.msg}
  else{if(m.gid)game=m.gid;
    if(m.all)LOCS=m.all;else if(LOCS&&m.phase==='lobby'&&!m.game)m.all=LOCS;
    if(m.role&&!m.game){if(m.role.locs)RLOCS=m.role.locs;else m.role.locs=RLOCS||[]}
    closing=!!S&&S.phase==='vote'&&(m.phase==='end'||(m.game==='cidade'&&(m.phase==='night'||m.phase==='sleep')));
    if(typeof closeConfirm==='function'&&(!S||S.phase!==m.phase||(P.confirm&&P.confirm.msg&&P.confirm.msg.type==='vote'&&m.voted&&m.voted.includes(m.you))))closeConfirm();
    if(S&&m.phase==='play'&&(S.phase!=='play'||(m.round&&S.round!==m.round))){struck=new Set();marks={};noteText='';saveNotes()}
    S=m;err='';invCode='';nameDraft=null;if(screen==='game'||S)store.set('inroom',true)}
  render();
  if(closing)closingFx(m);
  if(S&&!S.game&&S.phase==='play'&&S.round&&store.get('stKey','')!==S.code+':'+S.round){store.set('stKey',S.code+':'+S.round);showStarter()}}
// Animação quando a votação termina (antes de mostrar o resultado)
function closingFx(m){const early=(m.result&&m.result.early)||(m.lastVote&&m.lastVote.early);
  $('fx').innerHTML=`<div class="fx"><div class="fxbox"><div class="fxt">Votação encerrada!</div><div class="fxs">${early?'Maioria atingida':'Todos votaram'}</div></div></div>`;
  clearTimeout(window._fx);window._fx=setTimeout(()=>{if($('fx').querySelector('.fx'))$('fx').innerHTML=''},2300)}
// Quem começa perguntando (Impostor - Locais)
function showStarter(){if(!S||!S.starter)return;const p=pl(S.starter),me=S.starter===S.you;
  $('fx').innerHTML=`<div class="modal" onclick="if(event.target===this)$('fx').innerHTML=''"><div class="box" style="max-width:420px"><label>Quem começa perguntando</label><div style="display:flex;justify-content:center;margin:12px 0">${av(S.starter)}</div><div class="worst" style="margin:6px 0 8px">${esc(p.name||'?')}</div><p class="mut" style="margin:0 0 18px">${me?'É você! Faça a primeira pergunta a alguém.':'Essa pessoa faz a primeira pergunta a alguém.'}</p><button onclick="$('fx').innerHTML=''">Entendi</button></div></div>`;
  clearTimeout(window._st);window._st=setTimeout(()=>{if($('fx').querySelector('.box label'))$('fx').innerHTML=''},9000)}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  if(!ws||ws.readyState>1){retry=0;connect();return}
  if(ws.readyState===0){reopen();return}
  const w=ws,t=Date.now();w.send(JSON.stringify({type:'ping'}));setTimeout(()=>{if(ws===w&&lastPong<t)reopen()},3000)});
// Celular: ao voltar de outra aba/app a página pode vir do cache do navegador com a conexão já morta
window.addEventListener('pageshow',e=>{if(e.persisted)reopen()});
window.addEventListener('online',()=>{reopen()});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.classList.contains('nbtn')&&!b.classList.contains('ibtn')&&!b.classList.contains('xbtn')&&!b.classList.contains('pen')&&!b.classList.contains('nobusy')&&!b.classList.contains('fab')&&!b.classList.contains('mini')&&!b.classList.contains('nb')&&!b.classList.contains('bchip')&&!b.closest('.emos,.cols,.sug,.lbls,.opts,.sws')){b.classList.add('busy');setTimeout(()=>b.classList.remove('busy'),700)}});
// Esc fecha a janela que estiver aberta (a de cima primeiro)
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if(AUTH.menu){AUTH.menu=false;render();return}
  if($('lk')&&$('lk').innerHTML.trim()){closeLook();return}
  const fx=$('fx'),cf=$('cfm');
  if(fx&&fx.querySelector('.modal')){fx.innerHTML='';return}
  if(cf&&cf.innerHTML.trim()&&typeof closeConfirm==='function'){closeConfirm();return}
  if(NT.open){closeNotes();return}
  if($('ntc').innerHTML.trim())closeNote()});
window.addEventListener('error',e=>{if(e.message)notify('Erro na página: '+e.message)});
window.addEventListener('unhandledrejection',e=>notify('Erro: '+((e.reason&&e.reason.message)||e.reason)));
function trans(k){if(k===lastKey)return;lastKey=k;window.scrollTo(0,0);const a=$('app');a.classList.remove('enter');void a.offsetWidth;a.classList.add('enter');setTimeout(()=>a.classList.remove('enter'),900)}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)}
function notify(m){const n=$('ntc');if(n.dataset.m===m&&n.innerHTML)return;n.dataset.m=m;n.innerHTML=`<div class="modal"><div class="box"><h3 style="margin:0 0 10px">Aviso</h3><p style="margin:0 0 18px">${esc(m)}</p><button onclick="closeNote()">Entendi</button></div></div>`}
const closeNote=()=>{const n=$('ntc');n.dataset.m='';n.innerHTML=''};
function showInfo(id,full){const g=GAMES.find(x=>x.id===id),t=INFO[id];
  $('ntc').innerHTML=`<div class="modal" onclick="if(event.target===this)closeNote()"><div class="box ${full?'info':''}" style="${full?'':'text-align:center'}"><button class="xbtn" aria-label="Fechar" title="Fechar (Esc)" onclick="closeNote()">×</button><h3 style="margin:0 0 6px">${g.name}</h3>${full?t.full:`<p style="color:#cfd8f5;line-height:1.55">${t.brief}</p>`}<div style="text-align:center;clear:both"><button style="margin-top:18px" onclick="closeNote()">Entendi</button></div></div></div>`}
const infoBtn=id=>`<span class="iw"><span class="ihint">Explicação do jogo</span><button class="ibtn" title="Como jogar" onclick="event.stopPropagation();showInfo('${id}',true)">i</button></span>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
// ---- Atualização da tela sem recriar tudo ----
// Em vez de trocar o HTML inteiro a cada atualização do servidor (o que fazia a página piscar, recarregava imagens e
// podia engolir um toque no meio), compara o HTML novo com o que já está na tela e muda só o que for diferente.
function syncAttrs(a,b){
  for(const at of [...a.attributes])if(!b.hasAttribute(at.name))a.removeAttribute(at.name);
  for(const at of b.attributes)if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value)}
function patchKids(a,b){
  const ac=[...a.childNodes],bc=[...b.childNodes],n=Math.max(ac.length,bc.length);
  for(let i=0;i<n;i++){const x=ac[i],y=bc[i];
    if(!y){a.removeChild(x);continue}
    if(!x){a.appendChild(y);continue}
    if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName){a.replaceChild(y,x);continue}
    if(x.nodeType!==1){if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue;continue}
    syncAttrs(x,y);patchKids(x,y);
    const t=x.nodeName,busy=x===document.activeElement;
    if(t==='INPUT'&&x.type==='checkbox')x.checked=y.hasAttribute('checked');
    else if(t==='INPUT'){if(!busy){const v=y.getAttribute('value')||'';if(x.value!==v)x.value=v}}
    else if(t==='TEXTAREA'){if(!busy&&x.value!==y.value)x.value=y.value}
    else if(t==='OPTION')x.selected=y.hasAttribute('selected')}}
(()=>{const d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  for(const id of ['app','pp']){const el=document.getElementById(id);if(!el)continue;
    Object.defineProperty(el,'innerHTML',{configurable:true,get(){return d.get.call(this)},
      set(h){if(!this.firstChild||!h){d.set.call(this,h);return}
        const t=document.createElement('template');t.innerHTML=h;
        if(window.__morphCheck)window.__lastRef=t.innerHTML;
        patchKids(this,t.content)}})}})();
const pl=id=>S.players.find(p=>p.id===id)||{};
const nm=id=>esc(pl(id).name||'?');
const av=(id,c='')=>{const p=pl(id);return `<span class="av ${c}" style="background:hsl(${HUES[p.color]??200} 55% 32%)">${EMOTES[p.emo]??'?'}</span>`};
// Personalização: fonte (classe f1 a f3) e card (atributo data-cs 1 a 3) do jogador; 0 = padrão
const FONTS=['Padrão','Neon','Pixel','Marcador'],CARDS=['Padrão','Galáxia','Chamas','Oceano','Flores','Floresta','Castelo','Carro','Halloween','Natal'];
const COLS=['Automática','Branco','Vermelho','Laranja','Amarelo','Verde','Ciano','Azul','Roxo','Rosa'],COLHEX=['','#ffffff','#ff6b6b','#ffa04a','#ffe066','#6ff0a0','#6fe8f5','#7fb0ff','#c9a0ff','#ff8ae0'];
// classes do nome do jogador: fonte (f1 a f3) e cor (k1 a k9)
const fc=id=>{const p=pl(id),f=p.fnt|0,k=p.col|0;return(f?'f'+f:'')+(k?(f?' ':'')+'k'+k:'')};
const csA=id=>{const d=(pl(id).cd|0);return d?` data-cs="${d}"`:''};
const hue=n=>[...n].reduce((a,c)=>a+c.charCodeAt(0),0)*37%360;
const bg=n=>{const h=hue(n);return `background:linear-gradient(135deg,hsl(${h} 45% 30%),hsl(${(h+50)%360} 50% 16%))`};
// Nome de localidade: o que vem entre parênteses vai para a linha de baixo, centralizado
const lname=n=>{const m=String(n).match(/^(.*?)\s*(\(.*\))\s*$/);return m&&m[1]?`${esc(m[1])}<em class="pn">${esc(m[2])}</em>`:esc(n)};
const pic=l=>l.img?`<img src="${esc(l.img)}" referrerpolicy="no-referrer" onerror="this.remove()">`:'';
const tile=(l,cls='',click='')=>`<div class="tile ${cls}" style="${bg(l.name)}" ${click}>${pic(l)}<span>${lname(l.name)}</span></div>`;
const start=()=>tx({type:'start'}),again=()=>tx({type:'again'}),setReady=v=>tx({type:'ready',ready:v});
const prof=(e,c,f,d,k)=>{const me=pl(S.you);tx({type:'profile',emo:e,color:c,fnt:f??(me.fnt|0),cd:d??(me.cd|0),col:k??(me.col|0)},1)};
// Janela "Seu visual": abre pelo lápis do card (ou pelo botão do perfil). As escolhas valem na hora.
const LK={open:false,sig:''};
function openLook(){if(!S||S.phase!=='lobby')return;LK.open=true;LK.sig='';drawLook()}
function closeLook(){LK.open=false;drawLook()}
function lookInner(){const me=pl(S.you),kc=(me.col|0)?' k'+(me.col|0):'';
  return `<button class="xbtn" aria-label="Fechar" title="Fechar (Esc)" onclick="closeLook()">×</button>
    <h3 style="margin:0 0 12px">Seu visual</h3>
    <div style="display:flex;justify-content:center;margin:0 0 18px"><span class="chip"${csA(S.you)}>${av(S.you)}<span class="cn"><b class="${fc(S.you)}">${esc(me.name)}</b></span></span></div>
    <label>Fonte</label><div class="opts">${FONTS.map((n,i)=>`<button class="opt ${(me.fnt|0)===i?'sel':''}" onclick="setLook('fnt',${i})"><span class="${i?'f'+i:''}${kc}">${esc(me.name||'Nome')}</span><small>${n}</small></button>`).join('')}</div>
    <label style="margin-top:16px">Cor do nome</label><div class="sws">${COLS.map((n,i)=>`<button class="sw ${i?'':'auto'} ${(me.col|0)===i?'sel':''}" ${i?`style="background:${COLHEX[i]}"`:''} title="${n}" aria-label="${n}" onclick="setLook('col',${i})">${i?'':'A'}</button>`).join('')}</div>
    <label style="margin-top:16px">Card</label><div class="opts">${CARDS.map((n,i)=>`<button class="opt ${(me.cd|0)===i?'sel':''}"${i?` data-cs="${i}"`:''} onclick="setLook('cd',${i})">${i?`<span>${n}</span>`:`<span>${n}</span><small>card azul</small>`}</button>`).join('')}</div>
    <div style="text-align:center"><button style="margin-top:18px" onclick="closeLook()">Pronto</button></div>`}
function drawLook(){const c=$('lk');if(!c)return;
  if(!LK.open||!S||screen==='home'||S.phase!=='lobby'){LK.open=false;LK.sig='';if(c.innerHTML)c.innerHTML='';return}
  const me=pl(S.you),sig=[me.name,me.emo,me.color,me.fnt|0,me.cd|0,me.col|0].join('|');
  const box=c.querySelector('.box');
  if(box){ // janela já aberta: só troca o conteúdo (recriar a janela repetiria a animação e a página piscaria)
    if(sig!==LK.sig){LK.sig=sig;box.innerHTML=lookInner()}
    return}
  LK.sig=sig;
  c.innerHTML=`<div class="modal" onclick="if(event.target===this)closeLook()"><div class="box" style="max-width:460px;text-align:left;max-height:88vh;overflow-y:auto">${lookInner()}</div></div>`}
function setLook(k,v){const me=pl(S.you);store.set(k,v);me[k]=v;drawLook();prof(me.emo,me.color,k==='fnt'?v:undefined,k==='cd'?v:undefined,k==='col'?v:undefined)}
const mark=id=>{marks[id]=((marks[id]||0)+1)%3;render()};
function togLoc(i){const n=S.all[i].name,s=new Set(S.selected);s.has(n)?s.delete(n):s.add(n);tx({type:'locs',selected:[...s]},1)}
const LBL={f:'',
  has:l=>!LBL.f||(l.labels||[]).includes(LBL.f),
  vis:()=>S.all.filter(LBL.has).map(l=>l.name),
  all:()=>[...new Set(S.all.flatMap(l=>l.labels||[]))].sort((a,b)=>a.localeCompare(b,'pt-BR')),
  set:i=>{LBL.f=i<0?'':(LBL.all()[i]||'');window._pickReset=1;render()},
  only:()=>tx({type:'locs',selected:LBL.vis()},1)};
const selAll=v=>{const vis=new Set(LBL.vis()),s=new Set(S.selected);vis.forEach(n=>v?s.add(n):s.delete(n));tx({type:'locs',selected:[...s]},1)};

// Anotações pessoais do Impostor - Locais: uma caixa de texto livre. Só o próprio jogador vê, e o texto é apagado a cada rodada.
let noteText=store.get('note3','');
const NT={open:false};
const saveNotes=()=>store.set('note3',noteText);
function openNotes(){if(!S)return;NT.open=true;drawNotes()}
function closeNotes(){NT.open=false;drawNotes()}
function drawNotes(){const c=$('nt');if(!c)return;
  if(!NT.open||!S||screen==='home'){c.innerHTML='';return}
  if(c.querySelector('textarea'))return; // já está aberta
  c.innerHTML=`<div class="modal" onclick="if(event.target===this)closeNotes()"><div class="bubw"><div class="bub">
    <div class="pph"><b style="font-family:var(--disp);color:var(--acc)">Anotações</b><button class="cx mini" onclick="closeNotes()">Fechar</button></div>
    <p style="color:var(--mut);margin:0 0 10px;font-size:.88rem">Só você vê. Escreva o que quiser: quem perguntou o quê, respostas, suspeitas… O texto é apagado a cada rodada.</p>
    <textarea id="nt-text" class="notebox" placeholder="Suas anotações…" oninput="noteText=this.value;saveNotes()">${esc(noteText)}</textarea></div></div></div>`;
  const t=$('nt-text');if(t&&window.matchMedia('(pointer:fine)').matches)t.focus()}

// Ranking da sala (na tela final mostra +N em quem pontuou na partida)
function rankCard(){if(!S||!S.rank||!S.rank.length)return '';let pos=0,last=null;const g=(S.phase==='end'&&S.gain)?S.gain:{};
  const rows=S.rank.map((x,i)=>{if(x.pts!==last){pos=i+1;last=x.pts}return `<li class="rk"><span class="rp">${pos}º</span><span class="nm">${av(x.id)}<b class="${fc(x.id)}">${nm(x.id)}</b></span><span class="rpt">${x.pts} ponto${Math.abs(x.pts)===1?'':'s'}${g[x.id]?`<span class="gn${g[x.id]<0?' neg':''}">${g[x.id]>0?'+':''}${g[x.id]}</span>`:''}</span></li>`}).join('');
  return `<div class="card"><label>Ranking da sala (${S.rounds} partida${S.rounds>1?'s':''})</label><ul>${rows}</ul></div>`}

// Convite
const inviteUrl=()=>location.origin+'/?sala='+S.code+'&jogo='+(S.gid||'locais');
async function copyInvite(){const u=inviteUrl();
  try{await navigator.clipboard.writeText(u)}catch(e){const a=document.createElement('textarea');a.value=u;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e2){}a.remove()}
  toast('Link copiado!')}
const inviteBtn=()=>`<button class="sec" style="margin-top:14px" onclick="copyInvite()">Copiar convite</button>`;

// Sair da sala
function askLeave(fn){window._lv=fn;
  $('ntc').innerHTML=`<div class="modal"><div class="box"><h3 style="margin:0 0 10px">Sair da sala?</h3><p style="margin:0 0 18px;color:#cfd8f5">${S&&S.phase!=='lobby'?'A partida continua sem você e você não poderá voltar a ela.':'Você deixará a sala de espera.'}</p><div class="row"><button class="cx" onclick="closeNote()">Ficar</button><button onclick="doLeave()">Sair</button></div></div></div>`}
function doLeave(){const f=window._lv;closeNote();if(f)f()}
function leaveRoom(){if(S){tx({type:'leave'});S=null}store.set('inroom',false);err='';noteText='';saveNotes();NT.open=false;drawNotes();$('fx').innerHTML='';if(typeof closeConfirm==='function')closeConfirm()}
function goHome(){if(S)return askLeave(()=>{leaveRoom();screen='home';mode='menu';render()});screen='home';mode='menu';invCode='';err='';render()}
function back(){if(!S&&screen==='settings'){screen='profile';AUTH.draft=null;AUTH.dirty=false;render();return}if(S)return askLeave(()=>{leaveRoom();mode='menu';err='';render()});if(mode==='join')mode='menu';else screen='home';err='';invCode='';render()}

// Painel de jogadores: reserva uma faixa à direita (telas grandes) para não encostar no conteúdo
const ppIsOpen=()=>ppOpen===null?(!!S&&S.you===S.host&&window.matchMedia('(min-width:1360px)').matches):ppOpen;
function togPanel(){ppOpen=!ppIsOpen();drawPanel()}
function drawPanel(){const el=$('pp');if(!el)return;
  const show=!!S&&screen!=='home',open=show&&ppIsOpen();
  document.body.classList.toggle('pp-open',open);
  if(!show){el.innerHTML='';return}
  const lead=S.you===S.host;
  el.innerHTML=open?`<div class="pp"><div class="pph"><b>Jogadores (${S.players.length})</b><button class="mini" onclick="togPanel()">Minimizar</button></div>
    <ul class="ppl">${S.players.map(p=>`<li><span class="nm">${av(p.id)}<span class="cn"><b class="${fc(p.id)}" title="${esc(p.name)}">${esc(p.name)}</b>${tags(p)}</span></span>${lead&&p.id!==S.you?`<button class="bad" onclick="askKick(${p.id})">Remover</button>`:''}</li>`).join('')}</ul>
    <div style="text-align:center">${inviteBtn()}</div></div>`
   :`<button class="fab" onclick="togPanel()">Jogadores (${S.players.length})</button>`}
function askKick(id){const p=pl(id);
  $('ntc').innerHTML=`<div class="modal"><div class="box"><h3 style="margin:0 0 10px">Remover jogador?</h3><p style="margin:0 0 18px;color:#cfd8f5">${esc(p.name||'?')} será removido(a) da sala.</p><div class="row"><button class="cx" onclick="closeNote()">Cancelar</button><button onclick="doKick(${id})">Remover</button></div></div></div>`}
function doKick(id){tx({type:'kick',target:id});closeNote()}

function pick(id){game=id;screen='game';mode='menu';err='';render()}
const tags=p=>(p.id===S.host||p.id===S.you||p.away)?`<span class="sb">${p.id===S.host?'<span class="tag">líder</span>':''}${p.id===S.you?'<small>(você)</small>':''}${p.away?'<span class="tag off2">offline</span>':''}</span>`:'';
const PEN='<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/></svg>';
const players=()=>`<div class="chips">${S.players.map(p=>`<span class="chip"${csA(p.id)}>${av(p.id)}<span class="cn"><b class="${fc(p.id)}">${esc(p.name)}</b>${tags(p)}</span>${p.id===S.you&&S.phase==='lobby'?`<button class="pen" title="Editar fonte e card" aria-label="Editar fonte e card" onclick="openLook()">${PEN}</button>`:''}</span>`).join('')}</div>`;
function profileCard(){const me=pl(S.you),taken=new Set(S.players.filter(p=>p.id!==S.you).map(p=>p.emo));
  return `<div class="card"><label>Seu ícone</label><div class="emos">${EMOTES.map((e,i)=>`<button class="eb ${me.emo===i?'sel':''}" ${taken.has(i)?'disabled':''} onclick="prof(${i},${me.color})">${e}</button>`).join('')}</div>
  <label style="margin-top:16px">Sua cor</label><div class="cols">${HUES.map((h,i)=>`<button class="cb ${me.color===i?'sel':''}" style="background:hsl(${h} 55% 40%)" onclick="prof(${me.emo},${i})"></button>`).join('')}</div>
  <button class="sec" style="width:100%;margin-top:16px" onclick="openLook()">Editar visual do nome</button></div>`}

const WL={l:null,
  async on(){try{if(!('wakeLock' in navigator)||WL.l||document.hidden)return;WL.l=await navigator.wakeLock.request('screen');WL.l.addEventListener('release',()=>{WL.l=null})}catch(e){WL.l=null}},
  off(){try{if(WL.l)WL.l.release()}catch(e){}WL.l=null}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S&&screen!=='home')WL.on()});
let rDefer=0,rTimer;
function render(){
  const a=document.activeElement;
  if(a&&a.id==='vsel'&&rDefer<6){rDefer++;clearTimeout(rTimer);rTimer=setTimeout(render,500);return}
  rDefer=0;
  const y=window.scrollY,k0=lastKey,pk=document.querySelector('.pick');let pt=pk?pk.scrollTop:0;if(window._pickReset){pt=0;window._pickReset=0}
  try{renderMain()}catch(e){console.error(e);notify('Erro ao montar a tela: '+e.message+' ['+String(e.stack||'').split('\n')[1]+']')}
  document.body.classList.toggle('vs-open',!!document.querySelector('.vside'));
  drawLook();
  if(S&&screen!=='home')WL.on();else WL.off();
  if(lastKey===k0&&Math.abs(window.scrollY-y)>2)window.scrollTo(0,y);
  const pk2=document.querySelector('.pick');if(pk2&&lastKey===k0)pk2.scrollTop=pt;
}
function renderMain(){
  const G=GAMES.find(g=>g.id===game),A=$('app');
  const E=err?`<p class="err">${esc(err)}</p>`:'';let h='';
  const inr=!!S&&screen!=='home';
  drawPanel();document.body.classList.toggle('inroom',inr);
  document.body.classList.toggle('home',screen==='home');
  $('bk').classList.toggle('hide',screen==='home');$('hm').classList.toggle('hide',screen==='home');$('lg').style.visibility=screen==='home'?'hidden':'visible';
  A.classList.toggle('stack',!!(S&&S.game));A.classList.toggle('fw',!!(S&&!S.game&&S.phase!=='lobby'));
  if(!ready){A.innerHTML='<div class="splash"><div class="spin"></div><p>Conectando ao servidor…</p><small id="wk" style="max-width:340px;text-align:center"></small></div>';return}
  if(AUTH_SCREENS.includes(screen)&&!S){A.innerHTML=authHtml();trans('auth|'+screen);return}
  if(screen==='home'){
    h=`${accountBar()}<div class="hero"><div class="eyebrow">Bem-vindo à</div><div class="title">Resenha<br>da Madrugada</div><p class="sub">Escolha um jogo e marcha!</p></div>${E}
    <div class="games">${GAMES.map((g,i)=>{const im=g.img;return `<div class="gc ${g.ok?'':'off'}" ${g.ok?`onclick="pick('${g.id}')"`:''}><div class="art" style="${bg(g.name)}">${im?`<img src="${esc(im)}" referrerpolicy="no-referrer" onerror="this.remove()">`:''}<i>${g.short}</i></div><span class="no">0${i+1}</span><button class="ibtn" title="Sobre o jogo" onclick="event.stopPropagation();showInfo('${g.id}',false)">i</button>${g.ok?'':'<span class="ribbon">Em breve</span>'}<div class="info"><b>${g.name}</b><span>${g.tag}</span></div></div>`}).join('')}</div>
    <div class="beta">Versão de testes: pode conter falhas.</div>`;
    A.innerHTML=h;trans('home');return;
  }
  if(S&&S.game==='pika'){pikaRender('');return}
  if(S&&S.game==='perguntas'){perguntasRender();return}
  if(S&&S.game==='cidade'){cidadeRender();return}
  if(!S){
    h=`<div class="split"><div class="art-side"><div class="eyebrow">Resenha da Madrugada</div><div class="title">${G.name}</div><p class="sub">${G.tag}</p></div>`;
    if(mode==='menu')h+=`<div class="card ctr"><label>Seu nome</label><input id="name" class="ctr" maxlength="30" placeholder="Como você quer ser chamado?" value="${esc(curName())}" oninput="nameDraft=this.value" onkeydown="if(event.key==='Enter')menu('create')">${E}
      <div class="choices"><button onclick="menu('create')">Criar sala</button><button class="sec" onclick="menu('join')">Entrar em sala</button></div></div></div>`;
    else h+=`<div class="card ctr"><label>Seu nome</label><input id="name" class="ctr" maxlength="30" placeholder="Como você quer ser chamado?" value="${esc(curName())}" oninput="nameDraft=this.value" style="margin-bottom:16px">
      <label>Código da sala</label><input id="code" class="codein" maxlength="4" placeholder="ABCD" value="${esc(invCode)}" onkeydown="if(event.key==='Enter')join()">${E}
      <div class="row"><button onclick="join()">Entrar</button></div></div></div>`;
  }else if(S.phase==='lobby'){
    const host=S.you===S.host,sel=new Set(S.selected),lbs=LBL.all();if(LBL.f&&!lbs.includes(LBL.f))LBL.f='';
    h=`${E}<div class="hero rel" style="padding:0 0 10px"><div class="eyebrow">Sala de espera</div><h1>${G.name}</h1>${infoBtn(game)}</div>
    <div class="split" style="align-items:start"><div><div class="card ctr"><label>Código da sala</label><div class="code">${S.code}</div><p class="mut">Compartilhe o código com os amigos</p>${inviteBtn()}${players()}</div>${rankCard()}${profileCard()}
    ${host?'<button style="width:100%;padding:18px;font-size:1.1rem" onclick="start()">Iniciar partida</button>':'<div class="card ctr"><div class="spin" style="margin:0 auto 14px"></div><p class="mut" style="margin:0">Aguardando o líder iniciar…</p></div>'}</div>
        <div><div class="card"><label>Localidades da partida (${sel.size} de ${S.all.length})</label>
    ${lbs.length?`<div class="lbls"><button class="lb ${LBL.f?'':'sel'}" onclick="LBL.set(-1)">Todas</button>${lbs.map((b,i)=>`<button class="lb ${LBL.f===b?'sel':''}" onclick="LBL.set(${i})">${esc(b)} (${S.all.filter(l=>(l.labels||[]).includes(b)).length})</button>`).join('')}</div>`:''}
    ${host?`<div class="row"><button class="sec" onclick="selAll(true)">${LBL.f?'Marcar estas':'Marcar todas'}</button><button class="sec" onclick="selAll(false)">${LBL.f?'Desmarcar estas':'Desmarcar todas'}</button></div>${LBL.f?`<button style="width:100%;margin:0 0 12px" onclick="LBL.only()">Jogar só com “${esc(LBL.f)}”</button>`:''}`:'<p style="color:var(--mut);font-size:.85rem;margin:0 0 12px">Só o líder escolhe as localidades.</p>'}
    <div class="pick">${S.all.map((l,i)=>LBL.has(l)?tile(l,sel.has(l.name)?'on':'off',host?`onclick="togLoc(${i})" style="cursor:pointer"`:''):'').join('')}</div></div></div></div>`;
  }else{
    const R=S.role,me=pl(S.you),host=S.you===S.host;
    h=`<div class="top"><h1>Partida em andamento</h1><div class="me">${av(S.you)}<div><b>${esc(me.name)}</b><small>Sala ${S.code}</small></div></div></div>${E}`;
    if(S.phase==='vote'||S.phase==='end'){
      if(S.phase==='end'){const r=S.result;
        h+=`<div class="card ctr resultcard ${r.caught?'win':'lose'}"><label>Resultado da partida</label><div class="rtitle">${r.caught?'Os jogadores venceram!':'O espião venceu!'}</div><p>Mais votado: <b>${r.top.map(esc).join(' e ')}</b> (${r.max} voto${r.max>1?'s':''}). O espião era <b>${esc(r.spy)}</b>.</p><p>Local: <b>${lname(r.loc.name)}</b></p>${r.early?'<p class="mut">Votação encerrada por maioria.</p>':''}
        ${host?`<div class="row" style="max-width:560px;margin:12px auto 0"><button class="sec" onclick="pikaAsk('Voltar para a sala de espera? Todos os jogadores voltam junto e dá para trocar as localidades.',{type:'lobby'})">Nova partida</button><button onclick="pikaAsk('Jogar novamente com os mesmos jogadores? Novo local e novo espião serão sorteados.',{type:'again'})">Jogar novamente</button></div>`:'<p class="mut">Aguardando o líder…</p>'}</div>${rankCard()}`;
      }else h+=`<div class="card ctr"><label>Votação</label><h2>Quem é o espião?</h2><p class="mut" style="margin:0">Declare sua intenção para a turma ver e depois vote.${S.voted.includes(S.you)?' Você já votou.':''}</p></div>`;
      h+=board(S,S.players.map(p=>({id:p.id,name:p.name})),S.phase==='end');
    }else{
      const L=R.loc,rdy=S.ready,mine=rdy.includes(S.you);
      const card=R.spy?`<div class="loc" style="background:linear-gradient(135deg,#4a1616,#12151c)">${pic({img:R.spyImg})}<div class="ov"><small>Sua função</small><h2>Espião</h2><p>Descubra o local sem ser pego.</p></div></div>`
        :`<div class="loc" style="${bg(L.name)}">${pic(L)}<div class="ov"><small>Local</small><h2>${lname(L.name)}</h2><p>Lembre-se: não revele o local! Pergunte e responda com cuidado.</p></div></div>`;
      h+=`<div class="game"><div><h3>Seu cartão</h3>${card}
        <div class="card"><label>Prontos para votar</label><b style="font-family:var(--disp);font-size:1.5rem;color:var(--acc)">${rdy.length}/${S.players.length}</b>
        <button style="width:100%;margin:12px 0 10px" class="${mine?'cx':''}" onclick="setReady(${!mine})">${mine?'Cancelar':'Pronto para votar'}</button>
        <button class="sec" style="width:100%;margin-bottom:12px" onclick="openNotes()">Anotações</button>
        <small style="display:block;margin-bottom:8px">Começou perguntando: <b style="color:var(--txt)">${nm(S.starter)}</b></small>
        <ul class="rl">${S.players.map(p=>`<li><span class="nm">${av(p.id)}${esc(p.name)}${p.away?'<span class="tag off2">offline</span>':''}</span>${rdy.includes(p.id)?'<span class="tag">pronto</span>':''}</li>`).join('')}</ul></div></div><div>`;
      if(!R.spy)h+=`<h3>Quadro de suspeitos</h3><p style="color:var(--mut);margin:0 0 14px">Clique em um jogador para alternar: <b style="color:var(--txt)">Na dúvida</b> → <b style="color:#ef4444">Suspeito</b> → <b style="color:#3ddc97">Inocente</b></p>
        <div class="sus">${S.players.map(p=>{const self=p.id===S.you,m=marks[p.id]||0;return self?`<div class="pc self">${av(p.id)}<div class="cn"><b>${esc(p.name)}</b><small>(você)</small></div></div>`:`<div class="pc s${m}" onclick="mark(${p.id})">${av(p.id)}<div class="cn"><b>${esc(p.name)}</b><small>${['Na dúvida','Suspeito','Inocente'][m]}</small></div></div>`}).join('')}</div>
        <hr style="border:0;border-top:2px solid var(--line);margin:28px 0">`;
      else h+=`<h3>Anotações</h3><p style="color:var(--mut);margin:0 0 14px">Escreva o que quiser sobre as perguntas e as respostas. Só você vê.</p><button class="sec" style="width:100%" onclick="openNotes()">Abrir anotações</button><hr style="border:0;border-top:2px solid var(--line);margin:28px 0">`;
      h+=`<h3>Possíveis localidades <small style="font-weight:400">(toque para riscar)</small></h3><div class="grid6">${R.locs.map((l,i)=>tile(l,struck.has(i)?'x':'',`onclick="strike(${i})"`)).join('')}</div></div></div>`;
    }
  }
  A.innerHTML=h;trans(S?S.phase:mode);
}
// Servidor no plano grátis dorme e demora até ~1 minuto para acordar: depois de 5 s explicamos o motivo
setInterval(()=>{const e=$('wk');if(!e||ready)return;const s=Math.floor((Date.now()-T0)/1000);e.textContent=s>=5?'O servidor estava dormindo e pode levar até 1 minuto para acordar. Aguarde… ('+s+'s)':''},1000);
// Nome da partida: quem está logado já vê o nome de exibição preenchido (e pode trocar só para esta partida)
let nameDraft=null;
const defName=()=>(AUTH.user&&AUTH.user.name)||store.get('name','');
const curName=()=>nameDraft!==null?nameDraft:defName();
function nameVal(){const v=($('name')?$('name').value:curName()).trim();store.set('name',v);return v}
function menu(m){
  if(m==='join'){nameVal();mode='join';err='';render();const f=curName()?$('code'):$('name');if(f)f.focus();return}
  const n=nameVal();if(!n){err='Digite seu nome para continuar.';return render()}err='';tx({type:'create',name:n,game,token:TOKEN,fnt:store.get('fnt',0),cd:store.get('cd',0),col:store.get('col',0)})}
function join(){const n=nameVal();invCode=$('code').value;if(!n){err='Digite seu nome para continuar.';return render()}err='';tx({type:'join',name:n,code:invCode,game,token:TOKEN,fnt:store.get('fnt',0),cd:store.get('cd',0),col:store.get('col',0)})}
function strike(i){struck.has(i)?struck.delete(i):struck.add(i);render()}
render();connect();