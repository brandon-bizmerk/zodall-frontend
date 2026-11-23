'use client';

import React, { useState } from 'react';
import { ApiDocsPlayground } from '@/components/ApiDocsPlayground';
import { ComplianceVerification } from '@/components/ComplianceVerification';

interface DocsTabProps {
  backendOnline: boolean | null;
}

// La API key solo vive en memoria de este componente; nunca se guarda en storage.
export function DocsTab({ backendOnline }: DocsTabProps) {
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <label htmlFor="docs-api-key" className="block text-xs font-semibold text-slate-300 mb-2">
          Tu API key (opcional, solo en memoria)
        </label>
        <input
          id="docs-api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Pega tu API key para personalizar los ejemplos y probar una verificación"
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <p className="mt-2 text-[11px] text-slate-500">
          Sin clave, los ejemplos muestran TU_API_KEY. La clave no se guarda en el navegador.
        </p>
      </div>

      <ApiDocsPlayground apiKey={apiKey} />
      <ComplianceVerification apiKey={apiKey} onQuerySuccess={() => {}} backendOnline={backendOnline} />
    </div>
  );
}
