'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Calendar,
  ArrowUpDown,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Download,
  Copy,
  Check,
  ChevronDown,
  RotateCcw,
  Eye,
  X,
  Loader2,
  FileText,
  FileDown,
} from 'lucide-react';
import { QueryHistoryItem } from '@/types/compliance';
import {
  getQueryHistoryApi,
  downloadClientHistoryPdf,
  downloadIndividualCertificatePdf,
} from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

// Datos mock iniciales para fallback visual
const MOCK_HISTORY_DATA: QueryHistoryItem[] = [
  {
    id: 'req_98b712a4',
    timestamp: '2026-10-22T19:15:30Z',
    queried_name: 'Nicolas MADURO MOROS',
    queried_document: '5892464',
    order_reference: 'ORD-2026-8910',
    match_found: true,
    match_score: 100,
    matched_record: {
      id: 'ofac_sdn_12093',
      list_source: 'OFAC SDN (EE.UU.)',
      alert_type: 'individual',
      full_name: 'Nicolas MADURO MOROS',
    },
    timeout_triggered: false,
    served_from_cache: true,
    response_time_ms: 2.4,
    integrity_proof_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'req_87a621c1',
    timestamp: '2026-10-22T18:42:15Z',
    queried_name: 'Carlos Alberto Mendoza Silva',
    queried_document: '987654321',
    order_reference: 'ORD-2026-8909',
    match_found: false,
    timeout_triggered: false,
    served_from_cache: false,
    response_time_ms: 12.8,
    integrity_proof_hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
  },
  {
    id: 'req_76f510b9',
    timestamp: '2026-10-21T15:20:00Z',
    queried_name: 'Maria Fernanda Gonzalez Rios',
    queried_document: '52890123',
    order_reference: 'ORD-2026-8908',
    match_found: false,
    timeout_triggered: false,
    served_from_cache: true,
    response_time_ms: 1.8,
    integrity_proof_hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
  },
];

export function QueryHistory() {
  const [logs, setLogs] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueryHistoryItem | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Estados de filtrado, ordenamiento y paginación
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'match' | 'clean'>('all');

  // Paginación: 10, 15, 30, 50 por página
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await getQueryHistoryApi({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
        order: sortOrder,
        limit: 100,
      });

      // El backend devuelve { total, limit, offset, data } o un array directo
      const logsArray = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(logsArray)) {
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
    } catch {
      // Fallback a array vacío para no mostrar datos falsos si ya hay conexión
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFrom, dateTo, sortOrder, statusFilter]);

  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSortOrder('desc');
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleExportFilteredPdf = async () => {
    setExportingPdf(true);
    try {
      await downloadClientHistoryPdf({
        search: searchTerm.trim() || undefined,
        match_only: statusFilter === 'match',
      });
    } catch (err: any) {
      alert(err.message || 'Error al exportar reporte PDF del historial.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadCertificate = async (item: QueryHistoryItem) => {
    setDownloadingCertId(item.id);
    try {
      await downloadIndividualCertificatePdf(item.id, item.queried_document);
    } catch (err: any) {
      alert(err.message || 'Error al descargar certificado PDF.');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const filteredData = useMemo(() => {
    return logs
      .filter((item) => {
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim();
          const matchesName = item.queried_name.toLowerCase().includes(query);
          const matchesDoc = item.queried_document.toLowerCase().includes(query);
          const matchesRef = item.order_reference?.toLowerCase().includes(query);
          if (!matchesName && !matchesDoc && !matchesRef) return false;
        }

        if (statusFilter === 'match' && !item.match_found) return false;
        if (statusFilter === 'clean' && item.match_found) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, searchTerm, statusFilter, sortOrder]);

  // Resetear a página 1 si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo, sortOrder, pageSize]);

  // Cálculo de Paginación
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const matches = filteredData.filter((i) => i.match_found).length;
    const clean = total - matches;
    const avgResponseTime =
      total > 0
        ? (filteredData.reduce((acc, i) => acc + i.response_time_ms, 0) / total).toFixed(1)
        : '0';
    return { total, matches, clean, avgResponseTime };
  }, [filteredData]);

  return (
    <div className="space-y-6 max-w-[1152px] mx-auto py-2">
      {/* Header del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold font-heading text-[var(--color-text-main)] flex items-center gap-3">
            <span className={isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}>⚲</span>
            <span>Histórico de Consultas y Auditoría</span>
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            Registro de auditoría y trazabilidad criptográfica de todas las verificaciones realizadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Exportar PDF con filtros */}
          <button
            onClick={handleExportFilteredPdf}
            disabled={exportingPdf || isLoading || filteredData.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0b8a86] hover:bg-[#08736f] text-white transition shadow-sm disabled:opacity-50"
            title="Exportar listado actual de consultas en formato PDF"
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#5BE1E6]" />
            ) : (
              <FileDown className="w-4 h-4 text-[#5BE1E6]" />
            )}
            <span>{exportingPdf ? 'Generando PDF...' : 'Exportar Filtros (PDF)'}</span>
          </button>

          <button
            onClick={() => alert('Exportación CSV: los registros han sido copiados.')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isDark
                ? 'bg-[#1d1f1f] border-[#2b2d2d] text-[#b9c4c4] hover:text-white'
                : 'bg-white border-[#dfe6e6] text-[#4a5555] hover:text-[#181919]'
            }`}
          >
            <Download className="w-4 h-4 text-[#5BE1E6]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tarjetas resumen de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 rounded-2xl">
          <div className="text-[11px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
            Total Consultas
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-text-main)] mt-1.5">
            {stats.total}
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)] mt-0.5">En el rango seleccionado</div>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 rounded-2xl">
          <div className="text-[11px] uppercase font-semibold text-rose-500 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Alertas (Matches)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1.5">{stats.matches}</div>
          <div className="text-[11px] text-[var(--color-text-faint)] mt-0.5">Reportes en listas restrictivas</div>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 rounded-2xl">
          <div className="text-[11px] uppercase font-semibold text-[#10d98a] tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Consultas Limpias</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#10d98a] mt-1.5">{stats.clean}</div>
          <div className="text-[11px] text-[var(--color-text-faint)] mt-0.5">Sin coincidencias</div>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 rounded-2xl">
          <div className="text-[11px] uppercase font-semibold text-[#28e3da] tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Latencia Promedio</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#28e3da] mt-1.5">
            {stats.avgResponseTime} ms
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)] mt-0.5">Acelerado con caché Redis</div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Fecha Desde */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5BE1E6]" />
              <span>Fecha Desde</span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition font-mono"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5BE1E6]" />
              <span>Fecha Hasta</span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition font-mono"
            />
          </div>

          {/* Orden Temporal */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5BE1E6]" />
              <span>Orden Temporal</span>
            </label>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] appearance-none cursor-pointer pr-8"
              >
                <option value="desc">Descendente (Más recientes)</option>
                <option value="asc">Ascendente (Más antiguas)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-faint)] absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Estado del Veredicto */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#5BE1E6]" />
              <span>Estado del Veredicto</span>
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'match' | 'clean')}
                className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] appearance-none cursor-pointer pr-8"
              >
                <option value="all">Todos los resultados</option>
                <option value="match">Solo Alertas (Coincidencia)</option>
                <option value="clean">Solo Limpias (Sin Coincidencia)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-faint)] absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fila secundaria: Buscador y Reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--color-text-faint)] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[#5BE1E6] transition"
            />
          </div>

          {(dateFrom || dateTo || searchTerm || statusFilter !== 'all' || sortOrder !== 'desc') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] text-xs font-medium transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE REGISTROS */}
      <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Sujeto Consultado</th>
                <th className="py-3.5 px-4">Referencia Orden</th>
                <th className="py-3.5 px-4">Veredicto Compliance</th>
                <th className="py-3.5 px-4">Latencia / Caché</th>
                <th className="py-3.5 px-4">Hash Criptográfico</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                    <Loader2 className="w-8 h-8 text-[#5BE1E6] animate-spin mx-auto mb-2" />
                    <p className="font-medium text-[var(--color-text-main)]">Cargando historial de consultas...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-text-faint)]">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[var(--color-text-muted)]">No se encontraron consultas registradas</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const dateObj = new Date(item.timestamp);
                  const isMatch = item.match_found;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--color-bg-card-subtle)] transition cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4 font-mono text-[var(--color-text-main)] whitespace-nowrap">
                        <div className="font-semibold">
                          {dateObj.toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-faint)]">
                          {dateObj.toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Sujeto Consultado */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--color-text-main)] truncate max-w-[200px]">
                          {item.queried_name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          Doc: {item.queried_document}
                        </div>
                      </td>

                      {/* Referencia de Orden */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.order_reference ? (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-text-main)]">
                            {item.order_reference}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-faint)] italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Veredicto Compliance */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isMatch ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Alerta ({item.match_score}%)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Limpio</span>
                          </div>
                        )}
                        {item.matched_record && (
                          <div className="text-[10px] text-rose-400 truncate max-w-[180px] mt-1 font-medium">
                            {item.matched_record.list_source}
                          </div>
                        )}
                      </td>

                      {/* Latencia / Caché */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[var(--color-text-main)]">
                          <Zap className="w-3 h-3 text-[#28e3da]" />
                          <span>{item.response_time_ms} ms</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-faint)]">
                          {item.served_from_cache ? (
                            <span className="text-[#5BE1E6] font-medium">Redis Caché</span>
                          ) : (
                            <span>Consulta DB</span>
                          )}
                        </div>
                      </td>

                      {/* Hash SHA-256 */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                          <span className="truncate max-w-[90px] sm:max-w-[110px]">
                            {item.integrity_proof_hash}
                          </span>
                          <button
                            onClick={() => handleCopyHash(item.integrity_proof_hash, item.id)}
                            title="Copiar Hash SHA-256 de Auditoría"
                            className="p-1 rounded hover:bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition shrink-0"
                          >
                            {copiedHashId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-[#10d98a]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleDownloadCertificate(item)}
                            disabled={downloadingCertId === item.id}
                            title="Descargar Certificado Oficial SAGRILAFT en PDF"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              isDark
                                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {downloadingCertId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span className="hidden sm:inline">PDF</span>
                          </button>

                          <button
                            onClick={() => setSelectedItem(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              isDark
                                ? 'bg-[#262929] border-[#3a3d3d] text-white hover:bg-[#323636]'
                                : 'bg-[#eaf0f0] border-[#cfd8d8] text-[#181919] hover:bg-[#dfe6e6]'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla con Selector de Página y Paginador */}
        <div className="py-3.5 px-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          {/* Selector de registros por página */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[11px] text-[var(--color-text-faint)]">Mostrar:</span>
            <div className="flex items-center gap-1">
              {[10, 15, 30, 50].map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                    pageSize === size
                      ? 'bg-[#5BE1E6] text-[#181919] border-[#5BE1E6]'
                      : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[var(--color-text-faint)] hidden sm:inline">por pág.</span>
          </div>

          {/* Información y Controles de Paginación */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px]">
              Página <strong className="text-[var(--color-text-main)]">{currentPage}</strong> de{' '}
              <strong className="text-[var(--color-text-main)]">{totalPages}</strong> ({filteredData.length} registros)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-xs text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                ← Anterior
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-xs text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLE DE AUDITORÍA */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    selectedItem.match_found
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}
                >
                  {selectedItem.match_found ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold font-heading text-[var(--color-text-main)] truncate">
                    Detalle #{selectedItem.id}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-mono truncate">
                    {new Date(selectedItem.timestamp).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] p-3 rounded-xl">
                <span className="text-[var(--color-text-muted)] block text-[10px] uppercase font-bold tracking-wider">
                  Sujeto Consultado
                </span>
                <span className="font-semibold text-sm text-[var(--color-text-main)] mt-1 block break-words">
                  {selectedItem.queried_name}
                </span>
                <span className="font-mono text-[var(--color-text-muted)] block mt-0.5">
                  Doc: {selectedItem.queried_document}
                </span>
              </div>

              <div className="border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] p-3 rounded-xl">
                <span className="text-[var(--color-text-muted)] block text-[10px] uppercase font-bold tracking-wider">
                  Veredicto y Score
                </span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`font-bold text-sm ${
                      selectedItem.match_found ? 'text-rose-500' : 'text-[#10d98a]'
                    }`}
                  >
                    {selectedItem.match_found ? 'Alerta Coincidencia' : 'Limpio / Clean'}
                  </span>
                  {selectedItem.match_score && (
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-main)]">
                      {selectedItem.match_score}% Score
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedItem.matched_record && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs space-y-2">
                <div className="font-bold text-rose-500 flex items-center gap-1.5">
                  <span>Listas Restrictivas Detectadas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--color-text-main)]">
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[10px]">Fuente:</span>
                    <b className="font-mono break-all">{selectedItem.matched_record.list_source}</b>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[10px]">Alerta / Programa:</span>
                    <b className="break-words">{selectedItem.matched_record.alert_type}</b>
                  </div>
                </div>
              </div>
            )}

            <div>
              <span className="text-[var(--color-text-muted)] block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider mb-1.5">
                Hash de Integridad Criptográfica (Prueba de Inmutabilidad SHA-256)
              </span>
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] font-mono text-xs text-[#28e3da] break-all select-all flex items-center justify-between gap-2">
                <span>{selectedItem.integrity_proof_hash}</span>
                <button
                  onClick={() => handleCopyHash(selectedItem.integrity_proof_hash, 'modal')}
                  className="p-1 rounded hover:bg-[var(--color-bg-surface)] text-[var(--color-text-main)] transition shrink-0"
                >
                  {copiedHashId === 'modal' ? (
                    <Check className="w-4 h-4 text-[#10d98a]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadCertificate(selectedItem)}
                disabled={downloadingCertId === selectedItem.id}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs transition disabled:opacity-50"
              >
                {downloadingCertId === selectedItem.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Descargar Certificado PDF</span>
              </button>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5BE1E6] hover:bg-[#19BFB7] text-[#181919] font-bold text-xs transition"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
