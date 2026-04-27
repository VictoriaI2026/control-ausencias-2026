var PAGE=40;
var HR_OPTIONS=['Validado','Pendiente','Aprobado','Rechazado','En revision'];
var TIPOS={'Enfermedad':'b-enf','No show':'b-ns','Vacaciones':'b-vac','Personal':'b-per','FMLA':'b-lic'};
var BAR_COLORS=['#0d1b3e','#0e9f7e','#e24b4a','#378add','#7f77dd','#d85a30','#f5a623'];
var ROSTER=[
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

var allAus=[],filteredAus=[],filteredEmp=[],ausPage=0,empPage=0;

function showLoader(m){
  document.getElementById('loader-msg').textContent=m||'Cargando...';
  document.getElementById('loader').classList.add('show');
}
function hideLoader(){
  document.getElementById('loader').classList.remove('show');
}
function esc(s){
  return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
function tr2(s,n){
  return s&&s.length>n ? s.slice(0,n)+'...' : (s||'--');
}
function tipoBadge(t){
  var k=null;
  var keys=Object.keys(TIPOS);
  for(var i=0;i<keys.length;i++){
    if(t&&t.toLowerCase().indexOf(keys[i].toLowerCase())>=0){k=keys[i];break;}
  }
  return '<span class="badge '+(k?TIPOS[k]:'b-otro')+'">'+(t||'--')+'</span>';
}
function flashEl(el,cls,msg){
  if(!el)return;
  el.className='flash'+(cls?' '+cls:'');
  el.textContent=msg;
  if(cls==='ok')setTimeout(function(){el.textContent='';},3000);
}
function ssCell(rowId,field,value,btn,fl){
  if(!rowId){flashEl(fl,'err','Sin ID');return;}
  if(btn){btn.disabled=true;btn.textContent='...';}
  fetch('/api/ausencias/'+rowId,{
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({field:field,value:value})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.ok){
      flashEl(fl,'ok',field==='statusHR'?'Actualizado':'Guardado');
      if(btn){btn.textContent='Guardado';setTimeout(function(){btn.textContent='Guardar';btn.disabled=false;},2500);}
    } else {
      flashEl(fl,'err','Error');
      if(btn){btn.textContent='Guardar';btn.disabled=false;}
    }
  }).catch(function(){
    flashEl(fl,'err','Error');
    if(btn){btn.textContent='Guardar';btn.disabled=false;}
  });
}
function hrSelect(rowId,cur,uid){
  var opts='<option value="">-- seleccionar --</option>';
  for(var i=0;i<HR_OPTIONS.length;i++){
    opts+='<option'+(HR_OPTIONS[i]===cur?' selected':'')+'>'+HR_OPTIONS[i]+'</option>';
  }
  return '<div class="editable-cell"><div class="input-row"><select class="status-select" onchange="chgHR(\''+rowId+'\',\''+uid+'\',this)">'+opts+'</select></div><div class="flash" id="fls-'+uid+'"></div></div>';
}
function chgHR(rowId,uid,sel){
  var v=sel.value;if(!v)return;
  ssCell(rowId,'statusHR',v,null,document.getElementById('fls-'+uid));
  for(var i=0;i<allAus.length;i++){if(String(allAus[i].rowId)===String(rowId)){allAus[i].statusHR=v;break;}}
}
function cmtCell(rowId,ex,uid){
  return '<div class="editable-cell">'+(ex?'<div class="comment-existing">'+tr2(ex,85)+'</div>':'')+
    '<div class="input-row"><input type="text" id="ci-'+uid+'" placeholder="Añadir..." value="'+esc(ex)+'">'+
    '<button class="save-btn" onclick="saveCmt(\''+rowId+'\',\''+uid+'\',this)">Guardar</button></div>'+
    '<div class="flash" id="flc-'+uid+'"></div></div>';
}
function saveCmt(rowId,uid,btn){
  var v=document.getElementById('ci-'+uid).value.trim();
  var fl=document.getElementById('flc-'+uid);
  if(!v){fl.className='flash err';fl.textContent='Escribe algo';return;}
  ssCell(rowId,'comentarios',v,btn,fl);
  var cell=btn.parentNode.parentNode;
  var ex=cell.querySelector('.comment-existing');
  if(ex){ex.textContent=tr2(v,85);}
  else{var d=document.createElement('div');d.className='comment-existing';d.textContent=tr2(v,85);cell.insertBefore(d,cell.firstChild);}
  for(var i=0;i<allAus.length;i++){if(String(allAus[i].rowId)===String(rowId)){allAus[i].comentarios=v;break;}}
}
function buildFilters(){
  var deps=[],sups=[],meses=[];
  var dmap={},smap={},mmap={};
  for(var i=0;i<allAus.length;i++){
    var r=allAus[i];
    if(r.departamento&&!dmap[r.departamento]){dmap[r.departamento]=1;deps.push(r.departamento);}
    if(r.supervisor&&!smap[r.supervisor]){smap[r.supervisor]=1;sups.push(r.supervisor);}
    var m=r.fecha?r.fecha.slice(0,7):null;
    if(m&&!mmap[m]){mmap[m]=1;meses.push(m);}
  }
  deps.sort();sups.sort();meses.sort();
  document.getElementById('fil-dep').innerHTML='<option value="">Depto: Todos</option>'+deps.map(function(d){return'<option>'+d+'</option>';}).join('');
  document.getElementById('fil-sup').innerHTML='<option value="">Supervisor: Todos</option>'+sups.map(function(s){return'<option>'+s+'</option>';}).join('');
  document.getElementById('fil-mes').innerHTML='<option value="">Mes: Todos</option>'+meses.map(function(m){return'<option>'+m+'</option>';}).join('');
}
function filterAus(){
  var q=document.getElementById('srch-aus').value.toLowerCase();
  var tip=document.getElementById('fil-tipo').value;
  var dep=document.getElementById('fil-dep').value;
  var mes=document.getElementById('fil-mes').value;
  var shr=document.getElementById('fil-shr').value;
  filteredAus=allAus.filter(function(r){
    if(q&&(r.empleado||'').toLowerCase().indexOf(q)<0&&(r.supervisor||'').toLowerCase().indexOf(q)<0)return false;
    if(tip&&r.tipo!==tip)return false;
    if(dep&&r.departamento!==dep)return false;
    if(mes&&(r.fecha||'').indexOf(mes)!==0)return false;
    if(shr&&r.statusHR!==shr)return false;
    return true;
  });
  ausPage=0;renderAus();
}
function renderAus(){
  var tbody=document.getElementById('aus-tbody');
  var start=ausPage*PAGE;
  var slice=filteredAus.slice(start,start+PAGE);
  document.getElementById('aus-count').textContent=filteredAus.length+' registros';
  if(!slice.length){tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8">No hay registros</td></tr>';return;}
  var html='';
  for(var i=0;i<slice.length;i++){
    var r=slice[i];
    var uid='a'+(start+i);
    var bg=(r.tipo||'').toLowerCase().indexOf('no show')>=0?'background:#fff8f8':'';
    html+='<tr style="'+bg+'">';
    html+='<td style="color:#94a3b8;font-size:11px">'+(start+i+1)+'</td>';
    html+='<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500">'+tr2(r.empleado,22)+'</td>';
    html+='<td style="font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+tr2(r.supervisor,15)+'</td>';
    html+='<td style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(r.departamento||'--')+'</td>';
    html+='<td>'+tipoBadge(r.tipo)+'</td>';
    html+='<td style="font-size:11px;white-space:nowrap;color:#64748b">'+(r.fecha||'--')+'</td>';
    html+='<td>'+hrSelect(r.rowId||'',r.statusHR||'',uid)+'</td>';
    html+='<td>'+cmtCell(r.rowId||'',r.comentarios||'',uid)+'</td>';
    html+='<td style="font-size:11px;white-space:normal;line-height:1.4;color:#64748b">'+tr2(r.justificacion,60)+'</td>';
    html+='</tr>';
  }
  tbody.innerHTML=html;
  document.getElementById('aus-pinfo').textContent='Pag '+(ausPage+1)+' de '+(Math.ceil(filteredAus.length/PAGE)||1);
  document.getElementById('aus-prev').disabled=ausPage===0;
  document.getElementById('aus-next').disabled=start+PAGE>=filteredAus.length;
}
function buildEmp(){
  var m={};
  for(var i=0;i<allAus.length;i++){
    var r=allAus[i];
    var k=(r.empleado||'').toLowerCase().trim();
    if(!k)continue;
    if(!m[k])m[k]={nombre:r.empleado,supervisor:r.supervisor,total:0,noshow:0,comentarios:'',rowId:r.rowId||''};
    m[k].total++;
    if((r.tipo||'').toLowerCase().indexOf('no show')>=0)m[k].noshow++;
    if(r.comentarios&&!m[k].comentarios)m[k].comentarios=r.comentarios;
    if(r.rowId&&!m[k].rowId)m[k].rowId=r.rowId;
  }
  return ROSTER.map(function(e){
    var n=e.nombre.toLowerCase();
    var parts=n.split(',').map(function(s){return s.trim();});
    var ap=parts[0]||'',fn=parts[1]||'';
    var cands=Object.keys(m).filter(function(k){return k.indexOf(ap)>=0||(fn&&k.indexOf(fn)>=0);});
    var mt=cands.length===1?m[cands[0]]:null;
    return{id:e.id,nombre:e.nombre,posicion:e.posicion,supervisor:mt?mt.supervisor:e.supervisor,
      total:mt?mt.total:0,noshow:mt?mt.noshow:0,hasRecord:!!mt,
      comentarios:mt?mt.comentarios:'',rowId:mt?mt.rowId:''};
  });
}
function filterEmp(){
  var q=document.getElementById('srch-emp').value.toLowerCase();
  var sup=document.getElementById('fil-sup').value;
  var show=document.getElementById('fil-show').value;
  filteredEmp=buildEmp().filter(function(r){
    if(q&&(r.nombre||'').toLowerCase().indexOf(q)<0&&(r.id||'').indexOf(q)<0&&(r.supervisor||'').toLowerCase().indexOf(q)<0)return false;
    if(sup&&r.supervisor!==sup)return false;
    if(show==='noreg'&&r.total>0)return false;
    if(show==='noshow'&&r.noshow===0)return false;
    if(show==='multi'&&r.total<3)return false;
    return true;
  }).sort(function(a,b){return b.total-a.total;});
  empPage=0;renderEmp();
}
function renderEmp(){
  var tbody=document.getElementById('emp-tbody');
  var start=empPage*PAGE;
  var slice=filteredEmp.slice(start,start+PAGE);
  document.getElementById('emp-count').textContent=filteredEmp.length+' empleados';
  if(!slice.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8">No hay empleados</td></tr>';return;}
  var html='';
  for(var i=0;i<slice.length;i++){
    var r=slice[i];
    var dot='dot-ok',lbl='Activo',bg='';
    if(!r.hasRecord){dot='dot-gray';lbl='Sin reporte';bg='background:#f8fafc';}
    else if(r.total>=5){dot='dot-err';lbl='Alta frecuencia';bg='background:#fff8f8';}
    else if(r.noshow>0){dot='dot-warn';lbl='Tiene no shows';bg='background:#fffbf0';}
    var tc=r.total===0?'#94a3b8':r.total>=5?'#e24b4a':r.total>=3?'#f5a623':'#0e9f7e';
    var uid='e'+(start+i);
    html+='<tr style="'+bg+'">';
    html+='<td style="color:#94a3b8;font-size:11px;font-family:monospace">'+r.id+'</td>';
    html+='<td style="white-space:normal;line-height:1.4;font-weight:500">'+r.nombre+'</td>';
    html+='<td style="text-align:center"><span style="font-size:15px;font-weight:600;color:'+tc+'">'+r.total+'</span></td>';
    html+='<td style="font-size:11px;white-space:normal;line-height:1.4;color:#64748b">'+(r.supervisor||'--')+'</td>';
    html+='<td style="font-size:11px;overflow:hidden;text-overflow:ellipsis;color:#64748b">'+(r.posicion||'--')+'</td>';
    html+='<td style="text-align:center;font-weight:600;color:'+(r.noshow>0?'#e24b4a':'#94a3b8')+'">'+r.noshow+'</td>';
    html+='<td style="white-space:nowrap"><span class="status-dot '+dot+'"></span>'+lbl+'</td>';
    html+='<td>'+cmtCell(r.rowId,r.comentarios,uid)+'</td>';
    html+='</tr>';
  }
  tbody.innerHTML=html;
  document.getElementById('emp-pinfo').textContent='Pag '+(empPage+1)+' de '+(Math.ceil(filteredEmp.length/PAGE)||1);
  document.getElementById('emp-prev').disabled=empPage===0;
  document.getElementById('emp-next').disabled=start+PAGE>=filteredEmp.length;
}
function changePage(w,d){
  if(w==='aus'){ausPage+=d;renderAus();}
  else{empPage+=d;renderEmp();}
}
function updateMetrics(){
  var total=ROSTER.length;
  var ed=buildEmp();
  var cr=0,sr=0;
  for(var i=0;i<ed.length;i++){if(ed[i].total>0)cr++;else sr++;}
  var ns=0;
  for(var i=0;i<allAus.length;i++){if((allAus[i].tipo||'').toLowerCase().indexOf('no show')>=0)ns++;}
  document.getElementById('m-total').textContent=total;
  document.getElementById('m-reg').textContent=cr;
  document.getElementById('m-reg-pct').textContent=Math.round(cr/total*100)+'% de la plantilla';
  document.getElementById('m-ns').textContent=ns;
  document.getElementById('m-ns-pct').textContent=Math.round(ns/Math.max(allAus.length,1)*100)+'% del total';
  document.getElementById('m-noreg').textContent=sr;
  document.getElementById('alert-zone').innerHTML=sr>0?'<div class="alert-box"><strong>'+sr+' empleados</strong> sin ausencia registrada en 2026.</div>':'';
}
function showTab(tab,btn){
  var panels=document.querySelectorAll('.tab-panel');
  for(var i=0;i<panels.length;i++)panels[i].classList.remove('active');
  var btns=document.querySelectorAll('.tab-btn');
  for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
  document.getElementById('tab-'+tab).classList.add('active');
  btn.classList.add('active');
  if(tab==='resumen')renderCharts();
  if(tab==='empleados'&&filteredEmp.length===0)filterEmp();
}
function barChart(id,data,colors){
  var max=0;
  for(var i=0;i<data.length;i++)if(data[i].v>max)max=data[i].v;
  if(max===0)max=1;
  var html='';
  var top=data.slice(0,10);
  for(var i=0;i<top.length;i++){
    var d=top[i];
    var lbl=d.k.length>13?d.k.slice(0,13)+'...':d.k;
    html+='<div class="bar-row"><span class="bar-label" title="'+d.k+'">'+lbl+'</span>';
    html+='<div class="bar-track"><div class="bar-fill" style="width:'+Math.round(d.v/max*100)+'%;background:'+colors[i%colors.length]+'"></div></div>';
    html+='<span class="bar-count">'+d.v+'</span></div>';
  }
  document.getElementById(id).innerHTML=html;
}
function renderCharts(){
  var tC={},dC={},sC={},eC={};
  for(var i=0;i<allAus.length;i++){
    var r=allAus[i];
    var t=r.tipo||'Otro';tC[t]=(tC[t]||0)+1;
    var d=r.departamento||'Sin depto';dC[d]=(dC[d]||0)+1;
    var s=r.supervisor||'--';sC[s]=(sC[s]||0)+1;
    var e=r.empleado||'--';eC[e]=(eC[e]||0)+1;
  }
  function toArr(o){var a=[];for(var k in o)a.push({k:k,v:o[k]});return a.sort(function(a,b){return b.v-a.v;});}
  barChart('c-tipo',toArr(tC),['#e24b4a','#f5a623','#0e9f7e','#378add','#7f77dd']);
  barChart('c-dep',toArr(dC),['#0d1b3e','#1a2d5a','#243d7a','#378add','#85B7EB']);
  barChart('c-sup',toArr(sC),BAR_COLORS);
  barChart('c-top',toArr(eC),['#e24b4a','#d85a30','#f5a623','#0e9f7e','#378add','#7f77dd','#0d1b3e']);
}
function syncData(){
  showLoader('Sincronizando con Smartsheet...');
  fetch('/api/ausencias').then(function(r){
    if(!r.ok)throw new Error('Error '+r.status);
    return r.json();
  }).then(function(data){
    allAus=data.rows||[];
    filteredAus=allAus.slice();
    buildFilters();
    updateMetrics();
    renderAus();
    document.getElementById('sync-info').textContent='Sync: '+new Date().toLocaleTimeString('es-PR')+' - '+allAus.length+' registros';
    hideLoader();
  }).catch(function(e){
    hideLoader();
    alert('Error: '+e.message);
  });
}
syncData();
