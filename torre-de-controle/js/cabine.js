(function(){
  const QUEUE = [
    {sm:'SM-9845',geo:{origin:[-23.55,-46.63],dest:[-12.97,-38.51],pos:[-16.5,-39.2]},cli:'BOMBRIL',issue:'Parado há 47min sem comunicação',det:'Última posição: BR-101 km 234 · motorista não responde',ctx:[['ETA','+1h12 atraso'],['ROTA','SP→Salvador'],['MOTORISTA','J. Silva']],
      conn:{sinal:['bad','sem sinal','📵'],gps:['warn','12min','📡'],ign:['warn','desligada','🔑'],bat:['ok','78%','🔋']},
      mapPos:{x:60,y:55,label:'13:00 · BR-101 km 234'},
      mot:{n:'João Silva',f:'(11) 98472-1133'},dest:{n:'CD Bombril Salvador',f:'(71) 3045-9900'},
      trip:[['Saída','08:12 · CD São Paulo'],['Distância restante','892 km'],['Combustível','42%']],
      tl:[['12:58','Velocidade reduzida a 0 km/h','alert'],['13:47','Sem update de telemetria há 47min','alert'],['10:22','Pedágio Régis Bittencourt','ok']],
      actions:[['Acionar central','Disparar contato via 0800 + SMS automático','primary'],['Justificar parada','Marcar como pausa autorizada · 30min',null],['Escalar gestor','Notificar supervisor da rota',null]],
      actMap:{2:'mot'}},
    {sm:'SM-9712',geo:{origin:[-22.91,-47.06],dest:[-22.91,-43.20],pos:[-22.85,-45.20]},cli:'KELLUX',issue:'Desvio de rota detectado · 8km fora do plano',det:'Possível rota alternativa por congestionamento',ctx:[['ETA','no limite'],['ROTA','Campinas→RJ'],['MOTORISTA','M. Souza']],
      conn:{sinal:['ok','4G forte','📶'],gps:['ok','agora','📡'],ign:['ok','ligada','🔑'],bat:['ok','91%','🔋']},
      mapPos:{x:45,y:60,label:'14:02 · Dutra km 178'},
      mot:{n:'Marcos Souza',f:'(19) 99721-4408'},dest:{n:'Kellux RJ Centro',f:'(21) 2233-7700'},
      trip:[['Posição','Dutra km 178'],['Restante','246 km'],['Desvio','+8km do plano']],
      tl:[['14:02','Saiu da rota planejada','alert'],['13:18','Tráfego intenso reportado','ok'],['11:45','Pedágio Jacareí','ok']],
      actions:[['Aceitar desvio','Validar rota alternativa e seguir','primary'],['Contatar motorista','Confirmar motivo do desvio',null],['Forçar retorno','Solicitar volta à rota original',null]],
      actMap:{2:'mot'}},
    {sm:'SM-9633',geo:{origin:[-23.50,-47.46],dest:[-23.96,-46.33],pos:[-23.78,-46.50]},cli:'FENZA',issue:'Atraso previsto > 2h no destino',det:'Trânsito intenso no acesso ao porto de Santos',ctx:[['ETA','+2h08 atraso'],['ROTA','Sorocaba→Santos'],['MOTORISTA','R. Almeida']],
      conn:{sinal:['ok','3G','📶'],gps:['ok','agora','📡'],ign:['ok','ligada','🔑'],bat:['warn','34%','🔋']},
      mapPos:{x:70,y:75,label:'13:55 · Anchieta km 56'},
      mot:{n:'Ricardo Almeida',f:'(15) 98821-7765'},dest:{n:'Terminal Santos Brasil',f:'(13) 3221-4400'},
      trip:[['Posição','Anchieta km 56'],['Restante','38 km'],['Janela porto','até 17:00']],
      tl:[['13:55','ETA recalculado +2h08','alert'],['13:30','Congestionamento Anchieta','alert'],['11:00','Saída registrada','ok']],
      actions:[['Notificar cliente','Enviar nova ETA + justificativa OTIF','primary'],['Reagendar janela','Reservar novo slot no porto',null],['Manter monitoramento','Sem ação · acompanhar evolução',null]],
      actMap:{1:'dest_or_msg'}},
    {sm:'SM-9588',geo:{origin:[-23.51,-46.78],dest:[-23.42,-46.46],pos:[-23.50,-46.65]},cli:'BOMBRIL',issue:'Temperatura fora do padrão · carga refrigerada',det:'Câmara a 8°C · limite 4°C há 12min',ctx:[['ETA','3h restantes'],['CARGA','Cosméticos'],['MOTORISTA','C. Pereira']],
      conn:{sinal:['ok','4G','📶'],gps:['ok','agora','📡'],ign:['ok','ligada','🔑'],bat:['ok','82%','🔋']},
      mapPos:{x:35,y:40,label:'13:48 · Castello km 28'},
      mot:{n:'Carlos Pereira',f:'(11) 99334-5521'},dest:{n:'CD Bombril Guarulhos',f:'(11) 2412-8800'},
      trip:[['Posição','Castello km 28'],['Câmara','8°C ↑ (limite 4°C)'],['Tempo fora','12 min']],
      tl:[['13:48','Temperatura ultrapassou limite','alert'],['13:36','Alerta preditivo gerado','alert'],['12:00','Carga lacrada e iniciada','ok']],
      actions:[['Acionar manutenção','Disparar protocolo de emergência refrigeração','primary'],['Contatar motorista','Verificar painel da câmara',null],['Avaliar perda','Iniciar análise de risco da carga',null]],
      actMap:{2:'mot'}}
  ];
  const doneActs={}; // {smIdx: Set([0,2])}
  let idx=0,start=0,done=0;
  window.cabineOpen=function(){
    idx=0;done=0;start=Date.now();
    Object.keys(doneActs).forEach(k=>delete doneActs[k]);
    document.getElementById('cabine-overlay').classList.add('open');
    render();
  };
  window.cabineClose=function(){
    document.getElementById('cabine-overlay').classList.remove('open');
    document.removeEventListener('keydown',keys);
    if(cbMap){cbMap.remove();cbMap=null}
  };
  function render(){
    const it=QUEUE[idx%QUEUE.length];
    const total=parseInt(document.getElementById('cabine-count').textContent)||23;
    document.getElementById('cb-progress').textContent=(done+1)+'/'+total;
    const elapsed=(Date.now()-start)/60000;
    const rate=elapsed>0.05?(done/elapsed).toFixed(1):'—';
    const rEl=document.getElementById('cb-rate');
    rEl.textContent=rate==='—'?'—':rate+'/min';
    rEl.className=parseFloat(rate)>=7?'cb-rate-good':'cb-rate-bad';
    const ctxHtml=it.ctx.map(c=>`<div><span class="cb-ctx-label">${c[0]}</span><span class="cb-ctx-value">${c[1]}</span></div>`).join('');
    const smKey=idx%QUEUE.length;
    const dset=doneActs[smKey]||(doneActs[smKey]=new Set());
    const actHtml=it.actions.map((a,i)=>{
      const isPrim=a[2]==='primary'&&!dset.has(i);
      const isDone=dset.has(i);
      const cls=isDone?'done':(isPrim?'primary':'');
      return `<button class="cb-action ${cls}" onclick="cabineAct(${i})"><span class="cb-key">${i+1}</span><span class="cb-action-body"><span class="cb-action-title">${a[0]}</span><span class="cb-action-desc">${a[1]}</span></span></button>`;
    }).join('');
    document.getElementById('cb-card-host').innerHTML=`
      <div class="cb-card-top"><div><span class="cb-sm-id">${it.sm}</span><div class="cb-client">${it.cli}</div></div><span class="cb-severity">CRÍTICA</span></div>
      <div class="cb-issue"><div class="cb-issue-label">⚠ Problema</div><div class="cb-issue-text">${it.issue}</div><div class="cb-issue-detail">${it.det}</div></div>
      <div class="cb-context">${ctxHtml}</div>
      <div class="cb-actions"><div class="cb-actions-label">Tratativa</div>${actHtml}</div>`;
    const c=it.conn;
    const connHtml=[
      ['sinal','Sinal'],['gps','GPS'],['ign','Ignição'],['bat','Bateria']
    ].map(([k,lbl])=>{const v=c[k];return `<div class="cb-conn-chip ${v[0]}"><div class="cb-conn-icon">${v[2]}</div><div class="cb-conn-label">${lbl}</div><div class="cb-conn-value">${v[1]}</div></div>`}).join('');
    const motOk=c.sinal[0]!=='bad';
    const tripCells=it.trip.map(t=>`<div class="cb-trip-cell"><span class="l">${t[0]}</span><span class="v">${t[1]}</span></div>`).join('');
    document.getElementById('cb-aside-host').innerHTML=`
      <div class="cb-aside-section">
        <div class="cb-aside-label">📡 Conectividade do veículo</div>
        <div class="cb-conn">${connHtml}</div>
      </div>
      <div class="cb-aside-section map">
        <div id="cb-map"></div>
        <div class="cb-map-stamp">📍 ${it.mapPos.label}</div>
      </div>
      <div class="cb-aside-section">
        <div class="cb-aside-label">📍 Viagem</div>
        <div class="cb-trip-grid">${tripCells}</div>
      </div>
      <div class="cb-aside-section">
        <div class="cb-aside-label">⚡ Comunicação rápida</div>
        <div class="cb-quick">
          <button class="cb-qbtn call" onclick="cabinePrev('mot')" ${motOk?'':'disabled'}><div class="cb-qbtn-icon">📞</div><div class="cb-qbtn-label">Ligar motorista</div><div class="cb-qbtn-name">${it.mot.n.split(' ')[0]}</div><div class="cb-qbtn-key">M</div></button>
          <button class="cb-qbtn call" onclick="cabinePrev('dest')"><div class="cb-qbtn-icon">📞</div><div class="cb-qbtn-label">Ligar destino</div><div class="cb-qbtn-name">${it.dest.n.split(' ').slice(0,2).join(' ')}</div><div class="cb-qbtn-key">D</div></button>
          <button class="cb-qbtn msg" onclick="cabinePrev('msg')"><div class="cb-qbtn-icon">💬</div><div class="cb-qbtn-label">WhatsApp</div><div class="cb-qbtn-name">Template</div><div class="cb-qbtn-key">W</div></button>
        </div>
        <div id="cb-preview-host"></div>
      </div>`;
    setTimeout(()=>renderMap(it),50);
    document.addEventListener('keydown',keys);
  }
  window.cabineAct=function(i){done++;toast('✓ Tratativa registrada');setTimeout(next,350)};
  window.cabineSkip=function(){next()};
  window.cabinePrev=function(t){
    const it=QUEUE[idx%QUEUE.length];
    const host=document.getElementById('cb-preview-host');
    if(!host)return;
    let html='';
    if(t==='mot'||t==='dest'){
      const who=t==='mot'?it.mot:it.dest;
      const role=t==='mot'?'Motorista':'Destinatário';
      html=`<div class="cb-preview">
        <div class="cb-prev-title">📞 Confirmar ligação</div>
        <div class="cb-prev-row"><span>Para</span><b>${who.n}</b></div>
        <div class="cb-prev-row"><span>Papel</span><b>${role}</b></div>
        <div class="cb-prev-row"><span>Telefone</span><b>${who.f}</b></div>
        <div class="cb-prev-row"><span>SM</span><b>${it.sm}</b></div>
        <div class="cb-prev-row"><span>Registro</span><b>Timeline da SM</b></div>
        <div class="cb-prev-actions">
          <button class="cb-prev-confirm" onclick="cabineExec('${t}')">Ligar agora</button>
          <button class="cb-prev-cancel" onclick="cabinePrevClose()">Cancelar</button>
        </div>
      </div>`;
    }else if(t==='msg'){
      const tpl=msgTemplate(it);
      html=`<div class="cb-preview">
        <div class="cb-prev-title">💬 WhatsApp · pré-visualização</div>
        <div class="cb-prev-row"><span>Para</span><b>${it.mot.n}</b></div>
        <div class="cb-prev-row"><span>Número</span><b>${it.mot.f}</b></div>
        <div class="cb-prev-row"><span>Template</span><b>${tpl.name}</b></div>
        <div class="cb-prev-msg">${tpl.body}</div>
        <div class="cb-prev-actions">
          <button class="cb-prev-confirm msg" onclick="cabineExec('msg')">Enviar mensagem</button>
          <button class="cb-prev-cancel" onclick="cabinePrevClose()">Cancelar</button>
        </div>
      </div>`;
    }
    host.innerHTML=html;
  };
  window.cabinePrevClose=function(){const h=document.getElementById('cb-preview-host');if(h)h.innerHTML=''};
  window.cabineExec=function(t){
    const it=QUEUE[idx%QUEUE.length];
    const smKey=idx%QUEUE.length;
    const dset=doneActs[smKey]||(doneActs[smKey]=new Set());
    if(t==='mot'){toast('📞 Ligando para '+it.mot.n+' · '+it.mot.f)}
    else if(t==='dest'){toast('📞 Ligando para '+it.dest.n+' · '+it.dest.f)}
    else if(t==='msg'){toast('💬 WhatsApp enviado para '+it.mot.n)}
    // marca tratativa correspondente como concluída
    if(it.actMap){
      Object.entries(it.actMap).forEach(([actIdx,who])=>{
        if(t==='mot'&&who==='mot')dset.add(parseInt(actIdx));
        if(t==='dest'&&(who==='dest'||who==='dest_or_msg'))dset.add(parseInt(actIdx));
        if(t==='msg'&&(who==='msg'||who==='dest_or_msg'))dset.add(parseInt(actIdx));
      });
    }
    cabinePrevClose();
    render();
  };
  function msgTemplate(it){
    const first=it.mot.n.split(' ')[0];
    if(it.issue.includes('Parado'))return{name:'Verificação de parada',body:`Olá ${first}, identificamos que o veículo está parado há mais de 40 minutos. Tudo bem? Pode confirmar a situação? — Torre de Controle · ${it.cli}`};
    if(it.issue.includes('Desvio'))return{name:'Confirmação de desvio',body:`Olá ${first}, identificamos um desvio da rota planejada (${it.sm}). Pode confirmar o motivo? — Torre de Controle`};
    if(it.issue.includes('Atraso'))return{name:'Aviso de atraso',body:`Olá ${first}, ETA atual indica atraso significativo no destino. Pode confirmar previsão atualizada? — Torre · ${it.cli}`};
    if(it.issue.includes('Temperatura'))return{name:'Alerta de temperatura',body:`Olá ${first}, urgente: temperatura da câmara fora do limite. Por favor, verifique o painel e confirme. — Torre de Controle`};
    return{name:'Contato padrão',body:`Olá ${first}, precisamos de uma atualização sobre a SM ${it.sm}. — Torre de Controle`};
  }
  window.toast=function toast(msg){
    const t=document.getElementById('cb-toast');
    if(!t) return;
    t.textContent=msg;t.classList.add('show');
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2000);
  };
  let cbMap=null,cbLayers=[];
  function next(){idx++;render()}
  function renderMap(it){
    const el=document.getElementById('cb-map');
    if(!el||!window.L||!it.geo)return;
    if(cbMap){cbMap.remove();cbMap=null}
    cbMap=L.map(el,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:18}).addTo(cbMap);
    const g=it.geo;
    // origem (azul)
    L.circle(g.origin,{radius:30000,color:'#3B82F6',weight:2,fillColor:'#3B82F6',fillOpacity:.12}).addTo(cbMap);
    L.circleMarker(g.origin,{radius:5,color:'#fff',weight:2,fillColor:'#3B82F6',fillOpacity:1}).addTo(cbMap).bindTooltip('Origem',{permanent:false});
    // destino (verde)
    L.circle(g.dest,{radius:30000,color:'#10B981',weight:2,fillColor:'#10B981',fillOpacity:.12}).addTo(cbMap);
    L.circleMarker(g.dest,{radius:5,color:'#fff',weight:2,fillColor:'#10B981',fillOpacity:1}).addTo(cbMap).bindTooltip('Destino');
    // rota linha tracejada
    L.polyline([g.origin,g.pos,g.dest],{color:'#94A3B8',weight:2,dashArray:'4,5',opacity:.7}).addTo(cbMap);
    // posição atual (vermelho pulsante)
    L.circle(g.pos,{radius:18000,color:'#FF2D55',weight:2,fillColor:'#FF2D55',fillOpacity:.18}).addTo(cbMap);
    L.circleMarker(g.pos,{radius:7,color:'#fff',weight:2.5,fillColor:'#FF2D55',fillOpacity:1}).addTo(cbMap);
    cbMap.fitBounds([g.origin,g.dest],{padding:[18,18]});
    setTimeout(()=>cbMap&&cbMap.invalidateSize(),100);
  }
  function keys(e){
    if(e.key==='Escape'){
      const h=document.getElementById('cb-preview-host');
      if(h&&h.innerHTML){cabinePrevClose();return}
      cabineClose();return;
    }
    if(e.key==='1'){cabineAct(0)}
    else if(e.key==='2'){cabineAct(1)}
    else if(e.key==='3'){cabineAct(2)}
    else if(e.key==='ArrowRight'){cabineSkip()}
    else if(e.key==='m'||e.key==='M'){cabinePrev('mot')}
    else if(e.key==='d'||e.key==='D'){cabinePrev('dest')}
    else if(e.key==='w'||e.key==='W'){cabinePrev('msg')}
  }
})();

(function(){
  /* ═══ CABINE v2 — integrated mode ═══ */
  const CBQ = [
    {sm:'SM-9845',cli:'BOMBRIL',cc:'bombril',sev:'crit',issue:'Parado há 47 min sem comunicação',det:'Última posição BR-101 km 234 — motorista não responde há 47 minutos. Sem telemetria.',ctx:[['ETA','+1h12 atraso'],['ROTA','SP → Salvador'],['MOTORISTA','J. Silva']],conn:{sinal:['bad','Sem sinal'],gps:['warn','12 min'],ign:['warn','Desligada'],bat:['ok','78%']},geo:{origin:[-23.55,-46.63],dest:[-12.97,-38.51],pos:[-16.5,-39.2]},ml:'13:00 · BR-101 km 234',mot:{n:'João Silva',ph:'(11) 98472-1133',sc:82},dest:{n:'CD Bombril Salvador',ph:'(71) 3045-9900'},trip:{ori:'CD São Paulo',dst:'CD Bombril Salvador',dep:'08:12',dist:'892 km',fuel:'42%',cargo:'Prod. limpeza',veh:'DAF XF 530',plate:'FRC-8A42'},tl:[{t:'13:47',e:'Sem update telemetria há 47 min',ty:'alert'},{t:'12:58',e:'Velocidade reduzida a 0 km/h',ty:'alert'},{t:'11:30',e:'Abastecimento registrado',ty:'milestone'},{t:'10:22',e:'Pedágio Régis Bittencourt',ty:'ok'},{t:'08:12',e:'Saída CD São Paulo',ty:'milestone'}],acts:[{title:'Acionar central',desc:'Disparar contato via 0800 + SMS automático ao motorista',ty:'pri',out:'snooze',timer:10},{title:'Justificar parada',desc:'Marcar como pausa autorizada — 30 minutos',ty:'',out:'resolve'},{title:'Escalar gestor',desc:'Notificar supervisor da rota imediatamente',ty:'',out:'escalate'}],msgs:[]},
    {sm:'SM-9712',cli:'KELLUX',cc:'kellux',sev:'high',issue:'Desvio de rota detectado — 8 km fora do plano',det:'Possível alternativa por congestionamento na Dutra. Motorista comunicou trânsito parado.',ctx:[['ETA','No limite'],['ROTA','Campinas → RJ'],['DESVIO','+8 km']],conn:{sinal:['ok','4G'],gps:['ok','Agora'],ign:['ok','Ligada'],bat:['ok','91%']},geo:{origin:[-22.91,-47.06],dest:[-22.91,-43.20],pos:[-22.85,-45.20]},ml:'14:02 · Dutra km 178',mot:{n:'Marcos Souza',ph:'(19) 99721-4408',sc:91},dest:{n:'Kellux RJ Centro',ph:'(21) 2233-7700'},trip:{ori:'CD Campinas',dst:'Kellux RJ Centro',dep:'10:15',dist:'246 km',fuel:'67%',cargo:'Eletrônicos',veh:'Volvo FH 540',plate:'GHJ-5B18'},tl:[{t:'14:02',e:'Saiu da rota planejada (+8 km)',ty:'alert'},{t:'13:18',e:'Tráfego intenso reportado',ty:'ok'},{t:'12:40',e:'Msg motorista: "trânsito parado"',ty:'msg'},{t:'11:45',e:'Pedágio Jacareí',ty:'ok'},{t:'10:15',e:'Saída CD Campinas',ty:'milestone'}],acts:[{title:'Aceitar desvio',desc:'Validar rota alternativa — seguir monitorando',ty:'pri',out:'resolve'},{title:'Contatar motorista',desc:'Confirmar motivo do desvio por chamada',ty:'',out:'snooze',timer:5},{title:'Forçar retorno',desc:'Solicitar volta à rota original planejada',ty:'',out:'snooze',timer:15}],msgs:[{fr:'in',tx:'Trânsito parado na Dutra, vou pela 116',t:'12:40'},{fr:'out',tx:'Entendido. Avisa quando retomar rota.',t:'12:42'}]},
    {sm:'SM-9633',cli:'FENZA',cc:'fenza',sev:'crit',issue:'Atraso previsto > 2h — janela do porto em risco',det:'Congestionamento severo Anchieta. Janela de atracação expira às 17:00.',ctx:[['ETA','+2h08 atraso'],['JANELA','até 17:00'],['ROTA','Sorocaba → Santos']],conn:{sinal:['ok','3G'],gps:['ok','Agora'],ign:['ok','Ligada'],bat:['warn','34%']},geo:{origin:[-23.50,-47.46],dest:[-23.96,-46.33],pos:[-23.78,-46.50]},ml:'13:55 · Anchieta km 56',mot:{n:'Ricardo Almeida',ph:'(15) 98821-7765',sc:75},dest:{n:'Terminal Santos',ph:'(13) 3221-4400'},trip:{ori:'CD Sorocaba',dst:'Terminal Santos Brasil',dep:'11:00',dist:'38 km',fuel:'55%',cargo:'Containers export.',veh:'Scania R 450',plate:'KLP-2C67'},tl:[{t:'13:55',e:'ETA recalculado +2h08 — janela em risco',ty:'alert'},{t:'13:30',e:'Congestionamento severo Anchieta',ty:'alert'},{t:'12:45',e:'Passagem SP-055',ty:'ok'},{t:'11:00',e:'Saída CD Sorocaba',ty:'milestone'}],acts:[{title:'Notificar cliente',desc:'Enviar nova ETA + justificativa OTIF ao terminal',ty:'pri',out:'snooze',timer:15},{title:'Reagendar janela',desc:'Reservar novo slot no porto via sistema',ty:'',out:'snooze',timer:20},{title:'Monitorar',desc:'Acompanhar evolução do trânsito sem ação direta',ty:'',out:'reopen',timer:30}],msgs:[]},
    {sm:'SM-9588',cli:'BOMBRIL',cc:'bombril',sev:'crit',issue:'Temperatura câmara 8°C — limite 4°C há 12 min',det:'Carga termolábil (cosméticos) em risco. Protocolo de refrigeração deve ser acionado.',ctx:[['CÂMARA','8°C'],['LIMITE','4°C'],['TEMPO FORA','12 min']],conn:{sinal:['ok','4G'],gps:['ok','Agora'],ign:['ok','Ligada'],bat:['ok','82%']},geo:{origin:[-23.51,-46.78],dest:[-23.42,-46.46],pos:[-23.50,-46.65]},ml:'13:48 · Castello km 28',mot:{n:'Carlos Pereira',ph:'(11) 99334-5521',sc:68},dest:{n:'CD Bombril GRU',ph:'(11) 2412-8800'},trip:{ori:'CD Osasco',dst:'CD Bombril Guarulhos',dep:'12:00',dist:'18 km',fuel:'72%',cargo:'Cosm. termolábeis',veh:'Mercedes Actros',plate:'MNO-3D89'},tl:[{t:'13:48',e:'Temperatura ultrapassou limite: 8°C (máx 4°C)',ty:'alert'},{t:'13:36',e:'Alerta preditivo: tendência de aquecimento',ty:'alert'},{t:'13:10',e:'Temperatura 5°C — próximo do limite',ty:'alert'},{t:'12:00',e:'Carga lacrada e viagem iniciada',ty:'milestone'}],acts:[{title:'Acionar manutenção',desc:'Protocolo emergência refrigeração — técnico mais próximo',ty:'pri',out:'snooze',timer:15},{title:'Contatar motorista',desc:'Verificar painel da câmara frigorífica',ty:'',out:'snooze',timer:5},{title:'Avaliar perda',desc:'Iniciar análise de risco com equipe qualidade',ty:'',out:'escalate'}],msgs:[]}
  ];

  let cbIdx=0, cbDone=0, cbT0=0, cbTlF='all';
  const cbDa={}, cbTm={}, cbCo={}, cbCt=[];
  let cbLa=0, cbChatOpen=false;

  window.cabineOpen = function(){
    cbIdx=0; cbDone=0; cbT0=Date.now(); cbLa=Date.now();
    cbChatOpen=false;
    Object.keys(cbDa).forEach(k=>delete cbDa[k]);
    Object.keys(cbTm).forEach(k=>{Object.values(cbTm[k]).forEach(t=>{if(t.iv)clearInterval(t.iv)});delete cbTm[k]});
    cbCt.length=0;
    document.querySelector('.app').dataset.mode='cabine';
    // Open detail panel with timeline of current item
    const dp=document.querySelector('.detail-panel');
    if(dp) dp.classList.add('open');
    cbRender();
    document.addEventListener('keydown', cbKeys);
  };

  window.cabineClose = function(){
    delete document.querySelector('.app').dataset.mode;
    Object.values(cbTm).forEach(a=>Object.values(a).forEach(t=>{if(t.iv)clearInterval(t.iv)}));
    document.removeEventListener('keydown', cbKeys);
    cbChatOpen=false;
    const co=document.getElementById('cbf-chat-overlay');
    if(co) co.remove();
    // Remove adapter SMs injected by cabine
    CBQ.forEach(q=>{const idx=SMs.findIndex(s=>s.id===q.sm);if(idx>=0)SMs.splice(idx,1)});
    // Remove cabine route layers
    cbMapLayers.forEach(l=>{ if(window.map && map.hasLayer(l)) map.removeLayer(l) });
    cbMapLayers=[];
    // Restore all truck markers
    if(window.mapMarkers && window.map){
      Object.values(window.mapMarkers).forEach(m=>{ if(!map.hasLayer(m)) m.addTo(map) });
    }
  };

  function cbRender(){
    const it=CBQ[cbIdx%CBQ.length], qi=cbIdx%CBQ.length, n=CBQ.length;
    // Update slim bar KPIs
    const progEl=document.getElementById('cbr-prog');
    if(progEl) progEl.textContent=`${cbDone}/${n}`;
    const barEl=document.getElementById('cbr-bar');
    if(barEl) barEl.style.width=`${(cbDone/n)*100}%`;
    const el=(Date.now()-cbT0)/60000, r=el>.08?(cbDone/el).toFixed(1):'—';
    const rEl=document.getElementById('cbr-rate');
    if(rEl){rEl.textContent=r==='—'?'—':r+'/min';rEl.className='cbr-kpi-val'+(parseFloat(r)>=3?' ok':(r==='—'?'':' slow'))}
    const avgEl=document.getElementById('cbr-avg');
    if(avgEl) avgEl.textContent=cbCt.length>0?Math.round(cbCt.reduce((a,b)=>a+b,0)/cbCt.length)+'s':'—';
    cbUpdPend();
    cbRenderPanel(it,qi,n);
    cbRenderDetail(it,qi);
    cbFocusMap(it);
  }

  function cbUpdPend(){
    let ch='',pn=0;
    Object.entries(cbTm).forEach(([qi,a])=>Object.entries(a).forEach(([ai,t])=>{
      if(t.iv){pn++;ch+=`<span class="cbr-chip" onclick="cbGo(${qi})"><i class="fa-solid fa-clock"></i> ${CBQ[qi].sm}</span>`}
    }));
    const pe=document.getElementById('cbr-pend');
    if(pe) pe.innerHTML=ch;
  }
  window.cbGo=function(qi){cbIdx=parseInt(qi);cbTlF='all';cbRender()};

  /* ── Cabine face (SM panel) ────────────────── */
  function cbRenderPanel(it,qi,n){
    const ds=cbDa[qi]||(cbDa[qi]=new Set());
    const ctx=it.ctx.map(c=>`<div class="cbf-ctx-pill"><span class="cbf-ctx-k">${c[0]}</span><span class="cbf-ctx-v">${c[1]}</span></div>`).join('');
    const mOff=it.conn.sinal[0]==='bad'?' disabled':'';
    const fn=it.mot.n.split(' ')[0], dn=it.dest.n.split(' ').slice(0,2).join(' ');
    const sL={crit:'CRÍTICA',high:'ALTA',med:'MÉDIA'};

    // Treatment actions (1-3)
    const acts=it.acts.map((a,i)=>{
      const d=ds.has(i), p=a.ty==='pri'&&!d, cls=d?'done':(p?'pri':'');
      let tmr='';
      if(a.timer&&a.out==='snooze'){
        const lv=cbTm[qi]?.[i];
        tmr=lv?`<span class="cbf-act-timer live"><i class="fa-solid fa-clock"></i> <span id="cbt-${qi}-${i}">—</span></span>`
             :(!d?`<span class="cbf-act-timer"><i class="fa-solid fa-clock"></i> ${a.timer} min</span>`:'');
      }
      return `<div class="cbf-act ${cls}" onclick="cbAct(${i})"><span class="cbf-act-key">${i+1}</span><div class="cbf-act-body"><span class="cbf-act-title">${a.title}</span>${tmr}</div>${d?'<span class="cbf-act-done">✓</span>':''}</div>`;
    }).join('');

    // Comm actions (same list, same visual language)
    const commActs=`
      <div class="cbf-act comm-act" onclick="cbComm('mot')"${mOff}><span class="cbf-act-key comm-key phone"><i class="fa-solid fa-phone"></i></span><div class="cbf-act-body"><span class="cbf-act-title">Motorista · ${fn}</span></div><span class="cbf-act-kbd">M</span></div>
      <div class="cbf-act comm-act" onclick="cbComm('dest')"><span class="cbf-act-key comm-key phone"><i class="fa-solid fa-phone"></i></span><div class="cbf-act-body"><span class="cbf-act-title">Destinatário · ${dn}</span></div><span class="cbf-act-kbd">D</span></div>
      <div class="cbf-act comm-act wpp-act" onclick="cbComm('msg')"><span class="cbf-act-key comm-key wpp"><i class="fa-brands fa-whatsapp"></i></span><div class="cbf-act-body"><span class="cbf-act-title">WhatsApp · Template</span></div><span class="cbf-act-kbd">W</span></div>`;

    // Footer: active SMs with pending timers or chats
    let footerChips='';
    CBQ.forEach((q,i)=>{
      if(i===qi) return; // skip current
      const hasTimer=cbTm[i]&&Object.values(cbTm[i]).some(t=>t.iv);
      const hasChat=q.msgs&&q.msgs.length>0;
      const hasDone=cbDa[i]&&cbDa[i].size>0;
      if(hasTimer||hasChat||hasDone){
        const icon=hasTimer?'<i class="fa-solid fa-clock"></i>':(hasChat?'<i class="fa-solid fa-comment"></i>':'<i class="fa-solid fa-check"></i>');
        const cls=hasTimer?'timer':(hasChat?'chat':'done');
        footerChips+=`<button class="cbf-foot-chip ${cls}" onclick="cbGo(${i})">${icon} ${q.sm}</button>`;
      }
    });

    const host=document.getElementById('cbf-content');
    if(!host) return;
    host.innerHTML=`
      <div class="cbf-head"><div class="cbf-id"><span class="cbf-sm">${it.sm}</span><span class="cbf-cli ${it.cc}">${it.cli}</span></div><span class="cbf-sev ${it.sev}">${sL[it.sev]}</span></div>
      <div class="cbf-issue"><div class="cbf-issue-label">⚠ PROBLEMA</div><div class="cbf-issue-title">${it.issue}</div><div class="cbf-issue-detail">${it.det}</div></div>
      <div class="cbf-ctx">${ctx}</div>
      <div id="cbf-confirm"></div>
      <div class="cbf-sec"><span class="cbf-sec-label">Ações</span></div>
      <div class="cbf-acts">${acts}
        <div class="cbf-act-divider"></div>
        ${commActs}
      </div>`;

    // Footer strip for multi-occurrence
    const footHost=document.getElementById('cbf-footer');
    if(footHost){
      if(footerChips){
        footHost.innerHTML=`<span class="cbf-foot-label">Em andamento</span><div class="cbf-foot-chips">${footerChips}</div>`;
        footHost.style.display='flex';
      } else {
        footHost.style.display='none';
      }
    }
  }

  /* ── Detail panel (reuses torre patterns) ──── */
  function cbRenderDetail(it,qi){
    // ── Helpers ──
    const connSt=v=>v[0]==='ok'?'ok':v[0]==='warn'?'warn':'danger';
    const connTx=v=>v[1]||'—';
    const riskVal=it.sev==='crit'?98:it.sev==='high'?72:45;
    const riskCls=it.sev==='crit'?'risk-critical':it.sev==='high'?'eta-delay':'ok';
    const riskLbl=it.sev==='crit'?'Crítico':it.sev==='high'?'Alto':'Médio';
    const doneMs=it.tl.filter(e=>e.ty==='milestone'||e.ty==='ok').length;
    const progPct=it.tl.length>0?Math.round((doneMs/it.tl.length)*100):0;
    const etaCtx=it.ctx.find(c=>c[0]==='ETA');
    const etaVal=etaCtx?etaCtx[1]:'—';
    const etaCls=etaCtx&&etaCtx[1].includes('+')?'eta-delay':'ok';
    const etaSub=etaCtx&&etaCtx[1].includes('+')?'Atrasado':'No prazo';

    // ── Adapter: inject into SMs so switchTab/updateTabIndicator/setMapMode work ──
    const adapterSM={
      id:it.sm, client:it.cli, clientColor:'', type:it.sev==='crit'?'FTL':'LTL',
      risk:riskVal, driver:it.mot.n, plate:it.trip.plate, vehicle:it.trip.veh,
      driverScore:it.mot.sc, lat:it.geo.pos[0], lng:it.geo.pos[1],
      farol:[
        {dim:'GEO',icon:'📍',status:connSt(it.conn.sinal),statusText:connTx(it.conn.sinal),detail:connTx(it.conn.sinal)},
        {dim:'Telemetria',icon:'📡',status:connSt(it.conn.gps),statusText:connTx(it.conn.gps),detail:connTx(it.conn.gps)},
        {dim:'DTIF',icon:'⚡',status:connSt(it.conn.ign),statusText:connTx(it.conn.ign),detail:connTx(it.conn.ign)},
      ],
      stats:[
        {label:'Risco',val:String(riskVal),cls:riskCls,sub:riskLbl},
        {label:'Progresso',val:progPct+'%',cls:'',sub:it.trip.dist+' rest.'},
        {label:'ETA',val:etaVal,cls:etaCls,sub:etaSub},
      ],
      appStatus:{
        gps:it.conn.gps[0]==='ok'?'Ativo':'Sem sinal',
        battery:it.conn.bat[1],
        signal:it.conn.sinal[0]==='ok'?'4G':it.conn.sinal[0]==='warn'?'3G':'Sem sinal',
        app:it.conn.ign[0]==='ok'?'Aberto':'Inativo',
      },
      routeStops:[],route:[],milestones:[],msgs:[],alerts:[],
    };
    // Push adapter into SMs temporarily (or replace if exists)
    const existIdx=SMs.findIndex(s=>s.id===it.sm);
    if(existIdx>=0) SMs[existIdx]=adapterSM; else SMs.push(adapterSM);
    selectedSM=it.sm;

    // ── Header ──
    const dId=document.getElementById('d-id');
    if(dId) dId.textContent=it.sm;
    const dCli=document.getElementById('d-client');
    if(dCli){dCli.textContent=it.cli;dCli.style.color=''}
    const dType=document.getElementById('d-type');
    if(dType){dType.textContent=it.sev==='crit'?'CRÍTICA':'ALTA';dType.className='d-type '+(it.sev==='crit'?'risk-critical':'risk-high')}

    // ── Fiscal mini badges (MDF-e / CT-e) ──
    const fmEl=document.getElementById('d-fiscal-mini');
    if(fmEl){
      const cteBad=it.sev==='crit';
      fmEl.innerHTML=`<div style="display:flex;gap:5px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:5px;font-size:10px;background:var(--s1);border:1.5px solid var(--border);border-radius:var(--radius-md);padding:5px 10px">
          <span>📋</span><span style="color:var(--purple);font-weight:600">MDF-e</span>
          <span style="font-size:8px;padding:1px 5px;border-radius:3px;background:var(--green-s);color:var(--green);font-weight:700">✓ OK</span>
        </div>
        <div style="display:flex;align-items:center;gap:5px;font-size:10px;background:var(--s1);border:1.5px solid ${cteBad?'rgba(255,45,85,.3)':'var(--border)'};border-radius:var(--radius-md);padding:5px 10px">
          <span>📄</span><span style="color:var(--blue);font-weight:600">CT-e</span>
          <span style="font-size:8px;padding:1px 5px;border-radius:3px;${cteBad?'background:var(--red-s);color:var(--red)':'background:var(--green-s);color:var(--green)'};font-weight:700">${cteBad?'✗ Rejeitado':'✓ OK'}</span>
        </div>
      </div>`;
    }

    // ── Timeline — reuse torre's renderTimeline() ──
    _timelineEvents=it.tl.map((e,idx)=>{
      const kindMap={alert:'alert',ok:'milestone',milestone:'milestone',msg:'message'};
      const k=kindMap[e.ty]||'milestone';
      let state='done', severity, channel, channelClass;
      if(e.ty==='alert'){state=it.sev==='crit'?'alert':'warn';severity=state}
      if(e.ty==='msg'){channel='WhatsApp';channelClass='wpp'}
      return {
        kind:k, state:state, severity:severity,
        channel:channel, channelClass:channelClass,
        time:e.t, title:e.e,
        sub:e.ty==='alert'?'Pendente':e.ty==='msg'?it.mot.n:'Confirmado',
        lat:it.geo?it.geo.pos[0]:0, lng:it.geo?it.geo.pos[1]:0,
        sortTime:idx,
      };
    });
    _timelineFilter='all';
    renderTimeline();
    document.querySelectorAll('.tl-seg-btn').forEach(c=>{
      c.classList.toggle('active',c.dataset.tlf==='all');
    });

    // ── Locais tab — reuse torre's .loc-stop pattern ──
    const locHost=document.getElementById('d-locais-list');
    if(locHost && it.trip){
      const sevC=it.sev==='crit'?'var(--red)':'var(--amber)';
      const sevBg=it.sev==='crit'?'var(--red-s)':'rgba(255,159,10,.12)';
      locHost.innerHTML=`
        <div class="loc-stop open" id="ls-stop-0">
          <div class="loc-stop-hdr">
            <div class="ls-seq" style="background:var(--blue-s);color:var(--blue)">1</div>
            <div class="ls-info">
              <div class="ls-name">${it.trip.ori}</div>
              <div class="ls-meta">Saída ${it.trip.dep}</div>
            </div>
            <div class="ls-right">
              <span class="ls-nf-badge" style="background:var(--green-s);color:var(--green)">✓ OK</span>
            </div>
          </div>
          <div class="loc-body" style="display:block">
            <div style="font-size:10px;color:var(--t3);padding:6px 0">Partida confirmada</div>
          </div>
        </div>
        <div class="loc-stop open" id="ls-stop-1">
          <div class="loc-stop-hdr">
            <div class="ls-seq" style="background:${sevBg};color:${sevC}">●</div>
            <div class="ls-info">
              <div class="ls-name">Em trânsito</div>
              <div class="ls-meta">${it.ml}</div>
            </div>
            <div class="ls-right">
              <span class="ls-nf-badge">${it.trip.dist}</span>
            </div>
          </div>
          <div class="loc-body" style="display:block">
            <div style="font-size:10px;color:var(--t3);padding:6px 0">Carga: <strong style="color:var(--t1)">${it.trip.cargo}</strong> · Combustível: <strong style="color:var(--t1)">${it.trip.fuel}</strong></div>
          </div>
        </div>
        <div class="loc-stop" id="ls-stop-2">
          <div class="loc-stop-hdr">
            <div class="ls-seq" style="background:var(--green-s);color:var(--green)">3</div>
            <div class="ls-info">
              <div class="ls-name">${it.trip.dst}</div>
              <div class="ls-meta">Destino final</div>
            </div>
            <div class="ls-right">
              <span class="ls-nf-badge" style="background:var(--blue-s);color:var(--blue)">Destino</span>
            </div>
          </div>
        </div>`;
    }

    // ── Driver card (already uses correct torre classes) ──
    const dDrv=document.getElementById('d-driver-card');
    if(dDrv){
      const ini=it.mot.n.split(' ').map(w=>w[0]).join('');
      const scC=it.mot.sc>=85?'var(--green)':it.mot.sc>=70?'var(--amber)':'var(--red)';
      dDrv.innerHTML=`
        <div class="driver-avatar">${ini}</div>
        <div style="flex:1">
          <div class="driver-name-big">${it.mot.n}</div>
          <div class="driver-plate-big">${it.trip.plate} · ${it.trip.veh}</div>
        </div>
        <div class="driver-score-wrap">
          <div class="driver-score-val" style="color:${scC}">${it.mot.sc}</div>
          <div class="driver-score-lbl">Score</div>
        </div>`;
    }

    // ── Journey info ──
    const jEl=document.getElementById('d-journey');
    if(jEl && it.trip){
      jEl.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:var(--s1);border:1.5px solid var(--border);border-radius:var(--radius-base);padding:9px 11px">
        <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;background:var(--green-s);color:var(--green);border:1px solid rgba(48,209,88,.25)">📱 Aplicativo</span>
        <span style="font-size:9px;color:var(--t3)">Dist: <strong style="color:var(--t2)">${it.trip.dist}</strong></span>
        <span style="font-size:9px;color:var(--t3)">Carga: <strong style="color:var(--t2)">${it.trip.cargo}</strong></span>
      </div>`;
    }

    // ── Behavior ──
    const bEl=document.getElementById('d-behavior');
    if(bEl){
      const fr=Math.floor(Math.random()*6), cu=Math.floor(Math.random()*4), sp=it.sev==='crit'?Math.floor(Math.random()*3):0;
      const bItems=[
        {label:'Freadas',val:fr,color:fr>4?'var(--red)':fr>2?'var(--amber)':'var(--green)'},
        {label:'Curvas',val:cu,color:cu>3?'var(--red)':'var(--green)'},
        {label:'Exc. vel.',val:sp,color:sp>0?'var(--red)':'var(--green)'},
      ];
      bEl.innerHTML=bItems.map(b=>`
        <div class="behavior-item">
          <div class="behavior-val" style="color:${b.color}">${b.val}</div>
          <div class="behavior-lbl">${b.label}</div>
        </div>`).join('');
    }

    // ── Reset to timeline tab ──
    document.querySelectorAll('.dtab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.detail-body').forEach(b=>b.classList.remove('active'));
    const firstTab=document.querySelectorAll('.dtab')[0];
    if(firstTab) firstTab.classList.add('active');
    const tlTab=document.getElementById('tab-timeline');
    if(tlTab) tlTab.classList.add('active');

    // ── Tab indicator (uses adapter via updateTabIndicator) ──
    if(typeof updateTabIndicator==='function') updateTabIndicator('tab-timeline');
  }

  /* ── Focus map on current SM ───────────────── */
  let cbMapLayers=[];
  function cbFocusMap(it){
    if(!window.map || !it.geo) return;
    try{
      // Hide ALL existing truck markers
      if(window.mapMarkers){
        Object.values(window.mapMarkers).forEach(m=>{ if(map.hasLayer(m)) map.removeLayer(m) });
      }
      // Clear torre route/stop layers that may linger from previous SM selection
      if(typeof routeLayers!=='undefined') routeLayers.forEach(l=>{try{map.removeLayer(l)}catch(e){}});
      if(typeof stopMarkers!=='undefined') stopMarkers.forEach(m=>{try{map.removeLayer(m)}catch(e){}});
      if(typeof clearExtraMapLayers==='function') clearExtraMapLayers();
      // Clear previous cabine route layers
      cbMapLayers.forEach(l=>{ if(map.hasLayer(l)) map.removeLayer(l) });
      cbMapLayers=[];
      // Draw route: origin → current pos → destination
      const g=it.geo;
      const doneLine=L.polyline([g.origin,g.pos],{color:'#2E5BFF',weight:3.5,opacity:.85}).addTo(map);
      const aheadLine=L.polyline([g.pos,g.dest],{color:'#2E5BFF',weight:2.5,opacity:.3,dashArray:'8,6'}).addTo(map);
      // Origin marker
      const oriIcon=L.divIcon({html:'<div style="width:12px;height:12px;border-radius:50%;background:#2E5BFF;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',className:'',iconSize:[12,12],iconAnchor:[6,6]});
      const oriMk=L.marker(g.origin,{icon:oriIcon}).addTo(map);
      oriMk.bindTooltip(it.trip?.ori||'Origem',{direction:'top',className:'tc-tip',offset:[0,-8]});
      // Destination marker
      const dstIcon=L.divIcon({html:'<div style="width:12px;height:12px;border-radius:50%;background:var(--green,#1F9E5C);border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',className:'',iconSize:[12,12],iconAnchor:[6,6]});
      const dstMk=L.marker(g.dest,{icon:dstIcon}).addTo(map);
      dstMk.bindTooltip(it.trip?.dst||'Destino',{direction:'top',className:'tc-tip',offset:[0,-8]});
      // Current position (truck)
      const truckIcon=L.divIcon({html:'<div style="width:40px;height:40px;border-radius:50%;background:'+(it.sev==='crit'?'#D9342B':'#E85D1A')+';border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.35);animation:cb-pulse 2s infinite">🚛</div>',className:'',iconSize:[40,40],iconAnchor:[20,20]});
      const truckMk=L.marker(g.pos,{icon:truckIcon,zIndexOffset:100}).addTo(map);
      truckMk.bindTooltip(it.sm+' · '+it.mot.n,{direction:'top',className:'tc-tip',offset:[0,-22],permanent:true});
      cbMapLayers.push(doneLine,aheadLine,oriMk,dstMk,truckMk);
      // Fit bounds
      map.fitBounds(L.latLngBounds([g.origin,g.pos,g.dest]).pad(.2));
    }catch(e){console.warn('cbFocusMap error',e)}
  }

  /* ═══ ACTIONS ═══ */
  window.cbAct=function(i){
    const qi=cbIdx%CBQ.length, it=CBQ[qi], a=it.acts[i];
    if(!a) return;
    const ds=cbDa[qi]||(cbDa[qi]=new Set());
    if(ds.has(i)) return;
    ds.add(i);
    const now=Date.now();
    cbCt.push(Math.round((now-cbLa)/1000));
    cbLa=now;
    if(a.out==='snooze'&&a.timer){
      cbStartTm(qi,i,a.timer);
      toast('⏱ "'+a.title+'" — retorna em '+a.timer+' min');
    } else if(a.out==='resolve'){
      toast('✓ '+a.title+' — concluída');
      cbDone++;setTimeout(()=>cbNav(1),400);
    } else if(a.out==='escalate'){
      toast('↗ '+a.title+' — escalado');
      cbDone++;setTimeout(()=>cbNav(1),400);
    } else if(a.out==='reopen'){
      toast('🔄 '+a.title+' — monitorando');
      cbDone++;setTimeout(()=>cbNav(1),400);
    }
    cbRender();
  };

  function cbStartTm(qi,ai,min){
    if(!cbTm[qi]) cbTm[qi]={};
    const dl=Date.now()+min*3*1000; // demo: 1min=3sec
    const iv=setInterval(()=>{
      const rem=Math.max(0,dl-Date.now()),s=Math.ceil(rem/1000),m=Math.floor(s/60),ss=s%60;
      const d=m>0?m+'m'+String(ss).padStart(2,'0')+'s':ss+'s';
      const el=document.getElementById('cbt-'+qi+'-'+ai);
      if(el) el.textContent=d;
      if(rem<=0){
        clearInterval(iv);delete cbTm[qi][ai];
        const ds=cbDa[qi];if(ds)ds.delete(ai);
        toast('⚠ "'+CBQ[qi].acts[ai].title+'" retornou à fila');
        if(cbIdx%CBQ.length===parseInt(qi)) cbRender();
        else cbUpdPend();
      }
    },1000);
    cbTm[qi][ai]={dl,iv};
  }

  /* ── Communication ────────────────────────── */
  window.cbComm=function(ty){
    const it=CBQ[cbIdx%CBQ.length], el=document.getElementById('cbf-confirm');
    if(!el) return;
    let h='';
    if(ty==='mot') h=`<div class="cbf-confirm"><div class="cbf-confirm-title"><i class="fa-solid fa-phone"></i> Ligar motorista</div><div class="cbf-confirm-detail">${it.mot.n} · ${it.mot.ph}</div><div class="cbf-confirm-btns"><button class="cbf-btn-go" onclick="cbExec('mot')">Ligar agora</button><button class="cbf-btn-no" onclick="cbConfX()">Cancelar</button></div></div>`;
    else if(ty==='dest') h=`<div class="cbf-confirm"><div class="cbf-confirm-title"><i class="fa-solid fa-phone"></i> Ligar destinatário</div><div class="cbf-confirm-detail">${it.dest.n} · ${it.dest.ph}</div><div class="cbf-confirm-btns"><button class="cbf-btn-go" onclick="cbExec('dest')">Ligar agora</button><button class="cbf-btn-no" onclick="cbConfX()">Cancelar</button></div></div>`;
    else if(ty==='msg') h=`<div class="cbf-confirm"><div class="cbf-confirm-title"><i class="fa-brands fa-whatsapp"></i> WhatsApp</div><div class="cbf-confirm-detail">Template para ${it.mot.n}</div><div class="cbf-confirm-btns"><button class="cbf-btn-go wpp" onclick="cbExec('msg')">Enviar</button><button class="cbf-btn-no" onclick="cbConfX()">Cancelar</button></div></div>`;
    el.innerHTML=h;
  };
  window.cbConfX=function(){const el=document.getElementById('cbf-confirm');if(el)el.innerHTML=''};
  window.cbExec=function(ty){
    const qi=cbIdx%CBQ.length, it=CBQ[qi];
    cbConfX(); cbCo[qi]=true;
    const now=new Date(), ts=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    if(ty==='mot'){
      toast('📞 Ligando '+it.mot.n+'...');
      it.tl.unshift({t:ts,e:'Chamada: '+it.mot.n,ty:'msg'});
      // Open chat overlay on detail panel
      cbOpenChat(it,qi);
      setTimeout(()=>{it.msgs.push({fr:'out',tx:'Ligação — '+it.mot.n,t:ts},{fr:'in',tx:'Estou bem, parei pra descanso. Volto em 20 min.',t:ts});if(cbChatOpen)cbRenderChatMsgs(it)},1200);
    } else if(ty==='dest'){
      toast('📞 Ligando '+it.dest.n+'...');
      it.tl.unshift({t:ts,e:'Chamada: '+it.dest.n,ty:'msg'});
      cbOpenChat(it,qi);
      setTimeout(()=>{it.msgs.push({fr:'out',tx:'Ligação para '+it.dest.n,t:ts});if(cbChatOpen)cbRenderChatMsgs(it)},800);
    } else if(ty==='msg'){
      toast('💬 WhatsApp enviado');
      it.msgs.push({fr:'out',tx:'[Template] Atualização solicitada',t:ts});
      it.tl.unshift({t:ts,e:'WhatsApp: '+it.mot.n,ty:'msg'});
      cbOpenChat(it,qi);
      setTimeout(()=>{it.msgs.push({fr:'in',tx:'Recebi. Tudo certo por aqui.',t:ts});if(cbChatOpen)cbRenderChatMsgs(it)},1200);
    }
    cbRender();
  };

  /* ── Chat overlay on detail panel ──────────── */
  function cbOpenChat(it,qi){
    cbChatOpen=true;
    const dp=document.querySelector('.detail-inner');
    if(!dp) return;
    // Remove existing overlay
    const old=document.getElementById('cbf-chat-overlay');
    if(old) old.remove();
    const on=it.conn.sinal[0]!=='bad';
    const ov=document.createElement('div');
    ov.className='cbf-chat-overlay';
    ov.id='cbf-chat-overlay';
    ov.innerHTML=`
      <div class="cbf-chat-hd">
        <span class="cbf-chat-title">Chat · ${it.mot.n.split(' ')[0]}</span>
        <span class="cbf-chat-status"><span class="cbf-chat-dot ${on?'on':'off'}"></span>${on?'Online':'Offline'}</span>
        <button class="cbf-chat-close" onclick="cbCloseChat()">✕</button>
      </div>
      <div class="cbf-chat-msgs" id="cbf-chat-msgs"></div>
      <div class="cbf-chat-quick">
        <button class="cbf-chat-qb" onclick="cbChatQ('Posição?')">Posição?</button>
        <button class="cbf-chat-qb" onclick="cbChatQ('Foto')">Foto</button>
        <button class="cbf-chat-qb" onclick="cbChatQ('OK?')">OK?</button>
        <button class="cbf-chat-qb" onclick="cbChatQ('ETA?')">ETA?</button>
      </div>
      <div class="cbf-chat-input">
        <input class="cbf-chat-field" id="cbf-chat-in" placeholder="Mensagem..." onkeydown="if(event.key==='Enter')cbChatSend()">
        <button class="cbf-chat-send" onclick="cbChatSend()"><i class="fa-solid fa-paper-plane"></i></button>
      </div>`;
    dp.appendChild(ov);
    cbRenderChatMsgs(it);
  }
  function cbRenderChatMsgs(it){
    const host=document.getElementById('cbf-chat-msgs');
    if(!host) return;
    if(it.msgs.length===0){
      host.innerHTML='<div class="cbf-chat-empty">Sem mensagens ainda.</div>';
    } else {
      host.innerHTML=it.msgs.map(m=>`<div class="cbf-msg ${m.fr==='out'?'out':'in'}">${m.tx}<div class="cbf-msg-t">${m.t}</div></div>`).join('');
      host.scrollTop=host.scrollHeight;
    }
  }
  window.cbCloseChat=function(){
    cbChatOpen=false;
    const ov=document.getElementById('cbf-chat-overlay');
    if(ov){ov.classList.add('closing');setTimeout(()=>ov.remove(),300)}
  };
  window.cbChatQ=function(tx){
    const qi=cbIdx%CBQ.length, it=CBQ[qi];
    const now=new Date(), ts=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    it.msgs.push({fr:'out',tx:tx,t:ts});
    cbRenderChatMsgs(it);
    const rp={'Posição?':'BR-101 km 234, em posto.','Foto':'📷 [Foto enviada]','OK?':'Sim, tudo ok.','ETA?':'~3h pra chegar.'};
    setTimeout(()=>{it.msgs.push({fr:'in',tx:rp[tx]||'OK.',t:ts});cbRenderChatMsgs(it)},1200);
  };
  window.cbChatSend=function(){
    const inp=document.getElementById('cbf-chat-in');
    if(!inp||!inp.value.trim()) return;
    const qi=cbIdx%CBQ.length, it=CBQ[qi];
    const now=new Date(), ts=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    it.msgs.push({fr:'out',tx:inp.value.trim(),t:ts});
    inp.value='';
    cbRenderChatMsgs(it);
    setTimeout(()=>{it.msgs.push({fr:'in',tx:'Entendido, verificando.',t:ts});cbRenderChatMsgs(it)},1200);
  };

  /* ── Navigation ────────────────────────────── */
  window.cbNav=function(d){
    cbIdx=Math.max(0,cbIdx+d);
    if(cbIdx>=CBQ.length) cbIdx=0;
    cbTlF='all';
    cbCloseChat();
    cbRender();
  };

  /* ── Keyboard ──────────────────────────────── */
  function cbKeys(e){
    // Only handle when in cabine mode
    if(!document.querySelector('.app').dataset.mode) return;
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if(e.key==='Escape'){
      if(cbChatOpen){cbCloseChat();return}
      const cf=document.getElementById('cbf-confirm');
      if(cf&&cf.innerHTML){cbConfX();return}
      cabineClose();return;
    }
    if(e.key==='1') cbAct(0);
    else if(e.key==='2') cbAct(1);
    else if(e.key==='3') cbAct(2);
    else if(e.key==='ArrowRight') cbNav(1);
    else if(e.key==='ArrowLeft') cbNav(-1);
    else if(e.key==='m'||e.key==='M') cbComm('mot');
    else if(e.key==='d'||e.key==='D') cbComm('dest');
    else if(e.key==='w'||e.key==='W') cbComm('msg');
  }
})();
