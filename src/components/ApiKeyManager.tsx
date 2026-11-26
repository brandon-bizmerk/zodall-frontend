'use client';

import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, ShieldCheck, Loader2, RotateCw, Terminal, Info, Download, Puzzle } from 'lucide-react';
import { getApiKeyStatusApi, generateApiKeyApi, getPluginDownloadApi, BACKEND_URL } from '@/lib/api';
import { safeExternalUrl } from '@/lib/safeUrl';
import { useTheme } from '@/context/ThemeContext';

const WP_PLUGIN_URL = process.env.NEXT_PUBLIC_WP_PLUGIN_URL || '';

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

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getApiKeyStatusApi();
      setHasApiKey(data.has_api_key);
      setPrefix(data.api_key_prefix);
      if (data.last_generated) setLastGenerated(data.last_generated);
    } catch (err: unknown) {
      setErrorMsg((err instanceof Error ? err.message : undefined) || 'Error al obtener el estado de la API Key');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
  }, []);

  // Pide a la API el enlace firmado (registra el tenant en zodall.com); si falla, usa el enlace fijo.
  const handlePluginDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    let url = WP_PLUGIN_URL;
    try {
      // Solo se sigue el enlace firmado si es https y del mismo host que el enlace fijo del plugin.
      url = safeExternalUrl((await getPluginDownloadApi()).url, [new URL(WP_PLUGIN_URL).hostname]) || WP_PLUGIN_URL;
    } catch {
      // Sin enlace firmado la descarga funciona igual, solo no queda registrada.
    }
    window.location.assign(url);
  };

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
    } catch (err: unknown) {
      setErrorMsg((err instanceof Error ? err.message : undefined) || 'Error al generar la API Key');
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
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5BE1E6] mb-3" />
        <p className="text-sm font-mono">Cargando credenciales de API...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[896px] mx-auto py-2">
      {/* Título de la Sección */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold font-heading text-[var(--color-text-main)] flex items-center gap-3">
          <Key className={`w-6 h-6 ${isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}`} />
          <span>Credenciales de Integración (API Key)</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Usa tu API Key secreta para autenticar las peticiones de tus aplicaciones y servidores hacia la API de Compliance.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* BANNER DE CLAVE RECIÉN GENERADA (Pantalla 03 de la Maqueta Zodall) */}
      {newRawKey && (
        <section
          className={`border-2 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 shadow-xl transition ${
            isDark
              ? 'border-[#10a674] bg-gradient-to-b from-[#0a2a2a] to-[#1d1f1f]'
              : 'border-[#0a8f5a] bg-gradient-to-b from-[#e1f5ee] to-[#ffffff]'
          }`}
        >
          <span
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
              isDark ? 'bg-[#0b3d36] text-[#10d98a]' : 'bg-[#c5eedd] text-[#0a8f5a]'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div className="flex-1 min-w-0">
            <div className={`text-base font-bold ${isDark ? 'text-[#2be39a]' : 'text-[#0a8f5a]'}`}>
              ¡Tu nueva API Key ha sido generada exitosamente!
            </div>
            <p className="my-2 text-xs leading-relaxed text-[var(--color-text-main)]">
              Guarda esta clave en un lugar seguro (archivo{' '}
              <code
                className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                  isDark ? 'text-[#10d98a] bg-[#06181c]' : 'text-[#0a8f5a] bg-[#d5f3e6]'
                }`}
              >
                .env
              </code>{' '}
              de tu servidor). <b>Por estrictas políticas de ciberseguridad, esta clave NUNCA más se mostrará completa.</b>
            </p>

            <div className="flex items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] rounded-xl p-3 flex-wrap mt-3">
              <span className="font-mono text-sm font-semibold text-[#10d98a] break-all select-all">
                {newRawKey}
              </span>
              <button
                onClick={() => handleCopy(newRawKey)}
                className="font-mono text-xs font-bold text-[#181919] bg-[#5BE1E6] hover:bg-[#19BFB7] rounded-lg px-4 py-2 transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <span>⧉</span>}
                <span>{copied ? '¡Copiada!' : 'Copiar Clave'}</span>
              </button>
            </div>

            <div className="text-right mt-3">
              <button
                onClick={() => setNewRawKey(null)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] underline transition"
              >
                Ya la guardé de forma segura, ocultar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TARJETA DE ESTADO DE LA API KEY (Pantalla 02) */}
      <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <b className="text-sm text-[var(--color-text-main)]">API Key Principal de Producción</b>
              {hasApiKey ? (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? 'text-[#10d98a] bg-[#06251f] border-[#0d4a3a]'
                      : 'text-[#0a8f5a] bg-[#e1f5ee] border-[#a8dfc9]'
                  }`}
                >
                  ● Activa
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/30">
                  Sin Generar
                </span>
              )}
            </div>

            <div className="font-mono text-xs text-[var(--color-text-faint)] mt-2.5 break-all">
              Prefijo Identificador:{' '}
              <b className="text-[var(--color-text-main)] font-semibold inline-block">
                {prefix ? `${prefix}••••••••` : 'No asignado'}
              </b>
            </div>

            <div className="text-[11px] text-[var(--color-text-faint)] mt-2">
              Última actualización: {lastGenerated ? new Date(lastGenerated).toLocaleString('es-CO') : 'Nunca'}
            </div>
          </div>

          <div className="w-full sm:w-auto">
            {hasApiKey ? (
              <button
                onClick={() => setShowRotateConfirm(true)}
                disabled={actionLoading}
                className={`w-full sm:w-auto text-xs font-bold rounded-lg px-4 py-2.5 transition border flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'text-white bg-[#262929] border-[#3a3d3d] hover:bg-[#323636]'
                    : 'text-[#181919] bg-[#eaf0f0] border-[#cfd8d8] hover:bg-[#dfe6e6]'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotar / Regenerar Clave</span>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs font-bold text-[#181919] bg-[#5BE1E6] hover:bg-[#19BFB7] rounded-lg px-4 py-2.5 transition shadow-[0_0_16px_rgba(91,225,230,0.3)] text-center"
              >
                {actionLoading ? 'Generando...' : 'Generar API Key'}
              </button>
            )}
          </div>
        </div>

        {/* Modal de confirmación para rotar */}
        {showRotateConfirm && (
          <div className="mt-5 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-[var(--color-text-main)] space-y-3">
            <p className="font-semibold text-amber-400">
              ⚠️ ¿Estás seguro de que deseas rotar la API Key de producción?
            </p>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              La clave actual dejará de funcionar de forma inmediata. Cualquier aplicación, microservicio o cron que la esté utilizando perderá acceso hasta que actualices su variable de entorno.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowRotateConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
              >
                {actionLoading ? 'Rotando...' : 'Sí, revocar y generar nueva'}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--color-border)] my-6" />

        {/* Callout Informativo */}
        <div
          className={`flex gap-3 border rounded-xl p-4 text-xs leading-relaxed ${
            isDark
              ? 'border-[#1f5456] bg-[#12292b] text-[#f2f6f6]'
              : 'border-[#9ddfe2] bg-[#e0f6f7] text-[#181919]'
          }`}
        >
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}`} />
          <span>
            La clave secreta completa solo se mostró al momento de su creación. Si la extraviaste o consideras que se ha visto comprometida, utiliza el botón de <b>Rotar Clave</b> para revocarla de inmediato y generar una nueva.
          </span>
        </div>
      </section>

      {/* INSTRUCCIONES DE INTEGRACIÓN / CURL (Pantalla 02) */}
      <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6">
        <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--color-text-main)]">
          <Terminal className={`w-4 h-4 ${isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}`} />
          <span>¿Cómo consumir la API con tu clave?</span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-4 mb-4">
          Debes incluir tu API Key en la cabecera HTTP{' '}
          <code
            className={`font-mono rounded px-2 py-0.5 mx-1 ${
              isDark ? 'text-[#87e9ed] bg-[#181919]' : 'text-[#0b8a86] bg-[#dfe6e6]'
            }`}
          >
            x-api-key
          </code>{' '}
          de cada solicitud enviada al servidor:
        </p>

        <pre className="m-0 border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] rounded-xl p-4 font-mono text-xs leading-relaxed text-[var(--color-text-main)] overflow-x-auto">
          <span className="text-[var(--color-text-faint)]">{'// Ejemplo cURL hacia el endpoint oficial de producción:'}</span>
          {'\n'}curl -X POST https://api.zodall.app/api/v1/compliance/verify \{'\n'}
          {'  '}<span className="text-[#5BE1E6]">-H &quot;Content-Type: application/json&quot;</span> \{'\n'}
          {'  '}<span className="text-[#10d98a]">-H &quot;x-api-key: {prefix || 'rtk_live_...'}&quot;</span> \{'\n'}
          {'  '}<span className="text-[#f5b50a]">-d &apos;{"{"}&quot;queried_name&quot;:&quot;Nicolas Maduro&quot;,&quot;queried_document&quot;:&quot;123456789&quot;{"}"}&apos;</span>
        </pre>
      </section>

      {/* PLUGIN DE WORDPRESS (solo si NEXT_PUBLIC_WP_PLUGIN_URL está definida) */}
      {WP_PLUGIN_URL && (
        <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--color-text-main)]">
              <Puzzle className={`w-4 h-4 ${isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}`} />
              <span>Plugin de WordPress</span>
            </div>
            <a
              href={WP_PLUGIN_URL}
              download
              onClick={handlePluginDownload}
              className="w-full sm:w-auto text-xs font-bold text-[#181919] bg-[#5BE1E6] hover:bg-[#19BFB7] rounded-lg px-4 py-2.5 transition shadow-[0_0_16px_rgba(91,225,230,0.3)] flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar plugin</span>
            </a>
          </div>
          <ol className="mt-4 space-y-2 text-xs text-[var(--color-text-muted)] list-decimal list-inside">
            <li>En WordPress: <b className="text-[var(--color-text-main)]">Plugins → Añadir nuevo → Subir plugin</b>.</li>
            <li>Activa el plugin.</li>
            <li>Pega tu API Key en <b className="text-[var(--color-text-main)]">Ajustes de Zodall</b>.</li>
          </ol>
        </section>
      )}
    </div>
  );
}
