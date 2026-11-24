'use client';

import React, { useState } from 'react';
import {
  History,
  ShieldAlert,
  ShieldCheck,
  Search,
  Download,
  Filter,
  Clock,
  Hash,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { QueryHistoryItem } from '@/types/compliance';

interface AuditHistoryProps {
  history: QueryHistoryItem[];
  onClearHistory?: () => void;
  onSelectQuery?: (item: QueryHistoryItem) => void;
}

export function AuditHistory({ history, onClearHistory, onSelectQuery }: AuditHistoryProps) {
  const [filterType, setFilterType] = useState<'all' | 'matches' | 'clean'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtrado de registros
  const filteredItems = history.filter((item) => {
    if (filterType === 'matches' && !item.match_found) return false;
    if (filterType === 'clean' && item.match_found) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.queried_name.toLowerCase().includes(q);
      const matchDoc = item.queried_document.toLowerCase().includes(q);
      const matchOrder = item.order_reference?.toLowerCase().includes(q);
      const matchHash = item.integrity_proof_hash.toLowerCase().includes(q);
      return matchName || matchDoc || matchOrder || matchHash;
    }
    return true;
  });

  const copyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `regtech_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCsv = () => {
    if (history.length === 0) return;
    const headers = ['Timestamp', 'Document', 'Name', 'Order_Ref', 'Match_Found', 'Match_Score', 'List_Source', 'Latency_ms', 'Integrity_Hash'];
    const rows = history.map((h) => [
      h.timestamp,
      `"${h.queried_document}"`,
      `"${h.queried_name}"`,
      `"${h.order_reference || ''}"`,
      h.match_found ? 'YES' : 'NO',
      h.match_score || '',
      h.matched_record?.list_source || '',
      h.response_time_ms,
      `"${h.integrity_proof_hash}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `regtech_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior con Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Trazabilidad y Registros de Auditoría
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Logs inmutables generados para cumplimiento de regulaciones bancarias y antilavado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Exportar CSV
          </button>
          <button
            onClick={exportToJson}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Exportar JSON
          </button>
          {history.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition"
              title="Limpiar historial"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, documento, orden o hash..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({history.length})
          </button>
          <button
            onClick={() => setFilterType('matches')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filterType === 'matches'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alertas ({history.filter(i => i.match_found).length})
          </button>
          <button
            onClick={() => setFilterType('clean')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filterType === 'clean'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Limpios ({history.filter(i => !i.match_found).length})
          </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No se encontraron registros de auditoría</p>
            <p className="text-xs text-slate-500">
              {history.length === 0
                ? 'Realiza una consulta desde la pestaña de Screening para ver los registros aquí.'
                : 'Ningún registro coincide con el filtro o término de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Sujeto / Documento</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Score & Lista</th>
                  <th className="py-3 px-4">Latencia</th>
                  <th className="py-3 px-4">Prueba Criptográfica (SHA-256)</th>
                  <th className="py-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onSelectQuery?.(item)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.match_found ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <ShieldAlert className="w-3 h-3" />
                          Sancionado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Limpio
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{item.queried_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Doc: {item.queried_document}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {item.order_reference || '—'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.match_found ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-rose-400">{item.match_score}%</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono px-1.5 py-0.2 rounded bg-slate-800">
                            {item.matched_record?.list_source || 'OFAC'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400">
                      {item.response_time_ms} ms
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-indigo-300 truncate max-w-[160px]">
                          {item.integrity_proof_hash}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyHash(item.id, item.integrity_proof_hash);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white transition"
                          title="Copiar hash de integridad"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap font-mono">
                      {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
