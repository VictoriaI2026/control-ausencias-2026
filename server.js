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
const TOKEN = process.env.SMARTSHEET_TOKEN || 'MHV3H5D9FgaJXE0GNGDKCmgJHNrxVfCNOybub';

const SS_HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

app.get('/api/ausencias', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    let allRows = [], pageNum = 1;
    while (true) {
      const r = await fetch(`${SS_BASE}/sheets/${SHEET_ID}?pageSize=500&page=${pageNum}`, { headers: SS_HEADERS });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const data = await r.json();
      const colMap = {};
      (data.columns || []).forEach(c => { colMap[c.id] = c.title; });
      const rows = (data.rows || []).map(row => {
        const obj = { rowId: String(row.id) };
        (row.cells || []).forEach(cell => {
          const t = colMap[cell.columnId];
          if (t) obj[t] = cell.displayValue ?? cell.value ?? '';
        });
        return {
          rowId:         obj.rowId,
          empleado:      obj['Nombre Empleado'] || '',
          supervisor:    obj['Supervisor'] || '',
          departamento:  obj['Departamento'] || '',
          tipo:          obj['Tipo Ausencia'] || '',
          fecha:         obj['Fecha de Inicio'] || obj['Fecha Inicio'] || '',
          statusHR:      obj['Status HR'] || '',
          statusSup:     obj['Status Supervisor'] || '',
          justificacion: obj['Justificación'] || obj['Justificacion'] || '',
          comentarios:   obj['Comentarios'] || ''
        };
      });
      allRows = allRows.concat(rows);
      if (allRows.length >= data.totalRowCount || rows.length < 500) break;
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
    const r = await fetch(`${SS_BASE}/sheets/${SHEET_ID}/rows`, {
      method: 'PUT',
      headers: SS_HEADERS,
      body: JSON.stringify({ rows: [{ id: parseInt(rowId), cells: [{ columnId: parseInt(colId), value }] }] })
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
