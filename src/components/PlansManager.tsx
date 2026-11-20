'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowUpRight, Zap, Shield, Crown, Building2, Loader2, AlertCircle } from 'lucide-react';
import { getPlansApi, upgradePlanApi, ApiError } from '@/lib/api';
import { SubscriptionPlan } from '@/types/auth';

interface PlansManagerProps {
  currentPlanId: string;
  onPlanUpdated: () => void;
}

export function PlansManager({ currentPlanId, onPlanUpdated }: PlansManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlansApi();
      setPlans(data);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpgrade = async () => {
    if (!selectedPlanForUpgrade) return;
    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await upgradePlanApi(selectedPlanForUpgrade.id);
      setFeedbackMsg({ text: res.message, type: 'success' });
      setSelectedPlanForUpgrade(null);
      onPlanUpdated();
    } catch (err: any) {
      setFeedbackMsg({
        text: err instanceof ApiError ? err.message : 'Error al procesar el cambio de plan.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanIcon = (id: string) => {
    switch (id) {
      case 'free':
        return <Zap className="w-5 h-5 text-blue-400" />;
      case 'personal':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'pro':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'enterprise':
        return <Building2 className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Cargando catálogo de planes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Planes y Límites de Suscripción
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Escoge el volumen de consultas que mejor se adapte al tamaño y crecimiento de tu negocio.
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 max-w-xl mx-auto ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = currentPlanId.toLowerCase() === p.id.toLowerCase();
          const isPro = p.id.toLowerCase() === 'pro';

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'bg-gradient-to-b from-blue-900/40 to-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10'
                  : isPro
                  ? 'bg-slate-900/90 border border-amber-500/40 shadow-lg'
                  : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md uppercase tracking-wide">
                  Tu Plan Actual
                </div>
              )}

              {isPro && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md uppercase tracking-wide">
                  Más Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getPlanIcon(p.id)}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {p.query_limit.toLocaleString()} consultas/mes
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-white">
                    ${p.price_monthly}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ mes</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  {p.features?.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed"
                  >
                    Activo
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlanForUpgrade(p)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      isPro
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <span>Cambiar a {p.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CONFIRMACIÓN / SIMULACIÓN DE STRIPE */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Confirmar Mejora de Plan
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Estás a punto de actualizar tu cuenta al plan <strong>{selectedPlanForUpgrade.name}</strong> por{' '}
              <strong className="text-white">${selectedPlanForUpgrade.price_monthly} USD / mes</strong>.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Nuevo Límite Mensual:</span>
                <strong className="text-blue-400">{selectedPlanForUpgrade.query_limit.toLocaleString()} consultas</strong>
              </div>
              <div className="flex justify-between">
                <span>Facturación:</span>
                <span className="text-slate-400">Mensual</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              💳 <strong>Modo Sandbox / Simulación:</strong> Las claves de Stripe están en proceso de configuración. Este cambio actualizará tu cuota y plan en la base de datos de inmediato.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlanForUpgrade(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={actionLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Actualización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
