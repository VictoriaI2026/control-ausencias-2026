const express = require('express');
const app = express();
app.use(express.json());

const SHEET_ID = '7423562282389380';
const COL_COMENTARIOS = '6683470817087364';
const COL_STATUS_HR   = '8593863697190788';
const SS_BASE = 'https://api.smartsheet.com/2.0';
const TOKEN = process.env.SMARTSHEET_TOKEN || 'MHV3H5D9FgaJXE0GNGDKCmgJHNrxVfCNOybub';
const HEADERS = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

app.get('/api/ausencias', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    let allRows = [], pageNum = 1;
    while (true) {
      const r = await fetch(`${SS_BASE}/sheets/${SHEET_ID}?pageSize=500&page=${pageNum}`, { headers: HEADERS });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      const colMap = {};
      (data.columns || []).forEach(c => { colMap[c.id] = c.title; });
      const rows = (data.rows || []).map(row => {
        const obj = { rowId: String(row.id) };
        (row.cells || []).forEach(cell => { const t = colMap[cell.columnId]; if (t) obj[t] = cell.displayValue ?? cell.value ?? ''; });
        return { rowId: obj.rowId, empleado: obj['Nombre Empleado']||'', supervisor: obj['Supervisor']||'', departamento: obj['Departamento']||'', tipo: obj['Tipo Ausencia']||'', fecha: obj['Fecha de Inicio']||obj['Fecha Inicio']||'', statusHR: obj['Status HR']||'', justificacion: obj['Justificación']||obj['Justificacion']||'', comentarios: obj['Comentarios']||'' };
      });
      allRows = allRows.concat(rows);
      if (allRows.length >= data.totalRowCount || rows.length < 500) break;
      pageNum++;
    }
    res.json({ rows: allRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/ausencias/:rowId', async (req, res) => {
  const { rowId } = req.params;
  const { field, value } = req.body;
  const colId = field === 'statusHR' ? COL_STATUS_HR : COL_COMENTARIOS;
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`${SS_BASE}/sheets/${SHEET_ID}/rows`, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ rows: [{ id: parseInt(rowId), cells: [{ columnId: parseInt(colId), value }] }] }) });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Control de Ausencias 2026</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--navy:#0d1b3e;--navy2:#1a2d5a;--teal:#0e9f7e;--amber:#f5a623;--red:#e24b4a;--blue:#378add;--blue-light:#e6f1fb;--coral:#d85a30;--purple:#7f77dd;--gray-bg:#f0f2f7}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--gray-bg);color:#1e293b;font-size:14px;min-height:100vh}
#app{display:flex;flex-direction:column;min-height:100vh}
header{background:var(--navy);padding:.85rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
header h1{font-size:15px;font-weight:500;color:#fff;display:flex;align-items:center;gap:8px}
.dot{width:8px;height:8px;border-radius:50%;background:var(--teal);display:inline-block}
.header-right{display:flex;align-items:center;gap:10px}
.sync-info{font-size:11px;color:rgba(255,255,255,.5)}
.btn-sync{font-size:11px;padding:5px 13px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:7px;color:#fff;cursor:pointer}
main{padding:1.25rem;flex:1}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.25rem}
@media(max-width:700px){.metrics{grid-template-columns:repeat(2,1fr)}}
.m-card{border-radius:12px;padding:.9rem 1.1rem;position:relative;overflow:hidden}
.m-card.c1{background:var(--navy2)}.m-card.c2{background:var(--teal)}.m-card.c3{background:var(--red)}.m-card.c4{background:var(--amber)}
.m-card .lbl{font-size:10px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.m-card .val{font-size:26px;font-weight:600;color:#fff}
.m-card .sub{font-size:10px;color:rgba(255,255,255,.6);margin-top:3px}
.m-card .deco{position:absolute;right:-12px;top:-12px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.07)}
.alert-box{background:#fff3cd;border-left:3px solid var(--amber);border-radius:8px;padding:.7rem 1rem;margin-bottom:1rem;font-size:12px;color:#7a5200}
.tabs{display:flex;gap:4px;background:#fff;border-radius:10px;padding:4px;border:1px solid #e2e8f0;margin-bottom:1rem}
.tab-btn{flex:1;font-size:12px;padding:7px 10px;cursor:pointer;background:transparent;border:none;border-radius:7px;color:#64748b;text-align:center}
.tab-btn.active{background:var(--navy);color:#fff;font-weight:500}
.tab-btn:hover:not(.active){background:#f1f5f9}
.tab-panel{display:none}.tab-panel.active{display:block}
.section-card{background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:1rem}
.filters{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
.filters select,.filters input[type=text]{font-size:12px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#1e293b;height:34px}
.filters input[type=text]{min-width:180px}
.count-pill{font-size:11px;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:8px}
.tbl-wrap{overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed}
th{background:#f8fafc;padding:9px 10px;text-align:left;font-weight:500;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;white-space:nowrap;overflow:hidden}
td{padding:7px 9px;border-bottom:1px solid #f1f5f9;color:#1e293b;overflow:hidden;vertical-align:top}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f8fafc}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:10px;font-weight:500;line-height:1.5;white-space:nowrap}
.b-enf{background:#faece7;color:#993c1d}.b-vac{background:#e1f5ee;color:#0f6e56}.b-ns{background:#fcebeb;color:#a32d2d}.b-per{background:#e6f1fb;color:#185fa5}.b-lic{background:#eeedfe;color:#534ab7}.b-otro{background:#f1f5f9;color:#64748b}
.b-val{background:#e1f5ee;color:#0f6e56}.b-pen{background:#faeeda;color:#854f0b}.b-apr{background:#e6f1fb;color:#185fa5}.b-rec{background:#fcebeb;color:#a32d2d}
.status-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}
.dot-ok{background:#1d9e75}.dot-warn{background:#f5a623}.dot-err{background:#e24b4a}.dot-gray{background:#94a3b8}
.ss-pill{font-size:9px;background:var(--blue-light);color:#185fa5;padding:1px 6px;border-radius:5px;font-weight:500;white-space:nowrap;margin-left:3px}
.pagination{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px;color:#64748b}
.pagination button{padding:5px 14px;font-size:12px;cursor:pointer;background:#fff;border:1px solid #e2e8f0;border-radius:7px;color:#1e293b}
.pagination button:hover:not(:disabled){background:#f8fafc}
.pagination button:disabled{opacity:.4;cursor:default}
.editable-cell{display:flex;flex-direction:column;gap:3px;min-width:0}
.comment-existing{font-size:11px;color:#64748b;background:#f8fafc;border-left:2px solid #e2e8f0;border-radius:0 5px 5px 0;padding:3px 7px;line-height:1.4;word-break:break-word}
.input-row{display:flex;gap:3px;align-items:center}
.input-row input[type=text]{font-size:11px;padding:3px 7px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;color:#1e293b;flex:1;min-width:0;height:27px}
.status-select{font-size:11px;padding:2px 5px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;color:#1e293b;height:27px;width:100%;cursor:pointer}
.save-btn{font-size:10px;padding:0 9px;cursor:pointer;background:var(--navy);border:none;border-radius:6px;color:#fff;white-space:nowrap;flex-shrink:0;height:27px;font-weight:500}
.save-btn:disabled{opacity:.5;cursor:default}
.flash{font-size:10px;height:14px;line-height:14px}
.flash.ok{color:var(--teal)}.flash.err{color:var(--red)}
.chart-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1rem}
@media(max-width:600px){.chart-row{grid-template-columns:1fr}}
.chart-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1rem}
.chart-card h3{font-size:11px;font-weight:500;margin-bottom:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.bar-label{font-size:11px;color:#64748b;width:90px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar-track{flex:1;height:14px;background:#f1f5f9;border-radius:6px;overflow:hidden}
.bar-fill{height:100%;border-radius:6px}
.bar-count{font-size:11px;color:#94a3b8;width:30px;flex-shrink:0;text-align:right}
.loading-overlay{display:none;position:fixed;inset:0;background:rgba(13,27,62,.55);z-index:999;align-items:center;justify-content:center;flex-direction:column;gap:12px}
.loading-overlay.show{display:flex}
.spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-overlay p{color:#fff;font-size:13px}
</style>
</head>
<body>
<div class="loading-overlay" id="loader"><div class="spinner"></div><p id="loader-msg">Conectando...</p></div>
<div id="app">
  <header>
    <h1><span class="dot"></span> Control de Ausencias 2026</h1>
    <div class="header-right">
      <span class="sync-info" id="sync-info">—</span>
      <button class="btn-sync" onclick="syncData()">Sincronizar</button>
    </div>
  </header>
  <main>
    <div class="metrics">
      <div class="m-card c1"><div class="deco"></div><div class="lbl">Empleados en roster</div><div class="val" id="m-total">—</div><div class="sub">Activos</div></div>
      <div class="m-card c2"><div class="deco"></div><div class="lbl">Con ausencia registrada</div><div class="val" id="m-reg">—</div><div class="sub" id="m-reg-pct">—</div></div>
      <div class="m-card c3"><div class="deco"></div><div class="lbl">No shows</div><div class="val" id="m-ns">—</div><div class="sub" id="m-ns-pct">—</div></div>
      <div class="m-card c4"><div class="deco"></div><div class="lbl">Sin registro</div><div class="val" id="m-noreg">—</div><div class="sub">Posible falta de reporte</div></div>
    </div>
    <div id="alert-zone"></div>
    <div class="tabs">
      <button class="tab-btn active" onclick="showTab('ausencias',this)">Ausencias</button>
      <button class="tab-btn" onclick="showTab('empleados',this)">Por empleado</button>
      <button class="tab-btn" onclick="showTab('resumen',this)">Resumen visual</button>
    </div>
    <div id="tab-ausencias" class="tab-panel active">
      <div class="section-card">
        <div class="filters">
          <input type="text" id="srch-aus" placeholder="Buscar empleado..." oninput="filterAus()">
          <select id="fil-tipo" onchange="filterAus()"><option value="">Tipo: Todos</option><option>Enfermedad</option><option>No show</option><option>Vacaciones</option><option>Personal</option></select>
          <select id="fil-dep" onchange="filterAus()"><option value="">Depto: Todos</option></select>
          <select id="fil-mes" onchange="filterAus()"><option value="">Mes: Todos</option></select>
          <select id="fil-shr" onchange="filterAus()"><option value="">Status HR: Todos</option><option>Validado</option><option>Pendiente</option><option>Aprobado</option><option>Rechazado</option></select>
          <span class="count-pill" id="aus-count"></span>
        </div>
        <div class="tbl-wrap">
          <table>
            <colgroup><col style="width:28px"><col style="width:145px"><col style="width:85px"><col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:125px"><col style="width:120px"><col style="width:170px"></colgroup>
            <thead><tr><th>#</th><th>Empleado</th><th>Supervisor</th><th>Depto</th><th>Tipo</th><th>Fecha</th><th>Status HR <span class="ss-pill">Live</span></th><th>Comentarios <span class="ss-pill">Live</span></th><th>Justificación</th></tr></thead>
            <tbody id="aus-tbody"><tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8">Cargando...</td></tr></tbody>
          </table>
        </div>
        <div class="pagination">
          <button id="aus-prev" onclick="changePage('aus',-1)">← Anterior</button>
          <span id="aus-pinfo"></span>
          <button id="aus-next" onclick="changePage('aus',1)">Siguiente →</button>
        </div>
      </div>
    </div>
    <div id="tab-empleados" class="tab-panel">
      <div class="section-card">
        <div class="filters">
          <input type="text" id="srch-emp" placeholder="Buscar nombre, ID..." oninput="filterEmp()">
          <select id="fil-sup" onchange="filterEmp()"><option value="">Supervisor: Todos</option></select>
          <select id="fil-show" onchange="filterEmp()"><option value="">Todos</option><option value="noreg">Sin registro</option><option value="noshow">Tiene No shows</option><option value="multi">3+ ausencias</option></select>
          <span class="count-pill" id="emp-count"></span>
        </div>
        <div class="tbl-wrap">
          <table>
            <colgroup><col style="width:60px"><col style="width:175px"><col style="width:62px"><col style="width:115px"><col style="width:100px"><col style="width:62px"><col style="width:100px"><col style="width:175px"></colgroup>
            <thead><tr><th>ID</th><th>Nombre</th><th>Ausencias</th><th>Supervisor</th><th>Posición</th><th>No shows</th><th>Estado</th><th>Comentarios <span class="ss-pill">Live</span></th></tr></thead>
            <tbody id="emp-tbody"><tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8">Cargando...</td></tr></tbody>
          </table>
        </div>
        <div class="pagination">
          <button id="emp-prev" onclick="changePage('emp',-1)">← Anterior</button>
          <span id="emp-pinfo"></span>
          <button id="emp-next" onclick="changePage('emp',1)">Siguiente →</button>
        </div>
      </div>
    </div>
    <div id="tab-resumen" class="tab-panel">
      <div class="chart-row">
        <div class="chart-card"><h3>Tipo de ausencia</h3><div id="c-tipo"></div></div>
        <div class="chart-card"><h3>Por departamento</h3><div id="c-dep"></div></div>
      </div>
      <div class="chart-row">
        <div class="chart-card"><h3>Por supervisor</h3><div id="c-sup"></div></div>
        <div class="chart-card"><h3>Top 10 empleados</h3><div id="c-top"></div></div>
      </div>
    </div>
  </main>
</div>
<script>
const PAGE=40,HR_OPTIONS=['Validado','Pendiente','Aprobado','Rechazado','En revisión'];
const TIPOS={'Enfermedad':'b-enf','No show':'b-ns','Vacaciones':'b-vac','Personal':'b-per','FMLA':'b-lic'};
const BAR_COLORS=['#0d1b3e','#0e9f7e','#e24b4a','#378add','#7f77dd','#d85a30','#f5a623'];
const ROSTER=[{id:"100246",nombre:"Varela Ortiz, Eddie",posicion:"Gerente",supervisor:"Merlo Serna, Cesar O"},{id:"100067",nombre:"Razon Tejada, Joan",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100587",nombre:"Vazquez Mieles, Rafael",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100001",nombre:"Santiago Fontanez, Alberto",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100646",nombre:"Moreno Mendez, Arnaldo L",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100760",nombre:"Rosario Andujar, Javier",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100546",nombre:"Moya Agosto, Jorge",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100004",nombre:"Levest Trinidad, Alexander",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100315",nombre:"Landing Serrano, Jorge",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100016",nombre:"Rivera Caquias, Angel",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100796",nombre:"Acosta Daleccio, Jose",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},{id:"100391",nombre:"Cartagena Acosta, Angel",posicion:"Supervisor",supervisor:"Alvarado Cruz, Algenis"},{id:"100005",nombre:"Alvarado Cruz, Algenis",posicion:"Gerente",supervisor:"Merlo Serna, Cesar O"},{id:"100762",nombre:"Jimenez Matta, Victor L",posicion:"Supervisor",supervisor:"Alvarado Cruz, Algenis"},{id:"104219",nombre:"Morales Diaz, Ricardo X",posicion:"Supervisor",supervisor:"Alvarado Cruz, Algenis"},{id:"101564",nombre:"Torres Rivera, Abdiel",posicion:"Supervisor",supervisor:"Munoz Muniz, Herman"},{id:"104850",nombre:"Gonzalez Castro, Fernando",posicion:"Supervisor",supervisor:"Munoz Muniz, Herman"},{id:"100015",nombre:"Santiago Vazquez, Angel",posicion:"Supervisor",supervisor:""},{id:"100967",nombre:"Cortes Serrano, Enrique",posicion:"Perito",supervisor:""}];
let allAus=[],filteredAus=[],filteredEmp=[],ausPage=0,empPage=0;
function L(m){document.getElementById('loader-msg').textContent=m;document.getElementById('loader').classList.add('show');}
function HL(){document.getElementById('loader').classList.remove('show');}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/'/g,'&#39;');}
function tr2(s,n){return s&&s.length>n?s.slice(0,n)+'…':(s||'—');}
function tipoBadge(t){const k=Object.keys(TIPOS).find(k=>t&&t.toLowerCase().includes(k.toLowerCase()));return'<span class="badge '+(k?TIPOS[k]:'b-otro')+'">'+(t||'—')+'</span>';}
function flash(el,cls,msg){if(!el)return;el.className='flash'+(cls?' '+cls:'');el.textContent=msg;if(cls==='ok')setTimeout(()=>{el.textContent='';},3000);}
function ssCell(rowId,field,value,btn,fl){
  if(!rowId){flash(fl,'err','Sin ID');return;}
  if(btn){btn.disabled=true;btn.textContent='...';}
  fetch('/api/ausencias/'+rowId,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({field,value})})
  .then(r=>r.json()).then(d=>{
    if(d.ok){flash(fl,'ok',field==='statusHR'?'Actualizado':'Guardado');if(btn){btn.textContent='Guardado';setTimeout(()=>{btn.textContent='Guardar';btn.disabled=false;},2500);}}
    else{flash(fl,'err','Error');if(btn){btn.textContent='Guardar';btn.disabled=false;}}
  }).catch(()=>{flash(fl,'err','Error');if(btn){btn.textContent='Guardar';btn.disabled=false;}});
}
function hrSelect(rowId,cur,uid){
  return'<div class="editable-cell"><div class="input-row"><select class="status-select" onchange="chgHR(\''+rowId+'\',\''+uid+'\',this)"><option value="">— seleccionar —</option>'+HR_OPTIONS.map(o=>'<option'+(o===cur?' selected':'')+'>'+o+'</option>').join('')+'</select></div><div class="flash" id="fls-'+uid+'"></div></div>';
}
function chgHR(rowId,uid,sel){const v=sel.value;if(!v)return;ssCell(rowId,'statusHR',v,null,document.getElementById('fls-'+uid));const i=allAus.findIndex(r=>String(r.rowId)===String(rowId));if(i>=0)allAus[i].statusHR=v;}
function cmtCell(rowId,ex,uid){
  return'<div class="editable-cell">'+(ex?'<div class="comment-existing">'+tr2(ex,85)+'</div>':'')+'<div class="input-row"><input type="text" id="ci-'+uid+'" placeholder="Añadir..." value="'+esc(ex)+'"><button class="save-btn" onclick="saveCmt(\''+rowId+'\',\''+uid+'\',this)">Guardar</button></div><div class="flash" id="flc-'+uid+'"></div></div>';
}
function saveCmt(rowId,uid,btn){
  const v=document.getElementById('ci-'+uid).value.trim();
  const fl=document.getElementById('flc-'+uid);
  if(!v){fl.className='flash err';fl.textContent='Escribe algo';return;}
  ssCell(rowId,'comentarios',v,btn,fl);
  const c=btn.closest('.editable-cell'),ex=c.querySelector('.comment-existing');
  if(ex)ex.textContent=tr2(v,85);else{const d=document.createElement('div');d.className='comment-existing';d.textContent=tr2(v,85);c.insertBefore(d,c.firstChild);}
  const i=allAus.findIndex(r=>String(r.rowId)===String(rowId));if(i>=0)allAus[i].comentarios=v;
}
function buildFilters(){
  const deps=[...new Set(allAus.map(r=>r.departamento).filter(Boolean))].sort();
  const sups=[...new Set(allAus.map(r=>r.supervisor).filter(Boolean))].sort();
  const meses=[...new Set(allAus.map(r=>r.fecha?r.fecha.slice(0,7):null).filter(Boolean))].sort();
  document.getElementById('fil-dep').innerHTML='<option value="">Depto: Todos</option>'+deps.map(d=>'<option>'+d+'</option>').join('');
  document.getElementById('fil-sup').innerHTML='<option value="">Supervisor: Todos</option>'+sups.map(s=>'<option>'+s+'</option>').join('');
  document.getElementById('fil-mes').innerHTML='<option value="">Mes: Todos</option>'+meses.map(m=>'<option>'+m+'</option>').join('');
}
function filterAus(){
  const q=document.getElementById('srch-aus').value.toLowerCase(),tip=document.getElementById('fil-tipo').value,dep=document.getElementById('fil-dep').value,mes=document.getElementById('fil-mes').value,shr=document.getElementById('fil-shr').value;
  filteredAus=allAus.filter(r=>{
    if(q&&!((r.empleado||'').toLowerCase().includes(q)||(r.supervisor||'').toLowerCase().includes(q)))return false;
    if(tip&&r.tipo!==tip)return false;if(dep&&r.departamento!==dep)return false;
    if(mes&&!(r.fecha||'').startsWith(mes))return false;if(shr&&r.statusHR!==shr)return false;
    return true;
  });
  ausPage=0;renderAus();
}
function renderAus(){
  const tb=document.getElementById('aus-tbody'),st=ausPage*PAGE,sl=filteredAus.slice(st,st+PAGE);
  document.getElementById('aus-count').textContent=filteredAus.length+' registros';
  if(!sl.length){tb.innerHTML='<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8">No hay registros</td></tr>';return;}
  tb.innerHTML=sl.map((r,i)=>{const uid='a'+(st+i),bg=(r.tipo||'').toLowerCase().includes('no show')?'background:#fff8f8':'';
    return'<tr style="'+bg+'"><td style="color:#94a3b8;font-size:11px">'+(st+i+1)+'</td><td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500" title="'+esc(r.empleado)+'">'+tr2(r.empleado,22)+'</td><td style="font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+((r.supervisor||'—').split(' ').slice(-1)[0])+'</td><td style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(r.departamento||'—')+'</td><td>'+tipoBadge(r.tipo)+'</td><td style="font-size:11px;white-space:nowrap;color:#64748b">'+(r.fecha||'—')+'</td><td>'+hrSelect(r.rowId||'',r.statusHR||'',uid)+'</td><td>'+cmtCell(r.rowId||'',r.comentarios||'',uid)+'</td><td style="font-size:11px;white-space:normal;line-height:1.4;color:#64748b" title="'+esc(r.justificacion)+'">'+tr2(r.justificacion,60)+'</td></tr>';
  }).join('');
  document.getElementById('aus-pinfo').textContent='Pág '+(ausPage+1)+' de '+(Math.ceil(filteredAus.length/PAGE)||1);
  document.getElementById('aus-prev').disabled=ausPage===0;document.getElementById('aus-next').disabled=st+PAGE>=filteredAus.length;
}
function buildEmp(){
  const m={};
  allAus.forEach(r=>{const k=(r.empleado||'').toLowerCase().trim();if(!k)return;if(!m[k])m[k]={nombre:r.empleado,supervisor:r.supervisor,total:0,noshow:0,comentarios:'',rowId:r.rowId||''};m[k].total++;if((r.tipo||'').toLowerCase().includes('no show'))m[k].noshow++;if(r.comentarios&&!m[k].comentarios)m[k].comentarios=r.comentarios;if(r.rowId&&!m[k].rowId)m[k].rowId=r.rowId;});
  return ROSTER.map(e=>{const n=e.nombre.toLowerCase(),p=n.split(',').map(s=>s.trim()),ap=p[0]||'',fn=p[1]||'',cands=Object.keys(m).filter(k=>k.includes(ap)||(fn&&k.includes(fn))),mt=cands.length===1?m[cands[0]]:null;return{id:e.id,nombre:e.nombre,posicion:e.posicion,supervisor:mt?mt.supervisor:e.supervisor,total:mt?mt.total:0,noshow:mt?mt.noshow:0,hasRecord:!!mt,comentarios:mt?mt.comentarios:'',rowId:mt?mt.rowId:''};});
}
function filterEmp(){
  const q=document.getElementById('srch-emp').value.toLowerCase(),sup=document.getElementById('fil-sup').value,show=document.getElementById('fil-show').value;
  filteredEmp=buildEmp().filter(r=>{if(q&&!((r.nombre||'').toLowerCase().includes(q)||(r.id||'').includes(q)||(r.supervisor||'').toLowerCase().includes(q)))return false;if(sup&&r.supervisor!==sup)return false;if(show==='noreg'&&r.total>0)return false;if(show==='noshow'&&r.noshow===0)return false;if(show==='multi'&&r.total<3)return false;return true;}).sort((a,b)=>b.total-a.total);
  empPage=0;renderEmp();
}
function renderEmp(){
  const tb=document.getElementById('emp-tbody'),st=empPage*PAGE,sl=filteredEmp.slice(st,st+PAGE);
  document.getElementById('emp-count').textContent=filteredEmp.length+' empleados';
  if(!sl.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8">No hay empleados</td></tr>';return;}
  tb.innerHTML=sl.map((r,i)=>{
    let dot='dot-ok',lbl='Activo',bg='';
    if(!r.hasRecord){dot='dot-gray';lbl='Sin reporte';bg='background:#f8fafc';}else if(r.total>=5){dot='dot-err';lbl='Alta frecuencia';bg='background:#fff8f8';}else if(r.noshow>0){dot='dot-warn';lbl='Tiene no shows';bg='background:#fffbf0';}
    const tc=r.total===0?'#94a3b8':r.total>=5?'#e24b4a':r.total>=3?'#f5a623':'#0e9f7e',uid='e'+(st+i);
    return'<tr style="'+bg+'"><td style="color:#94a3b8;font-size:11px;font-family:monospace">'+r.id+'</td><td style="white-space:normal;line-height:1.4;font-weight:500">'+r.nombre+'</td><td style="text-align:center"><span style="font-size:15px;font-weight:600;color:'+tc+'">'+r.total+'</span></td><td style="font-size:11px;white-space:normal;line-height:1.4;color:#64748b">'+(r.supervisor||'—')+'</td><td style="font-size:11px;overflow:hidden;text-overflow:ellipsis;color:#64748b">'+(r.posicion||'—')+'</td><td style="text-align:center;font-weight:600;color:'+(r.noshow>0?'#e24b4a':'#94a3b8')+'">'+r.noshow+'</td><td style="white-space:nowrap"><span class="status-dot '+dot+'"></span>'+lbl+'</td><td>'+cmtCell(r.rowId,r.comentarios,uid)+'</td></tr>';
  }).join('');
  document.getElementById('emp-pinfo').textContent='Pág '+(empPage+1)+' de '+(Math.ceil(filteredEmp.length/PAGE)||1);
  document.getElementById('emp-prev').disabled=empPage===0;document.getElementById('emp-next').disabled=st+PAGE>=filteredEmp.length;
}
function changePage(w,d){if(w==='aus'){ausPage+=d;renderAus();}else{empPage+=d;renderEmp();}}
function updateMetrics(){
  const total=ROSTER.length,ed=buildEmp(),cr=ed.filter(e=>e.total>0).length,sr=ed.filter(e=>e.total===0).length,ns=allAus.filter(r=>(r.tipo||'').toLowerCase().includes('no show')).length;
  document.getElementById('m-total').textContent=total;document.getElementById('m-reg').textContent=cr;document.getElementById('m-reg-pct').textContent=Math.round(cr/total*100)+'% de la plantilla';
  document.getElementById('m-ns').textContent=ns;document.getElementById('m-ns-pct').textContent=Math.round(ns/Math.max(allAus.length,1)*100)+'% del total';
  document.getElementById('m-noreg').textContent=sr;
  document.getElementById('alert-zone').innerHTML=sr>0?'<div class="alert-box"><strong>'+sr+' empleados del roster</strong> no tienen ninguna ausencia registrada en 2026.</div>':'';
}
function showTab(tab,btn){document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('tab-'+tab).classList.add('active');btn.classList.add('active');if(tab==='resumen')renderCharts();if(tab==='empleados'&&filteredEmp.length===0)filterEmp();}
function barChart(id,data,colors){const max=Math.max(...data.map(d=>d.v),1);document.getElementById(id).innerHTML=data.slice(0,10).map((d,i)=>'<div class="bar-row"><span class="bar-label" title="'+d.k+'">'+(d.k.length>13?d.k.slice(0,13)+'…':d.k)+'</span><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(d.v/max*100)+'%;background:'+colors[i%colors.length]+'"></div></div><span class="bar-count">'+d.v+'</span></div>').join('');}
function renderCharts(){
  const tC={},dC={},sC={},eC={};
  allAus.forEach(r=>{tC[r.tipo||'Otro']=(tC[r.tipo||'Otro']||0)+1;dC[r.departamento||'Sin depto']=(dC[r.departamento||'Sin depto']||0)+1;sC[r.supervisor||'—']=(sC[r.supervisor||'—']||0)+1;eC[r.empleado||'—']=(eC[r.empleado||'—']||0)+1;});
  const toArr=o=>Object.entries(o).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
  barChart('c-tipo',toArr(tC),['#e24b4a','#f5a623','#0e9f7e','#378add','#7f77dd']);barChart('c-dep',toArr(dC),['#0d1b3e','#1a2d5a','#243d7a','#378add','#85B7EB']);barChart('c-sup',toArr(sC),BAR_COLORS);barChart('c-top',toArr(eC),['#e24b4a','#d85a30','#f5a623','#0e9f7e','#378add','#7f77dd','#0d1b3e']);
}
async function syncData(){
  L('Sincronizando con Smartsheet...');
  try{
    const r=await fetch('/api/ausencias');
    if(!r.ok)throw new Error('Error '+r.status);
    const data=await r.json();
    allAus=data.rows||[];filteredAus=[...allAus];
    buildFilters();updateMetrics();renderAus();
    document.getElementById('sync-info').textContent='Última sync: '+new Date().toLocaleTimeString('es-PR')+' · '+allAus.length+' registros';
  }catch(e){alert('Error: '+e.message);}finally{HL();}
}
syncData();
</script>
</body>
</html>`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
