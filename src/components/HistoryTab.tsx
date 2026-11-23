'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuditHistory } from '@/components/AuditHistory';
import { getQueryHistoryApi } from '@/lib/api';
import { QueryHistoryItem } from '@/types/compliance';

export function HistoryTab() {
  const [items, setItems] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQueryHistoryApi()
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Cargando historial de consultas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl text-xs font-medium border flex items-center gap-2 max-w-xl mx-auto bg-red-500/10 border-red-500/30 text-red-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
        <span>{error}</span>
      </div>
    );
  }

  return <AuditHistory history={items} />;
}
