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

/** Zona horaria del navegador como `UTC-05:00`. */
export function localTzLabel(date: Date = new Date()): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** ISO -> `AAAA-MM-DD HH:mm:ss` en la zona del navegador (Excel lo reconoce y ordena). */
export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const EXPORT_PAGE_SIZE = 500;
export const EXPORT_MAX_ROWS = 10000;

type HistoryPage = { total?: number; data: QueryHistoryItem[] };

/** Recorre el historial por páginas (offset/limit) hasta agotarlo o llegar al tope. */
export async function fetchAllHistory(
  fetchPage: (offset: number, limit: number) => Promise<HistoryPage>,
  maxRows: number = EXPORT_MAX_ROWS,
  pageSize: number = EXPORT_PAGE_SIZE,
): Promise<{ rows: QueryHistoryItem[]; truncated: boolean }> {
  const rows: QueryHistoryItem[] = [];
  while (rows.length < maxRows) {
    const page = await fetchPage(rows.length, Math.min(pageSize, maxRows - rows.length));
    const data = Array.isArray(page?.data) ? page.data : [];
    rows.push(...data);
    if (data.length === 0 || (typeof page.total === 'number' && rows.length >= page.total)) {
      return { rows, truncated: false };
    }
  }
  const last = await fetchPage(rows.length, 1);
  return { rows, truncated: Array.isArray(last?.data) && last.data.length > 0 };
}

const HISTORY_HEADERS = [
  'Fecha y hora (TZ)',
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
    HISTORY_HEADERS.map((h) => h.replace('TZ', localTzLabel())),
    items.map((i) => [
      formatLocalDateTime(i.timestamp),
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
