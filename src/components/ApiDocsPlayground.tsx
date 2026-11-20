'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Terminal,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { BACKEND_URL, DEFAULT_API_KEY } from '@/lib/api';

interface ApiDocsPlaygroundProps {
  apiKey: string;
}

export function ApiDocsPlayground({ apiKey }: ApiDocsPlaygroundProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const activeKey = apiKey || DEFAULT_API_KEY;

  const codeSnippets = {
    curl: `curl -X POST "${BACKEND_URL}/compliance/verify" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKey}" \\
  -d '{
    "queried_name": "Pablo Emilio Escobar Gaviria",
    "queried_document": "123456789",
    "order_reference": "ORD-2026-001"
  }'`,

    js: `// Node.js (v18+) o Browser Fetch
const response = await fetch("${BACKEND_URL}/compliance/verify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${activeKey}"
  },
  body: JSON.stringify({
    queried_name: "Pablo Emilio Escobar Gaviria",
    queried_document: "123456789",
    order_reference: "ORD-2026-001"
  })
});

const data = await response.json();
console.log("Resultado de cumplimiento:", data);
console.log("Prueba criptográfica SHA-256:", data.integrity_proof_hash);`,

    python: `import requests

url = "${BACKEND_URL}/compliance/verify"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${activeKey}"
}
payload = {
    "queried_name": "Pablo Emilio Escobar Gaviria",
    "queried_document": "123456789",
    "order_reference": "ORD-2026-001"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print("Match:", data.get("match_found"))
print("Integrity Proof:", data.get("integrity_proof_hash"))`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLanguage]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Documentación de Integración & API Playground</h2>
            <p className="text-xs text-slate-400">Especificación para conectar sistemas externos (e-commerce, pasarelas de pago, ERPs) a RegTech.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300">
            Base URL: <strong className="text-indigo-400">{BACKEND_URL}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300">
            Auth: <strong className="text-indigo-400">Header x-api-key</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300">
            Rate Limit: <strong className="text-indigo-400">100 req/min por IP</strong>
          </span>
        </div>
      </div>

      {/* Endpoint Principal */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-indigo-600 text-white">
              POST
            </span>
            <span className="font-mono text-sm font-semibold text-white">
              /compliance/verify
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Verificación de listas sancionatorias en tiempo real
          </span>
        </div>

        {/* Snippet de Código */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedLanguage('curl')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedLanguage === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setSelectedLanguage('js')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedLanguage === 'js' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                JavaScript / TypeScript
              </button>
              <button
                onClick={() => setSelectedLanguage('python')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedLanguage === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto leading-relaxed">
            {codeSnippets[selectedLanguage]}
          </pre>
        </div>

        {/* Tablas de Request & Response */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Parámetros Request */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cuerpo de la Solicitud (JSON Body)
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
              <div className="border-b border-slate-800/80 pb-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-indigo-400 font-semibold">queried_name</span>
                  <span className="text-rose-400 text-[11px]">Requerido (string)</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">Nombre completo del individuo o razón social a evaluar.</p>
              </div>

              <div className="border-b border-slate-800/80 pb-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-indigo-400 font-semibold">queried_document</span>
                  <span className="text-rose-400 text-[11px]">Requerido (string)</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">Número de cédula, pasaporte o documento de identificación fiscal.</p>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-indigo-400 font-semibold">order_reference</span>
                  <span className="text-slate-500 text-[11px]">Opcional (string)</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">ID interno de orden, cliente o ticket para vincular en auditoría.</p>
              </div>
            </div>
          </div>

          {/* Estructura Response */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Esquema de Respuesta (200 OK)
            </h3>
            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "match_found": true,
  "match_score": 100,
  "matched_record": {
    "id": "38ea6797-6945-4cc4-b520-361c888bb9d3",
    "list_source": "OFAC",
    "alert_type": null,
    "full_name": "Pablo Emilio Escobar Gaviria"
  },
  "timeout_triggered": false,
  "served_from_cache": false,
  "response_time_ms": 14,
  "integrity_proof_hash": "65d6797eb4941f..."
}`}
            </pre>
          </div>
        </div>

        {/* Códigos de Error */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Códigos de Estado HTTP y Respuestas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-mono font-bold text-emerald-400">200 OK</span>
              <p className="text-slate-400 mt-1">Consulta ejecutada correctamente con veredicto y prueba de hash.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-mono font-bold text-rose-400">401 Unauthorized</span>
              <p className="text-slate-400 mt-1">Falta o es inválido el encabezado <code className="text-indigo-300">x-api-key</code>.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-mono font-bold text-amber-400">402 Payment Required</span>
              <p className="text-slate-400 mt-1">Cuenta suspendida o con pagos pendientes en Stripe.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-mono font-bold text-purple-400">429 Too Many Req</span>
              <p className="text-slate-400 mt-1">Límite de consultas del plan superado o rate-limit activado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
