'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Package,
  Users,
  FileSpreadsheet,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { UserProfile, TenantInfo } from '@/types/auth';
import { AdminPlansDashboard } from './AdminPlansDashboard';
import { AdminUsersManager } from './AdminUsersManager';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminProfileManager } from './AdminProfileManager';

export type AdminSection = 'plans' | 'users' | 'logs' | 'profile';

interface AdminLayoutProps {
  user: UserProfile;
  tenant: TenantInfo;
  onLogout: () => void;
  onUserUpdated: (u: UserProfile) => void;
}

export function AdminLayout({
  user,
  tenant,
  onLogout,
  onUserUpdated,
}: AdminLayoutProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('plans');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    {
      id: 'plans' as AdminSection,
      label: 'Administrar Planes',
      description: 'Precios, características y Stripe',
      icon: Package,
    },
    {
      id: 'users' as AdminSection,
      label: 'Administrar Usuarios',
      description: 'Tenants, roles y consumos',
      icon: Users,
    },
    {
      id: 'logs' as AdminSection,
      label: 'Auditoría de Logs',
      description: 'Trazabilidad y hashes SAGRILAFT',
      icon: FileSpreadsheet,
    },
    {
      id: 'profile' as AdminSection,
      label: 'Administrar Perfil',
      description: 'Mis datos y cambio de contraseña',
      icon: UserCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-surface)] text-[var(--color-text-main)] flex flex-col md:flex-row transition-colors">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[var(--color-border)] bg-[var(--color-bg-card)] shrink-0 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="h-16 border-b border-[var(--color-border-subtle)] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-28 h-8 flex items-center">
              {isDark ? (
                <Image
                  src="/zodall-logo-turquesa.png"
                  alt="Zodall"
                  width={120}
                  height={32}
                  priority
                  className="object-contain object-left"
                />
              ) : (
                <Image
                  src="/zodall-logo-carbon.png"
                  alt="Zodall"
                  width={120}
                  height={32}
                  priority
                  className="object-contain object-left"
                />
              )}
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Admin
            </span>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
            Panel de Control
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <div className="flex-1 truncate">
                  <div className="text-xs leading-none">{item.label}</div>
                  <div
                    className={`text-[10px] truncate mt-1 ${
                      isActive ? 'text-indigo-100' : 'text-[var(--color-text-faint)]'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </button>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                {user.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>SuperAdmin</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={toggleTheme}
                title="Cambiar Tema"
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)] transition"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-[#5BE1E6]" /> : <Moon className="w-3.5 h-3.5 text-[#0b8a86]" />}
              </button>
              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-main)]"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="relative w-24 h-7 flex items-center">
            {isDark ? (
              <Image src="/zodall-logo-turquesa.png" alt="Zodall" width={100} height={28} priority />
            ) : (
              <Image src="/zodall-logo-carbon.png" alt="Zodall" width={100} height={28} priority />
            )}
          </div>
          <span className="text-[9px] font-bold text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded bg-indigo-500/10">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)]"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#5BE1E6]" /> : <Moon className="w-4 h-4 text-[#0b8a86]" />}
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-rose-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 flex">
          <div className="w-64 bg-[var(--color-bg-card)] h-full p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider">
                  Menú Administrativo
                </span>
                <button onClick={() => setIsMobileSidebarOpen(false)}>
                  <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-7 lg:p-9 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeSection === 'plans' && <AdminPlansDashboard />}
        {activeSection === 'users' && <AdminUsersManager />}
        {activeSection === 'logs' && <AdminAuditLogs />}
        {activeSection === 'profile' && (
          <AdminProfileManager
            user={user}
            tenant={tenant}
            onProfileUpdated={onUserUpdated}
          />
        )}
      </main>
    </div>
  );
}

