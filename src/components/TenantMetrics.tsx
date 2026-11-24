'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Layers,
  Key,
  History,
  CheckCircle2,
  ArrowRight,
  Server,
  Layers3,
  Shield,
  Activity,
} from 'lucide-react';
import { TenantInfo } from '@/types/auth';
import { useTheme } from '@/context/ThemeContext';

interface TenantMetricsProps {
  tenant: TenantInfo;
  onNavigateTab: (tab: 'metrics' | 'apikey' | 'plans' | 'history') => void;
  onRefreshMetrics?: () => void;
}

export function TenantMetrics({ tenant: initialTenant, onNavigateTab, onRefreshMetrics }: TenantMetricsProps) {
  const [tenant, setTenant] = useState<TenantInfo>(initialTenant);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTenant(initialTenant);
  }, [initialTenant]);

  useEffect(() => {
    onRefreshMetrics?.();
  }, [onRefreshMetrics]);

  const limit = tenant.query_limit || 250;
  const count = tenant.query_count || 0;
  const remaining = Math.max(0, limit - count);
  const usagePercentage = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-[1152px] mx-auto py-2">
      {/* 1. Header Card Principal */}
      <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-[20px] p-5 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
          <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] bg-[#19BFB7] flex items-center justify-center text-white shadow-[0_0_20px_rgba(25,191,183,0.35)] shrink-0">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold font-heading text-[var(--color-text-main)] truncate">
                {tenant.company_name}
              </h1>
              <span
                className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border ${
                  isDark
                    ? 'text-[#10d98a] bg-[#06251f] border-[#0d4a3a]'
                    : 'text-[#0a8f5a] bg-[#e1f5ee] border-[#a8dfc9]'
                }`}
              >
                {tenant.account_status === 'ACTIVE' ? 'Cuenta Activa' : tenant.account_status}
              </span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
              Plan Actual:{' '}
              <b className={isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}>
                {tenant.plan_name || 'Free'}
              </b>{' '}
              • <span className="opacity-80">{tenant.email}</span>
            </div>
          </div>
        </div>

        {/* Indicador de Consumo */}
        <div className="w-full md:w-[280px] border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] rounded-xl p-4 box-border">
          <div className="flex justify-between items-center text-xs text-[var(--color-text-muted)]">
            <span>Consumo de Consultas</span>
            <b className="font-mono text-[var(--color-text-main)]">
              {count.toLocaleString()} / {limit.toLocaleString()}
            </b>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-border)] my-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#19BFB7] transition-all duration-500"
              style={{ width: `${Math.max(4, usagePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-[var(--color-text-faint)]">
            <span>{usagePercentage}% consumido</span>
            <button
              onClick={() => onNavigateTab('plans')}
              className={`font-bold hover:underline ${
                isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'
              }`}
            >
              Mejorar Plan →
            </button>
          </div>
        </div>
      </section>

      {/* 2. Grid de KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* KPI 1 */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-5">
          <div className="flex justify-between items-center text-xs tracking-wider text-[var(--color-text-muted)] font-semibold uppercase">
            <span>Plan Activo</span>
            <CreditCard className={`w-4 h-4 ${isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}`} />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--color-text-main)] my-3 capitalize">
            {tenant.plan_name || 'Free'}
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)]">
            {limit.toLocaleString()} consultas asignadas
          </div>
        </div>

        {/* KPI 2 */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-5">
          <div className="flex justify-between items-center text-xs tracking-wider text-[var(--color-text-muted)] font-semibold uppercase">
            <span>Consultas Disponibles</span>
            <Layers3 className="w-4 h-4 text-[#28e3da]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#10d98a] my-3">
            {remaining.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)]">
            Saldo restante de este mes
          </div>
        </div>

        {/* KPI 3 */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-5">
          <div className="flex justify-between items-center text-xs tracking-wider text-[var(--color-text-muted)] font-semibold uppercase">
            <span>API Key</span>
            <Key className="w-4 h-4 text-[#f5b50a]" />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--color-text-main)] my-3.5 truncate">
            {tenant.has_api_key && tenant.api_key_prefix
              ? `${tenant.api_key_prefix}••••••••`
              : 'Sin Generar'}
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)]">
            {tenant.has_api_key ? 'Clave de producción activa' : 'Requiere generación manual'}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-5">
          <div className="flex justify-between items-center text-xs tracking-wider text-[var(--color-text-muted)] font-semibold uppercase">
            <span>SLA de Respuesta</span>
            <Zap className="w-4 h-4 text-[#28e3da]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#28e3da] my-3">
            &lt; 15 ms
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)]">
            Fail-Open garantizado a 400ms
          </div>
        </div>
      </section>

      {/* 3. Accesos Directos a Módulos (Estilo Maqueta Zodall) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Historial */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono ${
                  isDark
                    ? 'bg-[#12292b] text-[#5BE1E6]'
                    : 'bg-[#e0f6f7] text-[#0b8a86]'
                }`}
              >
                <History className="w-4 h-4" />
              </span>
              <b className="text-base text-[var(--color-text-main)]">Histórico de Consultas</b>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-text-muted)] mt-4 mb-4">
              Consulta la trazabilidad, hashes criptográficos SHA-256 y veredictos de todas tus verificaciones.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('history')}
              className={`inline-block text-xs font-bold rounded-lg px-4 py-2.5 transition border ${
                isDark
                  ? 'text-white bg-[#262929] border-[#3a3d3d] hover:bg-[#323636]'
                  : 'text-[#181919] bg-[#eaf0f0] border-[#cfd8d8] hover:bg-[#dfe6e6]'
              }`}
            >
              Ver Historial &nbsp;→
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-[#16302f] text-[#5BE1E6]'
                    : 'bg-[#e0f6f7] text-[#0b8a86]'
                }`}
              >
                <Key className="w-4 h-4" />
              </span>
              <b className="text-base text-[var(--color-text-main)]">Módulo de API Key</b>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-text-muted)] mt-4 mb-4">
              Genera tu clave secreta de producción, copia tu credencial o rótala si sospechas que fue expuesta.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('apikey')}
              className={`inline-block text-xs font-bold rounded-lg px-4 py-2.5 transition border ${
                isDark
                  ? 'text-white bg-[#262929] border-[#3a3d3d] hover:bg-[#323636]'
                  : 'text-[#181919] bg-[#eaf0f0] border-[#cfd8d8] hover:bg-[#dfe6e6]'
              }`}
            >
              Ir a Módulo API Key &nbsp;→
            </button>
          </div>
        </div>

        {/* Planes */}
        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-[#231a10] text-[#f5b50a]'
                    : 'bg-[#fdf1d6] text-[#9a6a00]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
              </span>
              <b className="text-base text-[var(--color-text-main)]">Planes y Facturación</b>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-text-muted)] mt-4 mb-4">
              Consulta los límites de los planes Free, Personal, Pro y Enterprise. Aumenta tu volumen de consultas en cualquier momento.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('plans')}
              className="inline-block text-xs font-bold text-[#181919] bg-[#5BE1E6] hover:bg-[#19BFB7] rounded-lg px-4 py-2.5 transition shadow-[0_0_16px_rgba(91,225,230,0.3)]"
            >
              Ver Planes Disponibles &nbsp;→
            </button>
          </div>
        </div>
      </section>

      {/* 4. Fuentes Monitoreadas */}
      <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6">
        <div className="text-xs tracking-wider font-semibold text-[var(--color-text-muted)] uppercase mb-4 flex items-center gap-2">
          <Server className={`w-4 h-4 ${isDark ? 'text-[#5BE1E6]' : 'text-[#0b8a86]'}`} />
          <span>FUENTES DE CUMPLIMIENTO MONITOREADAS EN TU API</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] rounded-xl p-4">
            <div className="flex justify-between items-center gap-2 text-xs font-bold text-[var(--color-text-main)]">
              <span>OFAC SDN List (EE.UU.)</span>
              <span className="text-[#0a8f5a]">◉</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)] mt-3 mb-0">
              Sanciones financieras internacionales, narcotráfico y terrorismo global.
            </p>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] rounded-xl p-4">
            <div className="flex justify-between items-center gap-2 text-xs font-bold text-[var(--color-text-main)]">
              <span>ONU Lista Consolidada</span>
              <span className="text-[#0a8f5a]">◉</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)] mt-3 mb-0">
              Resoluciones del Consejo de Seguridad de las Naciones Unidas.
            </p>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] rounded-xl p-4">
            <div className="flex justify-between items-center gap-2 text-xs font-bold text-[var(--color-text-main)]">
              <span>Colombia (PEPs y Control)</span>
              <span className="text-[#0a8f5a]">◉</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)] mt-3 mb-0">
              Inhabilidades de Procuraduría, Contraloría y antecedentes judiciales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
