'use client';

import React from 'react';
import Image from 'next/image';
import {
  BarChart3,
  Key,
  CreditCard,
  History,
  Search,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type TabType = 'metrics' | 'manual-verification' | 'history' | 'apikey' | 'plans' | 'admin-plans';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userName: string;
  planName: string;
  isSuperAdmin?: boolean;
  canVerifyManually?: boolean;
  onLogout: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  userName,
  planName,
  isSuperAdmin = false,
  canVerifyManually = false,
  onLogout,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] px-3 sm:px-7 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
        {/* Izquierda: Logo Zodall + Badge Plan + Compañía */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative w-[110px] sm:w-[148px] h-8 sm:h-9 flex items-center">
              {isDark ? (
                <Image
                  src="/zodall-logo-turquesa.png"
                  alt="Zodall"
                  width={150}
                  height={36}
                  priority
                  className="object-contain object-left"
                />
              ) : (
                <Image
                  src="/zodall-logo-carbon.png"
                  alt="Zodall"
                  width={150}
                  height={36}
                  priority
                  className="object-contain object-left"
                />
              )}
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase shrink-0 ${
                isDark
                  ? 'text-[#5BE1E6] bg-[#123a3b] border-[#1f6061]'
                  : 'text-[#0b8a86] bg-[#e0f6f7] border-[#9ddfe2]'
              }`}
            >
              {planName || 'FREE'}
            </span>
          </div>
        </div>

        {/* Centro: Navegación por pestañas (Desktop) */}
        <nav className="hidden xl:flex items-center gap-1 p-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <button
            onClick={() => onTabChange('metrics')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'metrics'
                ? 'bg-[#5BE1E6] text-[#181919] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {canVerifyManually && (
            <button
              onClick={() => onTabChange('manual-verification')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'manual-verification'
                  ? 'bg-[#5BE1E6] text-[#181919] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Consultas manuales</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-[#5BE1E6] text-[#181919] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial</span>
          </button>

          <button
            onClick={() => onTabChange('apikey')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'apikey'
                ? 'bg-[#5BE1E6] text-[#181919] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key</span>
          </button>

          <button
            onClick={() => onTabChange('plans')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'plans'
                ? 'bg-[#5BE1E6] text-[#181919] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Planes</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => onTabChange('admin-plans')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'admin-plans'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin Planes</span>
            </button>
          )}
        </nav>

        {/* Derecha: Botón Tema + Status Backend + Info Usuario + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Toggle Dark / Light Theme */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#5BE1E6]" /> : <Moon className="w-4 h-4 text-[#0b8a86]" />}
          </button>

          {/* Usuario y Logout */}
          <div className="border-l border-[var(--color-border)] pl-1.5 sm:pl-3 flex items-center gap-1.5 sm:gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[var(--color-text-main)] leading-none truncate max-w-[120px]">{userName}</div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">
                {isSuperAdmin ? (
                  <span className="text-indigo-400 font-semibold">SuperAdmin</span>
                ) : (
                  'Admin'
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-rose-500 hover:border-rose-500/40 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Barra de navegación inferior flotante exclusiva para móviles */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] px-1 flex items-center justify-around shadow-2xl backdrop-blur-lg">
        <button
          onClick={() => onTabChange('metrics')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'metrics'
              ? 'text-[#5BE1E6] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {canVerifyManually && (
          <button
            onClick={() => onTabChange('manual-verification')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition ${
              activeTab === 'manual-verification'
                ? 'text-[#5BE1E6] font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px]">Consultas</span>
          </button>
        )}

        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'history'
              ? 'text-[#5BE1E6] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px]">Historial</span>
        </button>

        <button
          onClick={() => onTabChange('apikey')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'apikey'
              ? 'text-[#5BE1E6] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
          }`}
        >
          <Key className="w-4 h-4" />
          <span className="text-[10px]">API Key</span>
        </button>

        <button
          onClick={() => onTabChange('plans')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'plans'
              ? 'text-[#5BE1E6] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px]">Planes</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => onTabChange('admin-plans')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
              activeTab === 'admin-plans'
                ? 'text-indigo-400 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-indigo-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px]">Admin</span>
          </button>
        )}
      </nav>
    </>
  );
}
