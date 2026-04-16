function _matchesETAStatus(sm){
  const e = activeFilters.etaStatus;
  if(!e) return true;
  return getETAStatus(sm) === e;
}

function setEtaFilter(val, el){
  // Toggle off if same chip clicked again
  if(activeFilters.etaStatus === val){
    activeFilters.etaStatus = null;
    document.querySelectorAll('.eta-q-chip').forEach(c=>c.className='eta-q-chip');
  } else {
    activeFilters.etaStatus = val;
    document.querySelectorAll('.eta-q-chip').forEach(c=>c.className='eta-q-chip');
    if(el) el.classList.add('active-'+val);
  }
  applyFilters();
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function riskClass(r){ return r>=80?'critical':r>=61?'high':r>=31?'medium':'low' }
function riskColor(r){ return r>=80?'#FF2D55':r>=61?'#FF9F0A':r>=31?'#FF6B00':'#30D158' }

/* ═══════════════════════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════════════════════ */
function updateClock(){const el=document.getElementById('clock');if(el)el.textContent=new Date().toLocaleTimeString('pt-BR')}
setInterval(updateClock,1000); updateClock();

/* Update all ETA countdown texts every 30s without re-rendering cards */
function updateEtaCountdowns(){
  document.querySelectorAll('.eta-countdown').forEach(el=>{
    const hhmm = el.getAttribute('data-eta');
    const d = parseEtaTime(hhmm);
    if(d) el.textContent = countdownText(d);
  });
}
setInterval(updateEtaCountdowns, 30000);

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR TOGGLE
═══════════════════════════════════════════════════════════════ */
function toggleSidebar(){
  sidebarOpen=!sidebarOpen;
  document.getElementById('sidebar').classList.toggle('expanded',sidebarOpen);
  setTimeout(()=>{if(map)map.invalidateSize()},240);
}

/* ═══════════════════════════════════════════════════════════════
   KPI TOGGLE / VIEW MODE
═══════════════════════════════════════════════════════════════ */
function toggleKpiDropdown(ev){
  if(ev) ev.stopPropagation();
  const vd=document.getElementById('view-dropdown');
  if(vd) vd.classList.remove('open');
  document.getElementById('kpi-dropdown').classList.toggle('open');
}
function toggleViewDropdown(ev){
  if(ev) ev.stopPropagation();
  document.getElementById('kpi-dropdown').classList.remove('open');
}
function toggleViewMode(){
  const app = document.querySelector('.app');
  const current = app.dataset.view || 'default';
  setViewMode(current === 'clean' ? 'default' : 'clean');
}
document.addEventListener('click',()=>{
  document.getElementById('kpi-dropdown').classList.remove('open');
});
function toggleKpi(id,show){
  const el=document.getElementById('kpi-'+id);
  if(el) el.classList.toggle('hidden',!show);
  // Hide the whole group (label + divider) when all its KPIs are hidden
  document.querySelectorAll('.kpi-group').forEach(g=>{
    const items=g.querySelectorAll('.kpi');
    const allHidden=Array.from(items).every(k=>k.classList.contains('hidden'));
    g.style.display=allHidden?'none':'';
  });
}
function setViewMode(mode){
  // mode: 'default' | 'clean'
  const app=document.querySelector('.app');
  if(!app) return;
  app.dataset.view=mode;
  // Swap the icon to reflect what the next click WILL do
  const icon = document.getElementById('view-mode-icon');
  const btn = document.getElementById('view-mode-btn');
  if(icon){
    if(mode === 'clean'){
      icon.className = 'fa-solid fa-map-location-dot';
      if(btn) btn.setAttribute('data-tip','Voltar ao modo padrão');
    } else {
      icon.className = 'fa-solid fa-table-columns';
      if(btn) btn.setAttribute('data-tip','Modo mapa limpo');
    }
  }
  // Recompute leaflet sizing after layout change
  setTimeout(()=>{ if(typeof map!=='undefined' && map) map.invalidateSize(); },300);
}

/* ═══════════════════════════════════════════════════════════════
   OPS SUMMARY — Saúde · Tratativas · Operadores
═══════════════════════════════════════════════════════════════ */
function openOpsDetail(which){
  // Stub: real panels TBD. For now, surface intent via toast.
  const labels={saude:'Saúde da operação',tratativas:'Fila de tratativas',operadores:'Operadores no turno'};
  if(typeof showActionToast==='function'){
    showActionToast(`${labels[which]||which} — painel em desenvolvimento`);
  }else{
    console.log('openOpsDetail:',which);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CARD PRESETS — density of information per card
═══════════════════════════════════════════════════════════════ */
// Two card visualizations: compact | detailed.
let currentPreset = 'compact'; // compact | detailed
let currentPanelMode = 'operacoes'; // operacoes | frota
let modeSwitchInFlight = false;

function setCardPreset(preset){
  currentPreset = preset;
  // Sync the segmented toggle visual state
  document.querySelectorAll('.view-seg-btn').forEach(b=>{
    const isActive = b.dataset.view===preset;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  // Re-render whichever list is currently active
  if(currentPanelMode === 'frota'){
    renderFleetCards();
  } else {
    renderCards(getFilteredSMs());
  }
}

/* ══ FLEET DATASET ═══════════════════════════════════════════════ */
const Vehicles = [
  {plate:'ABC-1D23', cat:'CARRETA', model:'Carreta Volvo FH 500',   driver:'Ricardo Matos',  driverScore:71, status:'em_rota',    risk:84,   kmTotal:248412, kmHoje:248, fuel:62, activeSm:'SM-984553', predMaintDays:3,  tags:[{label:'Parado fora de rota',type:'danger'},{label:'Manut. prev. em 3d',type:'amber'}]},
  {plate:'BRA-2E49', cat:'TRUCK',   model:'Truck Scania R450',      driver:'Carlos Silva',   driverScore:88, status:'em_rota',    risk:92,   kmTotal:198730, kmHoje:312, fuel:74, activeSm:'SM-984552', predMaintDays:13, tags:[{label:'OTIF em risco',type:'danger'}]},
  {plate:'DEF-3F67', cat:'TRUCK',   model:'Truck Mercedes Actros',  driver:'André Lima',     driverScore:97, status:'em_rota',    risk:12,   kmTotal:92000,  kmHoje:156, fuel:88, activeSm:'SM-984554', predMaintDays:34, tags:[]},
  {plate:'GHI-4K89', cat:'TRUCK',   model:'Truck Volvo FM 420',     driver:'Luciana Paes',   driverScore:82, status:'em_rota',    risk:38,   kmTotal:156800, kmHoje:204, fuel:71, activeSm:'SM-984555', predMaintDays:21, tags:[]},
  {plate:'JKL-5M10', cat:'CARRETA', model:'Carreta DAF XF 530',     driver:'Paulo Gomes',    driverScore:68, status:'em_rota',    risk:55,   kmTotal:302450, kmHoje:412, fuel:58, activeSm:'SM-984556', predMaintDays:6,  tags:[{label:'Velocidade alta',type:'amber'}]},
  {plate:'MNO-6P31', cat:'TRUCK',   model:'Truck Iveco Tector',     driver:'Fernanda Cruz',  driverScore:91, status:'em_rota',    risk:22,   kmTotal:68200,  kmHoje:178, fuel:82, activeSm:'SM-984557', predMaintDays:28, tags:[]},
  {plate:'PQR-8L45', cat:'TRUCK',   model:'Truck Scania P360',      driver:null,             driverScore:null,status:'manutencao', risk:null, kmTotal:412800, kmHoje:0,   fuel:38, activeSm:null,        predMaintDays:3,  tags:[{label:'Manut. preditiva',type:'amber'}]},
  {plate:'STU-9N72', cat:'TRUCK',   model:'Truck Volvo VM 270',     driver:null,             driverScore:null,status:'manutencao', risk:null, kmTotal:189500, kmHoje:0,   fuel:22, activeSm:null,        predMaintDays:1,  tags:[{label:'Troca de óleo',type:'danger'}]},
  {plate:'VWX-2R03', cat:'TRUCK',   model:'Truck Mercedes Axor',    driver:null,             driverScore:null,status:'disponivel', risk:null, kmTotal:142300, kmHoje:0,   fuel:95, activeSm:null,        predMaintDays:45, tags:[]},
  {plate:'YZA-3T58', cat:'CARRETA', model:'Carreta Volvo FH 460',   driver:null,             driverScore:null,status:'disponivel', risk:null, kmTotal:78950,  kmHoje:0,   fuel:88, activeSm:null,        predMaintDays:60, tags:[]},
  {plate:'BCD-4U91', cat:'CARRETA', model:'Carreta Scania G410',    driver:null,             driverScore:null,status:'reserva',    risk:null, kmTotal:56400,  kmHoje:0,   fuel:100,activeSm:null,        predMaintDays:90, tags:[]},
  {plate:'EFG-5V22', cat:'TRUCK',   model:'Truck Ford Cargo',       driver:'Tercerizado',    driverScore:null,status:'terceiros',  risk:null, kmTotal:0,      kmHoje:0,   fuel:null,activeSm:null,       predMaintDays:null,tags:[{label:'Terceirizado',type:'neutral'}]},
];

const STATUS_LABEL = {em_rota:'Em rota', disponivel:'Disponível', manutencao:'Manutenção', reserva:'Reserva', terceiros:'Terceiros'};

function riskClassNum(n){
  if(n==null) return '';
  if(n>=80) return 'risk-critical';
  if(n>=60) return 'risk-high';
  if(n>=30) return 'risk-medium';
  return 'risk-low';
}
function driverScoreClass(n){
  if(n==null) return '';
  if(n>=85) return 'sg-good';
  if(n>=70) return 'sg-warn';
  return 'sg-bad';
}
function maintSeverity(days){
  if(days==null) return '';
  if(days<=2) return 'sev-red';
  if(days<=7) return 'sev-amber';
  return 'sev-green';
}
function fmtKm(n){
  if(n==null) return '—';
  return n.toLocaleString('pt-BR');
}
function vehicleIcon(status){
  if(status==='manutencao') return '<i class="fa-solid fa-wrench"></i>';
  if(status==='disponivel') return '<i class="fa-solid fa-circle-check"></i>';
  if(status==='reserva')    return '<i class="fa-solid fa-clock"></i>';
  if(status==='terceiros')  return '<i class="fa-solid fa-handshake"></i>';
  return '<i class="fa-solid fa-truck"></i>';
}

/* ══ FLEET KPIs ═══════════════════════════════════════════════════ */
function updateFleetKpis(){
  const emRota = Vehicles.filter(v=>v.status==='em_rota').length;
  const disponivel = Vehicles.filter(v=>v.status==='disponivel').length;
  const manutencao = Vehicles.filter(v=>v.status==='manutencao').length;
  const reserva = Vehicles.filter(v=>v.status==='reserva').length;
  const terceiros = Vehicles.filter(v=>v.status==='terceiros').length;
  const predAlerta = Vehicles.filter(v=>v.predMaintDays!=null && v.predMaintDays<=7).length;
  const set = (id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
  set('kpiv-fleet-em_rota', emRota);
  set('kpiv-fleet-disponivel', disponivel);
  set('kpiv-fleet-manutencao', manutencao);
  set('kpiv-fleet-pred_alerta', predAlerta);
  // Sync contextual chip counts
  set('ctx-frota-all', Vehicles.length);
  set('ctx-frota-em_rota', emRota);
  set('ctx-frota-disponivel', disponivel);
  set('ctx-frota-manutencao', manutencao);
  set('ctx-frota-reserva', reserva);
  set('ctx-frota-terceiros', terceiros);
}

/* ══ CONTEXTUAL FILTERS ════════════════════════════════════════════
   Ops chips: quick filters on the SM list (critico/parado/atrasado).
   Frota chips: quick filters on the fleet list by vehicle status. */
let opsCtxFilter = 'all';
let frotaCtxFilter = 'all';

function setOpsContext(ctx){
  opsCtxFilter = ctx;
  document.querySelectorAll('#ctx-row-ops .ctx-chip').forEach(c=>{
    c.classList.toggle('active', c.dataset.ctx === ctx);
  });
  applyFilters();
}
function setFrotaContext(ctx){
  frotaCtxFilter = ctx;
  document.querySelectorAll('#ctx-row-frota .ctx-chip').forEach(c=>{
    c.classList.toggle('active', c.dataset.ctx === ctx);
  });
  renderFleetCards();
}
function updateOpsContextCounts(){
  const set = (id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
  set('ctx-ops-all', SMs.length);
  set('ctx-ops-critico', SMs.filter(s=>(s.risk||0) >= 80).length);
  set('ctx-ops-parado', SMs.filter(s=>s.status==='parado').length);
  set('ctx-ops-atrasado', SMs.filter(s=>s.etaDelay && /\+/.test(s.etaDelay)).length);
}

/* ══ FROTA FILTER MATCHERS ═══════════════════════════════════════ */
function _fleetMaintBucket(days){
  if(days==null) return 'none';
  if(days<=7) return 'urgent';
  if(days<=30) return 'soon';
  return 'scheduled';
}
function _fleetFuelBand(fuel){
  if(fuel==null) return null;
  if(fuel<30) return 'low';
  if(fuel<=70) return 'mid';
  return 'high';
}
function _matchesFleetFilters(v){
  if(fleetFilters.statuses.length && !fleetFilters.statuses.includes(v.status)) return false;
  if(fleetFilters.cats.length && !fleetFilters.cats.includes(v.cat)) return false;
  if(fleetFilters.maintWindows.length && !fleetFilters.maintWindows.includes(_fleetMaintBucket(v.predMaintDays))) return false;
  if(fleetFilters.fuelBands.length){
    const band = _fleetFuelBand(v.fuel);
    if(!band || !fleetFilters.fuelBands.includes(band)) return false;
  }
  const q = fleetFilters.plateQ.trim().toLowerCase();
  if(q){
    const hay = ((v.plate||'') + ' ' + (v.model||'')).toLowerCase();
    if(!hay.includes(q)) return false;
  }
  return true;
}
function getFilteredFleet(){
  return Vehicles.filter(_matchesFleetFilters);
}

/* ══ RENDER FLEET CARDS ══════════════════════════════════════════ */
function renderFleetCards(){
  const container = document.getElementById('fleet-list');
  if(!container) return;
  const list = getFilteredFleet();
  // Sync the shared count badge when in frota mode
  if(currentPanelMode === 'frota'){
    const cnt = document.getElementById('sm-count');
    if(cnt) cnt.textContent = `${list.length} de ${Vehicles.length}`;
  }
  const rows = list.map(v=>{
    const hasRisk = v.risk!=null;
    const riskCls = riskClassNum(v.risk);
    const dsCls = driverScoreClass(v.driverScore);
    const maintTxt = v.predMaintDays==null ? '—' :
      (v.predMaintDays===1 ? '⚡ em 1 dia' : `⚡ em ${v.predMaintDays} dias`);
    const maintCls = maintSeverity(v.predMaintDays);
    const statusLbl = STATUS_LABEL[v.status] || v.status;
    const driverLine = v.driver ? `<div class="fleet-driver">${v.driver}${v.driverScore!=null?` <span class="driver-score ${dsCls}">${v.driverScore}</span>`:''}</div>` : '';
    const tagsHtml = v.tags.length ? `<div class="fleet-tags">${v.tags.map(t=>`<span class="fleet-tag tag-${t.type}">${t.label}</span>`).join('')}</div>` : '';
    const statsHtml = `
      <div class="fleet-stats">
        <div class="fleet-stat"><span class="fleet-stat-val">${fmtKm(v.kmTotal)}</span><span class="fleet-stat-lbl">KM total</span></div>
        <div class="fleet-stat"><span class="fleet-stat-val">${v.kmHoje}</span><span class="fleet-stat-lbl">KM hoje</span></div>
        <div class="fleet-stat"><span class="fleet-stat-val">${v.fuel!=null?v.fuel+'%':'—'}</span><span class="fleet-stat-lbl">Combustível</span></div>
        <div class="fleet-stat"><span class="fleet-stat-val">${v.activeSm||'—'}</span><span class="fleet-stat-lbl">SM ativa</span></div>
      </div>`;
    // Status badge lives in the side column now so it never collides
    // with plate/cat on narrow cards. Risk circle (if any) sits below it;
    // when there is no risk, the maint badge is promoted to that slot.
    const sideHtml = hasRisk
      ? `<span class="fleet-status st-${v.status}">${statusLbl}</span>
         <div class="fleet-risk ${riskCls}">${v.risk}</div>
         <div class="fleet-maint ${maintCls}">${maintTxt}</div>`
      : `<span class="fleet-status st-${v.status}">${statusLbl}</span>
         <div class="fleet-maint ${maintCls} is-promoted">${maintTxt}</div>`;
    return `
      <div class="fleet-card preset-${currentPreset} st-${v.status}" data-plate="${v.plate}" onclick="toggleFleetCard('${v.plate}', event)">
        <div class="fleet-upper">
          <div class="fleet-icon">${vehicleIcon(v.status)}</div>
          <div class="fleet-body">
            <div class="fleet-row-1">
              <span class="fleet-plate">${v.plate}</span>
              <span class="fleet-cat">${v.cat}</span>
            </div>
            <div class="fleet-model">${v.model}</div>
            ${driverLine}
          </div>
          <div class="fleet-side">
            ${sideHtml}
          </div>
        </div>
        ${statsHtml}
        ${tagsHtml}
        ${renderFleetDetails(v)}
      </div>`;
  }).join('');
  container.innerHTML = rows;
}

/* ══ FLEET DETAILS (expandable) ═════════════════════════════════
   Reveals Telemetria / Manutenção / Histórico for a vehicle. */
function renderFleetDetails(v){
  const telemetry = v.telemetry || {
    speed: v.status==='em_rota' ? (40 + Math.round(v.risk/3)) : 0,
    rpm: v.status==='em_rota' ? (1400 + Math.round(v.risk*8)) : 0,
    engineTemp: v.status==='manutencao' ? '—' : (82 + Math.round(v.risk/10)),
    battery: 12 + (v.fuel != null ? Math.round(v.fuel/100) : 0),
  };
  const behav = v.behavior || {freadas:0, curvas:0, velocidade:0};
  const maintHist = v.maintHistory || [
    {label:'Revisão preventiva', when:'03/03', cost:'R$ 1.240', status:'ok'},
    {label:'Troca de óleo', when:'18/02', cost:'R$ 480', status:'ok'},
  ];
  const smHist = v.smHistory || [
    {id:'SM-984528', client:'Bombril', route:'SP → Santos', date:'04/04', otif:'warn'},
    {id:'SM-984512', client:'Kellux',  route:'SP → Campinas', date:'03/04', otif:'ok'},
    {id:'SM-984498', client:'Fenza',   route:'SP → Ribeirão', date:'02/04', otif:'ok'},
  ];
  return `
    <div class="fleet-details" onclick="event.stopPropagation()">
      <div class="fleet-details-tabs" role="tablist">
        <button class="fd-tab active" data-tab="telemetria" onclick="setFleetTab(this,'telemetria')">Telemetria</button>
        <button class="fd-tab" data-tab="manutencao" onclick="setFleetTab(this,'manutencao')">Manutenção</button>
        <button class="fd-tab" data-tab="historico" onclick="setFleetTab(this,'historico')">Histórico</button>
      </div>
      <div class="fd-pane is-active" data-pane="telemetria">
        <div class="fd-grid">
          <div class="fd-metric"><div class="fd-metric-lbl">Velocidade</div><div class="fd-metric-val">${telemetry.speed}<span>km/h</span></div></div>
          <div class="fd-metric"><div class="fd-metric-lbl">RPM</div><div class="fd-metric-val">${telemetry.rpm}</div></div>
          <div class="fd-metric"><div class="fd-metric-lbl">Temp. motor</div><div class="fd-metric-val">${telemetry.engineTemp}${telemetry.engineTemp==='—'?'':'<span>°C</span>'}</div></div>
          <div class="fd-metric"><div class="fd-metric-lbl">Combustível</div><div class="fd-metric-val ${v.fuel!=null&&v.fuel<30?'is-low':''}">${v.fuel!=null?v.fuel:'—'}<span>%</span></div></div>
        </div>
        <div class="fd-section-lbl">Comportamento do motorista — hoje</div>
        <div class="fd-behav">
          <div class="fd-behav-item ${behav.freadas>2?'is-warn':''}"><i class="fa-solid fa-bolt"></i><span>${behav.freadas}</span> freadas</div>
          <div class="fd-behav-item ${behav.curvas>2?'is-warn':''}"><i class="fa-solid fa-route"></i><span>${behav.curvas}</span> curvas</div>
          <div class="fd-behav-item ${behav.velocidade>0?'is-warn':''}"><i class="fa-solid fa-gauge-high"></i><span>${behav.velocidade}</span> veloc.</div>
        </div>
      </div>
      <div class="fd-pane" data-pane="manutencao">
        ${v.predMaintDays!=null && v.predMaintDays<=7 ? `
          <div class="fd-pred-alert">
            <i class="fa-solid fa-bolt"></i>
            <div>
              <div class="fd-pred-title">Manutenção preditiva</div>
              <div class="fd-pred-sub">Previsão em ${v.predMaintDays} ${v.predMaintDays===1?'dia':'dias'}</div>
            </div>
          </div>` : ''}
        <div class="fd-section-lbl">Histórico recente</div>
        <div class="fd-maint-list">
          ${maintHist.map(m=>`
            <div class="fd-maint-row">
              <span class="fd-maint-dot st-${m.status}"></span>
              <div class="fd-maint-body">
                <div class="fd-maint-lbl">${m.label}</div>
                <div class="fd-maint-sub">${m.when} · ${m.cost}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="fd-pane" data-pane="historico">
        <div class="fd-stats-row">
          <div class="fd-stat-box"><div class="fd-stat-val">${v.kmTotal?fmtKm(v.kmTotal):'—'}</div><div class="fd-stat-lbl">KM total</div></div>
          <div class="fd-stat-box"><div class="fd-stat-val">88<span>%</span></div><div class="fd-stat-lbl">OTIF médio</div></div>
          <div class="fd-stat-box"><div class="fd-stat-val">${smHist.length}</div><div class="fd-stat-lbl">Últimas SMs</div></div>
        </div>
        <div class="fd-section-lbl">Últimas SMs</div>
        <div class="fd-sm-list">
          ${smHist.map(s=>`
            <div class="fd-sm-row">
              <span class="fd-sm-id">${s.id}</span>
              <span class="fd-sm-client">${s.client}</span>
              <span class="fd-sm-route">${s.route}</span>
              <span class="fd-sm-date">${s.date}</span>
              <span class="fd-sm-otif ot-${s.otif}">${s.otif==='ok'?'OK':s.otif==='warn'?'⚠':'✕'}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function toggleFleetCard(plate, e){
  if(e) e.stopPropagation();
  const card = document.querySelector(`.fleet-card[data-plate="${plate}"]`);
  if(!card) return;
  const wasOpen = card.classList.contains('is-expanded');
  // Close any other open card
  document.querySelectorAll('.fleet-card.is-expanded').forEach(c=>c.classList.remove('is-expanded'));
  if(!wasOpen) card.classList.add('is-expanded');
}
function setFleetTab(btn, tab){
  const details = btn.closest('.fleet-details');
  if(!details) return;
  details.querySelectorAll('.fd-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  details.querySelectorAll('.fd-pane').forEach(p=>p.classList.toggle('is-active', p.dataset.pane===tab));
}

/* ══ MODE SWITCH (Operações ↔ Frota) ═════════════════════════════
   Clip-slide transition: outgoing list slides down and fades (clipped
   by the box's bottom edge), incoming list drops in from above into
   its resting position. Both lists live inside .mode-stage which has
   overflow:hidden so the motion is visually clipped. */
function setPanelMode(mode){
  if(mode === currentPanelMode || modeSwitchInFlight) return;
  modeSwitchInFlight = true;

  // 1. Sync sidebar nav-sub-item active state for Operacional/Frota
  document.querySelectorAll('[data-panel-mode]').forEach(el=>{
    const isActive = el.dataset.panelMode===mode;
    el.classList.toggle('active', isActive);
  });

  // 2. Crossfade KPI strips immediately (these live outside the stage)
  const stripOps = document.getElementById('kpi-strip');
  const stripFrota = document.getElementById('kpi-strip-frota');
  if(mode === 'frota'){
    updateFleetKpis();
    stripOps.classList.remove('is-active');
    stripFrota.classList.add('is-active');
    stripOps.setAttribute('aria-hidden','true');
    stripFrota.setAttribute('aria-hidden','false');
  } else {
    stripFrota.classList.remove('is-active');
    stripOps.classList.add('is-active');
    stripFrota.setAttribute('aria-hidden','true');
    stripOps.setAttribute('aria-hidden','false');
  }

  // 3. Sync shared count badge for the new mode
  const cntEl = document.getElementById('sm-count');
  if(cntEl){
    if(mode === 'frota'){
      const list = getFilteredFleet();
      cntEl.textContent = `${list.length} de ${Vehicles.length}`;
    } else {
      const filtered = getFilteredSMs();
      cntEl.textContent = `${filtered.length} de ${SMs.length}`;
    }
  }

  // 4. Clip-slide: mark outgoing list, render/show incoming list
  const smList = document.getElementById('sm-list');
  const fleetList = document.getElementById('fleet-list');
  const outgoing = (mode === 'frota') ? smList : fleetList;
  const incoming = (mode === 'frota') ? fleetList : smList;

  // Commit new mode immediately so dependent UI (filter trigger badge,
  // count, back panel render) reflects the correct context.
  currentPanelMode = mode;

  // Pre-render incoming content so it's ready when it enters
  if(mode === 'frota') renderFleetCards();

  // Start exit animation on the outgoing list
  outgoing.classList.remove('is-active');
  outgoing.classList.add('is-exiting');
  outgoing.setAttribute('aria-hidden','true');

  // Slight stagger so the incoming drop overlaps with the exit
  setTimeout(()=>{
    incoming.classList.add('is-active');
    incoming.setAttribute('aria-hidden','false');
  }, 80);

  // Update filter trigger badge for the new mode's filter state
  updateFilterTrigger();

  // Cleanup after the transition completes
  setTimeout(()=>{
    outgoing.classList.remove('is-exiting');
    modeSwitchInFlight = false;
  }, 500);
}

/* ═══════════════════════════════════════════════════════════════
   RENDER CARDS
═══════════════════════════════════════════════════════════════ */
/* ── Card v4 helpers ──────────────────────────────────────────── */
// Parse "14:32" → Date for today; returns null if invalid
function parseEtaTime(hhmm){
  if(!hhmm||typeof hhmm!=='string') return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  const d = new Date();
  d.setHours(parseInt(m[1],10), parseInt(m[2],10), 0, 0);
  return d;
}
// Compute countdown text relative to now: "em 2h14" / "em 47min" / "há 12min" / "agora"
function countdownText(etaDate){
  if(!etaDate) return '—';
  const now = new Date();
  let diffMin = Math.round((etaDate - now) / 60000);
  const sign = diffMin >= 0 ? 'em' : 'há';
  diffMin = Math.abs(diffMin);
  if(diffMin < 1) return 'agora';
  if(diffMin < 60) return `${sign} ${diffMin}min`;
  const h = Math.floor(diffMin/60);
  const m = diffMin % 60;
  return m>0 ? `${sign} ${h}h${String(m).padStart(2,'0')}` : `${sign} ${h}h`;
}
// Map operation type to mono 3-letter sigla
function opSigla(type){
  const m={'LTL':'LTL','FTL':'FTL','Dedicado':'DED','Transferência':'TRA','Mutação':'MUT'};
  return m[type]||type.slice(0,3).toUpperCase();
}
// LTL has multiple deliveries → pick first pending as "next"
// Others are direct (single destination) → return null
function nextLocation(sm){
  if(sm.type!=='LTL') return null;
  // Primary: hardcoded SMs have detailed routeStops array with type:'delivery'
  if(sm.routeStops && sm.routeStops.length){
    const next = sm.routeStops.find(s=>s.type==='delivery' && s.status==='pending');
    if(next){
      const parts = next.label.split('—');
      return parts.length>1 ? parts[1].trim() : next.label;
    }
  }
  // Fallback: generated SMs have milestones with label:"Ponto N — Dest"
  if(sm.milestones && sm.milestones.length){
    // Find first non-done, non-current "Ponto" milestone
    const next = sm.milestones.find(m=>!m.done && !m.current && /^Ponto/.test(m.label));
    if(next){
      const parts = next.label.split('—');
      return parts.length>1 ? parts[1].trim() : next.label;
    }
  }
  return null;
}
// Status chip: icon + label + optional duration (extracted from alerts if parado)
function buildStatusChip(sm){
  const map={em_rota:{cls:'s-em-rota',lbl:'Em rota'},parado:{cls:'s-parado',lbl:'Parado'},aguardando:{cls:'s-aguardando',lbl:'Aguardando'}};
  const s = map[sm.status]||{cls:'',lbl:sm.status};
  // Find duration from alerts if parado (e.g. "Parado 45min" → "45min")
  let duration='';
  if(sm.status==='parado'&&sm.alerts){
    const stopAlert = sm.alerts.find(a=>/parado\s+\d+/i.test(a.text));
    if(stopAlert){
      const m = stopAlert.text.match(/(\d+\s*min)/i);
      if(m) duration = m[1];
    }
  }
  return `<span class="status-chip ${s.cls}">${s.lbl}${duration?` <span class="sc-duration">${duration}</span>`:''}</span>`;
}
// Alert pill class mapping: critical/geo/telem
function apillClass(t){
  if(t==='geo') return 'geo';
  if(t==='warn') return 'telem';
  return 'critical';
}

function renderCards(list){
  const container=document.getElementById('sm-list');
  container.innerHTML='';
  list.forEach(sm=>{
    const rc=riskClass(sm.risk);
    const etaStatus = getETAStatus(sm); // 'atrasado' | 'no_limite' | null
    const next = nextLocation(sm);
    const routeGlobal = `${sm.origin} → ${sm.destination}`;

    // Route line HTML: LTL with next delivery shows "Next · Origin → Destination"
    // Direct (non-LTL) shows "[Direto] Origin → Destination"
    const routeHtml = next
      ? `<div class="route-line">
           <span class="route-ico"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span>
           <span class="route-next" data-tip="Próxima entrega">${next}</span>
           <span class="route-sep">·</span>
           <span class="route-global" data-tip="Rota completa">${routeGlobal}</span>
         </div>`
      : `<div class="route-line">
           <span class="route-ico"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span>
           <span class="route-direct">Direto</span>
           <span class="route-global" data-tip="Rota completa">${routeGlobal}</span>
         </div>`;

    // Route zone with progress bar glued to bottom edge
    // Derive "next point" info for detailed preset: pick first pending routeStop
    const nextStop = (sm.routeStops||[]).find(st=>st.status==='pending');
    const nextStopName = nextStop
      ? (nextStop.label||'').split('—')[0].trim()
      : sm.destination;
    // Synthetic distance/time until next point (real data would come from routing API)
    // Heuristic: use sm.progress to invert — less progress = more distance remaining
    const remainingPct = Math.max(5, 100 - (sm.progress||0));
    const synthKm = Math.round(remainingPct * 2.4); // ~240km total range
    const synthMin = Math.round(remainingPct * 1.8);
    const synthTime = synthMin >= 60
      ? `${Math.floor(synthMin/60)}h${String(synthMin%60).padStart(2,'0')}`
      : `${synthMin}min`;
    // Sequence indicator for LTL/multi-stop (e.g. "3/7")
    const totalStops = (sm.routeStops||[]).filter(s=>s.type!=='origin').length;
    const doneStops = (sm.routeStops||[]).filter(s=>s.type!=='origin' && s.status==='done').length;
    const seqIndicator = totalStops>1 ? `${doneStops+1}/${totalStops}` : '';
    const routeNextLineHtml = `
      <div class="route-next-line" data-tip="Próximo ponto: ${nextStopName}">
        <span class="rnl-arrow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span>
        <span class="rnl-dest">${nextStopName}</span>
        <span class="rnl-meta">· ${synthKm}km · ${synthTime}</span>
        ${seqIndicator?`<span class="rnl-seq">${seqIndicator}</span>`:''}
      </div>`;

    const routeZoneHtml = `
      <div class="route-zone">
        ${routeHtml}
        ${routeNextLineHtml}
        <div class="route-progress" data-tip="${Math.max(3,sm.progress)}% até o próximo ponto"><div class="rpf" style="width:${Math.max(3,sm.progress)}%"></div></div>
      </div>`;

    // Device strip (detailed only): GPS / Battery / Signal / App status
    // Critical thresholds: battery <30%, signal weak/2G, app closed, gps inactive
    const A = sm.appStatus || {};
    const batPct = parseInt((A.battery||'').replace('%',''))||0;
    const batCrit = batPct>0 && batPct<30 ? 'crit' : (batPct<50 ? 'warn' : '');
    const sigCrit = /fraco|2G|sem/i.test(A.signal||'') ? 'crit' : (/3G/i.test(A.signal||'') ? 'warn' : '');
    const appCrit = /fechado|offline/i.test(A.app||'') ? 'crit' : '';
    const gpsCrit = /inativo|sem/i.test(A.gps||'') ? 'crit' : '';
    const deviceStripHtml = (A.gps||A.battery||A.signal||A.app) ? `
      <div class="device-strip">
        <span class="dv-chip ${gpsCrit}" data-tip="GPS: ${A.gps||'—'}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><path d="M8 .8v2.2M8 13v2.2M.8 8h2.2M13 8h2.2"/></svg>
          <span class="dv-val">${A.gps||'—'}</span>
        </span>
        <span class="dv-chip ${batCrit}" data-tip="Bateria: ${A.battery||'—'}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="11" height="6" rx="1"/><path d="M14 7v2"/></svg>
          <span class="dv-val">${A.battery||'—'}</span>
        </span>
        <span class="dv-chip ${sigCrit}" data-tip="Sinal: ${A.signal||'—'}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2M6 10h2M10 8h2M14 6v6"/></svg>
          <span class="dv-val">${(A.signal||'—').replace(/\(|\)/g,'').split(' ').pop()||A.signal}</span>
        </span>
        <span class="dv-chip ${appCrit}" data-tip="App: ${A.app||'—'}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="8" height="12" rx="1"/><path d="M7 12h2"/></svg>
          <span class="dv-val">${A.app||'—'}</span>
        </span>
      </div>` : '';

    // ETA calculation — shared between compact foot and detailed ring
    const etaDate = parseEtaTime(sm.eta);
    const countdown = countdownText(etaDate);

    // Compact/Standard footer: pill ETA (quando aplicável) + status texto leve
    // Status vira COMPLEMENTO da pill (mesma linha BL), sem fundo nem borda
    // ETA Atrasado → count up ("ETA Atrasado · há 47min")
    // ETA Limite → count down ("ETA Limite · em 18min")
    // No prazo → pill some, status continua sozinho
    const statusMap = {em_rota:{cls:'s-em-rota',lbl:'Em rota'},parado:{cls:'s-parado',lbl:'Parado'},aguardando:{cls:'s-aguardando',lbl:'Aguardando'}};
    const stObj = statusMap[sm.status]||{cls:'',lbl:sm.status};
    let stDuration = '';
    if(sm.status==='parado' && sm.alerts){
      const stopAlert = sm.alerts.find(a=>/parado\s+\d+/i.test(a.text));
      if(stopAlert){
        const m = stopAlert.text.match(/(\d+\s*min)/i);
        if(m) stDuration = m[1];
      }
    }
    const statusTextHtml = `<span class="status-text ${stObj.cls}">${stObj.lbl}${stDuration?` <span class="sc-duration">${stDuration}</span>`:''}</span>`;

    let compactFootHtml;
    if(etaStatus){
      const label = etaStatus==='atrasado' ? 'ETA Atrasado' : 'ETA Limite';
      const pillTip = etaStatus==='atrasado'
        ? `Previsto: ${sm.eta||'—'} · Atraso ${sm.etaDelay||'—'}`
        : `Previsto: ${sm.eta||'—'} · Prazo se esgotando`;
      compactFootHtml = `
        <div class="card-compact-foot">
          <span class="eta-pill-mini ${etaStatus}" data-tip="${pillTip}">
            <span class="epm-label">${label}</span>
            <span class="epm-sep">·</span>
            <span class="epm-countdown eta-countdown" data-eta="${sm.eta||''}">${countdown}</span>
          </span>
          ${statusTextHtml}
        </div>`;
    } else {
      compactFootHtml = `
        <div class="card-compact-foot">
          ${statusTextHtml}
        </div>`;
    }

    // Alerts in detailed: pills with category coloring
    const alertsPillsHtml = (sm.alerts&&sm.alerts.length)
      ? `<div class="alerts-pills">${sm.alerts.map(a=>`<span class="apill ${apillClass(a.type)}">${a.text}</span>`).join('')}</div>`
      : `<div class="alerts-pills"></div>`;

    // ETA anchor: circular ring + countdown text
    // Ring fill: uses sm.progress as proxy for "consumed of planned time"
    const etaAnchorCls = etaStatus||'no_prazo';
    const ringPct = Math.min(100, Math.max(0, sm.progress||0));
    // Ring circumference: r=16, c = 2*π*r ≈ 100.53
    const circumference = 100.53;
    const dashoffset = circumference * (1 - ringPct/100);
    const etaAnchorHtml = `
      <div class="eta-anchor ${etaAnchorCls}" data-tip="ETA ${sm.eta||'—'} · progresso ${ringPct}%">
        <div class="eta-ring">
          <svg viewBox="0 0 40 40">
            <circle class="eta-ring-track" cx="20" cy="20" r="16"/>
            <circle class="eta-ring-fill" cx="20" cy="20" r="16"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${dashoffset}"/>
          </svg>
          <div class="eta-ring-hora">${sm.eta||'—'}</div>
        </div>
        <div class="eta-delta">
          <span class="eta-delta-label">ETA</span>
          <span class="eta-delta-value eta-countdown" data-eta="${sm.eta||''}">${countdown}</span>
        </div>
      </div>`;

    // Lower (detailed preset only): alerts inline chips zone
    // Legacy alerts-eta-row kept for backward compat but hidden in detailed via CSS
    const alertsInlineHtml = (sm.alerts&&sm.alerts.length)
      ? `<div class="alerts-inline">${sm.alerts.slice(0,4).map(a=>`<span class="apill ${apillClass(a.type)}" data-tip="${(a.text||'').replace(/"/g,'&quot;')}">${a.text}</span>`).join('')}</div>`
      : '';
    const lowerHtml = `
      <div class="card-lower">
        ${alertsInlineHtml}
        <div class="alerts-eta-row">
          ${alertsPillsHtml}
          ${etaAnchorHtml}
        </div>
        <div class="driver-line" data-tip="Motorista · Placa do veículo">
          <strong>${sm.driver}</strong> · <span class="plate">${sm.plate}</span>
        </div>
      </div>`;

    // Risk ring (renders visually only in detailed preset via CSS)
    // Ring fill: percentage = sm.risk (0-100)
    const riskCirc = 100.53;
    const riskPct = Math.min(100, Math.max(0, sm.risk||0));
    const riskOffset = riskCirc * (1 - riskPct/100);
    const riskRingHtml = `
      <span class="risk-ring risk-${rc}">
        <svg viewBox="0 0 40 40">
          <circle class="rrt" cx="20" cy="20" r="16"/>
          <circle class="rrf" cx="20" cy="20" r="16"
                  stroke-dasharray="${riskCirc}"
                  stroke-dashoffset="${riskOffset}"/>
        </svg>
        <span class="rrn">${sm.risk}</span>
      </span>`;

    // Vehicle icon removed in v39 — device-strip carries richer signal

    const div=document.createElement('div');
    div.className=`sm-card risk-${rc} preset-${currentPreset}`;
    div.id=`card-${sm.id}`;
    div.innerHTML=`
      <div class="card-upper">
        <div class="card-h-row">
          <div class="card-ident">
            <div class="card-ident-top">
              <span class="sm-id" data-tip="Manifesto de Serviço">${sm.id}</span>
              <span class="op-chip" data-tip="${sm.type}">${opSigla(sm.type)}</span>
              <span class="upd-time" data-tip="Última atualização">${sm.lastUpdate}</span>
            </div>
            <div class="card-ident-bottom">
              <span class="client-name" data-tip="Cliente embarcador">${sm.client}</span>
              <span class="driver-inline" data-tip="Motorista · Placa">${sm.driver} · <span class="plate">${sm.plate}</span>${sm.driverScore?` <span class="driver-score">${sm.driverScore}</span>`:''}</span>
              ${deviceStripHtml}
            </div>
          </div>
          <div class="meta-block status" data-tip="${(function(){
            const st = sm.status==='parado'?'Parado':sm.status==='em_rota'?'Em rota':sm.status==='aguardando'?'Aguardando':sm.status;
            const mainAlert = (sm.alerts||[]).find(a=>a.type==='alert'||a.type==='geo');
            return mainAlert ? `${st} · ${mainAlert.text.replace(/"/g,'&quot;')}` : st;
          })()}">
            ${buildStatusChip(sm)}
          </div>
          <div class="meta-block risk" data-tip="${(function(){
            const dangerDim = (sm.farol||[]).find(f=>f.status==='danger');
            const reason = dangerDim ? `${dangerDim.dim}: ${(dangerDim.detail||dangerDim.statusText||'').replace(/"/g,'&quot;')}` : 'Score composto';
            return `Risco ${sm.risk}/100 · ${reason}`;
          })()}">
            <span class="risk-inline">
              <span class="risk-num risk-${rc}">${sm.risk}</span>
              ${riskRingHtml}
            </span>
          </div>
        </div>
      </div>
      ${routeZoneHtml}
      ${compactFootHtml}
      ${lowerHtml}
    `;
    div.onclick=()=>selectSM(sm.id);
    container.appendChild(div);
  });
  // restore selection
  if(selectedSM){
    const el=document.getElementById(`card-${selectedSM}`);
    if(el) el.classList.add('selected');
  }
}

/* ═══════════════════════════════════════════════════════════════
   FILTERING — unified engine
   All filter dimensions combine with AND. activeFilters is the
   single source of truth; applyFilters() is the only entrypoint
   that triggers re-render, marker sync and map reposition.
═══════════════════════════════════════════════════════════════ */

function _matchesStatus(sm){
  const s = activeFilters.status;
  if(s==='todos') return true;
  if(s==='critico') return sm.risk>=80;
  if(s==='parado') return sm.status==='parado';
  if(s==='em_rota') return sm.status==='em_rota';
  return true;
}
function getETAStatus(sm){
  if(!sm.etaDelay) return null;
  const d = sm.etaDelay;
  let mins = 0;
  const hm = d.match(/(\d+)h/);  const mm = d.match(/(\d+)min/);
  if(hm) mins += parseInt(hm[1])*60;
  if(mm) mins += parseInt(mm[1]);
  if(mins<=0) return null;
  return mins<=30 ? 'no_limite' : 'atrasado';
}

function _matchesKpi(sm){
  const k = activeFilters.kpi;
  if(!k) return true;
  if(k==='eta_atrasado') return getETAStatus(sm)==='atrasado';
  if(k==='eta_no_limite') return getETAStatus(sm)==='no_limite';
  if(k==='sms_ativas') return true;
  if(k==='em_rota') return sm.status==='em_rota';
  if(k==='parados') return sm.status==='parado';
  if(k==='otif_risco') return sm.risk>=60; // proxy: OTIF at risk ≈ risk ≥ 60
  if(k==='alertas') return (sm.alerts||[]).length>0;
  if(k==='otif_pct') return true;
  if(k==='entregas_ok') return sm.status==='entregue' || sm.progress>=100;
  return true;
}
function _matchesSearch(sm){
  const q = activeFilters.search.trim().toLowerCase();
  if(!q) return true;
  return (
    sm.id.toLowerCase().includes(q) ||
    (sm.plate||'').toLowerCase().includes(q) ||
    (sm.driver||'').toLowerCase().includes(q) ||
    (sm.client||'').toLowerCase().includes(q) ||
    (sm.origin||'').toLowerCase().includes(q) ||
    (sm.destination||'').toLowerCase().includes(q) ||
    (sm.cte||'').toLowerCase().includes(q)
  );
}
function _matchesClients(sm){
  if(!activeFilters.clients.length) return true;
  return activeFilters.clients.includes(sm.client);
}
function _matchesOperations(sm){
  if(!activeFilters.operations.length) return true;
  return activeFilters.operations.includes(sm.type);
}
function _matchesRisk(sm){
  if(!activeFilters.riskRanges.length) return true;
  const r = sm.risk;
  return activeFilters.riskRanges.some(range=>{
    if(range==='low') return r<=30;
    if(range==='medium') return r>=31 && r<=60;
    if(range==='high') return r>=61 && r<=80;
    if(range==='critical') return r>=81;
    return false;
  });
}
function _matchesDriver(sm){
  const q = activeFilters.driver.trim().toLowerCase();
  if(!q) return true;
  return (sm.driver||'').toLowerCase().includes(q);
}
function _matchesCity(sm){
  const q = activeFilters.city.trim().toLowerCase();
  if(!q) return true;
  return (
    (sm.origin||'').toLowerCase().includes(q) ||
    (sm.destination||'').toLowerCase().includes(q)
  );
}

function _matchesOpsContext(sm){
  if(!opsCtxFilter || opsCtxFilter==='all') return true;
  if(opsCtxFilter==='critico') return (sm.risk||0) >= 80;
  if(opsCtxFilter==='parado')  return sm.status==='parado';
  if(opsCtxFilter==='atrasado')return !!(sm.etaDelay && /\+/.test(sm.etaDelay));
  return true;
}
function getFilteredSMs(){
  return SMs.filter(sm =>
    _matchesStatus(sm) &&
    _matchesKpi(sm) &&
    _matchesETAStatus(sm) &&
    _matchesSearch(sm) &&
    _matchesClients(sm) &&
    _matchesOperations(sm) &&
    _matchesRisk(sm) &&
    _matchesDriver(sm) &&
    _matchesCity(sm) &&
    _matchesOpsContext(sm)
  );
}

// Count how many "dimension" filters are active (for the badge on the advanced button)
function _countAdvancedFilters(){
  let n = 0;
  if(activeFilters.clients.length) n++;
  if(activeFilters.operations.length) n++;
  if(activeFilters.riskRanges.length) n++;
  if(activeFilters.driver.trim()) n++;
  if(activeFilters.city.trim()) n++;
  return n;
}

function applyFilters(){
  currentFilter = activeFilters.status; // keep legacy alias in sync

  const filtered = getFilteredSMs();
  renderCards(filtered);
  document.getElementById('sm-count').textContent = `${filtered.length} de ${SMs.length}`;

  // Sync map markers (skip in cabine mode — cabine owns the map)
  const inCabine = document.querySelector('.app')?.dataset?.mode === 'cabine';
  if(!inCabine){
    const filteredIds = new Set(filtered.map(s=>s.id));
    SMs.forEach(sm=>{
      const mk = mapMarkers[sm.id];
      if(!mk) return;
      if(filteredIds.has(sm.id)){
        if(!map.hasLayer(mk)) mk.addTo(map);
      } else {
        if(map.hasLayer(mk)) map.removeLayer(mk);
      }
    });
  }

  // Close detail if selected SM was filtered out
  if(selectedSM && !filteredIds.has(selectedSM)) closeDetail();

  // Reposition map only when no SM is selected (keep focus on the selected route)
  if(map && !selectedSM){
    if(filtered.length===0){
      // no-op — keep current view
    } else if(filtered.length===1){
      const only = filtered[0];
      map.flyTo([only.lat, only.lng], 11, {duration:0.7, easeLinearity:0.4});
    } else if(filtered.length < SMs.length){
      const pts = filtered.map(s=>[s.lat, s.lng]);
      const bounds = L.latLngBounds(pts);
      map.flyToBounds(bounds, {padding:[80,80], maxZoom:11, duration:0.7, easeLinearity:0.4});
    }
  }

  renderActiveFilterChips();
  updateDimensionButtons();
  updateKpiActiveStates();
}

/* Legacy entry point kept for any old onclick that still calls filterSMs(...) */
function filterSMs(type, el){
  setStatusFilter(type, el);
}

function setStatusFilter(type, el){
  document.querySelectorAll('.filter-row .chip').forEach(c=>c.classList.remove('active'));
  if(el) el.classList.add('active');
  activeFilters.status = type;
  applyFilters();
}

function setKpiFilter(kpiId){
  // Toggle off if clicking the same KPI
  if(activeFilters.kpi === kpiId){
    activeFilters.kpi = null;
  } else {
    activeFilters.kpi = kpiId;
  }
  applyFilters();
}

function updateKpiActiveStates(){
  document.querySelectorAll('.kpi[data-kpi]').forEach(el=>{
    const isActive = el.dataset.kpi === activeFilters.kpi;
    el.classList.toggle('kpi-active', isActive);
    el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

/* ═══ SEARCH ═══ */
function onSearchInput(){
  const input = document.getElementById('search-input');
  const box = input.closest('.search-box');
  activeFilters.search = input.value;
  box.classList.toggle('has-value', input.value.length>0);
  applyFilters();
}
function clearSearch(){
  const input = document.getElementById('search-input');
  input.value = '';
  activeFilters.search = '';
  input.closest('.search-box').classList.remove('has-value');
  applyFilters();
}

/* ═══ ACTIVE FILTER CHIPS (removable) ═══ */
function renderActiveFilterChips(){
  const el = document.getElementById('active-filters');
  if(!el) return;
  const chips = [];

  if(activeFilters.kpi){
    const kpiLabels = {
      sms_ativas:'SMs ativas', em_rota:'Em rota', otif_risco:'OTIF em risco',
      parados:'Parados', alertas:'Alertas ativos', otif_pct:'OTIF atual', entregas_ok:'Entregas ok'
    };
    chips.push({label:'KPI', value: kpiLabels[activeFilters.kpi] || activeFilters.kpi, remove: `activeFilters.kpi=null;applyFilters()`});
  }
  activeFilters.clients.forEach(c=>{
    chips.push({label:'Cliente', value:c, remove:`removeClientFilter('${c}')`});
  });
  activeFilters.operations.forEach(o=>{
    chips.push({label:'Operação', value:o, remove:`removeOperationFilter('${o}')`});
  });
  activeFilters.riskRanges.forEach(r=>{
    const labels = {low:'Baixo',medium:'Médio',high:'Alto',critical:'Crítico'};
    chips.push({label:'Risco', value:labels[r]||r, remove:`removeRiskRange('${r}')`});
  });
  if(activeFilters.driver.trim()){
    chips.push({label:'Motorista', value:activeFilters.driver, remove:`clearDriverFilter()`});
  }
  if(activeFilters.city.trim()){
    chips.push({label:'Cidade', value:activeFilters.city, remove:`clearCityFilter()`});
  }

  if(!chips.length){ el.innerHTML=''; return; }

  el.innerHTML = chips.map(c=>`
    <span class="af-chip">
      <span class="af-chip-label">${c.label}</span>${c.value}
      <button class="af-chip-remove" onclick="${c.remove}" aria-label="Remover">✕</button>
    </span>
  `).join('') + (chips.length>1 ? `<button class="af-chip-clear-all" onclick="clearAllFilters()">Limpar todos</button>` : '');
}

function removeClientFilter(c){
  activeFilters.clients = activeFilters.clients.filter(x=>x!==c);
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}
function removeOperationFilter(o){
  activeFilters.operations = activeFilters.operations.filter(x=>x!==o);
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}
function removeRiskRange(r){
  activeFilters.riskRanges = activeFilters.riskRanges.filter(x=>x!==r);
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}

function clearAllFilters(){
  activeFilters.status = 'todos';
  activeFilters.kpi = null;
  activeFilters.etaStatus = null;
  activeFilters.search = '';
  activeFilters.clients = [];
  activeFilters.operations = [];
  activeFilters.riskRanges = [];
  activeFilters.driver = '';
  activeFilters.city = '';

  // Reset UI
  document.querySelectorAll('.filter-row .chip').forEach((c,i)=>c.classList.toggle('active', i===0));
  document.querySelectorAll('.eta-q-chip').forEach(c=>c.className='eta-q-chip');
  const si = document.getElementById('search-input');
  if(si){ si.value=''; si.closest('.search-box').classList.remove('has-value'); }
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}

/* ═══════════════════════════════════════════════════════════════
   FILTER PANEL — flippable back face
   The .sm-panel has two faces: front (SM list) and back (filters).
   flipToFilters() reveals the back; flipToList() returns to the list.
   Dimension changes apply in real time, but the CTA "Ver resultados"
   is what physically flips the panel back.
═══════════════════════════════════════════════════════════════ */
let _panelFlipped = false;

function flipToFilters(){
  const panel = document.getElementById('sm-panel');
  if(!panel) return;
  // Populate the back face with current state
  renderFilterPanel();
  panel.classList.add('flipped');
  _panelFlipped = true;
  // Focus management — move focus to back panel title area
  setTimeout(()=>{
    const back = panel.querySelector('.panel-face.back');
    if(back){
      back.setAttribute('aria-hidden','false');
      back.querySelector('.panel-face.front')?.setAttribute('aria-hidden','true');
    }
  }, 360);
}

function flipToList(){
  const panel = document.getElementById('sm-panel');
  if(!panel) return;
  panel.classList.remove('flipped');
  _panelFlipped = false;
  const back = panel.querySelector('.panel-face.back');
  if(back) back.setAttribute('aria-hidden','true');
}

// CTA behavior: already applied in real time; the button just flips back
function applyFiltersAndFlipBack(){
  // Already live-applied via each toggle; just flip
  flipToList();
}

/* ═══ Render the filters back face from activeFilters ═══ */
function renderFilterPanel(){
  // Toggle which mode's sections are visible
  const opsWrap = document.getElementById('pf-mode-ops');
  const frotaWrap = document.getElementById('pf-mode-frota');
  const isFrota = currentPanelMode === 'frota';
  if(opsWrap) opsWrap.hidden = isFrota;
  if(frotaWrap) frotaWrap.hidden = !isFrota;

  // Also retitle the panel so the context is unambiguous
  const pfTitle = document.querySelector('.panel-face.back .pf-title');
  if(pfTitle) pfTitle.textContent = isFrota ? 'Filtros da frota' : 'Filtros';

  if(isFrota){
    _renderFrotaFilterPanel();
  } else {
    _renderOpsFilterPanel();
  }

  // Section counts + CTA
  _updatePfSectionCounts();
  _updatePfCta();
}

function _renderOpsFilterPanel(){
  // Chips for client / operation / risk are populated dynamically
  const clients = Array.from(new Set(SMs.map(s=>s.client))).filter(Boolean).sort();
  const ops = Array.from(new Set(SMs.map(s=>s.type))).filter(Boolean).sort();

  const cEl = document.getElementById('pf-chips-client');
  const oEl = document.getElementById('pf-chips-operation');
  const rEl = document.getElementById('pf-chips-risk');

  if(cEl){
    cEl.innerHTML = clients.map(c=>{
      const count = SMs.filter(s=>s.client===c).length;
      const on = activeFilters.clients.includes(c);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleClientFilter('${_escAttr(c)}')">${c}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }
  if(oEl){
    oEl.innerHTML = ops.map(o=>{
      const count = SMs.filter(s=>s.type===o).length;
      const on = activeFilters.operations.includes(o);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleOperationFilter('${_escAttr(o)}')">${o}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }
  if(rEl){
    const ranges = [
      {key:'low', label:'Baixo', range:'0–30', dot:'rc-low'},
      {key:'medium', label:'Médio', range:'31–60', dot:'rc-medium'},
      {key:'high', label:'Alto', range:'61–80', dot:'rc-high'},
      {key:'critical', label:'Crítico', range:'81–100', dot:'rc-critical'},
    ];
    rEl.innerHTML = ranges.map(r=>{
      const count = SMs.filter(s=>{
        if(r.key==='low') return s.risk<=30;
        if(r.key==='medium') return s.risk>=31 && s.risk<=60;
        if(r.key==='high') return s.risk>=61 && s.risk<=80;
        if(r.key==='critical') return s.risk>=81;
      }).length;
      const on = activeFilters.riskRanges.includes(r.key);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleRiskRange('${r.key}')"><span class="rc-dot ${r.dot}"></span>${r.label}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }

  // Driver / City inputs
  const drv = document.getElementById('pf-driver');
  const city = document.getElementById('pf-city');
  if(drv){ drv.value = activeFilters.driver||''; }
  if(city){ city.value = activeFilters.city||''; }
  document.getElementById('pf-driver-wrap')?.classList.toggle('has-value', !!activeFilters.driver.trim());
  document.getElementById('pf-city-wrap')?.classList.toggle('has-value', !!activeFilters.city.trim());
}

function _renderFrotaFilterPanel(){
  const stEl = document.getElementById('pf-chips-fleet-status');
  const catEl = document.getElementById('pf-chips-fleet-cat');
  const mntEl = document.getElementById('pf-chips-fleet-maint');
  const fuelEl = document.getElementById('pf-chips-fleet-fuel');

  if(stEl){
    const statuses = [
      {key:'em_rota', label:'Em rota', dot:'fs-em_rota'},
      {key:'disponivel', label:'Disponível', dot:'fs-disponivel'},
      {key:'manutencao', label:'Manutenção', dot:'fs-manutencao'},
      {key:'reserva', label:'Reserva', dot:'fs-reserva'},
      {key:'terceiros', label:'Terceiros', dot:'fs-terceiros'},
    ];
    stEl.innerHTML = statuses.map(s=>{
      const count = Vehicles.filter(v=>v.status===s.key).length;
      const on = fleetFilters.statuses.includes(s.key);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleFleetStatusFilter('${s.key}')"><span class="rc-dot ${s.dot}"></span>${s.label}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }
  if(catEl){
    const cats = [
      {key:'TRUCK', label:'Truck'},
      {key:'CARRETA', label:'Carreta'},
    ];
    catEl.innerHTML = cats.map(c=>{
      const count = Vehicles.filter(v=>v.cat===c.key).length;
      const on = fleetFilters.cats.includes(c.key);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleFleetCatFilter('${c.key}')">${c.label}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }
  if(mntEl){
    const windows = [
      {key:'urgent',    label:'Em ≤7 dias',  dot:'rc-critical'},
      {key:'soon',      label:'8–30 dias',   dot:'rc-high'},
      {key:'scheduled', label:'Mais de 30',  dot:'rc-low'},
      {key:'none',      label:'Sem previsão',dot:''},
    ];
    mntEl.innerHTML = windows.map(w=>{
      const count = Vehicles.filter(v=>_fleetMaintBucket(v.predMaintDays)===w.key).length;
      const on = fleetFilters.maintWindows.includes(w.key);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleFleetMaintFilter('${w.key}')">${w.dot?`<span class="rc-dot ${w.dot}"></span>`:''}${w.label}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }
  if(fuelEl){
    const bands = [
      {key:'low',  label:'<30%',   dot:'rc-critical'},
      {key:'mid',  label:'30–70%', dot:'rc-high'},
      {key:'high', label:'>70%',   dot:'rc-low'},
    ];
    fuelEl.innerHTML = bands.map(b=>{
      const count = Vehicles.filter(v=>_fleetFuelBand(v.fuel)===b.key).length;
      const on = fleetFilters.fuelBands.includes(b.key);
      return `<div class="pf-chip ${on?'active':''}" onclick="toggleFleetFuelFilter('${b.key}')"><span class="rc-dot ${b.dot}"></span>${b.label}<span class="pf-chip-meta">${count}</span></div>`;
    }).join('');
  }

  const pInp = document.getElementById('pf-fleet-plate');
  if(pInp) pInp.value = fleetFilters.plateQ || '';
  document.getElementById('pf-fleet-plate-wrap')?.classList.toggle('has-value', !!fleetFilters.plateQ.trim());
}

function _updatePfSectionCounts(){
  const set = (id, n) => {
    const el = document.getElementById(id);
    if(el) el.textContent = n>0 ? (n + (n>1?' ativos':' ativo')) : '';
  };
  // Ops sections
  set('pf-count-client', activeFilters.clients.length);
  set('pf-count-operation', activeFilters.operations.length);
  set('pf-count-risk', activeFilters.riskRanges.length);
  set('pf-count-driver', activeFilters.driver.trim() ? 1 : 0);
  set('pf-count-city', activeFilters.city.trim() ? 1 : 0);
  // Frota sections
  set('pf-count-fleet-status', fleetFilters.statuses.length);
  set('pf-count-fleet-cat', fleetFilters.cats.length);
  set('pf-count-fleet-maint', fleetFilters.maintWindows.length);
  set('pf-count-fleet-fuel', fleetFilters.fuelBands.length);
  set('pf-count-fleet-plate', fleetFilters.plateQ.trim() ? 1 : 0);
}

function _updatePfCta(){
  // Compute result count live — depends on current mode
  const isFrota = currentPanelMode === 'frota';
  const n = isFrota ? getFilteredFleet().length : getFilteredSMs().length;
  const total = isFrota ? Vehicles.length : SMs.length;
  const cta = document.getElementById('pf-cta');
  const countEl = document.getElementById('pf-cta-count');
  if(countEl) countEl.textContent = String(n);
  if(cta){
    cta.disabled = n===0;
    const label = cta.querySelector('span:first-child');
    if(label) label.textContent = n===0 ? 'Nenhum resultado' : 'Ver resultados';
  }
}

/* Small attribute escape for string injected into onclick= */
function _escAttr(s){ return String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

/* Dimension toggles — live-applied, also repaint the back face */
function toggleClientFilter(client){
  const idx = activeFilters.clients.indexOf(client);
  if(idx>=0) activeFilters.clients.splice(idx,1);
  else activeFilters.clients.push(client);
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}
function toggleOperationFilter(op){
  const idx = activeFilters.operations.indexOf(op);
  if(idx>=0) activeFilters.operations.splice(idx,1);
  else activeFilters.operations.push(op);
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}
function toggleRiskRange(range){
  const idx = activeFilters.riskRanges.indexOf(range);
  if(idx>=0) activeFilters.riskRanges.splice(idx,1);
  else activeFilters.riskRanges.push(range);
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}

/* Driver / City input handlers (from back face inputs) */
function onDriverFieldChange(val){
  activeFilters.driver = val;
  applyFilters();
  document.getElementById('pf-driver-wrap')?.classList.toggle('has-value', !!val.trim());
  _updatePfSectionCounts();
  _updatePfCta();
}
function onCityFieldChange(val){
  activeFilters.city = val;
  applyFilters();
  document.getElementById('pf-city-wrap')?.classList.toggle('has-value', !!val.trim());
  _updatePfSectionCounts();
  _updatePfCta();
}
function clearDriverFilter(){
  activeFilters.driver = '';
  const el = document.getElementById('pf-driver'); if(el) el.value='';
  document.getElementById('pf-driver-wrap')?.classList.remove('has-value');
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}
function clearCityFilter(){
  activeFilters.city = '';
  const el = document.getElementById('pf-city'); if(el) el.value='';
  document.getElementById('pf-city-wrap')?.classList.remove('has-value');
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}

/* ── Frota toggles ───────────────────────────────────────────── */
function _toggleInArray(arr, v){
  const i = arr.indexOf(v);
  if(i>=0) arr.splice(i,1);
  else arr.push(v);
}
function _afterFrotaFilterChange(){
  renderFleetCards();
  updateFilterTrigger();
  if(_panelFlipped) renderFilterPanel();
}
function toggleFleetStatusFilter(key){
  _toggleInArray(fleetFilters.statuses, key);
  _afterFrotaFilterChange();
}
function toggleFleetCatFilter(key){
  _toggleInArray(fleetFilters.cats, key);
  _afterFrotaFilterChange();
}
function toggleFleetMaintFilter(key){
  _toggleInArray(fleetFilters.maintWindows, key);
  _afterFrotaFilterChange();
}
function toggleFleetFuelFilter(key){
  _toggleInArray(fleetFilters.fuelBands, key);
  _afterFrotaFilterChange();
}
function onFleetPlateChange(val){
  fleetFilters.plateQ = val;
  document.getElementById('pf-fleet-plate-wrap')?.classList.toggle('has-value', !!val.trim());
  renderFleetCards();
  updateFilterTrigger();
  _updatePfSectionCounts();
  _updatePfCta();
}
function clearFleetPlateFilter(){
  fleetFilters.plateQ = '';
  const el = document.getElementById('pf-fleet-plate'); if(el) el.value='';
  document.getElementById('pf-fleet-plate-wrap')?.classList.remove('has-value');
  _afterFrotaFilterChange();
}

/* Clear ALL dimension filters from the back face header */
function clearAllDimensionFilters(){
  if(currentPanelMode === 'frota'){
    fleetFilters.statuses = [];
    fleetFilters.cats = [];
    fleetFilters.maintWindows = [];
    fleetFilters.fuelBands = [];
    fleetFilters.plateQ = '';
    const pInp = document.getElementById('pf-fleet-plate'); if(pInp) pInp.value='';
    document.getElementById('pf-fleet-plate-wrap')?.classList.remove('has-value');
    renderFleetCards();
    updateFilterTrigger();
    if(_panelFlipped) renderFilterPanel();
    return;
  }
  activeFilters.clients = [];
  activeFilters.operations = [];
  activeFilters.riskRanges = [];
  activeFilters.driver = '';
  activeFilters.city = '';
  activeFilters.etaStatus = null;
  document.querySelectorAll('.eta-q-chip').forEach(c=>c.className='eta-q-chip');
  const drv = document.getElementById('pf-driver'); if(drv) drv.value='';
  const city = document.getElementById('pf-city'); if(city) city.value='';
  document.getElementById('pf-driver-wrap')?.classList.remove('has-value');
  document.getElementById('pf-city-wrap')?.classList.remove('has-value');
  applyFilters();
  if(_panelFlipped) renderFilterPanel();
}

/* Sync the filter-trigger button on the front face (count + has-filters state) */
function updateFilterTrigger(){
  const trigger = document.getElementById('filter-trigger');
  const countEl = document.getElementById('filter-trigger-count');
  if(!trigger) return;
  let n = 0;
  if(currentPanelMode === 'frota'){
    n += fleetFilters.statuses.length;
    n += fleetFilters.cats.length;
    n += fleetFilters.maintWindows.length;
    n += fleetFilters.fuelBands.length;
    if(fleetFilters.plateQ.trim()) n++;
  } else {
    if(activeFilters.clients.length) n += activeFilters.clients.length;
    if(activeFilters.operations.length) n += activeFilters.operations.length;
    if(activeFilters.riskRanges.length) n += activeFilters.riskRanges.length;
    if(activeFilters.driver.trim()) n++;
    if(activeFilters.city.trim()) n++;
  }
  trigger.classList.toggle('has-filters', n>0);
  if(countEl) countEl.textContent = n>0 ? String(n) : '';
}

/* Legacy hook called from applyFilters() — keep updating both front trigger
   and back panel so they never drift out of sync with activeFilters. */
function updateDimensionButtons(){
  updateFilterTrigger();
  if(_panelFlipped){
    _updatePfSectionCounts();
    _updatePfCta();
  }
}

// Escape closes the back panel when flipped
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape' && _panelFlipped) flipToList();
});

/* ═══ SAVED VIEWS ═══ */
const SAVED_VIEWS_KEY = 'torre.savedViews';

function loadSavedViews(){
  try{
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function persistSavedViews(views){
  try{ localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)); }catch(e){}
}
function toggleSavedViewsMenu(ev){
  if(ev) ev.stopPropagation();
  const m = document.getElementById('saved-views-menu');
  if(!m) return;
  const willOpen = !m.classList.contains('open');
  m.classList.toggle('open', willOpen);
  if(willOpen) renderSavedViewsMenu();
}
function renderSavedViewsMenu(){
  const list = loadSavedViews();
  const empty = document.getElementById('saved-views-empty');
  const holder = document.getElementById('saved-views-list');
  if(!holder) return;
  if(!list.length){
    empty.style.display = 'block';
    holder.innerHTML = '';
    return;
  }
  empty.style.display = 'none';
  holder.innerHTML = list.map((v,i)=>{
    // Count how many dimensions this view has
    let dims = 0;
    if(v.filters.kpi) dims++;
    if(v.filters.status && v.filters.status!=='todos') dims++;
    if(v.filters.search) dims++;
    if(v.filters.clients.length) dims++;
    if(v.filters.operations.length) dims++;
    if(v.filters.riskRanges.length) dims++;
    if(v.filters.driver) dims++;
    if(v.filters.city) dims++;
    return `
      <div class="saved-view-item" onclick="loadSavedView(${i})">
        <span style="font-size:11px">👁</span>
        <span class="saved-view-name">${v.name}</span>
        <span class="saved-view-count">${dims}</span>
        <button class="saved-view-remove" onclick="event.stopPropagation();deleteSavedView(${i})" aria-label="Remover">✕</button>
      </div>
    `;
  }).join('');
}
function promptSaveView(){
  const name = prompt('Nome desta visualização:');
  if(!name || !name.trim()) return;
  const list = loadSavedViews();
  list.push({
    name: name.trim(),
    filters: JSON.parse(JSON.stringify(activeFilters)),
    ts: Date.now(),
  });
  persistSavedViews(list);
  renderSavedViewsMenu();
}
function loadSavedView(idx){
  const list = loadSavedViews();
  const v = list[idx];
  if(!v) return;
  Object.assign(activeFilters, JSON.parse(JSON.stringify(v.filters)));
  // Sync UI
  document.querySelectorAll('.filter-row .chip').forEach(c=>{
    const text = c.textContent.trim().toLowerCase();
    const map = {todos:'todos','● crítico':'critico','‖ parado':'parado','▶ em rota':'em_rota'};
    const val = map[text] || 'todos';
    c.classList.toggle('active', val===activeFilters.status);
  });
  const si = document.getElementById('search-input');
  if(si){ si.value = activeFilters.search||''; si.closest('.search-box').classList.toggle('has-value', !!activeFilters.search); }
  if(_panelFlipped) flipToList();
  applyFilters();
  // close menu
  const m = document.getElementById('saved-views-menu'); if(m) m.classList.remove('open');
}
function deleteSavedView(idx){
  const list = loadSavedViews();
  list.splice(idx,1);
  persistSavedViews(list);
  renderSavedViewsMenu();
}

// Close saved views menu on outside click
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.saved-views-row')){
    const m = document.getElementById('saved-views-menu');
    if(m) m.classList.remove('open');
  }
});

function restoreFilteredMarkers(){
  if(document.querySelector('.app')?.dataset?.mode==='cabine') return;
  const filtered = getFilteredSMs();
  const filteredIds = new Set(filtered.map(s=>s.id));
  SMs.forEach(sm=>{
    const mk = mapMarkers[sm.id];
    if(!mk) return;
    if(filteredIds.has(sm.id)){
      if(!map.hasLayer(mk)) mk.addTo(map);
    } else {
      if(map.hasLayer(mk)) map.removeLayer(mk);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   SELECT SM
═══════════════════════════════════════════════════════════════ */
function selectSM(id){
  // deselect prev
  if(selectedSM){
    const prev=document.getElementById(`card-${selectedSM}`);
    if(prev) prev.classList.remove('selected');
    if(mapMarkers[selectedSM]) setMarkerSelected(selectedSM,false);
  }
  selectedSM=id;
  const sm=SMs.find(s=>s.id===id);
  if(!sm) return;

  const card=document.getElementById(`card-${id}`);
  if(card){card.classList.add('selected');card.scrollIntoView({behavior:'smooth',block:'nearest'});}
  if(mapMarkers[id]) setMarkerSelected(id,true);

  // Hide all other SM markers — reduce cognitive load
  SMs.forEach(s=>{
    if(s.id!==id && mapMarkers[s.id] && map.hasLayer(mapMarkers[s.id])){
      map.removeLayer(mapMarkers[s.id]);
    }
  });

  // draw route (fitBounds is called inside drawRoute)
  drawRoute(sm);

  // populate detail
  populateDetail(sm);
  document.getElementById('detail-panel').classList.add('open');

  updateRouteStrip(sm);
}

/* ═══════════════════════════════════════════════════════════════
   CHAT MODE — multi-conversation chat with intelligent map sync
   State: chatTabs is an ordered array of { smId } and chatActive is
   the currently visible smId. Switching tabs calls selectSM(),
   which already handles route draw + map fit + detail repopulation.
═══════════════════════════════════════════════════════════════ */
let chatTabs = [];        // [{smId}]
let chatActive = null;    // smId currently shown
const chatHistories = {}; // smId -> [{from,text,time,type?}]

function openChatMode(smId){
  // If in cabine mode, don't open torre chat — use cabine chat overlay instead
  if(document.querySelector('.app').dataset.mode === 'cabine') return;
  // First, make sure detail-panel is open with this SM (this also recenters map)
  if(selectedSM !== smId) selectSM(smId);
  // Toggle the global chat-mode flag
  document.querySelector('.app').setAttribute('data-chat','open');
  // Add the tab if it's not there yet
  if(!chatTabs.find(t=>t.smId===smId)){
    chatTabs.push({smId});
  }
  // Mark as active
  chatActive = smId;
  renderChatTabs();
  renderChatConversation(smId);
  // Map needs a beat to recompute its size after the strip pushes it down
  setTimeout(()=>{ if(window.map) map.invalidateSize(); }, 320);
}

function closeChatMode(){
  document.querySelector('.app').removeAttribute('data-chat');
  // Keep tabs in memory so reopening restores state — just hide panel.
  // FAB visibility is controlled by CSS: .app:not([data-chat="open"]) .chat-fab.has-tabs
  updateFabBadge();
  setTimeout(()=>{ if(window.map) map.invalidateSize(); }, 320);
}

function updateFabBadge(){
  const fab = document.getElementById('chat-fab');
  if(!fab) return;
  if(chatTabs.length > 0){
    fab.classList.add('has-tabs');
    // Count tabs with "unread" (simulated: any tab that isn't the active one)
    const unread = chatTabs.filter(t => t.smId !== chatActive).length;
    document.getElementById('fab-badge').textContent = unread > 0 ? unread : '';
  } else {
    fab.classList.remove('has-tabs');
  }
}

function addChatTabFromCurrent(){
  // "+" button: add another in-progress SM as a new tab. Pick the
  // highest-risk SM that isn't already a tab, to simulate the operator
  // grabbing the next thing demanding attention.
  const open = new Set(chatTabs.map(t=>t.smId));
  const candidate = [...SMs]
    .filter(s=>!open.has(s.id))
    .sort((a,b)=>(b.risk||0)-(a.risk||0))[0];
  if(!candidate) return;
  chatTabs.push({smId:candidate.id});
  switchChatTab(candidate.id);
}

function switchChatTab(smId){
  if(chatActive === smId) return;
  chatActive = smId;
  trayActiveSm = smId;
  if(typeof trayUnread!=='undefined') trayUnread[smId] = 0;
  // selectSM does the heavy lift: route, map fit, detail repopulation
  selectSM(smId);
  renderChatTabs();
  renderChatConversation(smId);
  if(typeof trayRender==='function') trayRender();
}

function closeChatTab(e, smId){
  e.stopPropagation();
  const idx = chatTabs.findIndex(t=>t.smId===smId);
  if(idx<0) return;
  chatTabs.splice(idx,1);
  if(chatTabs.length === 0){
    closeChatMode();
    chatActive = null;
    return;
  }
  // If closed the active one, switch to neighbor
  if(chatActive === smId){
    const next = chatTabs[Math.min(idx, chatTabs.length-1)];
    switchChatTab(next.smId);
  } else {
    renderChatTabs();
  }
}

function renderChatTabs(){
  const wrap = document.getElementById('chat-tabs');
  if(!wrap) return;
  // Severity dot from risk
  const dotClass = (risk)=> risk>=80?'crit':risk>=60?'warn':'';
  const tabsHtml = chatTabs.map(t=>{
    const sm = SMs.find(s=>s.id===t.smId);
    if(!sm) return '';
    const active = t.smId===chatActive ? 'active' : '';
    const dc = dotClass(sm.risk||0);
    const label = (sm.driver||sm.id).split(' ')[0];
    return `<div class="ctab ${active}" onclick="switchChatTab('${sm.id}')" title="${sm.id} · ${sm.driver||''}">
      <span class="ctab-dot ${dc}"></span>
      <span class="ctab-label">${label}</span>
      <button class="ctab-close" onclick="closeChatTab(event,'${sm.id}')" aria-label="Fechar conversa">×</button>
    </div>`;
  }).join('');
  wrap.innerHTML = tabsHtml
    + `<button class="ctab-add" onclick="addChatTabFromCurrent()" title="Nova conversa">+</button>`
    + `<button class="icon-btn" onclick="closeTrayChat()" title="Fechar chat" style="margin-left:auto;align-self:center;margin-right:6px">✕</button>`;
  updateFabBadge();
}

function getOrSeedHistory(sm){
  if(chatHistories[sm.id]) return chatHistories[sm.id];
  // Mock history per SM — feels lived-in without being identical
  const driver = (sm.driver||'Motorista').split(' ')[0];
  const seeds = [
    {from:'system', text:`Conversa iniciada · ${sm.id}`, time:'08:12'},
    {from:'tower',  text:`Bom dia, ${driver}! Tudo certo na saída?`, time:'08:14'},
    {from:'driver', text:'Bom dia! Tudo certo, já estou na rodovia.', time:'08:16'},
    {from:'tower',  text:'Beleza. Qualquer coisa me chama por aqui.', time:'08:16'},
  ];
  // Add risk-flavored extra messages
  if((sm.risk||0) >= 80){
    seeds.push({from:'driver', text:'Pessoal, peguei um trânsito pesado na Régis.', time:'09:42'});
    seeds.push({from:'tower',  text:'Anotado. Atualiza o ETA quando puder seguir.', time:'09:43'});
    seeds.push({from:'driver', text:'Tô parado faz uns 20 minutos. Acho que houve acidente à frente.', time:'10:05'});
  } else if((sm.risk||0) >= 60){
    seeds.push({from:'driver', text:'Parei pro almoço, posto Graal Km 230.', time:'12:18'});
    seeds.push({from:'tower',  text:'Ok, aviso quando seguir.', time:'12:19'});
  } else {
    seeds.push({from:'driver', text:'Seguindo dentro do prazo.', time:'10:30'});
  }
  chatHistories[sm.id] = seeds;
  return seeds;
}

function renderChatConversation(smId){
  const sm = SMs.find(s=>s.id===smId);
  if(!sm) return;
  // Header
  const driver = sm.driver || 'Motorista';
  const initials = driver.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('chat-avatar').textContent = initials;
  document.getElementById('chat-driver-name').textContent = driver;
  document.getElementById('chat-driver-sub').textContent = `${sm.id} · ${sm.plate||''} · ${sm.client||''}`;
  // Body
  const history = getOrSeedHistory(sm);
  const body = document.getElementById('chat-body');
  body.innerHTML = `<div class="chat-day">Hoje</div>` + history.map(m=>{
    if(m.type==='photo'){
      return `<div class="chat-msg photo">
        <div class="photo-placeholder">📷</div>
        <span class="cm-cap">${m.text||'Foto da carga'} · ${m.time}</span>
      </div>`;
    }
    if(m.from==='system'){
      return `<div class="chat-msg system">${m.text}</div>`;
    }
    const cls = m.from==='tower' ? 'tower' : 'driver';
    return `<div class="chat-msg ${cls}">${m.text}<span class="cm-time">${m.time}</span></div>`;
  }).join('');
  body.scrollTop = body.scrollHeight;
}

function sendQuickReply(text){
  if(!chatActive) return;
  pushChatMessage(chatActive, {from:'tower', text, time:nowHHMM()});
  // Simulate driver typing back after a beat
  const sm = SMs.find(s=>s.id===chatActive);
  if(!sm) return;
  setTimeout(()=>{
    const reply = pickAutoReply(text, sm);
    pushChatMessage(chatActive, {from:'driver', text:reply, time:nowHHMM()});
  }, 1400);
}

function sendChatInput(){
  const input = document.getElementById('chat-input-box');
  const text = (input.value||'').trim();
  if(!text || !chatActive) return;
  pushChatMessage(chatActive, {from:'tower', text, time:nowHHMM()});
  input.value = '';
}

function pushChatMessage(smId, msg){
  if(!chatHistories[smId]) chatHistories[smId] = [];
  chatHistories[smId].push(msg);
  if(smId === chatActive) renderChatConversation(smId);
}

function nowHHMM(){
  const d = new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function pickAutoReply(prompt, sm){
  const p = prompt.toLowerCase();
  if(p.includes('posição') || p.includes('posicao')) return `Estou no km ${120+Math.floor(Math.random()*80)} da BR-116, sentido capital.`;
  if(p.includes('foto')) return 'Vou parar no próximo posto e mando.';
  if(p.includes('eta')) return `ETA atualizado: chego em aprox. ${1+Math.floor(Math.random()*3)}h.`;
  if(p.includes('ok') || p.includes('certo')) return 'Tudo certo por aqui, seguindo!';
  return 'Recebido.';
}

function attachChatPhoto(){
  if(!chatActive) return;
  pushChatMessage(chatActive, {from:'tower', text:'Pode me mandar uma foto?', time:nowHHMM()});
  setTimeout(()=>{
    pushChatMessage(chatActive, {from:'driver', type:'photo', text:'Foto da carga', time:nowHHMM()});
  }, 1800);
}

/* ═══════════════════════════════════════════════════════════════
   CHAT TRAY — permanent thin bar with active conversations.
   Independent from detail-panel. Toasts on unsolicited new msgs.
═══════════════════════════════════════════════════════════════ */
let trayConvs = [];      // [smId] — order = recency
let trayActiveSm = null; // currently expanded conv
let trayUnread = {};     // smId -> int

function trayRender(){
  const wrap = document.getElementById('tray-chips');
  if(!wrap) return;
  // Update history badge
  const histCount = document.getElementById('tray-history-count');
  if(histCount) histCount.textContent = trayClosedConvs.length;
  if(trayConvs.length === 0){
    wrap.innerHTML = '<span style="font-size:10px;color:var(--t4);padding:0 4px">Nenhuma conversa ativa</span>';
    return;
  }
  const dotClass = (r)=> r>=80?'crit':r>=60?'warn':'';
  wrap.innerHTML = trayConvs.map(smId=>{
    const sm = SMs.find(s=>s.id===smId);
    if(!sm) return '';
    const name = (sm.driver||sm.id).split(' ')[0];
    const badge = trayUnread[smId]||0;
    const active = trayActiveSm===smId ? 'active' : '';
    return `<button class="tray-chip ${active}" onclick="trayOpenChat('${smId}')">
      <span class="tray-chip-dot ${dotClass(sm.risk||0)}"></span>
      <span class="tray-chip-name">${name}</span>
      ${badge?`<span class="tray-chip-badge">${badge}</span>`:''}
      <span class="tray-chip-close" onclick="event.stopPropagation();trayCloseConv('${smId}')">×</span>
    </button>`;
  }).join('');
}

function trayAddConv(smId){
  if(!trayConvs.includes(smId)) trayConvs.push(smId);
  trayRender();
}

let trayClosedConvs = []; // [{smId, closedAt, lastMsg}]

function trayCloseConv(smId){
  // Archive instead of delete — closed conversations move to history
  const sm = SMs.find(s=>s.id===smId);
  const history = (chatHistories && chatHistories[smId]) || [];
  const lastMsg = history.length ? history[history.length-1] : null;
  trayClosedConvs.unshift({
    smId,
    closedAt: nowHHMM(),
    lastMsgText: lastMsg ? (lastMsg.text||'(foto)').slice(0,60) : '—',
    lastMsgFrom: lastMsg ? lastMsg.from : '—',
    driver: sm ? sm.driver : smId
  });
  // Cap history at 50
  if(trayClosedConvs.length > 50) trayClosedConvs.length = 50;
  trayConvs = trayConvs.filter(s=>s!==smId);
  delete trayUnread[smId];
  if(trayActiveSm===smId) closeTrayChat();
  trayRender();
}

function trayReopenConv(smId){
  // Restore from history
  const idx = trayClosedConvs.findIndex(c=>c.smId===smId);
  if(idx>=0) trayClosedConvs.splice(idx,1);
  trayAddConv(smId);
  trayOpenChat(smId);
  closeTrayHistoryPopover();
}

function toggleTrayHistory(ev){
  if(ev) ev.stopPropagation();
  const pop = document.getElementById('tray-history-popover');
  if(!pop) return;
  if(pop.classList.contains('open')){
    closeTrayHistoryPopover();
  } else {
    renderTrayHistoryPopover();
    pop.classList.add('open');
  }
}
function closeTrayHistoryPopover(){
  const pop = document.getElementById('tray-history-popover');
  if(pop) pop.classList.remove('open');
}
function renderTrayHistoryPopover(){
  const pop = document.getElementById('tray-history-popover');
  if(!pop) return;
  if(trayClosedConvs.length === 0){
    pop.innerHTML = `<div class="thp-header">Conversas encerradas</div>
      <div class="thp-empty">Nenhuma conversa encerrada</div>`;
    return;
  }
  pop.innerHTML = `<div class="thp-header">Conversas encerradas <span class="thp-count">${trayClosedConvs.length}</span></div>
    <div class="thp-list">${trayClosedConvs.map(c=>{
      const sm = SMs.find(s=>s.id===c.smId);
      const initials = (c.driver||c.smId).split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
      return `<button class="thp-item" onclick="trayReopenConv('${c.smId}')">
        <div class="thp-avatar">${initials}</div>
        <div class="thp-meta">
          <div class="thp-name">${c.driver||c.smId}</div>
          <div class="thp-last">${c.lastMsgFrom==='tower'?'Você: ':''}${c.lastMsgText}</div>
        </div>
        <div class="thp-time">${c.closedAt}</div>
      </button>`;
    }).join('')}</div>`;
}
document.addEventListener('click', (e)=>{
  const pop = document.getElementById('tray-history-popover');
  if(pop && pop.classList.contains('open') && !pop.contains(e.target) && !e.target.closest('#tray-history-btn')){
    closeTrayHistoryPopover();
  }
});

function trayOpenChat(smId){
  trayActiveSm = smId;
  trayUnread[smId] = 0;
  if(!trayConvs.includes(smId)) trayConvs.push(smId);
  // Reuse the v64 layout: detail-panel + chat-panel side-by-side, sm-panel hidden
  // Sync chatTabs with trayConvs so the chat-panel renders the same conversations
  chatTabs = trayConvs.map(id => ({smId: id}));
  chatActive = smId;
  if(typeof openChatMode === 'function'){
    openChatMode(smId);
  }
  trayRender();
}

function closeTrayChat(){
  // Close ONLY the chat panel (not the detail). Detail panel stays open
  // until user explicitly closes it via its own ✕ button.
  document.querySelector('.app').removeAttribute('data-chat');
  trayActiveSm = null;
  trayRender();
  setTimeout(()=>{ if(window.map) map.invalidateSize(); }, 320);
}

function trayChatSend(){
  const inp = document.getElementById('tray-chat-input-box');
  const text = (inp.value||'').trim();
  if(!text || !trayActiveSm) return;
  if(typeof pushChatMessage==='function'){
    pushChatMessage(trayActiveSm, {from:'tower', text, time:nowHHMM()});
  }
  inp.value='';
  trayOpenChat(trayActiveSm); // re-render
}

function trayShowToast(smId, msg){
  // No floating toast — drop the conversation directly into the tray
  // and pulse the chip to draw attention.
  const sm = SMs.find(s=>s.id===smId);
  if(!sm) return;
  trayAddConv(smId);
  trayUnread[smId] = (trayUnread[smId]||0) + 1;
  trayRender();
  // Pulse the new chip
  setTimeout(()=>{
    const chips = document.querySelectorAll('#tray-chips .tray-chip');
    chips.forEach(c=>{
      if(c.textContent.includes((sm.driver||sm.id).split(' ')[0])){
        c.classList.add('pulse');
        setTimeout(()=>c.classList.remove('pulse'), 4000);
      }
    });
  }, 50);
}

// Demo: simulate a new message after 3s and 9s
setTimeout(()=>{ if(SMs && SMs[2]) trayShowToast(SMs[2].id, 'Tô parado faz 1h, acidente à frente'); }, 3000);
setTimeout(()=>{ if(SMs && SMs[5]) trayShowToast(SMs[5].id, 'Cheguei no destino, aguardando descarga'); }, 9000);

// Hook: when user clicks 💬 in detail panel actions, add this SM to tray and open chat
function actionFeedback_chatHook(smId){
  trayAddConv(smId);
  trayOpenChat(smId);
}

/* ═══════════════════════════════════════════════════════════════
   MARKER ICON GENERATORS — professional FA-based pins
═══════════════════════════════════════════════════════════════ */

/* ── INLINE SVG ICONS — no external dependency ── */
const MI = {
  truck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  warehouse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
  dot: `<svg viewBox="0 0 24 24" fill="currentColor" width="8" height="8"><circle cx="12" cy="12" r="8"/></svg>`,
  warn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
};

function makeTruckIcon(color, pulse, selected){
  const scale = selected ? 'transform:scale(1.15)' : '';
  const shadow = selected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${color},0 4px 16px ${color}60`
    : `box-shadow:0 3px 10px ${color}60,0 0 0 2px white`;
  const ring = pulse ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2.5px solid ${color};opacity:.28;animation:ring-out 1.8s ease-out infinite"></div>` : '';
  return L.divIcon({
    html:`<div style="position:relative;width:36px;height:36px;cursor:pointer;${scale}">
      ${ring}
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};
        display:flex;align-items:center;justify-content:center;font-size:16px;${shadow}">🚛</div>
    </div>`,
    className:'',iconSize:[36,36],iconAnchor:[18,18]
  });
}

/* ── Route stop markers — clean professional pins ── */


function makeStopIcon(type, status, clientColor, seq){
  const COLORS={done:'#16A34A',current:clientColor||'#2563EB',pending:'#2563EB',problem:'#DC2626'};
  const c = type==='current'?(clientColor||'#2563EB'):COLORS[status]||'#6B7280';

  function td(bg,inner,sh){
    return '<div style="position:relative;width:28px;height:38px;cursor:pointer;filter:drop-shadow(0 3px 7px '+sh+')"><svg style="position:absolute;top:0;left:0" width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg"><path d="M14 2C7.4 2 2 7.4 2 14C2 22 14 36 14 36C14 36 26 22 26 14C26 7.4 20.6 2 14 2Z" fill="'+bg+'" stroke="white" stroke-width="2.5" stroke-linejoin="round"/></svg><div style="position:absolute;top:6px;left:0;width:28px;text-align:center;line-height:1">'+inner+'</div></div>';
  }

  switch(type){
    case 'origin': {
      const col = status==='done'?'#16A34A':'#6B7280';
      const badge = status==='done' ? '<div style="position:absolute;top:-5px;right:-5px;width:15px;height:15px;background:#16A34A;border-radius:50%;border:2px solid white;font-size:9px;font-weight:900;color:white;display:flex;align-items:center;justify-content:center;">✓</div>' : '';
      return L.divIcon({html:'<div style="position:relative;cursor:pointer;filter:drop-shadow(0 3px 7px rgba(0,0,0,.35))"><div style="width:36px;height:36px;background:'+col+';border:2.5px solid white;border-radius:var(--radius-base);display:flex;align-items:center;justify-content:center;font-size:18px">🏭</div>'+badge+'</div>',className:'',iconSize:[36,36],iconAnchor:[18,18]});
    }
    case 'delivery': {
      const col = status==='done'?'#16A34A':status==='problem'?'#DC2626':'#2563EB';
      const inner = status==='done' ? '<span style="color:white;font-weight:900;font-size:12px">✓</span>' : '<span style="color:white;font-weight:800;font-size:11px;font-family:monospace">'+(seq||'·')+'</span>';
      return L.divIcon({html:td(col,inner,col+'60'),className:'',iconSize:[28,38],iconAnchor:[14,37]});
    }
    case 'current': {
      const ring='<div style="position:absolute;inset:-9px;border-radius:50%;border:2.5px solid '+c+';opacity:.22;animation:ring-out 2s ease-out infinite"></div>';
      return L.divIcon({html:'<div style="position:relative;width:48px;height:48px;cursor:pointer;display:flex;align-items:center;justify-content:center">'+ring+'<div style="width:38px;height:38px;border-radius:50%;background:'+c+';border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px '+c+'70;position:relative;z-index:2">🚛</div></div>',className:'',iconSize:[48,48],iconAnchor:[24,24]});
    }
    case 'checkpoint': {
      const col = status==='done'?'#16A34A':'#9CA3AF';
      return L.divIcon({html:'<div style="width:20px;height:20px;transform:rotate(45deg);background:'+col+';border:2.5px solid white;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer"></div>',className:'',iconSize:[20,20],iconAnchor:[10,10]});
    }
    case 'destination': {
      return L.divIcon({html:'<div style="position:relative;width:30px;height:40px;cursor:pointer;filter:drop-shadow(0 3px 8px rgba(124,58,237,.55))"><svg style="position:absolute;top:0;left:0" width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 2C8.4 2 2 8.4 2 15C2 24.5 15 38 15 38C15 38 28 24.5 28 15C28 8.4 21.6 2 15 2Z" fill="#7C3AED" stroke="white" stroke-width="2.5"/></svg><div style="position:absolute;top:6px;left:0;width:30px;text-align:center;font-size:14px">🏁</div></div>',className:'',iconSize:[30,40],iconAnchor:[15,39]});
    }
    case 'problem': {
      return L.divIcon({html:'<div style="position:relative;width:34px;height:32px;cursor:pointer;filter:drop-shadow(0 3px 7px rgba(220,38,38,.55))"><svg width="34" height="32" viewBox="0 0 34 32" xmlns="http://www.w3.org/2000/svg"><path d="M17 2 L32 30 L2 30 Z" fill="#DC2626" stroke="white" stroke-width="2.5" stroke-linejoin="round"/></svg><div style="position:absolute;top:9px;width:34px;text-align:center;color:white;font-weight:900;font-size:14px">!</div></div>',className:'',iconSize:[34,32],iconAnchor:[17,32]});
    }
    default:
      return L.divIcon({html:'<div style="width:10px;height:10px;border-radius:50%;background:#6B7280;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',className:'',iconSize:[10,10],iconAnchor:[5,5]});
  }
}

/* ═══════════════════════════════════════════════════════════════
   STOP POPUP BUILDER
═══════════════════════════════════════════════════════════════ */
function makeStopPopup(stop, sm){
  const TYPE_LABEL={origin:'CD Origem',delivery:'Ponto de entrega',current:'Posição atual',
    checkpoint:'Checkpoint',destination:'Destino final',problem:'Parada não programada'};
  const TYPE_ICON={origin:'🏭',delivery:'📦',current:'🚛',checkpoint:'◇',destination:'🏁',problem:'⚠️'};
  const STATUS_CLS={done:'done',current:'current',pending:'pending',problem:'problem'};
  const STATUS_LBL={done:'Concluído',current:'Em andamento',pending:'Aguardando',problem:'Ocorrência'};

  const meta = [
    stop.nf        ? `<div class="sp-meta-item"><span class="mkey">📄</span>${stop.nf}</div>` : '',
    stop.window    ? `<div class="sp-meta-item"><span class="mkey">🕐</span>Janela: ${stop.window}</div>` : '',
    stop.eta       ? `<div class="sp-meta-item"><span class="mkey">📍</span>ETA: ${stop.eta}${stop.actual?' · Real: '+stop.actual:''}</div>` : '',
    stop.contact   ? `<div class="sp-meta-item"><span class="mkey">👤</span>${stop.contact}</div>` : '',
  ].filter(Boolean).join('');

  const issues = stop.issues.length ? `<div class="sp-issues">${
    stop.issues.map(iss=>`<div class="sp-issue ${iss.sev}">
      <span class="sp-issue-icon">${iss.sev==='danger'?'🔴':'🟡'}</span>
      <span class="sp-issue-text">${iss.text}</span>
    </div>`).join('')
  }</div>` : '';

  const actions = `<div class="sp-actions">
    ${stop.contact?`<button class="sp-btn primary">💬 Contatar</button>`:''}
    ${stop.issues.length?`<button class="sp-btn warn">📋 Registrar ocorrência</button>`:''}
    ${stop.nf?`<button class="sp-btn">📄 Ver NF</button>`:''}
    <button class="sp-btn">↗ Abrir ponto</button>
  </div>`;

  return `<div class="sp-wrap">
    <div class="sp-header">
      <span class="sp-type-icon">${TYPE_ICON[stop.type]||'📍'}</span>
      <div class="sp-info">
        <div class="sp-name">${stop.label}</div>
        <div class="sp-type-lbl">${TYPE_LABEL[stop.type]||stop.type} · ${sm.type}</div>
      </div>
      <span class="sp-status ${STATUS_CLS[stop.status]||'pending'}">${STATUS_LBL[stop.status]||'—'}</span>
    </div>
    ${meta?`<div class="sp-meta">${meta}</div>`:''}
    ${issues}
    ${actions}
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   DRAW ROUTE ON MAP
═══════════════════════════════════════════════════════════════ */
function drawRoute(sm){
  // Clear ALL previous route layers and stop markers
  routeLayers.forEach(l=>{ try{l.remove()}catch(e){} });
  routeLayers=[];
  stopMarkers.forEach(m=>{ try{m.remove()}catch(e){} });
  stopMarkers=[];

  // Split route into done/ahead at current/problem stop
  const currentIdx = sm.routeStops.findIndex(s=>s.status==='current'||s.status==='problem');
  const splitIdx = currentIdx>=0 ? Math.min(currentIdx, sm.route.length-1) : sm.route.length-1;

  const coordsDone  = sm.route.slice(0, splitIdx+1);
  const coordsAhead = sm.route.slice(splitIdx);

  if(coordsDone.length>1){
    const l=L.polyline(coordsDone,{color:sm.clientColor||'#3D72FF',weight:3.5,opacity:.8}).addTo(map);
    routeLayers.push(l);
  }
  if(coordsAhead.length>1){
    const l=L.polyline(coordsAhead,{color:sm.clientColor||'#3D72FF',weight:2.5,opacity:.35,dashArray:'8,6'}).addTo(map);
    routeLayers.push(l);
  }

  // Fit bounds to full route
  const allLine = L.polyline(sm.route);
  map.fitBounds(allLine.getBounds(),{padding:[60,60],maxZoom:13,animate:true});

  // Draw stop markers with popups
  sm.routeStops.forEach((stop,i)=>{
    const icon = makeStopIcon(stop.type, stop.status, sm.clientColor, stop.seq||i);
    const zOff = (stop.status==='current'||stop.status==='problem') ? 1000 : 500;
    const marker = L.marker([stop.lat,stop.lng],{icon,zIndexOffset:zOff}).addTo(map);
    marker.bindPopup(makeStopPopup(stop,sm),{maxWidth:300,minWidth:260,closeButton:true,autoPan:true});
    marker.bindTooltip(stop.label,{direction:'top',className:'tc-tip',offset:[0,-14],sticky:false});
    stopMarkers.push(marker);
  });

  updateLegendForRoute(sm);
}

function updateLegendForRoute(sm){
  const c = sm.clientColor||'#3D72FF';
  document.getElementById('leg-title').textContent=`${sm.id} — ${sm.type}`;
  document.getElementById('leg-items').innerHTML=`
    <div class="leg-item">
      <div style="width:22px;height:22px;background:#6B7280;border:2px solid white;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 5px rgba(0,0,0,.3);flex-shrink:0">🏭</div>CD Origem
    </div>
    <div class="leg-item">
      <div style="width:22px;height:22px;background:${c};border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 6px ${c}60;flex-shrink:0">🚛</div>Posição atual
    </div>
    <div class="leg-item">
      <svg width="18" height="24" viewBox="0 0 28 38" style="flex-shrink:0"><path d="M14 2C7.4 2 2 7.4 2 14C2 22 14 36 14 36C14 36 26 22 26 14C26 7.4 20.6 2 14 2Z" fill="#2563EB" stroke="white" stroke-width="2.5"/><text x="14" y="17" text-anchor="middle" fill="white" font-size="11" font-weight="800" font-family="monospace">1</text></svg>Entrega
    </div>
    <div class="leg-item">
      <svg width="18" height="24" viewBox="0 0 30 40" style="flex-shrink:0"><path d="M15 2C7.8 2 2 8 2 15C2 24.5 15 38 15 38C15 38 28 24.5 28 15C28 8 22.2 2 15 2Z" fill="#7C3AED" stroke="white" stroke-width="2.5"/></svg>Destino
    </div>
    <div class="leg-item">
      <svg width="18" height="17" viewBox="0 0 32 30" style="flex-shrink:0"><path d="M16 2 L30 28 L2 28 Z" fill="#DC2626" stroke="white" stroke-width="2.5"/></svg>Ocorrência
    </div>
    <div class="leg-item" style="margin-top:3px">
      <div style="display:flex;align-items:center;gap:3px;flex-shrink:0">
        <div style="width:14px;height:3px;background:${c};border-radius:2px"></div>
        <div style="width:10px;height:0;border-top:3px dashed ${c};opacity:.5"></div>
      </div>Percorrida / à frente
    </div>
  `;
}

function resetLegend(){
  document.getElementById('leg-title').textContent='Risco das SMs';
  document.getElementById('leg-items').innerHTML=`
    <div class="leg-item"><div class="leg-dot" style="background:var(--red)"></div>Crítico (≥80)</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--amber)"></div>Alto (61–79)</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--orange)"></div>Médio (31–60)</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--green)"></div>Baixo (≤30)</div>
  `;
}

/* ═══════════════════════════════════════════════════════════════
   MAP INIT
═══════════════════════════════════════════════════════════════ */
function initMap(){
  map=L.map('map',{center:[-23.3,-46.8],zoom:9,zoomControl:true,attributionControl:true});
  mapTileLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
    attribution:'© OpenStreetMap © CARTO',subdomains:'abcd',maxZoom:19
  }).addTo(map);

  SMs.forEach(sm=>{
    const color=riskColor(sm.risk);
    const pulse=sm.risk>=80;
    const icon=makeTruckIcon(color,pulse,false);
    const marker=L.marker([sm.lat,sm.lng],{icon}).addTo(map);
    marker.bindTooltip(
      `<strong>${sm.id}</strong> · ${sm.client} · Score <strong>${sm.risk}</strong>`,
      {direction:'top',className:'tc-tip',offset:[0,-10]}
    );
    marker.on('click',(e)=>{ L.DomEvent.stopPropagation(e); selectSM(sm.id); });
    mapMarkers[sm.id]=marker;
  });
  // Click empty map → clear selection
  map.on('click',()=>{ if(selectedSM) closeDetail(); });
}

function setMarkerSelected(id,sel){
  const m=mapMarkers[id];if(!m)return;
  const sm=SMs.find(s=>s.id===id);if(!sm)return;
  const color=riskColor(sm.risk);
  const icon=makeTruckIcon(color,sm.risk>=80,sel);
  m.setIcon(icon);
}
function closeDetail(){
  document.getElementById('detail-panel').classList.remove('open');
  // Also close chat mode if open — but keep the tray alive
  if(document.querySelector('.app').getAttribute('data-chat')==='open'){
    closeChatMode();
    // Don't clear chatTabs/chatActive — tray still owns them
  }
  if(selectedSM){
    const prev=document.getElementById(`card-${selectedSM}`);
    if(prev) prev.classList.remove('selected');
    setMarkerSelected(selectedSM,false);
    selectedSM=null;
  }
  routeLayers.forEach(l=>{ try{l.remove()}catch(e){} });
  routeLayers=[];
  stopMarkers.forEach(m=>{ try{m.remove()}catch(e){} });
  stopMarkers=[];
  clearExtraMapLayers();
  const tiEl=document.getElementById('tab-indicator');
  if(tiEl) tiEl.innerHTML='';
  hideRouteStrip();
  resetLegend();
  // Restore main marker before clearing selectedSM
  if(selectedSM && mapMarkers[selectedSM]){
    const icon=makeTruckIcon(riskColor(SMs.find(s=>s.id===selectedSM)?.risk||50),false,false);
    mapMarkers[selectedSM].setIcon(icon);
  }
  restoreFilteredMarkers();
  activeTab='tab-timeline';
  setTimeout(()=>{if(map)map.invalidateSize()},300);
}

/* ═══════════════════════════════════════════════════════════════
   TABS
═══════════════════════════════════════════════════════════════ */
function switchTab(el,tabId){
  document.querySelectorAll('.dtab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.detail-body').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(tabId).classList.add('active');
  activeTab=tabId;
  updateTabIndicator(tabId);
  setMapMode(tabId);
}

/* ═══════════════════════════════════════════════════════════════
   POPULATE DETAIL
═══════════════════════════════════════════════════════════════ */
function populateDetail(sm){
  document.getElementById('d-id').textContent=sm.id;
  document.getElementById('d-client').textContent=sm.client;
  document.getElementById('d-client').style.color=sm.clientColor;
  document.getElementById('d-type').textContent=sm.type;

  // Per-tab indicator populated via updateTabIndicator

  // ── Build unified timeline ───────────────────────────────────
  buildTimeline(sm);

  // ── Fiscal mini-summary ──────────────────────────────────────
  const hasCTeProblem = sm.risk>=80||sm.farol.some(f=>f.dim==='Docs'&&f.status!=='ok');
  const fmEl=document.getElementById('d-fiscal-mini');
  if(fmEl){
    fmEl.innerHTML=`<div style="display:flex;gap:5px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:5px;font-size:10px;background:var(--s1);border:1.5px solid var(--border);border-radius:var(--radius-md);padding:5px 10px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.05)"
           onclick="openDocModal('mdfe','35260412345678000195580010000${sm.id.replace('SM-','')}','${sm.id}')">
        <span>📋</span><span style="color:var(--purple);font-weight:600">MDF-e</span>
        <span style="font-size:8px;padding:1px 5px;border-radius:3px;background:var(--green-s);color:var(--green)">✓ OK</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;font-size:10px;background:var(--s2);border:1px solid ${hasCTeProblem?'rgba(255,45,85,.3)':'var(--border)'};border-radius:var(--radius-md);padding:4px 9px;cursor:pointer"
           onclick="openDocModal('cte','35260412345678000195570010000${sm.id.replace('SM-','')}1','${sm.id}',0)">
        <span>📄</span><span style="color:var(--blue);font-weight:600">CT-e</span>
        <span style="font-size:8px;padding:1px 5px;border-radius:3px;${hasCTeProblem?'background:var(--red-s);color:var(--red)':'background:var(--green-s);color:var(--green)'}">${hasCTeProblem?'✗ Rejeitado':'✓ OK'}</span>
      </div>
    </div>`;
  }

  // (Locais tab rendered by buildLocaisTab, called below)

  // Driver
  const initials=sm.driver.split(' ').map(w=>w[0]).join('').slice(0,2);
  const scoreColor=sm.driverScore>=90?'var(--green)':sm.driverScore>=70?'var(--amber)':'var(--red)';
  document.getElementById('d-driver-card').innerHTML=`
    <div class="driver-avatar">${initials}</div>
    <div style="flex:1">
      <div class="driver-name-big">${sm.driver}</div>
      <div class="driver-plate-big">${sm.plate} · ${sm.vehicle}</div>
    </div>
    <div class="driver-score-wrap">
      <div class="driver-score-val" style="color:${scoreColor}">${sm.driverScore}</div>
      <div class="driver-score-lbl">Score</div>
    </div>
  `;

  // App status is now in Motorista tab indicator (updateTabIndicator)
  // Journey info goes in tab body
  const trackBadge = sm.trackingType==='satellite'
    ? `<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;background:var(--cyan-s);color:var(--cyan);border:1px solid rgba(0,199,255,.25)">🛰 Satelital</span>`
    : `<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;background:var(--green-s);color:var(--green);border:1px solid rgba(48,209,88,.25)">📱 Aplicativo</span>`;
  const jEl=document.getElementById('d-journey');
  if(jEl && sm.journey){
    jEl.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:var(--s1);border:1.5px solid var(--border);border-radius:var(--radius-base);padding:9px 11px">
      ${trackBadge}
      <span style="font-size:9px;color:var(--t3)">Jornada: <strong style="color:var(--t2)">${sm.journey.hours}</strong></span>
      <span style="font-size:9px;color:var(--t3)">Descanso: <strong style="color:var(--amber)">${sm.journey.rest}</strong></span>
      <span style="font-size:9px;color:var(--t3);margin-left:auto">Atualizado: <strong style="color:var(--t2);font-family:var(--f-m)">${sm.journey.lastUpdate}</strong></span>
    </div>`;
  }

  // Behavior
  const bItems=[
    {label:'Freadas',val:sm.behavior.freadas,color:sm.behavior.freadas>4?'var(--red)':'var(--amber)'},
    {label:'Curvas',val:sm.behavior.curvas,color:sm.behavior.curvas>3?'var(--red)':'var(--green)'},
    {label:'Exc. vel.',val:sm.behavior.velocidade,color:sm.behavior.velocidade>0?'var(--red)':'var(--green)'},
  ];
  document.getElementById('d-behavior').innerHTML=bItems.map(b=>`
    <div class="behavior-item">
      <div class="behavior-val" style="color:${b.color}">${b.val}</div>
      <div class="behavior-lbl">${b.label}</div>
    </div>
  `).join('');

  // Msgs are now part of the unified timeline (buildTimeline)

  // Actions handled by buildActions
  buildActions(sm);

  // Reset to timeline tab
  document.querySelectorAll('.dtab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.detail-body').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.dtab')[0].classList.add('active');
  document.getElementById('tab-timeline').classList.add('active');
  activeTab='tab-timeline';

  _currentSM = sm;

  // Populate tab indicator for timeline
  updateTabIndicator('tab-timeline');

  // Build Locais tab
  buildLocaisTab(sm);

  // Badge for locais (problems exist?)
  const hasProb = sm.risk>=80 || sm.farol.some(f=>f.status==='danger'&&f.dim==='Docs');
  const docBadge=document.getElementById('doc-alert-badge');
  if(docBadge) docBadge.style.display=hasProb?'inline-block':'none';
}

/* ═══════════════════════════════════════════════════════════════
   GENERATE 47 SMs (5 detailed + 42 simulated)
═══════════════════════════════════════════════════════════════ */
(function(){
  const CLIENTS=[
    {name:'Kellux',color:'#3D72FF'},
    {name:'Bombril',color:'#FF9F0A'},
    {name:'Fenza',color:'#30D158'},
  ];
  const TYPES=['LTL','Dedicado','Transferência','Mutação'];
  const DRIVERS=['Carlos Silva','Ricardo Matos','André Lima','Fernando Costa',
    'Paulo Mendes','Marcos Alves','Joel Santos','Thiago Ramos','Sérgio Lima',
    'Bruno Costa','Rafael Andrade','Julio César','Nilson Ferreira','Pedro Alves'];
  const VEHICLES=['Truck Scania R450','Truck DAF XF','Truck Mercedes Actros',
    'Van Iveco Daily','Truck Volvo FH','Truck MAN TGX','Caminhão VW Constellation'];
  const ROUTES=[
    {o:'São Paulo',d:'Campinas',coords:[[-23.548,-46.638],[-23.18,-46.89],[-22.905,-47.063]]},
    {o:'São Paulo',d:'Santos',coords:[[-23.548,-46.638],[-23.718,-46.558],[-23.960,-46.333]]},
    {o:'São Paulo',d:'Sorocaba',coords:[[-23.548,-46.638],[-23.57,-47.12],[-23.501,-47.458]]},
    {o:'São Paulo',d:'S. José dos Campos',coords:[[-23.548,-46.638],[-23.30,-45.98],[-23.186,-45.884]]},
    {o:'São Paulo',d:'Ribeirão Preto',coords:[[-23.548,-46.638],[-22.35,-47.15],[-21.177,-47.810]]},
    {o:'São Paulo',d:'Bauru',coords:[[-23.548,-46.638],[-22.50,-48.50],[-22.314,-49.060]]},
    {o:'Campinas',d:'Santos',coords:[[-22.905,-47.063],[-23.30,-46.80],[-23.960,-46.333]]},
    {o:'São Paulo',d:'Osasco',coords:[[-23.548,-46.638],[-23.532,-46.791]]},
    {o:'São Paulo',d:'Guarulhos',coords:[[-23.548,-46.638],[-23.455,-46.533]]},
    {o:'São Paulo',d:'São Bernardo',coords:[[-23.548,-46.638],[-23.694,-46.565]]},
  ];
  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const pick=arr=>arr[rnd(0,arr.length-1)];
  let baseId=984557;

  for(let i=0;i<41;i++){
    const cl=pick(CLIENTS);
    const type=pick(TYPES);
    const route=pick(ROUTES);
    const driver=pick(DRIVERS);
    const vehicle=pick(VEHICLES);
    const risk=rnd(10,99);
    const status=risk>=80?'parado':risk>=50?'em_rota':'em_rota';
    const progress=rnd(5,95);
    const delay=risk>=70?`+${rnd(15,180)}min`:null;
    const plate=`${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}-${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${rnd(10,99)}`;
    const score=rnd(60,99);
    const bat=`${rnd(15,99)}%`;
    const sigs=['4G OK','3G','Fraco (2G)','Sem sinal'];
    const sig=pick(sigs);
    // Spread coordinates a bit around route midpoint
    const midC=route.coords[Math.floor(route.coords.length/2)];
    const jitterLat=(Math.random()-0.5)*0.3;
    const jitterLng=(Math.random()-0.5)*0.3;
    const alerts=[];
    if(risk>=80) alerts.push({text:'Parado '+rnd(20,90)+'min',type:'alert'});
    if(delay) alerts.push({text:'Atraso '+delay,type:'alert'});
    if(rnd(0,3)===0) alerts.push({text:'Geo-fence divergente',type:'geo'});

    // Milestones
    const nStops=rnd(2,6);
    const milestones=[];
    milestones.push({label:'Saída do CD '+route.o,time:'0'+rnd(6,9)+':'+rnd(10,59).toString().padStart(2,'0'),done:true});
    for(let s=1;s<nStops-1;s++){
      const isDone=s/nStops < progress/100;
      const isCur=s===Math.floor(nStops*progress/100);
      milestones.push({label:'Ponto '+s+' — '+route.d,time:rnd(10,17)+':'+rnd(10,59).toString().padStart(2,'0'),done:isDone,current:isCur});
    }
    milestones.push({label:'Chegada '+route.d,time:rnd(16,22)+':'+rnd(10,59).toString().padStart(2,'0'),done:false});

    const sm={
      id:'SM-'+baseId++,client:cl.name,clientColor:cl.color,
      type,status,risk,driver,driverScore:score,plate,vehicle,
      origin:route.o,destination:route.d,
      eta:rnd(13,20)+':'+rnd(10,59).toString().padStart(2,'0'),
      etaDelay:delay,progress,
      lat:midC[0]+jitterLat,lng:midC[1]+jitterLng,
      lastUpdate:rnd(1,9)+'min atrás',
      alerts,milestones,
      farol:[
        {dim:'Docs',icon:'📄',status:rnd(0,5)>0?'ok':'warn',statusText:rnd(0,5)>0?'Validados':'Pendente',detail:'CT-e'},
        {dim:'Geo',icon:'📍',status:risk>=80?'danger':'ok',statusText:risk>=80?'Desvio':'No corredor',detail:''},
        {dim:'Telemetria',icon:'📡',status:sig.includes('Sem')||sig.includes('Fraco')?'warn':'ok',statusText:sig.includes('Sem')?'Sem sinal':'Online',detail:sig},
        {dim:'OTIF',icon:'⏱',status:delay?'danger':'ok',statusText:delay?'Em risco':'No prazo',detail:delay||'OK'},
      ],
      msgs:[{channel:'Sistema',cls:'msg-system',text:'SM em operação.',time:'—',sender:'Sistema'}],
      appStatus:{gps:'Ativo',battery:bat,signal:sig,app:rnd(0,4)>0?'Aberto':'Fechado'},
      trackingType:rnd(0,1)?'app':'satellite',
      journey:{hours:`${rnd(1,8)}h${rnd(10,59)}min`,rest:'OK',lastUpdate:'—'},
      behavior:{freadas:rnd(0,7),curvas:rnd(0,5),velocidade:rnd(0,2)},
      stats:[
        {label:'Risco',val:String(risk),cls:risk>=80?'risk-critical':risk>=60?'risk-high':'',sub:risk>=80?'Crítico':risk>=60?'Alto':'Médio'},
        {label:'Progresso',val:progress+'%',cls:progress>70?'ok':'',sub:rnd(20,300)+' km rest.'},
        {label:'ETA',val:rnd(14,21)+':'+rnd(10,59).toString().padStart(2,'0'),cls:delay?'eta-delay':'ok',sub:delay||'No prazo'},
      ],
      route:route.coords,
      routeStops:route.coords.map((c,ci)=>({
        label:ci===0?'CD '+route.o:ci===route.coords.length-1?route.d:'Ponto '+ci,
        type:ci===0?'origin':ci===route.coords.length-1?'destination':'checkpoint',
        lat:c[0],lng:c[1],status:ci<Math.floor(route.coords.length*progress/100)?'done':'pending',
        nf:null,contact:null,window:null,eta:null,actual:null,issues:[],
      })),
    };
    SMs.push(sm);
  }

  // One special SM with 30 delivery points (SM-984560 overwrite index 5)
  // Already pushed above, but let's enrich one generated SM with 30 stops
  const bigSM = SMs.find(s=>s.id==='SM-984558');
  if(bigSM){
    bigSM.id='SM-984560';
    bigSM.type='LTL';
    bigSM.client='Bombril';bigSM.clientColor='#FF9F0A';
    bigSM.driver='Marcos Alves';bigSM.driverScore=84;
    bigSM.plate='QRS-3A12';bigSM.vehicle='Truck Mercedes Atego 2430';
    bigSM.origin='CD São Paulo';bigSM.destination='Região Metro SP (30 pts)';
    bigSM.progress=38;bigSM.risk=74;bigSM.etaDelay='+45min';
    bigSM.alerts=[{text:'Atraso +45min',type:'alert'},{text:'8 entregas pendentes',type:'warn'}];
    // 30 delivery coords across SP metro
    const pts30=[
      [-23.548,-46.638,0,'CD São Paulo','origin','done'],
      [-23.533,-46.620,1,'Brás — Distribuidora A','delivery','done'],
      [-23.545,-46.609,2,'Tatuapé — Cliente B','delivery','done'],
      [-23.556,-46.595,3,'Penha — Superm. C','delivery','done'],
      [-23.562,-46.573,4,'São Miguel — Depo. D','delivery','done'],
      [-23.574,-46.544,5,'Ermelino — Cliente E','delivery','done'],
      [-23.586,-46.518,6,'Itaquera — Farmácia F','delivery','done'],
      [-23.598,-46.493,7,'Guaianases — Depo. G','delivery','done'],
      [-23.610,-46.470,8,'Ferraz Vasconcelos','delivery','done'],
      [-23.528,-46.660,9,'Pinheiros — Depo. H','delivery','done'],
      [-23.515,-46.680,10,'Lapa — Cliente I','delivery','done'],
      [-23.503,-46.700,11,'Vila Leopoldina','delivery','done'],
      [-23.508,-46.735,12,'Osasco — Depo. J','delivery','current'],
      [-23.523,-46.760,13,'Carapicuíba — Mkt K','delivery','pending'],
      [-23.535,-46.783,14,'Barueri — Depo. L','delivery','pending'],
      [-23.548,-46.806,15,'Jandira — Cliente M','delivery','pending'],
      [-23.560,-46.827,16,'Itapevi — Depo. N','delivery','pending'],
      [-23.475,-46.645,17,'Santana — Mkt O','delivery','pending'],
      [-23.463,-46.630,18,'Tucuruvi — Cliente P','delivery','pending'],
      [-23.450,-46.610,19,'Tremembé — Depo. Q','delivery','pending'],
      [-23.455,-46.535,20,'Guarulhos Norte','delivery','pending'],
      [-23.442,-46.512,21,'Guarulhos Centro','delivery','pending'],
      [-23.430,-46.490,22,'Cumbica — Depo. R','delivery','pending'],
      [-23.560,-46.450,23,'São Miguel Paulista','delivery','pending'],
      [-23.578,-46.430,24,'Itaim Paulista','delivery','pending'],
      [-23.600,-46.640,25,'Ipiranga — Mkt S','delivery','pending'],
      [-23.620,-46.654,26,'Santo André — Depo. T','delivery','pending'],
      [-23.635,-46.630,27,'São Caetano — Cliente U','delivery','pending'],
      [-23.652,-46.559,28,'São Bernardo — Depo. V','delivery','pending'],
      [-23.668,-46.539,29,'Diadema — Mkt W','delivery','pending'],
      [-23.685,-46.519,30,'Mauá — Depo. Final','destination','pending'],
    ];
    bigSM.routeStops = pts30.map(([lat,lng,seq,label,type,status])=>({
      label,type,lat,lng,seq:seq||undefined,status,
      nf:seq>0?`NF-3${9000+seq}`:'',
      contact:seq>0?`Recebimento · (11) 9${8000+seq}-${1000+seq}`:'',
      window:seq>0?`${9+Math.floor(seq/6)}:00–${10+Math.floor(seq/6)}:30`:'',
      eta:null,actual:status==='done'?`${9+Math.floor(seq/6)}:${(seq*7%60).toString().padStart(2,'0')}`:'',
      issues:status==='pending'&&seq>20?[{sev:'warn',text:'Entrega agendada — confirmar presença'}]:[],
    }));
    bigSM.route = pts30.map(([lat,lng])=>[lat,lng]);
    bigSM.milestones = [
      {label:'Saída CD São Paulo',time:'07:30',done:true},
      {label:'Entregas 1–12 concluídas',time:'10:45',done:true},
      {label:'Entrega 12 — Osasco (atual)',time:'11:30',current:true},
      {label:'Entregas 13–20 pendentes',time:'14:00',done:false},
      {label:'Entregas 21–30 pendentes',time:'17:30',done:false},
    ];
  }
})();


/* ═══════════════════════════════════════════════════════════════
   ALERT BANNER
═══════════════════════════════════════════════════════════════ */
const ACTIVE_ALERTS=[
  {sev:'danger',type:'parado',        sm:'SM-984553',title:'Parado 45min sem sinal',              sub:'Fora do corredor · Geo-fence divergente'},
  {sev:'danger',type:'otif',          sm:'SM-984552',title:'OTIF em risco — Atraso +47min',        sub:'Kellux Campinas · Janela fecha 15:00'},
  {sev:'warn',  type:'dest_vermelho', sm:'SM-984556',title:'Destinatário Vermelho detectado',       sub:'Bombril Sorocaba · Histórico de recusa'},
  {sev:'warn',  type:'fiscal',        sm:'SM-984555',title:'Aguardando liberação fiscal +18min',    sub:'Mutação SP · Carga bloqueada'},
  {sev:'danger',type:'otif',          sm:'SM-984560',title:'LTL Metropolitano: 8 entregas atrasadas',sub:'Marcos Alves · Osasco atual'},
  {sev:'warn',  type:'fiscal',        sm:'SM-984561',title:'Documentação pendente — DANFE não capturado',sub:'Fenza · NF-38880'},
  {sev:'warn',  type:'bateria',       sm:'SM-984563',title:'Bateria do app crítica — 8%',           sub:'Motorista sem comunicação'},
  {sev:'danger',type:'velocidade',    sm:'SM-984567',title:'Excesso de velocidade detectado',       sub:'+42 km/h acima do limite'},
  {sev:'warn',  type:'janela',        sm:'SM-984570',title:'Janela de entrega expirando em 30min',  sub:'3 paradas críticas'},
  {sev:'danger',type:'fiscal',        sm:'SM-984574',title:'MDF-e rejeitado pela SEFAZ',            sub:'Código 539 — divergência de valor'},
  {sev:'warn',  type:'parado',        sm:'SM-984578',title:'Parada não programada — 22min',         sub:'Rota SP→Santos · Km 38'},
  {sev:'warn',  type:'temperatura',   sm:'SM-984580',title:'Temperatura da carga acima do limite',  sub:'Refrigerado Fenza · +2°C'},
];

// Botões de ação rápida por tipo de alerta
const ALERT_ACTIONS={
  parado:        [{l:'📞 Ligar',cls:'primary'},{l:'⏰ Alarme 15min',cls:''},{l:'✓ Resolvido',cls:'success'}],
  otif:          [{l:'💬 Motorista',cls:'primary'},{l:'📋 Escalar',cls:''},{l:'✓ Ciente',cls:'success'}],
  dest_vermelho: [{l:'⚠️ Alertar motorista',cls:'primary'},{l:'📋 Registrar',cls:''},{l:'✓ Ciente',cls:'success'}],
  fiscal:        [{l:'📄 Ver doc',cls:'primary'},{l:'🔄 Regularizar',cls:''},{l:'✓ Ciente',cls:'success'}],
  bateria:       [{l:'📞 Ligar',cls:'primary'},{l:'👁 Monitorar',cls:''},{l:'✓ Ciente',cls:'success'}],
  velocidade:    [{l:'📞 Ligar',cls:'primary'},{l:'⚠️ Registrar',cls:''},{l:'✓ Ciente',cls:'success'}],
  janela:        [{l:'💬 Motorista',cls:'primary'},{l:'🔔 Alertar cliente',cls:''},{l:'✓ Ciente',cls:'success'}],
  temperatura:   [{l:'📞 Ligar',cls:'primary'},{l:'📋 Escalar',cls:''},{l:'✓ Ciente',cls:'success'}],
};

function initAlertBanner(){
  // Ticker
  const ticker=document.getElementById('mab-ticker');
  if(!ticker) return;
  const items=ACTIVE_ALERTS.filter(a=>a.sev==='danger').slice(0,6);
  const doubled=[...items,...items]; // loop
  ticker.innerHTML=doubled.map(a=>
    `<div class="mab-alert-item" onclick="selectSM('${a.sm}')">
      <span class="sm-ref">${a.sm}</span> ${a.title}
    </div>`
  ).join('');
  document.getElementById('mab-count').textContent=ACTIVE_ALERTS.length+' ativos';

  // Full panel — with quick actions per type
  const afp=document.getElementById('afp-inner');
  if(afp){
    afp.innerHTML=ACTIVE_ALERTS.map(a=>{
      const acts=(ALERT_ACTIONS[a.type]||[]).map(b=>
        `<button class="afp-act ${b.cls}" onclick="event.stopPropagation();afpAction('${b.l}','${a.sm}')">${b.l}</button>`
      ).join('');
      return `<div class="afp-item" onclick="selectSM('${a.sm}');toggleAlertPanel()">
        <div class="afp-sev ${a.sev}"></div>
        <div class="afp-body">
          <div class="afp-title">${a.title}</div>
          <div class="afp-sub">${a.sub}</div>
          ${acts?`<div class="afp-actions">${acts}</div>`:''}
        </div>
        <span class="afp-sm ${a.sev}">${a.sm}</span>
      </div>`;
    }).join('');
  }
}

function toggleAlertPanel(){
  const p=document.getElementById('alert-full-panel');
  if(p) p.classList.toggle('open');
}

function afpAction(label, smId){
  showToast(`${label} — ${smId}`);
}

/* ═══════════════════════════════════════════════════════════════
   NAV GROUP — colapsável Torre de Controle
═══════════════════════════════════════════════════════════════ */
function toggleNavGroup(id){
  const group = document.getElementById('nav-group-'+id);
  if(!group) return;
  const items = document.getElementById('ng-items-'+id);
  const isCollapsed = group.classList.toggle('collapsed');
  // Set explicit max-height for smooth animation
  if(!isCollapsed){
    items.style.maxHeight = items.scrollHeight + 'px';
  } else {
    items.style.maxHeight = items.scrollHeight + 'px'; // force reflow
    requestAnimationFrame(()=>{ items.style.maxHeight = '0'; });
  }
}

// Init nav group — start expanded, set explicit height
(function initNavGroup(){
  const items = document.getElementById('ng-items-torre');
  if(items) setTimeout(()=>{ items.style.maxHeight = items.scrollHeight + 'px'; }, 50);
})();

/* ═══════════════════════════════════════════════════════════════
   ROUTE STRIP UPDATE
═══════════════════════════════════════════════════════════════ */
function updateRouteStrip(sm){ /* route strip removed — info lives in drawer header + stat cards */ }

function hideRouteStrip(){ /* route strip removed */ }

/* ═══════════════════════════════════════════════════════════════
   POD HIERÁRQUICO — accordion destinatário → NFs
═══════════════════════════════════════════════════════════════ */
const NF_STATUSES=['assinada','assinada','assinada','pendente','recusada','ausente'];
const NF_VALUES=['R$ 4.820,00','R$ 2.100,00','R$ 890,00','R$ 6.200,00','R$ 1.450,00',
  'R$ 3.300,00','R$ 780,00','R$ 5.100,00','R$ 2.280,00','R$ 4.000,00'];

function generateNFs(stop, stopIdx){
  // Each delivery stop = 1 destinatário with 1-3 NFs
  const nfCount = stopIdx % 5 === 0 ? 3 : stopIdx % 3 === 0 ? 2 : 1;
  const nfs=[];
  for(let i=0;i<nfCount;i++){
    const nfId=stop.nf?stop.nf.split('·')[i]||`NF-${39000+stopIdx*3+i}`:`NF-${39000+stopIdx*3+i}`;
    const statusIdx=stop.status==='done'?0:stop.status==='problem'?4:3;
    const jitter=i===0?0:Math.min(i,NF_STATUSES.length-1);
    nfs.push({
      id:nfId.trim(),
      value:NF_VALUES[(stopIdx+i)%NF_VALUES.length],
      status:stop.status==='done'?(i===0?'assinada':i===1?'assinada':'pendente'):stop.status==='problem'?'recusada':'pendente',
    });
  }
  return nfs;
}

function buildPOD(sm){
  const section=document.getElementById('d-pod-section');
  if(!section) return;
  const deliveries=sm.routeStops.filter(s=>s.type==='delivery');
  if(!deliveries.length){ section.style.display='none'; return; }
  section.style.display='block';

  // Count total + captured NFs
  let totalNFs=0, capturedNFs=0;
  const allDests=deliveries.map((s,i)=>{
    const nfs=generateNFs(s,i+1);
    totalNFs+=nfs.length;
    capturedNFs+=nfs.filter(n=>n.status==='assinada').length;
    return {stop:s,nfs,idx:i};
  });

  document.getElementById('d-pod-count').textContent=`${capturedNFs}/${totalNFs} capturados`;
  const podList=document.getElementById('d-pod-list');
  if(!podList) return;

  const NF_STATUS_CFG={
    assinada:{cls:'pns-ok',label:'✓ Assinada',btnPrimary:'📄 Canhoto',btn2:null,btnWarn:null},
    pendente:{cls:'pns-pend',label:'⏳ Pendente',btnPrimary:null,btn2:'📋 Registrar',btnWarn:'💬 Contatar'},
    recusada:{cls:'pns-recusada',label:'✗ Recusada',btnPrimary:null,btn2:'📋 Ver ocorrência',btnWarn:'🔄 Reagendar'},
    ausente:{cls:'pns-ausente',label:'✗ Ausente',btnPrimary:null,btn2:'📋 Registrar ausência',btnWarn:'💬 Contatar'},
  };

  const destIcon={
    done:'<i class="fa-solid fa-circle-check" style="color:var(--green)"></i>',
    pending:'<i class="fa-regular fa-circle" style="color:var(--t3)"></i>',
    current:'<i class="fa-solid fa-circle-dot" style="color:var(--blue)"></i>',
    problem:'<i class="fa-solid fa-circle-exclamation" style="color:var(--red)"></i>',
  };

  podList.innerHTML=allDests.map(({stop,nfs,idx})=>{
    const cfg=NF_STATUS_CFG;
    const doneCount=nfs.filter(n=>n.status==='assinada').length;
    const hasProblem=nfs.some(n=>n.status==='recusada'||n.status==='ausente');
    const statusIcon=destIcon[stop.status]||destIcon.pending;
    const contactName=stop.contact?stop.contact.split('·')[0].trim():'';

    const nfRows=nfs.map(nf=>{
      const s=cfg[nf.status]||cfg.pendente;
      const btns=[
        s.btnPrimary?`<button class="pod-nf-btn primary">${s.btnPrimary}</button>`:'',
        s.btnWarn?`<button class="pod-nf-btn warn">${s.btnWarn}</button>`:'',
        s.btn2?`<button class="pod-nf-btn ${hasProblem?'danger':''}">${s.btn2}</button>`:'',
      ].filter(Boolean).join('');
      return `<div class="pod-nf-item">
        <div class="pod-nf-id">${nf.id}</div>
        <div class="pod-nf-val">${nf.value}</div>
        <span class="pod-nf-status ${s.cls}">${s.label}</span>
        <div class="pod-nf-actions">${btns}</div>
      </div>`;
    }).join('');

    const openFirst = idx===0 ? 'open' : '';
    return `<div class="pod-dest ${openFirst}">
      <div class="pod-dest-hdr" onclick="this.parentElement.classList.toggle('open')">
        <div class="pod-dest-icon">${statusIcon}</div>
        <div class="pod-dest-info">
          <div class="pod-dest-name">${stop.label}</div>
          <div class="pod-dest-meta">${contactName||'—'}${stop.window?' · Janela '+stop.window:''}</div>
        </div>
        <div class="pod-dest-badges">
          <span class="pod-nf-count">${nfs.length} NF${nfs.length>1?'s':''} · ${doneCount}/${nfs.length} ok</span>
          ${hasProblem?`<span style="font-size:9px;color:var(--red)"><i class="fa-solid fa-triangle-exclamation"></i></span>`:''}
        </div>
        <i class="fa-solid fa-chevron-right pod-dest-chevron"></i>
      </div>
      <div class="pod-nfs">${nfRows}</div>
    </div>`;
  }).join('');
}


/* ═══════════════════════════════════════════════════════════════
   DOCUMENTS TAB — hierarchical: MDF-e → CT-e → NF-e → Canhoto
═══════════════════════════════════════════════════════════════
   Insight profissional:
   Fluxo real BR: 1 MDF-e por viagem agrupa CT-es e NF-es.
   Cada CT-e vincula transportadora→embarcador com grupo de NFs.
   Cada NF tem 1 canhoto (POD) capturado no momento da entrega.
   Problemas críticos: NF sem canhoto = risco fiscal; CT-e rejeitado
   = entrega bloqueada; MDF-e não encerrado = multa ANTT.
════════════════════════════════════════════════════════════════ */

const DOC_NF_VALS=['R$ 4.820,00','R$ 2.100,00','R$ 890,00','R$ 6.200,00','R$ 1.450,00',
  'R$ 3.300,00','R$ 780,00','R$ 5.100,00','R$ 2.280,00','R$ 4.000,00','R$ 1.750,00','R$ 920,00'];
const DOC_NF_STATUS=['assinada','assinada','pendente','recusada','assinada','ausente'];

function buildDocumentsTab(sm){
  const deliveries = sm.routeStops.filter(s=>s.type==='delivery');
  const hasDeliveries = deliveries.length > 0;

  // ── Fiscal documents (simulated per SM) ──────────────────────
  const hasCTeProblem = sm.risk>=80 || sm.farol.some(f=>f.dim==='Docs'&&f.status!=='ok');
  const mdfe={
    num:`35260412345678000195580010000${sm.id.replace('SM-','')}`,
    status:'Autorizado e Encerrado', statusCls:'ok',
    encerramento:'Automático', uf:'SP',
  };
  const ctes=[
    {num:`35260412345678000195570010000${sm.id.replace('SM-','')}1`,
     emitente:sm.client+' S.A.',valor:'R$ '+(4000+sm.risk*30)+',00',
     status:hasCTeProblem?'Rejeitado':'Autorizado',
     statusCls:hasCTeProblem?'danger':'ok',
     rejeicao:hasCTeProblem?'Cód. 539 — valor divergente':null},
  ];
  if(deliveries.length>5){
    ctes.push({num:`35260412345678000195570010000${sm.id.replace('SM-','')}2`,
     emitente:'Transportadora Parceira Ltda',valor:'R$ 2.100,00',
     status:'Autorizado',statusCls:'ok',rejeicao:null});
  }

  // ── Summary counts ────────────────────────────────────────────
  const totalNFs = hasDeliveries ? deliveries.reduce((acc,s,i)=>acc+(i%3===0?3:i%2===0?2:1),0) : 2;
  const assinadaCount = hasDeliveries ? deliveries.filter(s=>s.status==='done').reduce((acc,s,i)=>acc+(i%3===0?3:i%2===0?2:1),0) : 1;
  const problemDocs = ctes.filter(c=>c.statusCls==='danger').length;

  const sumEl = document.getElementById('doc-sum-strip');
  if(sumEl) sumEl.innerHTML = [
    {val:1+ctes.length,lbl:'CT-e',cls:hasCTeProblem?'var(--red)':'var(--green)'},
    {val:totalNFs,lbl:'NF-es',cls:'var(--t1)'},
    {val:assinadaCount+'/'+totalNFs,lbl:'Canhotos',cls:assinadaCount<totalNFs?'var(--amber)':'var(--green)'},
  ].map(s=>`<div class="doc-sum-card">
    <div class="doc-sum-val" style="color:${s.cls}">${s.val}</div>
    <div class="doc-sum-lbl">${s.lbl}</div>
  </div>`).join('');

  // ── Fiscal section ─────────────────────────────────────────────
  const fiscalEl = document.getElementById('doc-fiscal-list');
  if(fiscalEl){
    const mdfCard = `<div class="doc-fiscal-card" onclick="openDocModal('mdfe','${mdfe.num}','${sm.id}')">
      <div class="doc-fc-icon" style="background:rgba(191,90,242,.12);color:var(--purple)">MDF</div>
      <div class="doc-fc-info">
        <div class="doc-fc-type" style="color:var(--purple)">MDF-e</div>
        <div class="doc-fc-num">${mdfe.num.slice(0,20)}…</div>
      </div>
      <span class="doc-fc-status chip-ok">${mdfe.status}</span>
      <button class="doc-fc-btn" onclick="event.stopPropagation();openDocModal('mdfe','${mdfe.num}','${sm.id}')">Abrir</button>
    </div>`;

    const cteCards = ctes.map((ct,i)=>`
      <div class="doc-fiscal-card" onclick="openDocModal('cte','${ct.num}','${sm.id}',${i})">
        <div class="doc-fc-icon" style="background:var(--blue-s);color:var(--blue)">CT-e</div>
        <div class="doc-fc-info">
          <div class="doc-fc-type" style="color:var(--blue)">CT-e ${i+1}</div>
          <div class="doc-fc-num">${ct.num.slice(0,20)}…</div>
        </div>
        <span class="doc-fc-status ${ct.statusCls==='ok'?'chip-ok':'chip-fail'}">${ct.status}</span>
        <button class="doc-fc-btn" onclick="event.stopPropagation();openDocModal('cte','${ct.num}','${sm.id}',${i})">Abrir</button>
      </div>`).join('');

    fiscalEl.innerHTML = mdfCard + cteCards;
  }

  // ── Delivery destinations with NFs + canhotos ──────────────────
  const destEl = document.getElementById('doc-dest-list');
  if(!destEl) return;
  if(!hasDeliveries){ destEl.innerHTML='<div style="font-size:11px;color:var(--t3);text-align:center;padding:16px">Sem pontos de entrega nesta SM</div>'; return; }

  destEl.innerHTML = deliveries.map((stop,di)=>{
    const nfCount = di%3===0?3:di%2===0?2:1;
    const isDone = stop.status==='done';
    const isProblem = stop.status==='problem';
    const seqColor = isDone?'var(--green)':isProblem?'var(--red)':'var(--t3)';
    const seqBg = isDone?'var(--green-s)':isProblem?'var(--red-s)':'var(--s3)';
    let doneNFs=0;

    const nfRows = Array.from({length:nfCount}).map((_,ni)=>{
      const nfId = `NF-${39000+di*3+ni+1}`;
      const val = DOC_NF_VALS[(di+ni)%DOC_NF_VALS.length];
      const status = isDone?(ni<nfCount-1?'assinada':'assinada'):isProblem?'recusada':'pendente';
      if(status==='assinada') doneNFs++;
      const chipCls = status==='assinada'?'chip-ok':status==='recusada'?'chip-fail':'chip-pend';
      const chipTxt = status==='assinada'?'✓ Assinada':status==='recusada'?'✗ Recusada':'⏳ Pendente';
      const podIcon = status==='assinada'?'📄':status==='recusada'?'📵':'📷';
      const podTxt = status==='assinada'?'Canhoto capturado — '+((stop.actual)||'—'):status==='recusada'?'Entrega recusada':'Aguardando captura';
      const podStatusCls = status==='assinada'?'var(--green)':status==='recusada'?'var(--red)':'var(--t3)';

      const btns = status==='assinada'
        ? `<button class="doc-act-btn blue" onclick="openDocModal('canhoto','${nfId}','${stop.label}')">📄 Canhoto</button>
           <button class="doc-act-btn" onclick="openDocModal('nfe','${nfId}','${stop.label}')">Ver NF</button>`
        : status==='recusada'
        ? `<button class="doc-act-btn red" onclick="openDocModal('nfe','${nfId}','${stop.label}')">Ver NF</button>
           <button class="doc-act-btn amber">🔄 Reagendar</button>`
        : `<button class="doc-act-btn" onclick="openDocModal('nfe','${nfId}','${stop.label}')">Ver NF</button>
           <button class="doc-act-btn amber">💬 Contatar</button>`;

      return `<div class="doc-nf-row">
        <div class="doc-nf-id">${nfId}</div>
        <div class="doc-nf-val">${val}</div>
        <span class="doc-nf-chip ${chipCls}">${chipTxt}</span>
        <div class="doc-nf-actions">${btns}</div>
      </div>
      <div class="pod-row">
        <span class="pod-row-icon">${podIcon}</span>
        <span class="pod-row-info">${podTxt}</span>
        <span class="pod-row-status" style="color:${podStatusCls}">${status==='assinada'?'● OK':status==='recusada'?'● Recusado':'● Pendente'}</span>
      </div>`;
    }).join('');

    const isFirstOpen = di===0 ? 'open' : '';
    const badge = isProblem ? '<span style="font-size:8px;color:var(--red);font-weight:700">⚠ Ocorrência</span>' : '';
    return `<div class="doc-dest-accordion ${isFirstOpen}">
      <div class="doc-da-hdr" onclick="this.parentElement.classList.toggle('open')">
        <div class="doc-da-seq" style="background:${seqBg};color:${seqColor}">${di+1}</div>
        <div class="doc-da-info">
          <div class="doc-da-name">${stop.label}</div>
          <div class="doc-da-meta">${stop.contact?stop.contact.split('·')[0].trim():'—'}${stop.window?' · '+stop.window:''}</div>
        </div>
        <div class="doc-da-badges">
          <span style="font-size:9px;background:var(--s1);padding:2px 7px;border-radius:3px;color:var(--t2)">${nfCount} NF${nfCount>1?'s':''}</span>
          ${badge}
        </div>
        <span class="doc-da-arrow">›</span>
      </div>
      <div class="doc-da-body">${nfRows}</div>
    </div>`;
  }).join('');

  // Badge in tab if there are problems
  const docBadge = document.getElementById('doc-alert-badge');
  if(docBadge){
    const hasProb = hasCTeProblem || deliveries.some(s=>s.status==='problem');
    docBadge.style.display = hasProb ? 'inline-block' : 'none';
  }
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT VIEWER MODAL
═══════════════════════════════════════════════════════════════ */
let _currentSM = null;

function openDocModal(type, id, context, extra){
  const overlay = document.getElementById('doc-modal-overlay');
  const badge = document.getElementById('dmod-badge');
  const title = document.getElementById('dmod-title');
  const status = document.getElementById('dmod-status');
  const body = document.getElementById('dmod-body');
  const primaryBtn = document.getElementById('dmod-primary-btn');
  if(!overlay) return;

  const TYPE_CFG = {
    nfe:    {label:'NF-e',    bg:'rgba(48,209,88,.12)',    color:'var(--green)'},
    cte:    {label:'CT-e',    bg:'var(--blue-s)',           color:'var(--blue)'},
    mdfe:   {label:'MDF-e',   bg:'rgba(191,90,242,.12)',    color:'var(--purple)'},
    canhoto:{label:'Canhoto', bg:'rgba(255,159,10,.12)',    color:'var(--amber)'},
  };
  const cfg = TYPE_CFG[type] || TYPE_CFG.nfe;
  badge.textContent = cfg.label;
  badge.style.background = cfg.bg;
  badge.style.color = cfg.color;
  title.textContent = id;

  let bodyHtml = '';
  let statusTxt = '';
  let statusCls = '';

  if(type==='nfe'){
    statusTxt = context&&(context.includes('Brás')||context.includes('Tatuapé')||context.includes('Penha'))?'✓ Autorizada':'⏳ Pendente';
    statusCls = statusTxt.includes('✓')?'chip-ok':'chip-pend';
    const smData = _currentSM;
    bodyHtml = `
      <div class="doc-section">
        <div class="doc-section-title">Dados da Nota Fiscal</div>
        <div class="doc-fields">
          <div class="doc-field"><div class="doc-field-lbl">Número / Série</div><div class="doc-field-val">${id} / 001</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Data de emissão</div><div class="doc-field-val">07/04/2026 08:30</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Emitente</div><div class="doc-field-val">${smData?smData.client+' S.A.':'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Destinatário</div><div class="doc-field-val">${context||'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Valor total</div><div class="doc-field-val ok">R$ 4.820,00</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Valor do frete</div><div class="doc-field-val">R$ 380,00</div></div>
          <div class="doc-field"><div class="doc-field-lbl">CFOP</div><div class="doc-field-val mono">6353</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Peso bruto</div><div class="doc-field-val">820 kg</div></div>
          <div class="doc-field full"><div class="doc-field-lbl">Chave de acesso</div><div class="doc-field-val mono">35260412345678000195550010000${id.replace('NF-','')}1234567890</div></div>
        </div>
      </div>
      <div class="doc-section">
        <div class="doc-section-title">Status SEFAZ</div>
        <div class="doc-fields">
          <div class="doc-field"><div class="doc-field-lbl">Situação</div><div class="doc-field-val ok">✓ Autorizado o uso</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Protocolo</div><div class="doc-field-val mono">135260000018471</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Data autorização</div><div class="doc-field-val">07/04/2026 08:32</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Validade DANFE</div><div class="doc-field-val">07/05/2026</div></div>
        </div>
      </div>`;
    primaryBtn.textContent = '⬇ Baixar DANFE (PDF)';
  }
  else if(type==='canhoto'){
    statusTxt = '✓ Capturado';
    statusCls = 'chip-ok';
    bodyHtml = `
      <div class="doc-section">
        <div class="doc-section-title">Comprovante de Entrega (POD)</div>
        <div class="doc-fields">
          <div class="doc-field"><div class="doc-field-lbl">NF vinculada</div><div class="doc-field-val mono">${id}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Destinatário</div><div class="doc-field-val">${context||'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Receptor</div><div class="doc-field-val">João da Silva (Recebimento)</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Data e hora</div><div class="doc-field-val">07/04/2026 · 14:28</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Geolocalização</div><div class="doc-field-val ok">✓ Dentro do geo-fence</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Assinatura digital</div><div class="doc-field-val ok">✓ Coletada no app</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Lat / Lng</div><div class="doc-field-val mono">-23.5068 / -46.6388</div></div>
          <div class="doc-field"><div class="doc-field-lbl">App versão</div><div class="doc-field-val mono">v4.2.1</div></div>
        </div>
      </div>
      <div class="doc-section">
        <div class="doc-section-title">Capturas do motorista</div>
        <div class="doc-photo-grid">
          <div class="doc-photo captured"><div class="doc-photo-icon">📄</div><div class="doc-photo-lbl">Canhoto assinado · 14:28</div></div>
          <div class="doc-photo captured"><div class="doc-photo-icon">📦</div><div class="doc-photo-lbl">Carga entregue · 14:26</div></div>
          <div class="doc-photo captured"><div class="doc-photo-icon">🏷️</div><div class="doc-photo-lbl">Lacre verificado · 14:25</div></div>
          <div class="doc-photo"><div class="doc-photo-icon">📷</div><div class="doc-photo-lbl">Pendente captura</div></div>
        </div>
      </div>`;
    primaryBtn.textContent = '⬇ Baixar POD (PDF)';
  }
  else if(type==='cte'){
    const isFail = extra===0 && (_currentSM&&_currentSM.risk>=80);
    statusTxt = isFail?'✗ Rejeitado':'✓ Autorizado';
    statusCls = isFail?'chip-fail':'chip-ok';
    bodyHtml = `
      <div class="doc-section">
        <div class="doc-section-title">Conhecimento de Transporte</div>
        <div class="doc-fields">
          <div class="doc-field"><div class="doc-field-lbl">Emitente</div><div class="doc-field-val">${_currentSM?_currentSM.client+' S.A.':'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Tomador</div><div class="doc-field-val">Embarcador</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Valor do frete</div><div class="doc-field-val ${isFail?'danger':'ok'}">${isFail?'R$ 4.820,00 ⚠':'R$ 4.380,00'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Modal</div><div class="doc-field-val">Rodoviário</div></div>
          <div class="doc-field"><div class="doc-field-lbl">CFOP</div><div class="doc-field-val mono">6353</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Peso total</div><div class="doc-field-val">14.820 kg</div></div>
          ${isFail?`<div class="doc-field full"><div class="doc-field-lbl">Motivo rejeição SEFAZ</div><div class="doc-field-val danger">Código 539 — Valor total da NF divergente. Diferença: R$ 440,00</div></div>`:''}
          <div class="doc-field full"><div class="doc-field-lbl">Chave de acesso</div><div class="doc-field-val mono">${id.slice(0,30)}…</div></div>
        </div>
      </div>`;
    primaryBtn.textContent = isFail?'🔄 Solicitar reemissão':'⬇ Baixar CT-e (XML)';
  }
  else if(type==='mdfe'){
    statusTxt = '✓ Encerrado';
    statusCls = 'chip-ok';
    bodyHtml = `
      <div class="doc-section">
        <div class="doc-section-title">Manifesto de Documentos Fiscais</div>
        <div class="doc-fields">
          <div class="doc-field"><div class="doc-field-lbl">Emitente</div><div class="doc-field-val">${_currentSM?_currentSM.client+' S.A.':'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">UF de carregamento</div><div class="doc-field-val">SP</div></div>
          <div class="doc-field"><div class="doc-field-lbl">UF de descarregamento</div><div class="doc-field-val">SP</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Condutor</div><div class="doc-field-val">${_currentSM?_currentSM.driver:'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Placa</div><div class="doc-field-val mono">${_currentSM?_currentSM.plate:'—'}</div></div>
          <div class="doc-field"><div class="doc-field-lbl">Encerramento</div><div class="doc-field-val ok">Automático no destino</div></div>
          <div class="doc-field full"><div class="doc-field-lbl">Protocolo SEFAZ</div><div class="doc-field-val mono">235260000029841</div></div>
        </div>
      </div>`;
    primaryBtn.textContent = '⬇ Baixar MDF-e (XML)';
  }

  status.textContent = statusTxt;
  status.className = 'doc-modal-status '+statusCls;
  body.innerHTML = bodyHtml;
  overlay.classList.add('open');
}

function closeDocModal(){
  const overlay = document.getElementById('doc-modal-overlay');
  if(overlay) overlay.classList.remove('open');
}


/* ═══════════════════════════════════════════════════════════════
   TAB INDICATOR SYSTEM — per-tab sticky context
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   UNIFIED TIMELINE — milestones + messages + alerts
   Each event is georeferenced (lat/lng derived from route position)
   Click → map flies to that point
═══════════════════════════════════════════════════════════════ */
let _timelineEvents = [];
let _timelineFilter = 'all';

function _timeToMinutes(t){
  if(!t||typeof t!=='string') return 0;
  const m=t.match(/(\d{1,2}):(\d{2})/);
  if(!m) return 0;
  return parseInt(m[1])*60+parseInt(m[2]);
}

function _latlngForTime(sm, time){
  // Find the routeStop closest in time, fallback to first/last
  const stops = sm.routeStops||[];
  if(!stops.length) return [sm.lat, sm.lng];
  const tMin = _timeToMinutes(time);
  let best = stops[0], bestDiff = Infinity;
  stops.forEach(s=>{
    const ref = s.actual||s.eta;
    if(!ref) return;
    const d = Math.abs(_timeToMinutes(ref)-tMin);
    if(d<bestDiff){bestDiff=d; best=s;}
  });
  return [best.lat, best.lng];
}

function buildTimeline(sm){
  const events = [];

  // 1) Milestones → marcos cronológicos
  (sm.milestones||[]).forEach((m,i)=>{
    // Try to map milestone to a routeStop by sequence
    const stops = sm.routeStops||[];
    let stop = null;
    if(m.label.toLowerCase().includes('saída') || m.label.toLowerCase().includes('cd')) stop = stops.find(s=>s.type==='origin');
    else if(m.label.toLowerCase().includes('chegada') || m.label.toLowerCase().includes('destino')) stop = stops.find(s=>s.type==='destination');
    else if(m.label.toLowerCase().includes('parada')) stop = stops.find(s=>s.type==='problem');
    else if(m.label.toLowerCase().includes('checkpoint')) stop = stops.find(s=>s.type==='checkpoint');
    if(!stop) stop = stops[Math.min(i, stops.length-1)] || stops[0];
    const lat = stop ? stop.lat : sm.lat;
    const lng = stop ? stop.lng : sm.lng;

    let state = 'pending';
    if(m.done) state = 'done';
    else if(m.current) state = 'current';

    events.push({
      kind: 'milestone',
      state,
      time: m.time,
      title: m.label,
      sub: state==='done' ? 'Confirmado' : state==='current' ? 'Em andamento' : 'Previsto',
      lat, lng,
      sortTime: _timeToMinutes(m.time),
    });
  });

  // 2) Messages → mensagens trocadas (georef pela posição na rota no horário)
  (sm.msgs||[]).forEach(msg=>{
    const [lat,lng] = _latlngForTime(sm, msg.time);
    const channelLower = (msg.channel||'').toLowerCase();
    events.push({
      kind: 'message',
      channel: msg.channel,
      channelClass: channelLower==='whatsapp'?'wpp':channelLower==='email'?'email':'sistema',
      time: msg.time,
      title: msg.text,
      sub: msg.sender,
      lat, lng,
      sortTime: _timeToMinutes(msg.time),
    });
  });

  // 3) Alerts → alertas críticos (sm.alerts) — vinculados à posição atual
  (sm.alerts||[]).forEach(a=>{
    if(a.type==='alert' || a.type==='warn'){
      events.push({
        kind: 'alert',
        severity: a.type==='alert'?'alert':'warn',
        time: sm.lastUpdate || '—',
        title: a.text,
        sub: null,
        lat: sm.lat, lng: sm.lng,
        sortTime: 9999, // alerts go at the bottom (most recent state)
      });
    }
  });

  // Sort by time ascending (chronological story of the SM)
  events.sort((a,b)=>a.sortTime-b.sortTime);
  _timelineEvents = events;
  _timelineFilter = 'all';

  renderTimeline();

  // Reset segmented control state
  document.querySelectorAll('.tl-seg-btn').forEach(c=>{
    c.classList.toggle('active', c.dataset.tlf==='all');
  });
}

function renderTimeline(){
  const el = document.getElementById('d-timeline');
  if(!el) return;
  const filter = _timelineFilter;
  const visible = _timelineEvents.filter(e=>{
    if(filter==='all') return true;
    return e.kind===filter;
  });
  if(!visible.length){
    el.innerHTML = `<div class="timeline-empty">Nenhum evento ${filter!=='all'?'desta categoria':''} para esta SM.</div>`;
    return;
  }
  el.innerHTML = visible.map((ev,idx)=>{
    let dotClass='', kindLabel='', kindCls='';
    if(ev.kind==='milestone'){
      dotClass = 'tl-'+ev.state;
      kindLabel = ev.state==='current'?'Atual':'Marco';
      kindCls = ev.state==='current'?'kind-current':'kind-milestone';
    } else if(ev.kind==='message'){
      dotClass = 'tl-msg-'+ev.channelClass;
      kindLabel = ev.channel;
      kindCls = 'kind-message';
    } else if(ev.kind==='alert'){
      dotClass = ev.severity==='alert'?'tl-alert':'tl-warn';
      kindLabel = 'Alerta';
      kindCls = 'kind-alert';
    }
    const dotIcon = ev.kind==='milestone' && ev.state==='done' ? '✓'
                   : ev.kind==='alert' ? '!'
                   : ev.kind==='message' ? '·'
                   : '';
    return `
      <div class="tl-event ${dotClass}" data-tl-idx="${idx}" data-tip="Clique para centralizar no mapa" onclick="zoomTimelineEvent(${idx})">
        <div class="tl-event-rail">
          <div class="tl-event-dot">${dotIcon}</div>
          <div class="tl-event-line"></div>
        </div>
        <div class="tl-event-body">
          <div class="tl-event-head">
            <span class="tl-event-kind ${kindCls}">${kindLabel}</span>
            <span class="tl-event-time">${ev.time}</span>
          </div>
          <div class="tl-event-title">${ev.title}</div>
          ${ev.sub?`<div class="tl-event-sub">${ev.sub}</div>`:''}
        </div>
      </div>`;
  }).join('');
}

function filterTimeline(el, kind){
  document.querySelectorAll('.tl-seg-btn').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  _timelineFilter = kind;
  renderTimeline();
}

function zoomTimelineEvent(idx){
  const ev = _timelineEvents[idx];
  if(!ev || !map) return;
  // Highlight the event briefly
  const el = document.querySelector(`[data-tl-idx="${idx}"]`);
  if(el){
    el.style.background = 'rgba(61,114,255,.12)';
    setTimeout(()=>{ el.style.background=''; }, 1200);
  }
  // Fly to the lat/lng with a comfortable zoom
  map.flyTo([ev.lat, ev.lng], 14, {duration:0.8, easeLinearity:0.4});
  // Drop a temporary highlight ring at the location
  const ring = L.circleMarker([ev.lat, ev.lng], {
    radius: 18, color: '#3D72FF', weight: 3,
    fillColor: '#3D72FF', fillOpacity: 0.15,
  }).addTo(map);
  setTimeout(()=>{ try{ ring.remove(); }catch(e){} }, 1800);
}

/* ═══════════════════════════════════════════════════════════════
   ACTION BUTTONS — sticky footer with toast/modal feedback
═══════════════════════════════════════════════════════════════ */
function buildActions(sm){
  const isCritical = sm.risk>=80;
  document.getElementById('d-actions').innerHTML = `
    <button class="action-btn icon-only" title="Abrir chat" onclick="actionFeedback('chat','${sm.id}')">💬</button>
    <button class="action-btn icon-only" title="Solicitar foto ao motorista" onclick="actionFeedback('photo','${sm.id}')">📷</button>
    <button class="action-btn primary" onclick="actionFeedback('support','${sm.id}')">📍 Acionar suporte</button>
    ${isCritical?`<button class="action-btn danger" onclick="actionFeedback('escalate','${sm.id}')">🚨 Escalar agora</button>`:''}
  `;
}

function actionFeedback(action, smId){
  const sm = SMs.find(s=>s.id===smId);
  if(!sm) return;
  if(action === 'chat'){
    trayAddConv(sm.id);
    trayOpenChat(sm.id);
    return;
  }
  const cfg = {
    photo: {
      icon:'📷', title:'Solicitar foto ao motorista',
      desc:`Uma notificação foi enviada para <strong>${sm.driver}</strong> via app, solicitando uma foto da situação atual da carga.`,
      tone:'info', confirmLabel:'Entendi',
    },
    chat: null, // handled directly via openChatMode above
    support: {
      icon:'📍', title:'Acionar suporte',
      desc:`Um chamado de suporte foi aberto para a SM <strong>${sm.id}</strong>. A equipe de plantão receberá os dados completos desta viagem e entrará em contato.`,
      tone:'info', confirmLabel:'OK',
    },
    escalate: {
      icon:'🚨', title:'Escalar para gestor',
      desc:`Um relatório completo da SM <strong>${sm.id}</strong> será gerado e enviado por WhatsApp e e-mail ao gestor de operações. Esta ação não pode ser desfeita.`,
      tone:'danger', confirmLabel:'Confirmar escalação', cancelLabel:'Cancelar',
    },
  }[action];
  if(!cfg) return;
  showActionModal(cfg);
}

function showActionModal(cfg){
  // Remove any existing modal
  const old = document.getElementById('action-modal');
  if(old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'action-modal';
  overlay.className = 'action-modal-overlay';
  overlay.innerHTML = `
    <div class="action-modal ${cfg.tone||'info'}">
      <div class="am-icon">${cfg.icon}</div>
      <div class="am-title">${cfg.title}</div>
      <div class="am-desc">${cfg.desc}</div>
      <div class="am-actions">
        ${cfg.cancelLabel?`<button class="am-btn am-cancel" onclick="closeActionModal()">${cfg.cancelLabel}</button>`:''}
        <button class="am-btn am-confirm ${cfg.tone==='danger'?'danger':''}" id="am-confirm-btn">${cfg.confirmLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.classList.add('open'), 10);
  document.getElementById('am-confirm-btn').onclick = ()=>{
    if(cfg.onConfirm) cfg.onConfirm();
    closeActionModal();
    if(!cfg.onConfirm) showActionToast(cfg.icon+' '+cfg.title+' — concluído');
  };
  overlay.onclick = (e)=>{ if(e.target===overlay) closeActionModal(); };
}

function closeActionModal(){
  const m = document.getElementById('action-modal');
  if(!m) return;
  m.classList.remove('open');
  setTimeout(()=>{ try{ m.remove(); }catch(e){} }, 200);
}

function showActionToast(text){
  const old = document.getElementById('action-toast');
  if(old) old.remove();
  const t = document.createElement('div');
  t.id = 'action-toast';
  t.className = 'action-toast';
  t.innerHTML = text;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add('visible'), 10);
  setTimeout(()=>{
    t.classList.remove('visible');
    setTimeout(()=>{ try{ t.remove(); }catch(e){} }, 300);
  }, 3000);
}

function updateTabIndicator(tabId){
  const sm = SMs.find(s=>s.id===selectedSM);
  const el = document.getElementById('tab-indicator');
  if(!el||!sm) return;

  if(tabId==='tab-timeline'){
    // Timeline tab keeps the rich Farol + stats indicator (was previously the Viagem tab)
    el.innerHTML=`
      <div class="ti-farol">${(sm.farol||[]).filter(f=>f.dim!=='Docs').map(f=>`
        <div class="tif-item ${f.status}" data-tip="${f.dim}: ${f.detail||f.statusText}">
          <span class="tif-icon">${f.icon||'●'}</span>
          <div><div class="tif-dim">${f.dim}</div><div class="tif-val ${f.status}">${f.statusText}</div></div>
        </div>`).join('')}
      </div>
      <div class="ti-stats">${(sm.stats||[]).map(s=>`
        <div class="tis-item" data-tip="${s.label}: ${s.sub}">
          <div class="tis-lbl">${s.label}</div>
          <div class="tis-val ${s.cls}">${s.val}</div>
          <div class="tis-sub">${s.sub}</div>
        </div>`).join('')}
      </div>`;
  }
  else if(tabId==='tab-motorista'){
    const A=sm.appStatus||{};
    const appItems=[
      {key:'gps',icon:'📡',label:'GPS',val:A.gps||'—',color:A.gps&&A.gps.includes('Ativo')?'var(--green)':'var(--red)'},
      {key:'battery',icon:'🔋',label:'Bateria',val:A.battery||'—',color:parseInt(A.battery)>40?'var(--green)':parseInt(A.battery)>15?'var(--amber)':'var(--red)'},
      {key:'signal',icon:'📶',label:'Sinal',val:A.signal||'—',color:A.signal&&A.signal.includes('4G')?'var(--green)':A.signal&&A.signal.includes('Sem')?'var(--red)':'var(--amber)'},
      {key:'app',icon:'📱',label:'App',val:A.app||'—',color:A.app==='Aberto'?'var(--green)':'var(--red)'},
    ];
    el.innerHTML=`<div class="ti-app">${appItems.map(a=>`
      <div class="tia-item" data-tip="${a.label}: ${a.val}">
        <span class="tia-icon">${a.icon}</span>
        <div><div class="tia-val" style="color:${a.color}">${a.val}</div><div class="tia-lbl">${a.label}</div></div>
      </div>`).join('')}
    </div>`;
  }
  else if(tabId==='tab-locais'){
    const deliveries=(sm.routeStops||[]).filter(s=>s.type==='delivery');
    const totalNF=deliveries.reduce((a,s,i)=>a+(i%3===0?3:i%2===0?2:1),0);
    const doneNF=deliveries.filter(s=>s.status==='done').reduce((a,s,i)=>a+(i%3===0?3:i%2===0?2:1),0);
    el.innerHTML=`<div class="ti-locais">
      <div class="til-item" data-tip="Total de pontos de entrega nesta SM">
        <div class="til-val" style="color:var(--t1)">${deliveries.length}</div>
        <div class="til-lbl">Locais</div>
      </div>
      <div class="til-item" data-tip="Canhotos capturados / total de NFs">
        <div class="til-val" style="color:${doneNF===totalNF?'var(--green)':'var(--amber)'}">${doneNF}/${totalNF}</div>
        <div class="til-lbl">Canhotos</div>
      </div>
      <div class="til-item" data-tip="NFs com status pendente ou recusada">
        <div class="til-val" style="color:${totalNF-doneNF>0?'var(--red)':'var(--green)'}">${totalNF-doneNF}</div>
        <div class="til-lbl">Pendentes</div>
      </div>
    </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAP MODE PER TAB
   Viagem   → full route + all stops
   Motorista→ breadcrumb trail + current position
   Comunicação→ comm event pins
   Locais   → delivery stops only, colored by NF status
═══════════════════════════════════════════════════════════════ */
function clearExtraMapLayers(){
  breadcrumbMarkers.forEach(m=>{try{m.remove()}catch(e){}});
  breadcrumbMarkers=[];
  commMarkers.forEach(m=>{try{m.remove()}catch(e){}});
  commMarkers=[];
  delivOnlyMarkers.forEach(m=>{try{m.remove()}catch(e){}});
  delivOnlyMarkers=[];
}

function setMapMode(tabId){
  // In cabine mode, map is managed by cbFocusMap — skip torre map modes
  if(document.querySelector('.app').dataset.mode==='cabine') return;
  const sm=SMs.find(s=>s.id===selectedSM);
  if(!sm||!map) return;
  clearExtraMapLayers();

  // Always hide generic truck marker — each mode shows its own position indicator
  const mainMk=mapMarkers[sm.id];
  if(mainMk && map.hasLayer(mainMk)) map.removeLayer(mainMk);

  if(tabId==='tab-timeline'){
    // Linha do tempo: full route + all stop markers (the "everything" view)
    routeLayers.forEach(l=>{if(!map.hasLayer(l)) l.addTo(map)});
    stopMarkers.forEach(m=>{if(!map.hasLayer(m)) m.addTo(map)});
    const allLine=L.polyline(sm.route);
    map.fitBounds(allLine.getBounds(),{padding:[60,60],maxZoom:13,animate:true});
  }
  else if(tabId==='tab-motorista'){
    // Hide route/stops — show only breadcrumb + current position
    routeLayers.forEach(l=>map.removeLayer(l));
    stopMarkers.forEach(m=>map.removeLayer(m));
    // Simulated breadcrumb: 6 fading positions around current
    const offsets=[[-0.008,-0.012],[-0.014,-0.006],[-0.019,0.002],[-0.024,-0.005],[-0.028,0.008],[-0.032,0.003]];
    offsets.forEach((off,i)=>{
      const opacity=0.12+(i*0.12);
      const size=6+(i*2);
      const crumb=L.circleMarker([sm.lat+off[0],sm.lng+off[1]],{
        radius:size/2,fillColor:sm.clientColor||'#3D72FF',fillOpacity:opacity,
        color:sm.clientColor||'#3D72FF',weight:1,opacity:opacity+0.1
      }).addTo(map);
      breadcrumbMarkers.push(crumb);
    });
    // Current position — large truck marker
    const curIcon=makeStopIcon('current','current',sm.clientColor);
    const curMk=L.marker([sm.lat,sm.lng],{icon:curIcon,zIndexOffset:2000}).addTo(map);
    curMk.bindTooltip(`${sm.driver} — posição atual`,{direction:'top',className:'tc-tip',offset:[0,-18]});
    breadcrumbMarkers.push(curMk);
    map.flyTo([sm.lat,sm.lng],13,{duration:0.8,easeLinearity:0.4});
  }
  else if(tabId==='tab-locais'){
    // Delivery stops only, no route line
    routeLayers.forEach(l=>map.removeLayer(l));
    stopMarkers.forEach(m=>map.removeLayer(m));
    const deliveries=(sm.routeStops||[]).filter(s=>s.type==='delivery');
    const bounds=[];
    deliveries.forEach((stop,i)=>{
      const icon=makeStopIcon('delivery',stop.status,sm.clientColor,stop.seq||i+1);
      const mk=L.marker([stop.lat,stop.lng],{icon,zIndexOffset:500}).addTo(map);
      const nfCount=i%3===0?3:i%2===0?2:1;
      const isDone=stop.status==='done';
      mk.bindTooltip(`${stop.label} · ${isDone?'✓ Entregue':'⏳ Pendente'} · ${nfCount} NF${nfCount>1?'s':''}`,{direction:'top',className:'tc-tip',offset:[0,-14]});
      mk.on('click',()=>{
        // Expand corresponding stop in Locais tab
        const stopEl=document.getElementById('ls-stop-'+i);
        if(stopEl){
          stopEl.classList.add('open');
          stopEl.scrollIntoView({behavior:'smooth',block:'nearest'});
        }
      });
      delivOnlyMarkers.push(mk);
      bounds.push([stop.lat,stop.lng]);
    });
    if(bounds.length) map.fitBounds(bounds,{padding:[60,60],maxZoom:14,animate:true});
    else if(sm.route.length) map.flyTo(sm.route[0],12,{duration:0.8});
  }
}

/* ═══════════════════════════════════════════════════════════════
   LOCAIS TAB BUILDER
═══════════════════════════════════════════════════════════════ */
const LOC_NF_VALS=['R$ 4.820,00','R$ 2.100,00','R$ 890,00','R$ 6.200,00','R$ 1.450,00','R$ 3.300,00','R$ 780,00','R$ 5.100,00'];

function buildLocaisTab(sm){
  const el=document.getElementById('d-locais-list');
  if(!el) return;
  const deliveries=(sm.routeStops||[]).filter(s=>s.type==='delivery');
  if(!deliveries.length){
    // Transfers and dedicated runs go point-to-point — show origin/destination
    const origin = (sm.routeStops||[]).find(s=>s.type==='origin');
    const dest = (sm.routeStops||[]).find(s=>s.type==='destination');
    const isTransfer = (sm.type||'').toLowerCase().includes('transfer') || (sm.type||'').toLowerCase().includes('dedicado');
    el.innerHTML = `
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:var(--radius-base);padding:14px;margin-bottom:10px">
        <div style="font-size:11px;color:var(--t2);line-height:1.5">
          <strong>${sm.type}</strong> ponto-a-ponto · ${sm.origin} → ${sm.destination}
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:4px">${isTransfer?'Transferências não possuem múltiplos pontos de entrega — apenas origem e destino.':'Esta SM não possui pontos de entrega múltiplos.'}</div>
      </div>
      ${dest?`<div class="loc-stop open" id="ls-stop-0" data-lat="${dest.lat}" data-lng="${dest.lng}">
        <div class="loc-stop-hdr" onclick="zoomLocalStop(0,this)">
          <div class="ls-seq" style="background:var(--blue-s);color:var(--blue)">🏁</div>
          <div class="ls-info">
            <div class="ls-name">${dest.label}</div>
            <div class="ls-meta">${dest.contact?dest.contact.split('·')[0].trim():'Destino final'}${dest.window?' · '+dest.window:''}</div>
          </div>
          <div class="ls-right">
            <span class="ls-nf-badge" style="background:var(--blue-s);color:var(--blue)">Destino</span>
          </div>
          <span class="ls-arrow">›</span>
        </div>
        <div class="loc-body">
          <div style="font-size:10px;color:var(--t3);padding:6px 0">Aguardando chegada · ETA ${sm.eta||'—'}</div>
        </div>
      </div>`:''}
    `;
    return;
  }
  el.innerHTML=deliveries.map((stop,di)=>{
    const isDone=stop.status==='done', isProblem=stop.status==='problem';
    const seqColor=isDone?'var(--green)':isProblem?'var(--red)':'var(--t3)';
    const seqBg=isDone?'var(--green-s)':isProblem?'var(--red-s)':'var(--s3)';
    const nfCount=di%3===0?3:di%2===0?2:1;
    const doneNF=isDone?nfCount:0;
    const nfRows=Array.from({length:nfCount}).map((_,ni)=>{
      const nfId=`NF-${39000+di*3+ni+1}`;
      const val=LOC_NF_VALS[(di+ni)%LOC_NF_VALS.length];
      const st=isDone?'assinada':isProblem?'recusada':'pendente';
      const chipCls=st==='assinada'?'chip-ok':st==='recusada'?'chip-fail':'chip-pend';
      const chipTxt=st==='assinada'?'✓ Assinada':st==='recusada'?'✗ Recusada':'⏳ Pendente';
      const podTxt=st==='assinada'?'📄 Canhoto capturado · '+(stop.actual||'14:'+Math.floor(28+ni*3).toString().padStart(2,'0')):st==='recusada'?'📵 Entrega recusada':'📷 Aguardando captura';
      const btns=st==='assinada'
        ?`<button class="loc-act blue" onclick="event.stopPropagation();openDocModal('canhoto','${nfId}','${stop.label}')">Canhoto</button>
           <button class="loc-act" onclick="event.stopPropagation();openDocModal('nfe','${nfId}','${stop.label}')">Ver NF</button>`
        :st==='recusada'
        ?`<button class="loc-act" onclick="event.stopPropagation();openDocModal('nfe','${nfId}','${stop.label}')">Ver NF</button>
           <button class="loc-act amber">🔄 Reagendar</button>`
        :`<button class="loc-act" onclick="event.stopPropagation();openDocModal('nfe','${nfId}','${stop.label}')">Ver NF</button>
           <button class="loc-act amber">💬 Contatar</button>`;
      return `<div class="loc-nf-row">
        <div class="loc-nf-id">${nfId}</div>
        <div class="loc-nf-val">${val}</div>
        <span class="loc-nf-chip ${chipCls}">${chipTxt}</span>
        <div style="display:flex;gap:3px">${btns}</div>
      </div>
      <div class="loc-pod-row">${podTxt}</div>`;
    }).join('');
    const isFirst=di===0?'open':'';
    return `<div class="loc-stop ${isFirst}" id="ls-stop-${di}" data-lat="${stop.lat}" data-lng="${stop.lng}">
      <div class="loc-stop-hdr" onclick="zoomLocalStop(${di}, this)">
        <div class="ls-seq" style="background:${seqBg};color:${seqColor}">${di+1}</div>
        <div class="ls-info">
          <div class="ls-name">${stop.label}</div>
          <div class="ls-meta">${stop.contact?stop.contact.split('·')[0].trim():'—'}${stop.window?' · '+stop.window:''}</div>
        </div>
        <div class="ls-right">
          <span class="ls-nf-badge">${doneNF}/${nfCount} NF ok</span>
          ${isProblem?'<span>⚠️</span>':''}
        </div>
        <span class="ls-arrow">›</span>
      </div>
      <div class="loc-body">${nfRows}</div>
    </div>`;
  }).join('');
}

function zoomLocalStop(idx, headerEl){
  // Toggle accordion
  const stopEl = headerEl.parentElement;
  stopEl.classList.toggle('open');
  // Fly map to that stop
  const lat = parseFloat(stopEl.dataset.lat);
  const lng = parseFloat(stopEl.dataset.lng);
  if(!isNaN(lat) && !isNaN(lng) && map){
    map.flyTo([lat, lng], 14, {duration:0.8, easeLinearity:0.4});
    const ring = L.circleMarker([lat, lng], {
      radius: 18, color: '#3D72FF', weight: 3,
      fillColor: '#3D72FF', fillOpacity: 0.15,
    }).addTo(map);
    setTimeout(()=>{ try{ ring.remove(); }catch(e){} }, 1800);
  }
}


/* ═══════════════════════════════════════════════════════════════
   THEME TOGGLE — light / dark mode
═══════════════════════════════════════════════════════════════ */
let currentTheme = 'light';
let mapTileLayer = null;

/* ── Colorblind Mode: Wong palette safe for deuteranopia/protanopia ── */
let cbMode = false;
function toggleCBMode(){
  cbMode = !cbMode;
  document.documentElement.classList.toggle('cb-mode', cbMode);
  const btn = document.getElementById('cb-toggle-btn');
  const label = document.getElementById('cb-label');
  if(btn) btn.classList.toggle('cb-active', cbMode);
  if(label) label.textContent = cbMode ? 'Cores padrão' : 'Daltonismo';
  try{ localStorage.setItem('torre.cb', cbMode ? '1' : '0'); }catch(e){}
}
// Restore on boot (runs before DOM is ready for some elements)
try{
  if(localStorage.getItem('torre.cb') === '1'){
    cbMode = true;
    document.documentElement.classList.add('cb-mode');
    document.addEventListener('DOMContentLoaded', ()=>{
      const btn = document.getElementById('cb-toggle-btn');
      const label = document.getElementById('cb-label');
      if(btn) btn.classList.add('cb-active');
      if(label) label.textContent = 'Cores padrão';
    });
  }
}catch(e){}

function toggleTheme(){
  currentTheme = currentTheme==='light'?'dark':'light';
  const isDark = currentTheme==='dark';
  document.documentElement.setAttribute('data-theme', isDark?'dark':'');
  document.getElementById('theme-icon').textContent = isDark?'☀️':'🌙';
  document.getElementById('theme-label').textContent = isDark?'Tema claro':'Tema escuro';
  try{ localStorage.setItem('torre.theme', currentTheme); }catch(e){}
  // Switch map tiles
  if(mapTileLayer){ mapTileLayer.remove(); }
  mapTileLayer = L.tileLayer(
    isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {attribution:'© OpenStreetMap © CARTO',subdomains:'abcd',maxZoom:19}
  ).addTo(map);
}

/* ═══════════════════════════════════════════════════════════════
   FONT SIZE CYCLE — accessibility
   compact (-8%) → standard (100%) → comfort (+8%) → compact...
═══════════════════════════════════════════════════════════════ */
const FS_CYCLE = ['compact','standard','comfort'];
const FS_LABELS = {compact:'Fonte compacta', standard:'Fonte padrão', comfort:'Fonte confortável'};
let currentFontScale = 'standard';

function applyFontScale(scale){
  const main = document.getElementById('main');
  if(!main) return;
  currentFontScale = scale;
  main.setAttribute('data-fontscale', scale);
  const btn = document.getElementById('fontsize-btn');
  const lbl = document.getElementById('fontsize-label');
  if(lbl) lbl.textContent = FS_LABELS[scale];
  if(btn) btn.classList.toggle('fs-active', scale!=='standard');
  try{ localStorage.setItem('torre.fontscale', scale); }catch(e){}
}

function cycleFontSize(){
  const idx = FS_CYCLE.indexOf(currentFontScale);
  const next = FS_CYCLE[(idx+1) % FS_CYCLE.length];
  applyFontScale(next);
}

// Restore preferences on load
(function restorePrefs(){
  try{
    const savedTheme = localStorage.getItem('torre.theme');
    if(savedTheme==='dark'){
      currentTheme = 'light'; // toggleTheme flips it
      // Defer until map is ready — called at end of boot section
      window._restoreDarkOnBoot = true;
    }
    const savedFs = localStorage.getItem('torre.fontscale');
    if(savedFs && FS_CYCLE.includes(savedFs)){
      applyFontScale(savedFs);
    }
  }catch(e){}
})();

/* ═══════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════ */
renderCards(SMs);
document.getElementById('sm-count').textContent=SMs.length+' de '+SMs.length;
initMap();
initAlertBanner();
updateDimensionButtons();
updateOpsContextCounts();
updateFleetKpis();

// ETA KPI values — computed from live dataset
(function computeETAKPIs(){
  const atrasado = SMs.filter(s=>getETAStatus(s)==='atrasado').length;
  const noLimite = SMs.filter(s=>getETAStatus(s)==='no_limite').length;
  const elA = document.getElementById('kpiv-eta_atrasado');
  const elN = document.getElementById('kpiv-eta_no_limite');
  if(elA) elA.textContent = atrasado;
  if(elN) elN.textContent = noLimite;
})();

// Apply saved dark theme now that the map is ready to swap tile layers
if(window._restoreDarkOnBoot){ toggleTheme(); delete window._restoreDarkOnBoot; }

// Global tooltip (fixed, never clipped, flips below when not enough space above)
(function(){
  const tip=document.createElement('div');
  tip.id='g-tip'; document.body.appendChild(tip);
  let hovered=null;

  function position(el){
    const r = el.getBoundingClientRect();
    const tipR = tip.getBoundingClientRect();
    const tipH = tipR.height || 26;
    const margin = 8;
    // Flip below if not enough room above
    const below = r.top < tipH + margin;
    tip.classList.toggle('below', below);
    tip.style.left = (r.left + r.width/2) + 'px';
    tip.style.top = below ? (r.bottom) + 'px' : (r.top) + 'px';
  }

  document.addEventListener('mouseover',e=>{
    const el=e.target.closest('[data-tip]');
    if(!el){tip.style.opacity='0';return;}
    hovered=el;
    tip.textContent=el.getAttribute('data-tip');
    position(el);
    tip.style.opacity='1';
  });
  document.addEventListener('mousemove',e=>{
    if(!hovered) return;
    position(hovered);
  });
  document.addEventListener('mouseout',e=>{
    if(e.target.closest('[data-tip]')===hovered) return;
    hovered=null; tip.style.opacity='0';
  });
})();

