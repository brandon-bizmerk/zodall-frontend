// Pruebas de src/lib/csv.ts. Ejecutar: yarn test
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell, buildCsv, buildHistoryCsv, fetchAllHistory, formatLocalDateTime, localTzLabel } from '../src/lib/csv.ts';

test('escapa comillas, separador, comas y saltos de línea', () => {
  assert.equal(escapeCsvCell('a"b'), '"a""b"');
  assert.equal(escapeCsvCell('a;b'), '"a;b"');
  assert.equal(escapeCsvCell('a,b'), '"a,b"');
  assert.equal(escapeCsvCell('a\nb'), '"a\nb"');
  assert.equal(escapeCsvCell('simple'), 'simple');
  assert.equal(escapeCsvCell(null), '');
  assert.equal(escapeCsvCell(2.4), '2.4');
});

test('neutraliza inyección de fórmulas', () => {
  for (const c of ['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx']) {
    assert.ok(escapeCsvCell(c).replace(/^"/, '').startsWith("'"), c);
  }
  assert.equal(escapeCsvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  assert.equal(escapeCsvCell('a=b'), 'a=b');
});

test('buildCsv lleva BOM, separador ; y CRLF', () => {
  const csv = buildCsv(['A', 'B'], [['x', 'y']]);
  assert.equal(csv, '﻿A;B\r\nx;y\r\n');
});

test('buildHistoryCsv conserva acentos y columnas', () => {
  const csv = buildHistoryCsv([
    {
      id: '1', timestamp: '2026-10-22T19:15:30Z', queried_name: 'José Ñandú; "El" =Jefe',
      queried_document: '123', match_found: true, match_score: 100,
      matched_record: { list_source: 'OFAC' }, timeout_triggered: false,
      served_from_cache: false, response_time_ms: 2.4, integrity_proof_hash: 'abc',
    },
    {
      id: '2', timestamp: '2026-10-22T18:00:00Z', queried_name: 'Ana', queried_document: '9',
      match_found: false, timeout_triggered: false, served_from_cache: false,
      response_time_ms: 1, integrity_proof_hash: 'def',
    },
  ]);
  const lines = csv.split('\r\n');
  assert.ok(csv.startsWith(`\uFEFFFecha y hora (${localTzLabel()});Nombre consultado;`));
  assert.equal(lines[1], formatLocalDateTime('2026-10-22T19:15:30Z') + ';"José Ñandú; ""El"" =Jefe";123;;Alerta;100;OFAC;2.4;abc');
  assert.equal(lines[2], formatLocalDateTime('2026-10-22T18:00:00Z') + ';Ana;9;;Sin coincidencias;;;1;def');
});

test('fecha local AAAA-MM-DD HH:mm:ss y etiqueta de zona', () => {
  const d = new Date(2026, 9, 22, 19, 5, 9);
  assert.equal(formatLocalDateTime(d.toISOString()), '2026-10-22 19:05:09');
  assert.match(localTzLabel(), /^UTC[+-]\d{2}:\d{2}$/);
  assert.equal(formatLocalDateTime('no-fecha'), 'no-fecha');
});

const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

test('fetchAllHistory pagina 3 páginas y devuelve todas las filas', async () => {
  const calls = [];
  const r = await fetchAllHistory(async (offset, limit) => {
    calls.push([offset, limit]);
    return { total: 25, data: mk(Math.min(limit, 25 - offset)) };
  }, 10000, 10);
  assert.equal(r.rows.length, 25);
  assert.equal(r.truncated, false);
  assert.deepEqual(calls, [[0, 10], [10, 10], [20, 10]]);
});

test('fetchAllHistory respeta el tope y avisa de truncamiento', async () => {
  const r = await fetchAllHistory(async (offset, limit) => ({ total: 100, data: mk(Math.min(limit, 100 - offset)) }), 30, 10);
  assert.equal(r.rows.length, 30);
  assert.equal(r.truncated, true);
});

test('fetchAllHistory: exactamente el tope no es truncamiento', async () => {
  const r = await fetchAllHistory(async (offset, limit) => ({ data: mk(Math.max(0, Math.min(limit, 20 - offset))) }), 20, 10);
  assert.equal(r.rows.length, 20);
  assert.equal(r.truncated, false);
});
