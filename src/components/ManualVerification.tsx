'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, FileSearch, Loader2, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { verifyManualCompliance } from '@/lib/api';
import type { VerificationResult } from '@/types/compliance';

interface ManualVerificationProps {
  onQuerySuccess: () => void;
}

export function ManualVerification({ onQuerySuccess }: ManualVerificationProps) {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    data: VerificationResult;
    name: string;
    document: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanDocument = document.trim();
    if (!cleanName && !cleanDocument) {
      setResult(null);
      setError('Ingresa el nombre o el documento de la persona.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyManualCompliance({
        queried_name: cleanName,
        queried_document: cleanDocument,
      });
      setResult({ data, name: cleanName, document: cleanDocument });
      onQuerySuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo completar la consulta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const records = result?.data.matched_records?.length
    ? result.data.matched_records
    : result?.data.matched_record
      ? [result.data.matched_record]
      : [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold font-heading text-[var(--color-text-main)]">
          <Search className="w-6 h-6 text-[#19BFB7]" />
          Consultas manuales
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Busca una persona por su nombre, documento o ambos en las listas disponibles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-main)]">Datos de la persona</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Completa al menos uno de los campos.
            </p>
          </div>
          <div>
            <label htmlFor="manual-name" className="block mb-2 text-xs font-semibold text-[var(--color-text-main)]">
              Nombre completo
            </label>
            <input
              id="manual-name"
              type="text"
              autoComplete="off"
              maxLength={500}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              placeholder="Nombre y apellidos"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[#19BFB7] disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="manual-document" className="block mb-2 text-xs font-semibold text-[var(--color-text-main)]">
              Documento de identidad
            </label>
            <input
              id="manual-document"
              type="text"
              autoComplete="off"
              maxLength={100}
              value={document}
              onChange={(event) => setDocument(event.target.value)}
              disabled={loading}
              placeholder="Cédula, pasaporte o identificación"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[#19BFB7] disabled:opacity-60"
            />
          </div>
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
            Cada consulta utiliza el saldo de tu plan y queda registrada en el historial de tu empresa.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5BE1E6] px-4 py-3 text-sm font-bold text-[#181919] hover:bg-[#19BFB7] disabled:opacity-60 disabled:cursor-wait transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Consultando…' : 'Consultar persona'}
          </button>
          {error && (
            <div role="alert" className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div aria-live="polite" aria-busy={loading} className="lg:col-span-3 space-y-4">
          {loading && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-10 text-center text-[var(--color-text-muted)]">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#19BFB7]" />
              Consultando las listas disponibles…
            </div>
          )}
          {!loading && !result && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-10 text-center">
              <FileSearch className="w-10 h-10 mx-auto mb-4 text-[var(--color-text-faint)]" />
              <h2 className="font-semibold text-[var(--color-text-main)]">Resultado de la consulta</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Ingresa los datos de la persona para ver si existen coincidencias.
              </p>
            </div>
          )}
          {!loading && result && (
            <>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 sm:p-6 space-y-4">
                {result.data.timeout_triggered ? (
                  <div className="flex items-center gap-3 text-amber-500">
                    <AlertCircle className="w-7 h-7 shrink-0" />
                    <h2 className="text-lg font-bold">Consulta incompleta. Vuelve a intentarlo.</h2>
                  </div>
                ) : result.data.match_found ? (
                  <div className="flex items-center gap-3 text-red-500">
                    <ShieldAlert className="w-7 h-7 shrink-0" />
                    <h2 className="text-lg font-bold">Se encontraron coincidencias</h2>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-emerald-500">
                    <ShieldCheck className="w-7 h-7 shrink-0" />
                    <h2 className="text-lg font-bold">Sin coincidencias</h2>
                  </div>
                )}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">Nombre consultado</dt>
                    <dd className="mt-1 break-words text-[var(--color-text-main)]">{result.name || 'Sin especificar'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">Documento consultado</dt>
                    <dd className="mt-1 break-all text-[var(--color-text-main)]">{result.document || 'Sin especificar'}</dd>
                  </div>
                </dl>
                {!result.data.timeout_triggered && !result.data.match_found && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No se encontraron coincidencias en las listas consultadas.
                  </p>
                )}
                {result.data.match_found && result.data.match_score !== undefined && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Coincidencia principal <strong className="text-[var(--color-text-main)]">{result.data.match_score}%</strong>
                  </p>
                )}
              </div>

              {records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 space-y-2">
                  <h3 className="font-semibold text-[var(--color-text-main)]">{record.full_name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Fuente <span className="font-semibold text-[var(--color-text-main)]">{record.list_source}</span>
                  </p>
                  {record.description && (
                    <p className="text-sm whitespace-pre-wrap break-words text-[var(--color-text-muted)]">
                      {record.description}
                    </p>
                  )}
                </article>
              ))}

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Comprobante de la consulta en el historial
                </p>
                <p className="font-mono text-[11px] break-all text-[var(--color-text-main)]">{result.data.integrity_proof_hash}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
