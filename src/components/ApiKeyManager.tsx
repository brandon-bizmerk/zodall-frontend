'use client';

import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, AlertTriangle, RefreshCw, ShieldCheck, Terminal, Code2, Loader2, Info } from 'lucide-react';
import { getApiKeyStatusApi, generateApiKeyApi, BACKEND_URL } from '@/lib/api';

export interface ApiKeyManagerProps {
  onApiKeyGenerated?: (prefix: string) => void;
}

export function ApiKeyManager({ onApiKeyGenerated }: ApiKeyManagerProps = {}) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [prefix, setPrefix] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  // Raw key returned only once upon generation
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getApiKeyStatusApi();
      setHasApiKey(data.has_api_key);
      setPrefix(data.api_key_prefix);
      if (data.last_generated) setLastGenerated(data.last_generated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al obtener el estado de la API Key');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await generateApiKeyApi();
      setNewRawKey(res.api_key);
      setPrefix(res.api_key_prefix);
      setHasApiKey(true);
      setShowRotateConfirm(false);
      onApiKeyGenerated?.(res.api_key_prefix);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar la API Key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Cargando credenciales de API...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Key className="w-6 h-6 text-blue-400" />
          Credenciales de Integración (API Key)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Usa tu API Key secreta para autenticar las peticiones de tus aplicaciones y servidores hacia la API de Compliance.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* MODAL / BANNER DE CLAVE RECIÉN GENERADA (SE MUESTRA UNA ÚNICA VEZ) */}
      {newRawKey && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/60 p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-300">
                ¡Tu nueva API Key ha sido generada exitosamente!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Guarda esta clave en un lugar seguro (archivo <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">.env</code> de tu servidor).{' '}
                <strong className="text-white">Por estrictas políticas de ciberseguridad, esta clave NUNCA más se mostrará completa.</strong>
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/90 border border-emerald-500/40 rounded-xl p-2.5 font-mono text-sm text-emerald-200">
                <span className="flex-1 select-all break-all px-2 py-1">{newRawKey}</span>
                <button
                  onClick={() => handleCopy(newRawKey)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Clave</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setNewRawKey(null)}
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
                >
                  Ya la guardé de forma segura, ocultar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO DE LA API KEY */}
      {!hasApiKey ? (
        // Estado: Aún no tiene clave
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-8 text-center backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Key className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Aún no has generado una API Key</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Para que tu tienda en línea o sistema pueda realizar consultas automáticas contra las listas restrictivas, necesitas generar tu primera clave secreta.
          </p>
          <div className="mt-6">
            <button
              onClick={handleGenerate}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-xl shadow-blue-500/25 transition disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              <span>Generar API Key</span>
            </button>
          </div>
        </div>
      ) : (
        // Estado: Ya tiene clave activa
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-white">API Key Principal de Producción</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Activa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Prefijo Identificador: <strong className="text-slate-200">{prefix}••••••••••••••••</strong>
              </p>
              {lastGenerated && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Última actualización: {new Date(lastGenerated).toLocaleString('es-CO')}
                </p>
              )}
            </div>

            <div>
              {!showRotateConfirm ? (
                <button
                  onClick={() => setShowRotateConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotar / Regenerar Clave</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirmar Rotación</span>
                  </button>
                  <button
                    onClick={() => setShowRotateConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              La clave secreta completa solo se mostró al momento de su creación. Si la extraviaste o consideras que se ha visto comprometida, utiliza el botón de <strong>Rotar Clave</strong> para revocarla de inmediato y generar una nueva.
            </span>
          </div>
        </div>
      )}

      {/* GUÍA TÉCNICA RÁPIDA DE USO */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          ¿Cómo consumir la API con tu clave?
        </h3>
        <p className="text-xs text-slate-400">
          Debes incluir tu API Key en la cabecera HTTP <code className="text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded">x-api-key</code> de cada solicitud enviada al servidor:
        </p>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-1">
          <div className="text-slate-500">// Ejemplo cURL hacia tu servidor en producción:</div>
          <div>
            curl -X POST {BACKEND_URL}/compliance/verify \
          </div>
          <div className="text-blue-400 pl-4">
            -H &quot;Content-Type: application/json&quot; \
          </div>
          <div className="text-emerald-400 pl-4">
            -H &quot;x-api-key: {prefix ? `${prefix}...` : 'TU_API_KEY_AQUI'}&quot; \
          </div>
          <div className="text-amber-300 pl-4">
            -d &apos;{JSON.stringify({ queried_name: "Nombre Sujeto", queried_document: "123456789" })}&apos;
          </div>
        </div>
      </div>
    </div>
  );
}
