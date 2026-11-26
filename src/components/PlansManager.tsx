'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Zap, Shield, Crown, Building2, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPlansApi, upgradePlanApi, createStripeCheckoutSessionApi, ApiError } from '@/lib/api';
import { safeExternalUrl } from '@/lib/safeUrl';
import { SubscriptionPlan } from '@/types/auth';
import { useTheme } from '@/context/ThemeContext';

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

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Configuración de los 4 planes según la maqueta de Zodall
  const mockPlanMeta: Record<
    string,
    {
      icon: React.ReactNode;
      desc: string;
      features: string[];
      badge?: string;
      isPopular?: boolean;
    }
  > = {
    free: {
      icon: <Zap className="w-4 h-4 text-[#5BE1E6]" />,
      desc: 'Ideal para pruebas, prototipado y validación de integración.',
      features: [
        '250 consultas / mes',
        'SLA de 400ms Fail-Open',
        'Filtro OFAC, ONU y Colombia',
        'Auditoría criptográfica SHA-256',
        'Soporte comunitario',
      ],
    },
    personal: {
      icon: <Shield className="w-4 h-4 text-[#10d98a]" />,
      desc: 'Para pequeños comercios y negocios en fase inicial de operaciones.',
      features: [
        '2,500 consultas / mes',
        'Caché acelerada en Redis (<2ms)',
        'Soporte por email 24/5',
        'Exportación de auditorías en CSV',
        '99.5% SLA Garantizado',
      ],
    },
    pro: {
      icon: <Crown className="w-4 h-4 text-[#19BFB7]" />,
      desc: 'Para plataformas e-commerce medianas, pasarelas de pago y fintechs.',
      isPopular: true,
      badge: 'MÁS POPULAR',
      features: [
        '20,000 consultas / mes',
        'Caché ultrarrápida en Redis',
        'Filtros Fuzzy con similitud trigram',
        'Soporte prioritario 24/7',
        '99.9% SLA de Alta Disponibilidad',
      ],
    },
    enterprise: {
      icon: <Building2 className="w-4 h-4 text-[#87e9ed]" />,
      desc: 'Para corporaciones e instituciones financieras de gran volumen transaccional.',
      features: [
        '100,000 consultas / mes (escalable)',
        'Endpoints dedicados y Webhooks',
        'Monitoreo continuo de listas PEPs',
        'Gerente de cuenta dedicado',
        '99.99% SLA Misión Crítica',
      ],
    },
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlansApi();
      setPlans(data);
    } catch (err: unknown) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans();
  }, []);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      // Para planes de pago, redirigir a Stripe Checkout
      if (Number(plan.price_monthly) > 0) {
        setFeedbackMsg({ text: 'Iniciando pasarela de pago segura con Stripe...', type: 'success' });
        const { url } = await createStripeCheckoutSessionApi(plan.id);
        const checkoutUrl = safeExternalUrl(url, ['checkout.stripe.com']);
        if (!checkoutUrl) throw new Error('El servidor no devolvió una URL de pago válida.');
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = checkoutUrl;
        return;
      }

      // Si es plan Free
      const res = await upgradePlanApi(plan.id);
      setFeedbackMsg({ text: res.message, type: 'success' });
      setSelectedPlanForUpgrade(null);
      onPlanUpdated();
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof ApiError ? err.message : 'Error al procesar el cambio de plan.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5BE1E6] mb-3" />
        <p className="text-sm font-mono">Cargando catálogo de planes...</p>
      </div>
    );
  }

  // Si la API no retorna planes aún, mostrar lista por defecto
  const displayPlans: SubscriptionPlan[] =
    plans.length > 0
      ? plans
      : [
          { id: 'free', name: 'Free', price_monthly: 0, query_limit: 250, description: 'Plan Gratuito', features: [] },
          { id: 'personal', name: 'Personal', price_monthly: 19, query_limit: 2500, description: 'Plan Personal', features: [] },
          { id: 'pro', name: 'Pro', price_monthly: 79, query_limit: 20000, description: 'Plan Pro', features: [] },
          { id: 'enterprise', name: 'Enterprise', price_monthly: 299, query_limit: 100000, description: 'Plan Enterprise', features: [] },
        ];

  return (
    <div className="space-y-8 max-w-[1152px] mx-auto py-2">
      {/* Título de la Sección */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-[30px] font-bold font-heading text-[var(--color-text-main)]">
          Planes y Límites de Suscripción
        </h1>
        <p className="mt-2.5 text-sm text-[var(--color-text-muted)]">
          Escoge el volumen de consultas que mejor se adapte al tamaño y crecimiento de tu negocio.
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 max-w-xl mx-auto ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{feedbackMsg.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Grid de 4 Planes (Estilo exacto de Zodall) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {displayPlans.map((plan) => {
          const isCurrent = plan.id.toLowerCase() === (currentPlanId || 'free').toLowerCase();
          const meta = mockPlanMeta[plan.id.toLowerCase()] || {
            icon: 'ϟ',
            desc: plan.description || '',
            features: [],
          };

          // Priorizar características dinámicas provenientes de la base de datos
          const activeFeatures =
            Array.isArray(plan.features) && plan.features.length > 0
              ? plan.features
              : meta.features || [];

          // Determinación de bordes, fondo y shadows según el tema
          let borderClass = 'border border-[var(--color-border)]';
          let bgClass = 'bg-[var(--color-bg-card)]';
          let shadowClass = '';

          if (isCurrent) {
            borderClass = isDark ? 'border-2 border-[#5BE1E6]' : 'border-2 border-[#19BFB7]';
            bgClass = isDark
              ? 'bg-gradient-to-b from-[#123335] to-[#1d1f1f]'
              : 'bg-gradient-to-b from-[#e4f8f9] to-[#ffffff]';
            shadowClass = isDark ? 'shadow-[0_0_28px_rgba(91,225,230,0.25)]' : 'shadow-[0_0_28px_rgba(25,191,183,0.2)]';
          } else if (meta.isPopular) {
            borderClass = 'border border-[#19BFB7]';
          }

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 transition-all ${borderClass} ${bgClass} ${shadowClass}`}
            >
              {/* Badge Superior */}
              {isCurrent ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide text-[#181919] bg-[#5BE1E6] rounded-full px-3 py-0.5 whitespace-nowrap shadow-sm">
                  TU PLAN ACTUAL
                </span>
              ) : meta.isPopular ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide text-[#181919] bg-[#28e3da] rounded-full px-3 py-0.5 whitespace-nowrap shadow-sm">
                  {meta.badge}
                </span>
              ) : null}

              {/* Icono + Quota */}
              <div className="flex justify-between items-center">
                <span className="w-9 h-9 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-center">
                  {meta.icon}
                </span>
                <b className="font-mono text-xs text-[var(--color-text-faint)]">
                  {Number(plan.query_limit || 0).toLocaleString()} consultas/mes
                </b>
              </div>

              {/* Nombre del Plan */}
              <div className="text-xl font-bold font-heading text-[var(--color-text-main)] mt-5">
                {plan.name}
              </div>

              {/* Descripción */}
              <p className="text-xs leading-relaxed text-[var(--color-text-muted)] mt-2 min-h-[48px]">
                {meta.desc}
              </p>

              {/* Precio */}
              <div className="my-4 text-[var(--color-text-main)]">
                <b className="text-3xl font-heading font-bold">
                  ${(Number(plan.price_monthly) || 0).toFixed(2)}
                </b>{' '}
                <span className="text-xs text-[var(--color-text-muted)]">/ mes</span>
              </div>

              {/* Lista de Features Dinámicas y Adaptables */}
              <ul className="list-none m-0 pt-4 border-t border-[var(--color-border)] flex flex-col gap-2.5 flex-1 text-xs text-[var(--color-text-main)] min-h-[160px]">
                {activeFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className={isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}>✓</span>
                    <span className="leading-tight break-words">{feat}</span>
                  </li>
                ))}
                {activeFeatures.length === 0 && (
                  <li className="text-[11px] text-[var(--color-text-faint)] italic">
                    Sin características adicionales.
                  </li>
                )}
              </ul>

              {/* Botón de Acción */}
              <div className="border-t border-[var(--color-border)] mt-5 pt-4">
                {isCurrent ? (
                  <button
                    disabled
                    className={`w-full py-2.5 rounded-lg text-xs font-bold ${
                      isDark ? 'bg-[#262929] text-[#8a9494]' : 'bg-[#e3e9e9] text-[#5b6666]'
                    }`}
                  >
                    Activo
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={actionLoading}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold text-[#181919] transition shadow-sm ${
                      meta.isPopular
                        ? 'bg-gradient-to-r from-[#19BFB7] to-[#3CFFF4] hover:opacity-90'
                        : 'bg-[#5BE1E6] hover:bg-[#19BFB7]'
                    }`}
                  >
                    {actionLoading ? 'Actualizando...' : `Cambiar a ${plan.name} ↗`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
