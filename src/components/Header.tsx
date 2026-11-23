'use client';

import React from 'react';
import {
  ShieldCheck,
  Key,
  FileCode2,
  BarChart3,
  RefreshCw,
  LogOut,
  CreditCard,
  History,
  User,
} from 'lucide-react';

export type TabType = 'metrics' | 'apikey' | 'plans' | 'history' | 'docs';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  backendOnline: boolean | null;
  checkingBackend: boolean;
  onRefreshBackend: () => void;
  companyName: string;
  userName: string;
  planName: string;
  onLogout: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  backendOnline,
  checkingBackend,
  onRefreshBackend,
  companyName,
  userName,
  planName,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Identidad */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 text-white">
              <ShieldCheck className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    backendOnline ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    backendOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">RegTech</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  {planName || 'Free'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                {companyName}
              </p>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => onTabChange('metrics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'metrics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('apikey')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'apikey'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>API Key</span>
            </button>

            <button
              onClick={() => onTabChange('plans')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'plans'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Planes</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial</span>
            </button>

            <button
              onClick={() => onTabChange('docs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'docs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Documentación</span>
            </button>
          </nav>

          {/* Estado del Backend y Usuario */}
          <div className="flex items-center gap-3">
            {/* Status backend indicator */}
            <button
              onClick={onRefreshBackend}
              title={backendOnline ? 'API Conectada' : 'API Desconectada'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span className="hidden sm:inline">
                {backendOnline ? 'API Online' : 'Reconectando...'}
              </span>
              <RefreshCw
                className={`w-3 h-3 text-slate-500 ${checkingBackend ? 'animate-spin' : ''}`}
              />
            </button>

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-bold text-white block leading-tight">{userName}</span>
                <span className="text-[10px] text-slate-400">Admin</span>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60">
          <button
            onClick={() => onTabChange('metrics')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'metrics' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onTabChange('apikey')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'apikey' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Key</span>
          </button>
          <button
            onClick={() => onTabChange('plans')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'plans' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Planes</span>
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'history' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial</span>
          </button>
          <button
            onClick={() => onTabChange('docs')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'docs' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Docs</span>
          </button>
        </div>
      </div>
    </header>
  );
}
