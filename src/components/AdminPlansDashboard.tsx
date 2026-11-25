'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Zap,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  Save,
  CreditCard,
  Building,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { getPlansApi, updatePlanAdminApi, ApiError } from '@/lib/api';
import { SubscriptionPlan } from '@/types/auth';
import { useTheme } from '@/context/ThemeContext';

export function AdminPlansDashboard() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de edición por plan
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const loadPlans = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getPlansApi();
      setPlans(data);
      if (data.length > 0 && !editingPlan) {
        setEditingPlan(JSON.parse(JSON.stringify(data[0])));
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Error al cargar catálogo de planes.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan)));
    setFeedback(null);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim() || !editingPlan) return;
    const currentFeatures = Array.isArray(editingPlan.features) ? editingPlan.features : [];
    setEditingPlan({
      ...editingPlan,
      features: [...currentFeatures, newFeatureText.trim()],
    });
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    const updated = [...editingPlan.features];
    updated.splice(index, 1);
    setEditingPlan({
      ...editingPlan,
      features: updated,
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setSavingPlanId(editingPlan.id);
    setFeedback(null);

    try {
      const res = await updatePlanAdminApi(editingPlan.id, {
        name: editingPlan.name.trim(),
        description: editingPlan.description?.trim(),
        price_monthly: Number(editingPlan.price_monthly),
        query_limit: Number(editingPlan.query_limit),
        features: Array.isArray(editingPlan.features) ? editingPlan.features : [],
      });

      setFeedback({
        type: 'success',
        text: res.message || 'Plan actualizado y sincronizado en Stripe exitosamente.',
      });

      // Recargar catálogo actualizado
      const updatedPlans = await getPlansApi();
      setPlans(updatedPlans);
      const reloaded = updatedPlans.find((p) => p.id === editingPlan.id);
      if (reloaded) {
        setEditingPlan(JSON.parse(JSON.stringify(reloaded)));
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Error al guardar cambios del plan.',
      });
    } finally {
      setSavingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#5BE1E6] mb-3" />
        <p className="text-sm font-mono">Cargando panel de gestión de planes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1152px] mx-auto py-2">
      {/* Banner Superior SuperAdmin */}
      <div className="border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-slate-900/60 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Panel Administrativo Zodall
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" /> Sincronización en Vivo con Stripe
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white mt-2">
            Gestión y Configuración de Planes de Suscripción
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Edita los nombres, precios, cuotas y características dinámicas de cada plan. Las modificaciones de precio y nombre actualizan automáticamente los productos y tarifas en Stripe sin interrumpir cobros.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Selector de Plan a la Izquierda y Formulario de Edición a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Tarjetas de Selección de Plan */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1">
            Planes Disponibles ({plans.length})
          </div>

          {plans.map((p) => {
            const isSelected = editingPlan?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPlan(p)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer ${
                  isSelected
                    ? 'border-[#5BE1E6] bg-[var(--color-bg-card)] shadow-lg shadow-[#5BE1E6]/10'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:border-[var(--color-border-subtle)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-[var(--color-text-main)] font-heading">
                    {p.name}
                  </span>
                  <span className="font-mono text-sm font-bold text-[#10d98a]">
                    ${Number(p.price_monthly).toFixed(2)}/m
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {Number(p.query_limit).toLocaleString()} consultas/mes
                </div>
                <div className="text-[11px] text-[var(--color-text-faint)] mt-1 flex items-center gap-2">
                  <span>{p.features?.length || 0} características</span>
                  {p.stripe_price_id ? (
                    <span className="font-mono text-[9px] text-[#5BE1E6] truncate max-w-[120px]">
                      {p.stripe_price_id}
                    </span>
                  ) : (
                    <span className="text-[9px] text-amber-400">Gratuito / Sin Stripe</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Columna Derecha: Formulario Editor del Plan Seleccionado */}
        {editingPlan && (
          <div className="lg:col-span-8 border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
              <div>
                <span className="text-[10px] font-mono text-[var(--color-text-faint)] uppercase">
                  Editando Plan ID: {editingPlan.id}
                </span>
                <h2 className="text-xl font-bold font-heading text-[var(--color-text-main)]">
                  Configuración de &quot;{editingPlan.name}&quot;
                </h2>
              </div>
              {editingPlan.stripe_price_id && (
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg">
                  Stripe: {editingPlan.stripe_price_id}
                </span>
              )}
            </div>

            <form onSubmit={handleSavePlan} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nombre del Plan */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-main)] mb-1.5">
                    Nombre del Plan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition"
                    required
                  />
                </div>

                {/* Precio Mensual (USD) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-main)] mb-1.5">
                    Precio Mensual (USD) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm text-[var(--color-text-faint)] font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPlan.price_monthly}
                      disabled={editingPlan.id === 'free'}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition disabled:opacity-50"
                      required
                    />
                  </div>
                  {editingPlan.id === 'free' && (
                    <span className="text-[10px] text-[var(--color-text-faint)] mt-1 block">
                      El plan gratuito no tiene costo mensual.
                    </span>
                  )}
                </div>

                {/* Límite de Consultas Mensuales */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-main)] mb-1.5">
                    Límite Mensual de Consultas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingPlan.query_limit}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, query_limit: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition"
                    required
                  />
                </div>

                {/* Descripción Corta */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-main)] mb-1.5">
                    Descripción del Plan
                  </label>
                  <input
                    type="text"
                    value={editingPlan.description || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    placeholder="Ej. Ideal para plataformas en crecimiento"
                    className="w-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition"
                  />
                </div>
              </div>

              {/* Sección Dinámica: Lista de Características (Features) */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-main)]">
                    Características Incluidas ({editingPlan.features?.length || 0})
                  </label>
                  <span className="text-[11px] text-[var(--color-text-faint)]">
                    El diseño se adapta automáticamente a cualquier cantidad
                  </span>
                </div>

                {/* Lista de Features Actuales */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(editingPlan.features || []).map((feat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-xs text-[var(--color-text-main)]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-3.5 h-3.5 text-[#10d98a] shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        title="Eliminar característica"
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-[var(--color-text-muted)] hover:text-rose-400 transition shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(editingPlan.features || []).length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-faint)]">
                      No hay características configuradas para este plan.
                    </div>
                  )}
                </div>

                {/* Input para Agregar Nueva Característica */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Escribe una nueva característica y presiona Agregar..."
                    className="flex-1 bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-xs text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[#5BE1E6] transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-main)] hover:border-[#5BE1E6] transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Botón de Guardado y Sincronización */}
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--color-text-faint)]">
                  {editingPlan.id !== 'free'
                    ? '⚡ Al guardar, se refrescará el precio y nombre en Stripe automáticamente.'
                    : '⚡ Plan gratuito: solo se actualiza en base de datos local.'}
                </span>

                <button
                  type="submit"
                  disabled={savingPlanId === editingPlan.id}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-[#181919] bg-[#5BE1E6] hover:bg-[#19BFB7] transition shadow-[0_0_16px_rgba(91,225,230,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPlanId === editingPlan.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sincronizando con Stripe...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar y Refrescar en Stripe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

