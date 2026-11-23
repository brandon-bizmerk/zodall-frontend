'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Building,
  Clock,
  Zap,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  FileDown,
} from 'lucide-react';
import {
  getAdminAuditLogsApi,
  downloadFilteredAuditLogsPdf,
  downloadIndividualCertificatePdf,
} from '@/lib/api';
import { AdminAuditLogItem } from '@/types/auth';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [matchOnly, setMatchOnly] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [exportingReport, setExportingReport] = useState(false);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const res = await getAdminAuditLogsApi({
        limit: pageSize,
        offset,
        search: search.trim() || undefined,
        match_only: matchOnly,
      });
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Error cargando logs globales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, matchOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportFilteredPdf = async () => {
    setExportingReport(true);
    try {
      await downloadFilteredAuditLogsPdf({
        search: search.trim() || undefined,
        match_only: matchOnly,
      });
    } catch (err: any) {
      alert(err.message || 'Error al exportar reporte PDF.');
    } finally {
      setExportingReport(false);
    }
  };

  const handleDownloadCertificate = async (log: AdminAuditLogItem) => {
    setDownloadingCertId(log.id);
    try {
      await downloadIndividualCertificatePdf(log.id, log.queried_document);
    } catch (err: any) {
      alert(err.message || 'Error al descargar el certificado individual.');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)]">
              Auditoría Global de Logs (SAGRILAFT / OFAC)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Supervisión inmutable de todas las verificaciones procesadas a través de la API para todas las empresas integradas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Botón Exportar PDF de Reporte Filtrado */}
          <button
            onClick={handleExportFilteredPdf}
            disabled={exportingReport || loading || total === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm disabled:opacity-50"
            title="Exportar listado según los filtros de búsqueda actuales"
          >
            {exportingReport ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{exportingReport ? 'Generando PDF...' : 'Exportar Filtros (PDF)'}</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula/NIT, referencia o empresa..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-main)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={matchOnly}
              onChange={(e) => {
                setMatchOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Solo Coincidencias (Alertas)</span>
          </label>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text-main)]"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-xs font-mono">Consultando registros auditables...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)] text-sm">
            No se registraron transacciones con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Persona / Empresa Consultada</th>
                  <th className="py-3 px-4">Dictamen</th>
                  <th className="py-3 px-4">Latencia</th>
                  <th className="py-3 px-4">Hash Integridad (SHA-256)</th>
                  <th className="py-3 px-4 text-right">Certificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-main)]">
                {logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('es-CO');
                  const isDownloadingCert = downloadingCertId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-[var(--color-bg-card-subtle)] transition">
                      <td className="py-3 px-4 text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-[var(--color-text-main)] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{log.tenant_name}</span>
                        </div>
                        {log.order_reference && (
                          <span className="text-[10px] text-[var(--color-text-faint)] font-mono">
                            Ref: {log.order_reference}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--color-text-main)]">{log.queried_name}</div>
                        <div className="text-xs text-[var(--color-text-faint)] font-mono">
                          Doc: {log.queried_document}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {log.match_found ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            ALERTA ({log.match_score}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            LIMPIO
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#5BE1E6]" />
                          {log.response_time_ms} ms
                        </span>
                        {log.served_from_cache && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-sans">
                            Cache
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-[var(--color-text-faint)] max-w-[130px] truncate" title={log.integrity_proof_hash}>
                            {log.integrity_proof_hash}
                          </span>
                          <a
                            href={`http://localhost:3001/api/v1/compliance/verify-proof/${log.integrity_proof_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300"
                            title="Verificar evidencia criptográfica pública"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Botón para Certificado Individual PDF */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownloadCertificate(log)}
                          disabled={isDownloadingCert}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition disabled:opacity-50"
                          title="Descargar Certificado Oficial de Evidencia SAGRILAFT (PDF)"
                        >
                          {isDownloadingCert ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span>Certificado</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>
            Mostrando {logs.length} de {total} registros
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
