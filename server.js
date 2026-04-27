const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SHEET_ID = '7423562282389380';
const COL_COMENTARIOS = '6683470817087364';
const COL_STATUS_HR   = '8593863697190788';
const SS_BASE = 'https://api.smartsheet.com/2.0';

function ssHeaders(req) {
  const token = req.headers['x-ss-token'] || process.env.SMARTSHEET_TOKEN;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

app.get('/api/ausencias', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    let allRows = [];
    let pageNum = 1;
    const pageSize = 500;
    while (true) {
      const url = `${SS_BASE}/sheets/${SHEET_ID}?pageSize=${pageSize}&page=${pageNum}`;
      const r = await fetch(url, { headers: ssHeaders(req) });
      if (!r.ok) { const err = await r.text(); return res.status(r.status).json({ error: err }); }
      const data = await r.json();
      const cols = data.columns || [];
      const colMap = {};
      cols.forEach(c => { colMap[c.id] = c.title; });
      const rows = (data.rows || []).map(row => {
        const obj = { rowId: String(row.id) };
        (row.cells || []).forEach(cell => {
          const title = colMap[cell.columnId];
          if (title) obj[title] = cell.displayValue ?? cell.value ?? '';
        });
        return {
          rowId:         obj.rowId,
          empleado:      obj['Nombre Empleado'] || '',
          supervisor:    obj['Supervisor'] || '',
          departamento:  obj['Departamento'] || '',
          tipo:          obj['Tipo Ausencia'] || '',
          fecha:         obj['Fecha de Inicio'] || obj['Fecha Inicio'] || '',
          fechaFin:      obj['Fecha Fin'] || '',
          statusHR:      obj['Status HR'] || '',
          statusSup:     obj['Status Supervisor'] || '',
          justificacion: obj['Justificación'] || obj['Justificacion'] || '',
          comentarios:   obj['Comentarios'] || ''
        };
      });
      allRows = allRows.concat(rows);
      if (allRows.length >= data.totalRowCount || rows.length < pageSize) break;
      pageNum++;
    }
    res.json({ rows: allRows, total: allRows.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/ausencias/:rowId', async (req, res) => {
  const { rowId } = req.params;
  const { field, value } = req.body;
  const colId = field === 'statusHR' ? COL_STATUS_HR : COL_COMENTARIOS;
  try {
    const fetch = (await import('node-fetch')).default;
    const body = JSON.stringify({
      rows: [{ id: parseInt(rowId), cells: [{ columnId: parseInt(colId), value: value }] }]
    });
    const r = await fetch(`${SS_BASE}/sheets/${SHEET_ID}/rows`, {
      method: 'PUT', headers: ssHeaders(req), body
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
