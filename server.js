const nodemailer = require('nodemailer');
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

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'v.rivera@windmarhome.com',
    pass: process.env.EMAIL_PASS
  },
  tls: { ciphers: 'SSLv3' }
});

app.post('/api/notificar', async (req, res) => {
  const { empleado, ausencias, supervisor, mes } = req.body;
  try {
    await transporter.sendMail({
      from: '"Control de Ausencias 2026" <v.rivera@windmarhome.com>',
      to: 'v.rivera@windmarhome.com',
      subject: '⚠️ Alerta: ' + empleado + ' - ' + ausencias + ' ausencias en ' + mes,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2e1065;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0">⚠️ Alerta de Ausencias</h2>
            <p style="color:#a78bfa;margin:5px 0 0">Windmar Field Operations 2026</p>
          </div>
          <div style="background:#f5f3ff;padding:20px;border-radius:0 0 8px 8px;border:1px solid #ddd6fe">
            <p style="font-size:16px;color:#2e1065"><strong>${empleado}</strong> ha alcanzado <strong style="color:#e24b4a">${ausencias} ausencias</strong> en ${mes}.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:15px">
              <tr><td style="padding:8px;background:#fff;border:1px solid #ddd6fe;color:#64748b">Empleado</td><td style="padding:8px;background:#fff;border:1px solid #ddd6fe;font-weight:600">${empleado}</td></tr>
              <tr><td style="padding:8px;background:#f9fafb;border:1px solid #ddd6fe;color:#64748b">Supervisor</td><td style="padding:8px;background:#f9fafb;border:1px solid #ddd6fe">${supervisor||'--'}</td></tr>
              <tr><td style="padding:8px;background:#fff;border:1px solid #ddd6fe;color:#64748b">Ausencias en ${mes}</td><td style="padding:8px;background:#fff;border:1px solid #ddd6fe;font-weight:600;color:#e24b4a">${ausencias}</td></tr>
            </table>
            <p style="margin-top:15px;font-size:12px;color:#94a3b8">Este es un mensaje automático del sistema Control de Ausencias 2026.</p>
          </div>
        </div>
      `
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('Servidor v3 corriendo en puerto ' + PORT); });
