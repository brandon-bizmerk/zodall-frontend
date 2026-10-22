'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CreditCard,
  Zap,
  ShieldCheck,
  Server,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Key,
} from 'lucide-react';
import { TenantInfo } from '@/types/auth';
import { getTenantMetricsApi } from '@/lib/api';

interface TenantMetricsProps {
  tenant: TenantInfo;
  onNavigateTab: (tab: 'metrics' | 'apikey' | 'plans') => void;
}

export function TenantMetrics({ tenant: initialTenant, onNavigateTab }: TenantMetricsProps) {
  const [tenant, setTenant] = useState<TenantInfo>(initialTenant);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTenant(initialTenant);
  }, [initialTenant]);

  const limit = tenant.query_limit || 250;
  const count = tenant.query_count || 0;
  const remaining = Math.max(0, limit - count);
  const usagePercentage = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Resumen Principal del Tenant */}
      <div className="bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-md shadow-xl">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-white">{tenant.company_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {tenant.account_status === 'ACTIVE' ? 'Cuenta Activa' : tenant.account_status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plan Actual: <strong className="text-blue-400">{tenant.plan_name || 'Free'}</strong>
              {tenant.price_monthly > 0 && <span> (${tenant.price_monthly} USD/mes)</span>} • {tenant.email}
            </p>
          </div>
        </div>

        {/* Barra de progreso de cuota */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 min-w-[280px]">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium">Consumo de Consultas</span>
            <span className="font-mono font-bold text-white">
              {count.toLocaleString()} / {limit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercentage > 85 ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${Math.max(5, usagePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
            <span>{usagePercentage}% consumido</span>
            <button
              onClick={() => onNavigateTab('plans')}
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
            >
              <span>Mejorar Plan</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI de Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Plan Activo</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white capitalize">{tenant.plan_name || 'Free'}</div>
          <p className="text-[11px] text-slate-500">{limit.toLocaleString()} consultas asignadas</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Consultas Disponibles</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {remaining.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Saldo restante de este mes</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">API Key</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono truncate">
            {tenant.has_api_key && tenant.api_key_prefix ? `${tenant.api_key_prefix}...` : 'Sin Generar'}
          </div>
          <p className="text-[11px] text-slate-500">
            {tenant.has_api_key ? 'Clave de producción activa' : 'Requiere generación manual'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">SLA de Respuesta</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">&lt; 15 ms</div>
          <p className="text-[11px] text-slate-500">Fail-Open garantizado a 400ms</p>
        </div>
      </div>

      {/* Accesos Directos a Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Módulo de API Key</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Genera tu clave secreta de producción, copia tu credencial o rótala si sospechas que fue expuesta.
            </p>
          </div>
          <div className="mt-5">
            <button
              onClick={() => onNavigateTab('apikey')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              <span>Ir a Módulo API Key</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Planes y Facturación</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consulta los límites de los planes Free, Personal, Pro y Enterprise. Aumenta tu volumen de consultas en cualquier momento.
            </p>
          </div>
          <div className="mt-5">
            <button
              onClick={() => onNavigateTab('plans')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-md shadow-blue-500/20"
            >
              <span>Ver Planes Disponibles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Estado de las Listas y Scrapers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Fuentes de Cumplimiento Monitoreadas en tu API
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">OFAC SDN List (EE.UU.)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 leading-relaxed">
              Sanciones financieras internacionales, narcotráfico y terrorismo global.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">ONU Lista Consolidada</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 leading-relaxed">
              Resoluciones del Consejo de Seguridad de las Naciones Unidas.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Colombia (PEPs y Órganos de Control)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 leading-relaxed">
              Inhabilidades de Procuraduría, Contraloría y antecedentes judiciales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
