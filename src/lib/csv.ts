import type { QueryHistoryItem } from '../types/compliance';

const BOM = '﻿';
const SEPARATOR = ';';

/** Escapa una celda (RFC 4180) y neutraliza fórmulas de hoja de cálculo. */
export function escapeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) || text.includes(',') ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV con BOM UTF-8, separador `;` (Excel en español) y saltos CRLF. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(SEPARATOR));
  return BOM + lines.join('\r\n') + '\r\n';
}

const HISTORY_HEADERS = [
  'Fecha y hora',
  'Nombre consultado',
  'Documento/NIT',
  'Referencia',
  'Dictamen',
  'Score',
  'Lista',
  'Latencia (ms)',
  'Hash de integridad',
];

export function buildHistoryCsv(items: QueryHistoryItem[]): string {
  return buildCsv(
    HISTORY_HEADERS,
    items.map((i) => [
      i.timestamp,
      i.queried_name,
      i.queried_document,
      i.order_reference ?? '',
      i.match_found ? 'Alerta' : 'Sin coincidencias',
      i.match_found ? (i.match_score ?? '') : '',
      i.matched_record?.list_source ?? '',
      i.response_time_ms,
      i.integrity_proof_hash,
    ]),
  );
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
