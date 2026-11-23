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
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
  LogIn,
  Key,
  CreditCard,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';
import {
  getAdminAuditLogsApi,
  downloadFilteredAuditLogsPdf,
  downloadIndividualCertificatePdf,
  getAdminEventLogsApi,
  EventLogItem,
} from '@/lib/api';
import { AdminAuditLogItem } from '@/types/auth';

type ActiveTab = 'compliance' | 'events';

// ─── Helpers para Event Logs ─────────────────────────────────────────────────

const EVENT_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  AUTH_EVENT:          { label: 'Login',        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',      icon: LogIn },
  API_KEY_EVENT:       { label: 'API Key',      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Key },
  SUBSCRIPTION_EVENT:  { label: 'Suscripción',  color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', icon: CreditCard },
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS:            'Inicio de sesión exitoso',
  API_KEY_GENERATED:        'API Key generada / rotada',
  SUBSCRIPTION_ACTIVATED:   'Suscripción activada (webhook)',
  SUBSCRIPTION_VERIFIED:    'Suscripción verificada (pago)',
};

// ─── Componente principal ────────────────────────────────────────────────────

export function AdminAuditLogs() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('compliance');

  // ── Estado de la pestaña Compliance ──
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [matchOnly, setMatchOnly] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [exportingReport, setExportingReport] = useState(false);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  // ── Estado de la pestaña Eventos ──
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsSearch, setEventsSearch] = useState('');
  const [eventsTypeFilter, setEventsTypeFilter] = useState('');
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(15);

  // ── Carga de Compliance logs ──
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

  // ── Carga de Event logs ──
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const offset = (eventsPage - 1) * eventsPageSize;
      const res = await getAdminEventLogsApi({
        limit: eventsPageSize,
        offset,
        search: eventsSearch.trim() || undefined,
        type: eventsTypeFilter || undefined,
      });
      setEvents(res.data);
      setEventsTotal(res.total);
    } catch (err) {
      console.error('Error cargando event logs:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compliance') fetchLogs();
  }, [page, pageSize, matchOnly, activeTab]);

  useEffect(() => {
    if (activeTab === 'events') fetchEvents();
  }, [eventsPage, eventsPageSize, eventsTypeFilter, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleEventsSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEventsPage(1);
    fetchEvents();
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
  const eventsTotalPages = Math.max(1, Math.ceil(eventsTotal / eventsPageSize));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)]">
              Auditoría Global de Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Supervisión inmutable de verificaciones SAGRILAFT/OFAC y eventos del sistema para todas las empresas.
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] w-fit">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'compliance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Consultas de Compliance
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'events'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Eventos del Sistema
        </button>
      </div>

      {/* ─── PESTAÑA COMPLIANCE ─────────────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <>
          {/* Acciones */}
          <div className="flex items-center gap-2.5 self-start">
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

          {/* Tabla de Compliance Logs */}
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
              <span>Mostrando {logs.length} de {total} registros</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono">Página {page} de {totalPages}</span>
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
        </>
      )}

      {/* ─── PESTAÑA EVENTOS DEL SISTEMA ────────────────────────────────────── */}
      {activeTab === 'events' && (
        <>
          {/* Cabecera de eventos */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {/* Badge leyenda */}
              {Object.entries(EVENT_LABELS).map(([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <span key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${meta.color}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                );
              })}
            </div>
            <button
              onClick={fetchEvents}
              disabled={eventsLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${eventsLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Filtros de eventos */}
          <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleEventsSearchSubmit} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={eventsSearch}
                  onChange={(e) => setEventsSearch(e.target.value)}
                  placeholder="Buscar por empresa, correo o acción..."
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

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Tipo:</span>
                <select
                  value={eventsTypeFilter}
                  onChange={(e) => {
                    setEventsTypeFilter(e.target.value);
                    setEventsPage(1);
                  }}
                  className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text-main)]"
                >
                  <option value="">Todos</option>
                  <option value="AUTH_EVENT">Login</option>
                  <option value="API_KEY_EVENT">API Key</option>
                  <option value="SUBSCRIPTION_EVENT">Suscripción</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Mostrar:</span>
                <select
                  value={eventsPageSize}
                  onChange={(e) => {
                    setEventsPageSize(Number(e.target.value));
                    setEventsPage(1);
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

          {/* Tabla de Event Logs */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-sm">
            {eventsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-xs font-mono">Cargando eventos del sistema...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-[var(--color-text-muted)] text-sm">
                No hay eventos registrados con los criterios seleccionados.
                <p className="text-xs mt-1 text-[var(--color-text-faint)]">
                  Los logins, generaciones de API Keys y suscripciones aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Acción</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-main)]">
                    {events.map((ev) => {
                      const dateStr = new Date(ev.created_at).toLocaleString('es-CO');
                      const evMeta = EVENT_LABELS[ev.type] || { label: ev.type, color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: Activity };
                      const EvIcon = evMeta.icon;
                      const actionLabel = ACTION_LABELS[ev.action] || ev.action;

                      return (
                        <tr key={ev.id} className="hover:bg-[var(--color-bg-card-subtle)] transition">
                          <td className="py-3 px-4 text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                            {dateStr}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${evMeta.color}`}>
                              <EvIcon className="w-3 h-3" />
                              {evMeta.label}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-xs text-[var(--color-text-main)] flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>{ev.tenant_name || '—'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-xs text-[var(--color-text-muted)]">
                            {ev.user_email || '—'}
                          </td>

                          <td className="py-3 px-4 text-xs font-medium text-[var(--color-text-main)]">
                            {actionLabel}
                          </td>

                          <td className="py-3 px-4">
                            {ev.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-rose-400">
                                <XCircle className="w-3.5 h-3.5" />
                                {ev.status}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[10px] font-mono text-[var(--color-text-faint)] max-w-[180px]">
                            {ev.metadata ? (
                              <span title={JSON.stringify(ev.metadata, null, 2)}>
                                {ev.type === 'SUBSCRIPTION_EVENT' && ev.metadata.plan_name && (
                                  <span className="text-violet-400 font-sans font-semibold text-xs">
                                    Plan: {ev.metadata.plan_name}
                                  </span>
                                )}
                                {ev.type === 'API_KEY_EVENT' && ev.metadata.api_key_prefix && (
                                  <span className="font-mono">{ev.metadata.api_key_prefix}…</span>
                                )}
                                {ev.type === 'AUTH_EVENT' && ev.metadata.role && (
                                  <span className="text-sky-400 font-sans text-xs">{ev.metadata.role}</span>
                                )}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginador eventos */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>Mostrando {events.length} de {eventsTotal} eventos</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                  disabled={eventsPage === 1 || eventsLoading}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono">Página {eventsPage} de {eventsTotalPages}</span>
                <button
                  onClick={() => setEventsPage((p) => Math.min(eventsTotalPages, p + 1))}
                  disabled={eventsPage >= eventsTotalPages || eventsLoading}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
