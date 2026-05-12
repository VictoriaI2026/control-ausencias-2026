const express = require('express');
const app = express();
app.use(express.json());

const SHEET_ID = '7423562282389380';
const COL_COMENTARIOS = '6683470817087364';
const COL_STATUS_HR = '8593863697190788';
const SS_BASE = 'https://api.smartsheet.com/2.0';
const TOKEN = process.env.SMARTSHEET_TOKEN || 'MHV3H5D9FgaJXE0GNGDKCmgJHNrxVfCNOybub';
const HEADERS = { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

app.get('/api/ausencias', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    let allRows = [], pageNum = 1;
    while (true) {
      const r = await fetch(SS_BASE + '/sheets/' + SHEET_ID + '?pageSize=500&page=' + pageNum + '&include=attachments', { headers: HEADERS });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      const colMap = {};
      (data.columns || []).forEach(function(c) { colMap[c.id] = c.title; });
      const rows = (data.rows || []).map(function(row) {
        const obj = { rowId: String(row.id) };
        (row.cells || []).forEach(function(cell) {
          const t = colMap[cell.columnId];
          if (t) obj[t] = cell.displayValue !== undefined ? cell.displayValue : (cell.value !== undefined ? cell.value : '');
        });
        const attachments = (row.attachments || []).map(function(a) {
          return { id: a.id, name: a.name, type: a.attachmentType, url: a.url || null, mimeType: a.mimeType || '' };
        });
        return {
          rowId: obj.rowId,
          empleado: obj['Nombre Empleado'] || '',
          supervisor: obj['Supervisor'] || '',
          departamento: obj['Departamento'] || '',
          tipo: obj['Tipo Ausencia'] || '',
          fecha: obj['Fecha de Inicio'] || obj['Fecha Inicio'] || '',
          statusHR: obj['Status HR'] || '',
          justificacion: obj['Justificacion'] || obj['Justificaci\u00f3n'] || '',
          comentarios: obj['Comentarios'] || '',
          attachments: attachments
        };
      });
      allRows = allRows.concat(rows);
      if (allRows.length >= data.totalRowCount || rows.length < 500) break;
      pageNum++;
    }
    res.json({ rows: allRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/attachment/:attachmentId', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(SS_BASE + '/sheets/' + SHEET_ID + '/attachments/' + req.params.attachmentId, { headers: HEADERS });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const data = await r.json();
    res.json({ url: data.url, name: data.name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/ausencias/:rowId', async (req, res) => {
  const rowId = req.params.rowId;
  const field = req.body.field;
  const value = req.body.value;
  const colId = field === 'statusHR' ? COL_STATUS_HR : COL_COMENTARIOS;
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(SS_BASE + '/sheets/' + SHEET_ID + '/rows', {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ rows: [{ id: parseInt(rowId), cells: [{ columnId: parseInt(colId), value: value }] }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const path = require('path');
app.get('/app.js', function(req, res) { res.sendFile(path.join(__dirname, 'public', 'app.js')); });
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', function(req, res) { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('Servidor v3 corriendo en puerto ' + PORT); });
