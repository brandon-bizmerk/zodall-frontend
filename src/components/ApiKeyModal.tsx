'use client';

import React, { useState } from 'react';
import { Key, ShieldAlert, Check, X, RotateCcw } from 'lucide-react';
import { DEFAULT_API_KEY } from '@/lib/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (newKey: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }: ApiKeyModalProps) {
  const [keyValue, setKeyValue] = useState(apiKey);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyValue.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setKeyValue(DEFAULT_API_KEY);
    onSaveApiKey(DEFAULT_API_KEY);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configuración de API Key</h3>
            <p className="text-xs text-slate-400">Autenticación por encabezado <code className="text-indigo-300">x-api-key</code></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              API Key Activa
            </label>
            <input
              type="text"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="rtk_live_..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono transition"
              required
            />
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex gap-3 text-xs text-amber-300/90 leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200">Seguridad Criptográfica:</span> En el backend, las API Keys nunca se almacenan en texto plano. Cada petición genera un hash SHA-256 que se valida contra la base de datos de tenants.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar clave Demo
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    Guardado
                  </>
                ) : (
                  'Guardar Clave'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
