/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const SMs = [
  {
    id:'SM-984553', client:'Bombril', clientColor:'#FF9F0A',
    type:'Transferência', status:'parado', risk:98,
    driver:'Ricardo Matos', driverScore:71, plate:'ABC-1D23', vehicle:'Truck Iveco Tector',
    origin:'São Paulo', destination:'Santos',
    eta:'13:15', etaDelay:'+2h10min', progress:34,
    lat:-23.718, lng:-46.558, lastUpdate:'45min atrás',
    alerts:[{text:'Parado 45min',type:'alert'},{text:'Geo-fence divergente',type:'geo'},{text:'Sem sinal telemetria',type:'warn'}],
    milestones:[
      {label:'Saída do CD São Paulo',time:'08:40',done:true},
      {label:'Checkpoint Mauá',time:'09:55',done:true},
      {label:'Parada atual — não programada',time:'10:22',current:true},
      {label:'Chegada Santos',time:'13:15',done:false},
    ],
    farol:[
      {dim:'Docs',icon:'📄',status:'ok',statusText:'Validados',detail:'CT-e e MDF-e OK'},
      {dim:'Geo',icon:'📍',status:'danger',statusText:'Desvio',detail:'Fora do corredor'},
      {dim:'Telemetria',icon:'📡',status:'danger',statusText:'Sem sinal',detail:'Desde 10:22'},
      {dim:'OTIF',icon:'⏱',status:'danger',statusText:'Em risco',detail:'+2h10 atraso'},
    ],
    msgs:[
      {channel:'WhatsApp',cls:'msg-wpp',text:'Ricardo, confirma saída do CD? Aguardamos.',time:'08:40',sender:'Torre → Motorista'},
      {channel:'WhatsApp',cls:'msg-wpp',text:'Saí sim. Trânsito pesado na Anchieta.',time:'08:43',sender:'Ricardo Matos'},
      {channel:'Email',cls:'msg-email',text:'Alerta: SM-984553 parada há 45min fora de rota.',time:'11:07',sender:'Torre → Ger. Operações'},
    ],
    appStatus:{gps:'Ativo',battery:'23%',signal:'Fraco (2G)',app:'Fechado'},
    trackingType:'app',
    journey:{hours:'4h22min',rest:'Necessário em 1h38min',lastUpdate:'10:22'},
    behavior:{freadas:3,curvas:1,velocidade:0},
    stats:[
      {label:'Risco',val:'98',cls:'risk-critical',sub:'Crítico'},
      {label:'ETA',val:'13:15',cls:'eta-delay',sub:'+2h10min'},
      {label:'Progresso',val:'34%',cls:'',sub:'168 km rest.'},
    ],
    route:[[-23.548,-46.638],[-23.60,-46.61],[-23.65,-46.58],[-23.718,-46.558],[-23.85,-46.44],[-23.960,-46.333]],
    routeStops:[
      {label:'CD São Paulo — Origem',type:'origin',lat:-23.548,lng:-46.638,status:'done',
       nf:null,contact:null,window:'07:00–08:30',eta:'08:00',actual:'08:40',issues:[]},
      {label:'Checkpoint Mauá',type:'checkpoint',lat:-23.67,lng:-46.46,status:'done',
       nf:null,contact:null,window:null,eta:'09:55',actual:'09:55',issues:[]},
      {label:'Parada não programada',type:'problem',lat:-23.718,lng:-46.558,status:'problem',
       nf:null,contact:'Ricardo Matos · (11) 97822-0341',window:null,eta:null,actual:null,
       issues:[
         {sev:'danger',text:'Parado há 45min sem movimentação'},
         {sev:'danger',text:'Geo-fence divergente — fora da rota planejada'},
         {sev:'warn',text:'Sem sinal de telemetria desde 10:22'},
       ]},
      {label:'Terminal Santos — Destino',type:'destination',lat:-23.960,lng:-46.333,status:'pending',
       nf:'NF-38291 · NF-38292',contact:'Oper. Porto · (13) 3289-0044',
       window:'12:00–14:00',eta:'13:15',actual:null,
       issues:[{sev:'warn',text:'OTIF em risco — janela fecha às 14:00'}]},
    ]
  },
  {
    id:'SM-984552', client:'Kellux', clientColor:'#3D72FF',
    type:'LTL', status:'em_rota', risk:92,
    driver:'Carlos Silva', driverScore:88, plate:'BRA-2E49', vehicle:'Truck Scania R450',
    origin:'São Paulo', destination:'Campinas',
    eta:'14:32', etaDelay:'+47min', progress:62,
    lat:-23.18, lng:-46.89, lastUpdate:'2min atrás',
    alerts:[{text:'OTIF em risco',type:'alert'},{text:'Atraso +47min',type:'alert'}],
    milestones:[
      {label:'Saída do CD São Paulo',time:'10:00',done:true},
      {label:'Checkpoint Jundiaí',time:'11:30',done:true},
      {label:'Em rota — próx. checkpoint',time:'12:45',current:true},
      {label:'Chegada Campinas',time:'14:32',done:false},
    ],
    msgs:[
      {channel:'WhatsApp',cls:'msg-wpp',text:'Carlos, sua janela fecha às 15h. Acelere.',time:'12:10',sender:'Torre → Motorista'},
      {channel:'WhatsApp',cls:'msg-wpp',text:'Entendido. Trânsito na Bandeirantes mas tô desviando.',time:'12:13',sender:'Carlos Silva'},
    ],
    appStatus:{gps:'Ativo',battery:'61%',signal:'4G OK',app:'Aberto'},
    trackingType:'app',
    journey:{hours:'2h30min',rest:'OK — 4h disponíveis',lastUpdate:'12:13'},
    farol:[
      {dim:'Docs',icon:'📄',status:'ok',statusText:'Validados',detail:'CT-e e NF OK'},
      {dim:'Geo',icon:'📍',status:'ok',statusText:'No corredor',detail:'Rota ativa'},
      {dim:'Telemetria',icon:'📡',status:'warn',statusText:'Instável',detail:'Sinal 3G'},
      {dim:'OTIF',icon:'⏱',status:'danger',statusText:'Em risco',detail:'+47min atraso'},
    ],
    behavior:{freadas:5,curvas:2,velocidade:1},
    stats:[
      {label:'Risco',val:'92',cls:'risk-critical',sub:'Crítico'},
      {label:'ETA',val:'14:32',cls:'eta-delay',sub:'+47min'},
      {label:'Progresso',val:'62%',cls:'ok',sub:'57 km rest.'},
    ],
    route:[[-23.548,-46.638],[-23.40,-46.72],[-23.18,-46.89],[-22.905,-47.063]],
    routeStops:[
      {label:'CD São Paulo — Origem',type:'origin',lat:-23.548,lng:-46.638,status:'done',
       nf:null,contact:null,window:'09:30–10:00',eta:'10:00',actual:'10:00',issues:[]},
      {label:'Entrega 1 — Distribuidora Jundiaí',type:'delivery',seq:1,lat:-23.18,lng:-46.89,status:'done',
       nf:'NF-39021',contact:'Almoxarifado · (11) 4521-8800',
       window:'11:00–12:30',eta:'11:30',actual:'11:45',issues:[]},
      {label:'Em rota — Rod. Bandeirantes',type:'current',lat:-23.35,lng:-46.97,status:'current',
       nf:null,contact:null,window:null,eta:null,actual:null,issues:[]},
      {label:'Entrega 2 — Kellux Campinas',type:'delivery',seq:2,lat:-22.905,lng:-47.063,status:'pending',
       nf:'NF-39022',contact:'Recebimento · (19) 3776-5522',
       window:'14:00–16:00',eta:'14:32',actual:null,
       issues:[{sev:'warn',text:'Atraso +47min — janela de entrega em risco'}]},
    ]
  },
  {
    id:'SM-984556', client:'Bombril', clientColor:'#FF9F0A',
    type:'LTL', status:'em_rota', risk:71,
    driver:'Fernando Costa', driverScore:81, plate:'JKL-5H12', vehicle:'Truck DAF XF',
    origin:'São Paulo', destination:'Sorocaba',
    eta:'16:20', etaDelay:'+32min', progress:51,
    lat:-23.57, lng:-47.12, lastUpdate:'3min atrás',
    alerts:[{text:'Janela em risco',type:'alert'}],
    milestones:[
      {label:'Saída do CD São Paulo',time:'12:00',done:true},
      {label:'Em rota — Rod. Raposo Tavares',time:'13:30',current:true},
      {label:'Chegada Sorocaba',time:'16:20',done:false},
    ],
    farol:[
      {dim:'Docs',status:'ok'},{dim:'Geo',status:'ok'},
      {dim:'Telemetria',status:'ok'},{dim:'OTIF',status:'warn'},
    ],
    msgs:[
      {channel:'Sistema',cls:'msg-system',text:'SM iniciada. Carga verificada e lacrada.',time:'11:55',sender:'Sistema'},
      {channel:'WhatsApp',cls:'msg-wpp',text:'Fernando, janela de Sorocaba fecha às 17h. OK?',time:'13:00',sender:'Torre → Motorista'},
    ],
    appStatus:{gps:'Ativo',battery:'45%',signal:'3G',app:'Aberto'},
    behavior:{freadas:4,curvas:3,velocidade:0},
    stats:[
      {label:'Risco',val:'71',cls:'risk-high',sub:'Alto'},
      {label:'ETA',val:'16:20',cls:'eta-delay',sub:'+32min'},
      {label:'Progresso',val:'51%',cls:'',sub:'48 km rest.'},
    ],
    route:[[-23.548,-46.638],[-23.57,-47.12],[-23.478,-47.448],[-23.501,-47.458]],
    routeStops:[
      {label:'CD São Paulo — Origem',type:'origin',lat:-23.548,lng:-46.638,status:'done',
       nf:null,contact:null,window:'11:30–12:00',eta:'12:00',actual:'12:00',issues:[]},
      {label:'Em rota — Rod. Raposo Tavares',type:'current',lat:-23.57,lng:-47.12,status:'current',
       nf:null,contact:null,window:null,eta:null,actual:null,issues:[]},
      {label:'Entrega 1 — Bombril Sorocaba',type:'delivery',seq:1,lat:-23.478,lng:-47.448,status:'pending',
       nf:'NF-40112',contact:'Almoxarifado · (15) 3228-0092',
       window:'15:00–17:00',eta:'16:20',actual:null,
       issues:[
         {sev:'warn',text:'Destinatário Vermelho — histórico de recusa'},
         {sev:'warn',text:'Atraso +32min — janela em risco'},
       ]},
      {label:'Depósito Sorocaba — Destino',type:'destination',lat:-23.501,lng:-47.458,status:'pending',
       nf:null,contact:'Portaria · (15) 3220-1100',window:'17:00–18:00',eta:'17:00',actual:null,issues:[]},
    ]
  },
  {
    id:'SM-984555', client:'Kellux', clientColor:'#3D72FF',
    type:'Mutação', status:'aguardando', risk:55,
    driver:'Paulo Mendes', driverScore:93, plate:'GHI-4G89', vehicle:'Van Iveco Daily',
    origin:'São Paulo', destination:'S. Bernardo',
    eta:'15:00', etaDelay:'+18min', progress:0,
    lat:-23.694, lng:-46.565, lastUpdate:'5min atrás',
    alerts:[{text:'Aguardando liberação',type:'warn'}],
    milestones:[
      {label:'Aguardando liberação de carga',time:'13:00',current:true},
      {label:'Saída prevista',time:'13:30',done:false},
      {label:'Chegada São Bernardo',time:'15:00',done:false},
    ],
    farol:[
      {dim:'Docs',status:'warn'},{dim:'Geo',status:'ok'},
      {dim:'Telemetria',status:'ok'},{dim:'OTIF',status:'warn'},
    ],
    msgs:[
      {channel:'WhatsApp',cls:'msg-wpp',text:'Paulo, aguarda a liberação do fiscal.',time:'12:55',sender:'Torre → Motorista'},
    ],
    appStatus:{gps:'Ativo',battery:'78%',signal:'4G OK',app:'Aberto'},
    behavior:{freadas:1,curvas:0,velocidade:0},
    stats:[
      {label:'Risco',val:'55',cls:'',sub:'Médio'},
      {label:'ETA',val:'15:00',cls:'',sub:'+18min est.'},
      {label:'Progresso',val:'0%',cls:'',sub:'Aguardando'},
    ],
    route:[[-23.694,-46.565],[-23.710,-46.565]],
    routeStops:[
      {label:'CD São Paulo — Aguardando liberação',type:'problem',lat:-23.694,lng:-46.565,status:'problem',
       nf:null,contact:'Fiscal CD · (11) 98821-4400',window:'12:00–13:30',eta:null,actual:null,
       issues:[{sev:'warn',text:'Aguardando liberação fiscal — +18min estimado'}]},
      {label:'Entrega — S. Bernardo do Campo',type:'destination',lat:-23.710,lng:-46.555,status:'pending',
       nf:'NF-38990',contact:'Recebimento · (11) 4330-7788',
       window:'14:00–16:00',eta:'15:00',actual:null,issues:[]},
    ]
  },
  {
    id:'SM-984554', client:'Fenza', clientColor:'#30D158',
    type:'Dedicado', status:'em_rota', risk:12,
    driver:'André Lima', driverScore:97, plate:'DEF-3F67', vehicle:'Mercedes Actros',
    origin:'São Paulo', destination:'Ribeirão Preto',
    eta:'18:45', etaDelay:null, progress:28,
    lat:-22.35, lng:-47.15, lastUpdate:'1min atrás',
    alerts:[],
    milestones:[
      {label:'Saída do CD São Paulo',time:'09:00',done:true},
      {label:'Em rota — Rod. Anhanguera',time:'12:40',current:true},
      {label:'Checkpoint São Carlos',time:'16:00',done:false},
      {label:'Chegada Ribeirão Preto',time:'18:45',done:false},
    ],
    farol:[
      {dim:'Docs',status:'ok'},{dim:'Geo',status:'ok'},
      {dim:'Telemetria',status:'ok'},{dim:'OTIF',status:'ok'},
    ],
    msgs:[
      {channel:'Sistema',cls:'msg-system',text:'SM em dia. OTIF garantido.',time:'12:40',sender:'Sistema'},
    ],
    appStatus:{gps:'Ativo',battery:'89%',signal:'4G OK',app:'Aberto'},
    behavior:{freadas:1,curvas:1,velocidade:0},
    stats:[
      {label:'Risco',val:'12',cls:'ok',sub:'Baixo — OK'},
      {label:'ETA',val:'18:45',cls:'ok',sub:'No prazo'},
      {label:'Progresso',val:'28%',cls:'ok',sub:'289 km rest.'},
    ],
    route:[[-23.548,-46.638],[-22.35,-47.15],[-22.015,-47.891],[-21.177,-47.810]],
    routeStops:[
      {label:'CD São Paulo — Origem',type:'origin',lat:-23.548,lng:-46.638,status:'done',
       nf:null,contact:null,window:'08:30–09:00',eta:'09:00',actual:'09:00',issues:[]},
      {label:'Em rota — Rod. Anhanguera',type:'current',lat:-22.35,lng:-47.15,status:'current',
       nf:null,contact:null,window:null,eta:null,actual:null,issues:[]},
      {label:'Checkpoint São Carlos',type:'checkpoint',lat:-22.015,lng:-47.891,status:'pending',
       nf:null,contact:null,window:null,eta:'16:00',actual:null,issues:[]},
      {label:'Fenza Ribeirão Preto — Destino',type:'destination',lat:-21.177,lng:-47.810,status:'pending',
       nf:'NF-41888 · NF-41889',contact:'Gerência Fenza · (16) 3602-9944',
       window:'17:00–20:00',eta:'18:45',actual:null,issues:[]},
    ]
  }
];

/* ═══════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════ */
let selectedSM = null;
let mapMarkers = {}; window.mapMarkers = mapMarkers;
let map;
let routeLayers = [];
let stopMarkers = [];
let breadcrumbMarkers = []; // motorista mode breadcrumb trail
let commMarkers = [];       // comunicação mode event pins (legacy, kept for compat)
let delivOnlyMarkers = [];  // locais mode — delivery only
let activeTab = 'tab-timeline';
let sidebarOpen = false;
/* ═══════════════════════════════════════════════════════════════
   FILTER STATE — central source of truth
═══════════════════════════════════════════════════════════════ */
const activeFilters = {
  status: 'todos',      // chip rápido: todos | critico | parado | em_rota
  kpi: null,            // KPI clicado
  etaStatus: null,      // chip ETA: null | 'atrasado' | 'no_limite'
  search: '',
  clients: [],
  operations: [],
  riskRanges: [],
  driver: '',
  city: '',
};
/* Frota-specific filters — only applied when currentPanelMode === 'frota' */
const fleetFilters = {
  statuses: [],     // ['em_rota','disponivel','manutencao','reserva','terceiros']
  cats: [],         // ['TRUCK','CARRETA']
  maintWindows: [], // ['urgent','soon','scheduled','none']
  fuelBands: [],    // ['low','mid','high']
  plateQ: '',
};
let currentFilter = 'todos';

