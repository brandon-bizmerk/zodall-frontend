'use client';

import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Database,
  Hash,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  FileCheck,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { verifyCompliance, ApiError, DEFAULT_API_KEY } from '@/lib/api';
import { VerificationResult, QueryHistoryItem } from '@/types/compliance';

interface ComplianceVerificationProps {
  apiKey: string;
  onQuerySuccess: (item: QueryHistoryItem) => void;
  backendOnline: boolean | null;
}

export function ComplianceVerification({
  apiKey,
  onQuerySuccess,
  backendOnline,
}: ComplianceVerificationProps) {
  const [queriedName, setQueriedName] = useState('');
  const [queriedDocument, setQueriedDocument] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Casos de prueba preconfigurados
  const testCases = [
    {
      label: 'Caso Sancionado: Pablo Escobar (OFAC)',
      name: 'Pablo Emilio Escobar Gaviria',
      document: '123456789',
      order: 'ORD-TEST-OFAC-01',
      badge: 'Alerta Roja',
      badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
    },
    {
      label: 'Caso Limpio: Carlos Mendoza',
      name: 'Carlos Alberto Mendoza',
      document: '987654321',
      order: 'ORD-TEST-CLEAN-02',
      badge: 'Limpio',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    },
    {
      label: 'Búsqueda Fuzzy (Nombre con variación)',
      name: 'Pablo Escobar Gaviria',
      document: '999999999',
      order: 'ORD-TEST-FUZZY-03',
      badge: 'Fuzzy Match',
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    },
  ];

  const handleApplyTestCase = (tc: typeof testCases[0]) => {
    setQueriedName(tc.name);
    setQueriedDocument(tc.document);
    setOrderReference(tc.order);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queriedName.trim() || !queriedDocument.trim()) {
      setError('Por favor ingresa tanto el Nombre Completo como el Documento de Identidad.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyCompliance(
        {
          queried_name: queriedName,
          queried_document: queriedDocument,
          order_reference: orderReference || undefined,
        },
        apiKey || DEFAULT_API_KEY
      );

      setResult(data);

      // Registrar en el historial de auditoría
      onQuerySuccess({
        ...data,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        queried_name: queriedName,
        queried_document: queriedDocument,
        order_reference: orderReference || undefined,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al procesar la verificación.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Columna Izquierda: Formulario de Verificación */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              Verificación AML en Tiempo Real
            </h2>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              POST /api/v1/compliance/verify
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Consulta en milisegundos contra las listas sancionatorias internacionales de la OFAC (EE.UU.), ONU y listas restrictivas nacionales.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nombre Completo del Sujeto <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={queriedName}
                onChange={(e) => setQueriedName(e.target.value)}
                placeholder="Ej. Pablo Emilio Escobar Gaviria"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Documento de Identificación / Pasaporte <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={queriedDocument}
                onChange={(e) => setQueriedDocument(e.target.value)}
                placeholder="Ej. 123456789"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Referencia de Orden / ID de Transacción</span>
                <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
              </label>
              <input
                type="text"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                placeholder="Ej. ORD-2026-99124"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-rose-200">Error en la consulta</div>
                  <div>{error}</div>
                  {backendOnline === false && (
                    <div className="mt-2 text-[11px] text-rose-300/80 bg-rose-950/40 p-2 rounded border border-rose-800/40">
                      <strong>Tip:</strong> Inicia el backend en otra terminal con:
                      <code className="block mt-1 font-mono text-white bg-black/40 px-2 py-1 rounded">
                        cd ..\backend; npm run start:dev
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Escaneando Listas Restrictivas...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-indigo-200" />
                  <span>Ejecutar Verificación Normativa</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Acceso Rápido a Casos de Prueba */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Cargar Casos de Prueba Rápidos
            </div>
            <div className="space-y-2">
              {testCases.map((tc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTestCase(tc)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700 transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                      {tc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Doc: {tc.document}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tc.badgeColor}`}>
                    {tc.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Resultado & Certificado de Auditoría */}
      <div className="lg:col-span-7 space-y-6">
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 animate-pulse">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-base font-semibold text-white">Consultando Motor de RegTech...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Realizando coincidencia exacta por documento y búsqueda difusa (trigrama pg_trgm &gt; 85%) con fail-open timeout...
            </p>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400">
              <FileCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-300">Esperando Parámetros de Consulta</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ingresa los datos del sujeto a la izquierda o selecciona uno de los casos de prueba para emitir un veredicto de cumplimiento normativo.
              </p>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner Principal de Veredicto */}
            <div
              className={`rounded-2xl border p-6 shadow-xl relative overflow-hidden ${
                result.match_found
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-2xl ${
                      result.match_found
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {result.match_found ? (
                      <ShieldAlert className="w-8 h-8" />
                    ) : (
                      <ShieldCheck className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        result.match_found
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {result.match_found ? 'Alerta Crítica de Cumplimiento' : 'Verificación Exitosa'}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      {result.match_found
                        ? 'COINCIDENCIA EN LISTA SANCIONATORIA'
                        : 'SUJETO LIMPIO (CLEAN)'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {result.match_found
                        ? `El sujeto figura en bases de datos restrictivas de sanciones.`
                        : `No se encontraron coincidencias en las listas de sanciones analizadas.`}
                    </p>
                  </div>
                </div>

                {/* Score */}
                {result.match_score !== undefined && (
                  <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-center shrink-0">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Match Score
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        result.match_score >= 90
                          ? 'text-rose-400'
                          : result.match_score >= 80
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {result.match_score}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalle del Registro Coincidente si match_found es true */}
            {result.match_found && result.matched_record && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Registro Coincidente Identificado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Nombre en Registro
                    </span>
                    <span className="font-semibold text-white">
                      {result.matched_record.full_name}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Fuente de la Lista
                    </span>
                    <span className="font-bold text-rose-400 font-mono">
                      {result.matched_record.list_source}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      ID en Watchlist
                    </span>
                    <span className="text-slate-300 font-mono text-[11px] truncate block">
                      {result.matched_record.id}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Tipo de Alerta
                    </span>
                    <span className="text-slate-300">
                      {result.matched_record.alert_type || 'OFAC Specially Designated Nationals (SDN)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Métricas Técnicas y SLA del Backend */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Métricas Técnicas de Ejecución
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Latencia API
                  </span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {result.response_time_ms} ms
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
                  <Database className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Redis Cache
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      result.served_from_cache ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {result.served_from_cache ? 'HIT (24h TTL)' : 'MISS'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Fail-Open Timeout
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      result.timeout_triggered ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {result.timeout_triggered ? 'ACTIVADO (&gt;400ms)' : 'NO'}
                  </span>
                </div>
              </div>

              {/* Hash Criptográfico de Integridad (SHA-256) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <Hash className="w-4 h-4 text-indigo-400" />
                    Prueba de Integridad Criptográfica (SHA-256)
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.integrity_proof_hash)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-200 transition"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Hash</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                  {result.integrity_proof_hash}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Este hash certifica de forma inmutable ante auditores que la consulta fue realizada en esta fecha y con este resultado exacto, sin posibilidad de alteración posterior.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
