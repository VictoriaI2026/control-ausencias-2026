let allAus=[],filteredAus=[],filteredEmp=[];
let ausPage=0,empPage=0;
const PAGE=40;
const HR_OPTIONS=['Validado','Pendiente','Aprobado','Rechazado','En revisión'];
const TIPOS={'Enfermedad':'b-enf','No show':'b-ns','Vacaciones':'b-vac','Personal':'b-per','FMLA':'b-lic','Licencia':'b-lic'};
const BAR_COLORS=['#0d1b3e','#0e9f7e','#e24b4a','#378add','#7f77dd','#d85a30','#f5a623','#5DCAA5','#AFA9EC','#F0997B'];
const ROSTER=[
  {id:"100246",nombre:"Varela Ortiz, Eddie",posicion:"Gerente",supervisor:"Merlo Serna, Cesar O"},
  {id:"100067",nombre:"Razon Tejada, Joan",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100587",nombre:"Vazquez Mieles, Rafael",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100001",nombre:"Santiago Fontanez, Alberto",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100646",nombre:"Moreno Mendez, Arnaldo L",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100760",nombre:"Rosario Andujar, Javier",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100546",nombre:"Moya Agosto, Jorge",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100004",nombre:"Levest Trinidad, Alexander",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100315",nombre:"Landing Serrano, Jorge",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100016",nombre:"Rivera Caquias, Angel",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100796",nombre:"Acosta Daleccio, Jose",posicion:"Supervisor",supervisor:"Varela Ortiz, Eddie"},
  {id:"100391",nombre:"Cartagena Acosta, Angel",posicion:"Supervisor",supervisor:"Alvarado Cruz, Algenis"},
  {id:"100005",nombre:"Alvarado Cruz, Algenis",posicion:"Gerente",supervisor:"Merlo Serna, Cesar O"},
  {id:"100762",nombre:"Jimenez Matta, Victor L",posicion:"Supervisor",supervisor:"Alvarado Cruz, Algenis"},
  {id:"104219",nombre:"Morales Diaz, Ricardo X",posicion:"Supervisor",supervisor:"Alvarado Cruz, Algenis"},
  {id:"101564",nombre:"Torres Rivera, Abdiel",posicion:"Supervisor",supervisor:"Munoz Muniz, Herman"},
  {id:"104850",nombre:"Gonzalez Castro, Fernando",posicion:"Supervisor",supervisor:"Munoz Muniz, Herman"},
  {id:"100015",nombre:"Santiago Vazquez, Angel",posicion:"Supervisor",supervisor:""},
  {id:"100967",nombre:"Cortes Serrano, Enrique",posicion:"Perito",supervisor:""}
];

function showLoader(m){document.getElementById('loader-msg').textContent=m||'Cargando...';document.getElementById('loader').classList.add('show');}
function hideLoader(){document.getElementById('loader').classList.remove('show');}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/'/g,'&#39;');}
function trunc(s,n){return s&&s.length>n?s.slice(0,n)+'…':(s||'—');}
function tipoBadge(t){const k=Object.keys(TIPOS).find(k=>t&&t.toLowerCase().includes(k.toLowerCase()));return`<span class="badge ${k?TIPOS[k]:'b-otro'}">${t||'—'}</span>`;}

async function fetchAusencias(){
  const r=await fetch('/api/ausencias');
  if(!r.ok)throw new Error(`Error ${r.status}`);
  const data=await r.json();
  return data.rows||[];
}

async function patchCell(rowId,field,value,btnEl,flashEl){
  if(!rowId){flash(flashEl,'err','Sin ID');return;}
  if(btnEl){btnEl.disabled=true;btnEl.textContent='...';}
  try{
    const r=await fetch(`/api/ausencias/${rowId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({field,value})});
    const data=await r.json();
    if(r.ok&&data.ok){
      flash(flashEl,'ok',field==='statusHR'?'Status actualizado':'Guardado');
      if(btnEl){btnEl.textContent='Guardado';setTimeout(()=>{if(btnEl){btnEl.textContent='Guardar';btnEl.disabled=false;}},2500);}
    }else{flash(flashEl,'err','Error al guardar');if(btnEl){btnEl.textContent='Guardar';btnEl.disabled=false;}}
  }catch(e){flash(flashEl,'err','Error');if(btnEl){btnEl.textContent='Guardar';btnEl.disabled=false;}}
}

function flash(el,cls,msg){if(!el)return;el.className='flash'+(cls?' '+cls:'');el.textContent=msg;if(cls==='ok')setTimeout(()=>{el.textContent='';},3000);}

function statusHRSelect(rowId,current,uid){
  const opts=HR_OPTIONS.map(o=>`<option value="${o}"${o===current?' selected':''}>${o}</option>`).join('');
  return`<div class="editable-cell"><div class="input-row"><select class="status-select" onchange="handleStatusChange('${rowId}','${uid}',this)"><option value="">— seleccionar —</option>${opts}</select></div><div class="flash" id="fls-${uid}"></div></div>`;
}
function handleStatusChange(rowId,uid,sel){
  const val=sel.value;if(!val)return;
  patchCell(rowId,'statusHR',val,null,document.getElementById('fls-'+uid));
  const idx=allAus.findIndex(r=>String(r.rowId)===String(rowId));
  if(idx>=0)allAus[idx].statusHR=val;
}
function commentCell(rowId,existing,uid){
  return`<div class="editable-cell">${existing?`<div class="comment-existing">${trunc(existing,85)}</div>`:''}<div class="input-row"><input type="text" id="ci-${uid}" placeholder="Añadir comentario..." value="${esc(existing)}"><button class="save-btn" onclick="handleComment('${rowId}','${uid}',this)">Guardar</button></div><div class="flash" id="flc-${uid}"></div></div>`;
}
function handleComment(rowId,uid,btn){
  const val=document.getElementById('ci-'+uid).value.trim();
  const fl=document.getElementById('flc-'+uid);
  if(!val){fl.className='flash err';fl.textContent='Escribe un comentario';return;}
  patchCell(rowId,'comentarios',val,btn,fl);
  const cell=btn.closest('.editable-cell');
  const ex=cell.querySelector('.comment-existing');
  if(ex)ex.textContent=trunc(val,85);
  else{const d=document.createElement('div');d.className='comment-existing';d.textContent=trunc(val,85);cell.insertBefore(d,cell.firstChild);}
  const idx=allAus.findIndex(r=>String(r.rowId)===String(rowId));
  if(idx>=0)allAus[idx].comentarios=val;
}

function buildFilters(){
  const deps=[...new Set(allAus.map(r=>r.departamento).filter(Boolean))].sort();
  const sups=[...new Set(allAus.map(r=>r.supervisor).filter(Boolean))].sort();
  const meses=[...new Set(allAus.map(r=>r.fecha?r.fecha.slice(0,7):null).filter(Boolean))].sort();
  document.getElementById('fil-dep').innerHTML=`<option value="">Depto: Todos</option>`+deps.map(d=>`<option>${d}</option>`).join('');
  document.getElementById('fil-sup').innerHTML=`<option value="">Supervisor: Todos</option>`+sups.map(s=>`<option>${s}</option>`).join('');
  document.getElementById('fil-mes').innerHTML=`<option value="">Mes: Todos</option>`+meses.map(m=>`<option>${m}</option>`).join('');
}

function filterAus(){
  const q=document.getElementById('srch-aus').value.toLowerCase();
  const tip=document.getElementById('fil-tipo').value;
  const dep=document.getElementById('fil-dep').value;
  const mes=document.getElementById('fil-mes').value;
  const shr=document.getElementById('fil-shr').value;
  filteredAus=allAus.filter(r=>{
    if(q&&!((r.empleado||'').toLowerCase().includes(q)||(r.supervisor||'').toLowerCase().includes(q)))return false;
    if(tip&&r.tipo!==tip)return false;
    if(dep&&r.departamento!==dep)return false;
    if(mes&&!(r.fecha||'').startsWith(mes))return false;
    if(shr&&r.statusHR!==shr)return false;
    return true;
  });
  ausPage=0;renderAus();
}

function renderAus(){
  const tbody=document.getElementById('aus-tbody');
  const start=ausPage*PAGE;
  const slice=filteredAus.slice(start,start+PAGE);
  document.getElementById('aus-count').textContent=`${filteredAus.length} registros`;
  if(!slice.length){tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8">No hay registros</td></tr>`;return;}
  tbody.innerHTML=slice.map((r,i)=>{
    const uid=`a${start+i}`;
    const rowBg=(r.tipo||'').toLowerCase().includes('no show')?'background:#fff8f8':'';
    return`<tr style="${rowBg}">
      <td style="color:#94a3b8;font-size:11px">${start+i+1}</td>
      <td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500" title="${esc(r.empleado)}">${trunc(r.empleado,22)}</td>
      <td style="font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(r.supervisor)}">${(r.supervisor||'—').split(' ').slice(-1)[0]}</td>
      <td style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.departamento||'—'}</td>
      <td>${tipoBadge(r.tipo)}</td>
      <td style="font-size:11px;white-space:nowrap;color:#64748b">${r.fecha||'—'}</td>
      <td>${statusHRSelect(r.rowId||'',r.statusHR||'',uid)}</td>
      <td>${commentCell(r.rowId||'',r.comentarios||'',uid)}</td>
      <td style="font-size:11px;white-space:normal;line-height:1.4;color:#64748b" title="${esc(r.justificacion)}">${trunc(r.justificacion,60)}</td>
    </tr>`;
  }).join('');
  document.getElementById('aus-pinfo').textContent=`Pág ${ausPage+1} de ${Math.ceil(filteredAus.length/PAGE)||1}`;
  document.getElementById('aus-prev').disabled=ausPage===0;
  document.getElementById('aus-next').disabled=start+PAGE>=filteredAus.length;
}

function buildEmpData(){
  const empMap={};
  allAus.forEach(r=>{
    const k=(r.empleado||'').toLowerCase().trim();if(!k)return;
    if(!empMap[k])empMap[k]={nombre:r.empleado,supervisor:r.supervisor,total:0,noshow:0,comentarios:'',rowId:r.rowId||''};
    empMap[k].total++;
    if((r.tipo||'').toLowerCase().includes('no show'))empMap[k].noshow++;
    if(r.comentarios&&!empMap[k].comentarios)empMap[k].comentarios=r.comentarios;
    if(r.rowId&&!empMap[k].rowId)empMap[k].rowId=r.rowId;
  });
  return ROSTER.map(emp=>{
    const n=emp.nombre.toLowerCase();
    const parts=n.split(',').map(s=>s.trim());
    const ap=parts[0]||'',fn=parts[1]||'';
    const cands=Object.keys(empMap).filter(k=>k.includes(ap)||(fn&&k.includes(fn)));
    const m=cands.length===1?empMap[cands[0]]:null;
    return{id:emp.id,nombre:emp.nombre,posicion:emp.posicion,supervisor:m?m.supervisor:emp.supervisor,total:m?m.total:0,noshow:m?m.noshow:0,hasRecord:!!m,comentarios:m?m.comentarios:'',rowId:m?m.rowId:''};
  });
}

function filterEmp(){
  const q=document.getElementById('srch-emp').value.toLowerCase();
  const sup=document.getElementById('fil-sup').value;
  const show=document.getElementById('fil-show').value;
  filteredEmp=buildEmpData().filter(r=>{
    if(q&&!((r.nombre||'').toLowerCase().includes(q)||(r.id||'').includes(q)||(r.supervisor||'').toLowerCase().includes(q)))return false;
    if(sup&&r.supervisor!==sup)return false;
    if(show==='noreg'&&r.total>0)return false;
    if(show==='noshow'&&r.noshow===0)return false;
    if(show==='multi'&&r.total<3)return false;
    return true;
  }).sort((a,b)=>b.total-a.total);
  empPage=0;renderEmp();
}

function renderEmp(){
  const tbody=document.getElementById('emp-tbody');
  const start=empPage*PAGE;
  const slice=filteredEmp.slice(start,start+PAGE);
  document.getElementById('emp-count').textContent=`${filteredEmp.length} empleados`;
  if(!slice.length){tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8">No hay empleados</td></tr>`;return;}
  tbody.innerHTML=slice.map((r,i)=>{
    let dot='dot-ok',lbl='Activo',rowBg='';
    if(!r.hasRecord){dot='dot-gray';lbl='Sin reporte';rowBg='background:#f8fafc';}
    else if(r.total>=5){dot='dot-err';lbl='Alta frecuencia';rowBg='background:#fff8f8';}
    else if(r.noshow>0){dot='dot-warn';lbl='Tiene no shows';rowBg='background:#fffbf0';}
    const totalColor=r.total===0?'#94a3b8':r.total>=5?'#e24b4a':r.total>=3?'#f5a623':'#0e9f7e';
    const uid=`e${start+i}`;
    return`<tr style="${rowBg}">
      <td style="color:#94a3b8;font-size:11px;font-family:monospace">${r.id}</td>
      <td style="white-space:normal;line-height:1.4;font-weight:500">${r.nombre}</td>
      <td style="text-align:center"><span style="font-size:15px;font-weight:600;color:${totalColor}">${r.total}</span></td>
      <td style="font-size:11px;white-space:normal;line-height:1.4;color:#64748b">${r.supervisor||'—'}</td>
      <td style="font-size:11px;overflow:hidden;text-overflow:ellipsis;color:#64748b">${r.posicion||'—'}</td>
      <td style="text-align:center;font-weight:600;color:${r.noshow>0?'#e24b4a':'#94a3b8'}">${r.noshow}</td>
      <td style="white-space:nowrap"><span class="status-dot ${dot}"></span>${lbl}</td>
      <td>${commentCell(r.rowId,r.comentarios,uid)}</td>
    </tr>`;
  }).join('');
  document.getElementById('emp-pinfo').textContent=`Pág ${empPage+1} de ${Math.ceil(filteredEmp.length/PAGE)||1}`;
  document.getElementById('emp-prev').disabled=empPage===0;
  document.getElementById('emp-next').disabled=start+PAGE>=filteredEmp.length;
}

function changePage(which,dir){
  if(which==='aus'){ausPage+=dir;renderAus();}
  else{empPage+=dir;renderEmp();}
}

function updateMetrics(){
  const total=ROSTER.length;
  const empData=buildEmpData();
  const conReg=empData.filter(e=>e.total>0).length;
  const sinReg=empData.filter(e=>e.total===0).length;
  const noShows=allAus.filter(r=>(r.tipo||'').toLowerCase().includes('no show')).length;
  document.getElementById('m-total').textContent=total.toLocaleString();
  document.getElementById('m-reg').textContent=conReg.toLocaleString();
  document.getElementById('m-reg-pct').textContent=`${Math.round(conReg/total*100)}% de la plantilla`;
  document.getElementById('m-ns').textContent=noShows.toLocaleString();
  document.getElementById('m-ns-pct').textContent=`${Math.round(noShows/Math.max(allAus.length,1)*100)}% del total`;
  document.getElementById('m-noreg').textContent=sinReg.toLocaleString();
  document.getElementById('alert-zone').innerHTML=sinReg>0?`<div class="alert-box"><strong>${sinReg} empleados del roster</strong> no tienen ninguna ausencia registrada en 2026.</div>`:'';
}

function showTab(tab,btn){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  btn.classList.add('active');
  if(tab==='resumen')renderCharts();
  if(tab==='empleados'&&filteredEmp.length===0)filterEmp();
}

function barChart(id,data,colors){
  const max=Math.max(...data.map(d=>d.v),1);
  document.getElementById(id).innerHTML=data.slice(0,10).map((d,i)=>`
    <div class="bar-row"><span class="bar-label" title="${d.k}">${d.k.length>13?d.k.slice(0,13)+'…':d.k}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(d.v/max*100)}%;background:${colors[i%colors.length]}"></div></div><span class="bar-count">${d.v}</span></div>`).join('');
}

function renderCharts(){
  const tC={},dC={},sC={},eC={};
  allAus.forEach(r=>{
    tC[r.tipo||'Otro']=(tC[r.tipo||'Otro']||0)+1;
    dC[r.departamento||'Sin depto']=(dC[r.departamento||'Sin depto']||0)+1;
    sC[r.supervisor||'—']=(sC[r.supervisor||'—']||0)+1;
    eC[r.empleado||'—']=(eC[r.empleado||'—']||0)+1;
  });
  const toArr=o=>Object.entries(o).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
  barChart('c-tipo',toArr(tC),['#e24b4a','#f5a623','#0e9f7e','#378add','#7f77dd']);
  barChart('c-dep',toArr(dC),['#0d1b3e','#1a2d5a','#243d7a','#378add','#85B7EB']);
  barChart('c-sup',toArr(sC),BAR_COLORS);
  barChart('c-top',toArr(eC),['#e24b4a','#d85a30','#f5a623','#0e9f7e','#378add','#7f77dd','#0d1b3e','#1a2d5a','#5DCAA5','#AFA9EC']);
}

async function syncData(){
  showLoader('Sincronizando con Smartsheet...');
  try{
    allAus=await fetchAusencias();
    filteredAus=[...allAus];
    buildFilters();
    updateMetrics();
    renderAus();
    const now=new Date().toLocaleTimeString('es-PR');
    document.getElementById('sync-info').textContent=`Última sync: ${now} · ${allAus.length} registros`;
  }catch(e){
    alert('Error: '+e.message);
  }finally{
    hideLoader();
  }
}

syncData();
