'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from '@/components/Header';
import { AuthScreen } from '@/components/AuthScreen';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { PlansManager } from '@/components/PlansManager';
import { AdminPlansDashboard } from '@/components/AdminPlansDashboard';
import { TenantMetrics } from '@/components/TenantMetrics';
import { QueryHistory } from '@/components/QueryHistory';
import { ManualVerification } from '@/components/ManualVerification';
import { AdminLayout } from '@/components/AdminLayout';
import { getMeApi, logoutApi, clearLegacyToken, SESSION_EXPIRED_EVENT } from '@/lib/api';
import { UserProfile, TenantInfo, AuthResponse } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');

  // Authentication State
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  // Cargar perfil del usuario autenticado
  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await getMeApi();
      setUser(data.user);
      setTenant(data.tenant);
    } catch {
      setUser(null);
      setTenant(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    // Migración: versiones anteriores guardaban el JWT en localStorage; la sesión ahora es una cookie HttpOnly.
    clearLegacyToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserProfile();

    // Validar si venimos de un pago exitoso de Stripe Checkout (?payment=success&plan=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get('payment') === 'success';

      if (urlParams.get('payment')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (isSuccess) {
        // El plan lo activa el webhook de Stripe (no hay verify-session): se sondea /auth/me
        // cada 2 s (máx. 20 s) hasta que el plan comprado aparezca en el perfil.
        const targetPlan = urlParams.get('plan');
        (async () => {
          for (let i = 0; i < 10; i++) {
            try {
              const me = await getMeApi();
              if (targetPlan && me.tenant.plan_id === targetPlan) break;
            } catch {
              // reintenta en el siguiente ciclo
            }
            await new Promise((r) => setTimeout(r, 2000));
          }
          fetchUserProfile();
        })();
      }
    }
  }, [fetchUserProfile]);

  // Una respuesta 401 de la API (sesión vencida o revocada) devuelve al login.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setTenant(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setUser(authData.user);
    if (authData.user.role === 'SUPERADMIN') {
      setActiveTab('admin-plans');
    } else {
      setActiveTab('metrics');
    }
    fetchUserProfile();
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Error registrando el cierre de sesión:', error);
    } finally {
      setUser(null);
      setTenant(null);
    }
  };

  const handleApiKeyGenerated = useCallback((newPrefix: string) => {
    setTenant((prev) =>
      prev
        ? {
            ...prev,
            has_api_key: true,
            api_key_prefix: newPrefix,
          }
        : null
    );
    fetchUserProfile();
  }, [fetchUserProfile]);

  // 1. Pantalla de carga mientras se verifica el token
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-surface)] flex flex-col items-center justify-center text-[var(--color-text-muted)]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5BE1E6] mb-4" />
        <p className="text-xs font-mono">Verificando sesión segura...</p>
      </div>
    );
  }

  // 2. Si no hay sesión iniciada, exige Login / Registro
  if (!user || !tenant) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Si el usuario es SUPERADMIN, mostrar exclusivamente el Panel Administrativo
  if (user.role === 'SUPERADMIN') {
    return (
      <AdminLayout
        user={user}
        tenant={tenant}
        onLogout={handleLogout}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    );
  }

  // 4. Portal Cliente para usuarios clientes
  return (
    <div className="min-h-screen bg-[var(--color-bg-surface)] text-[var(--color-text-main)] flex flex-col transition-colors">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={user.full_name}
        planName={tenant.plan_name || 'Free'}
        isSuperAdmin={false}
        canVerifyManually={user.role === 'ADMIN'}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-[1152px] w-full mx-auto px-3 sm:px-6 lg:px-7 py-5 sm:py-8 pb-20 xl:pb-8">
        {activeTab === 'metrics' && (
          <TenantMetrics
            tenant={tenant}
            onNavigateTab={setActiveTab}
            onRefreshMetrics={fetchUserProfile}
          />
        )}

        {activeTab === 'manual-verification' && user.role === 'ADMIN' && (
          <ManualVerification onQuerySuccess={fetchUserProfile} />
        )}

        {activeTab === 'history' && <QueryHistory />}

        {activeTab === 'apikey' && (
          <ApiKeyManager onApiKeyGenerated={handleApiKeyGenerated} />
        )}

        {activeTab === 'plans' && (
          <PlansManager
            currentPlanId={tenant.plan_id || 'free'}
            onPlanUpdated={fetchUserProfile}
          />
        )}

        {activeTab === 'admin-plans' && <AdminPlansDashboard />}
      </main>

      {/* Footer minimalista de Zodall */}
      <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] py-6 text-center text-xs text-[var(--color-text-faint)]">
        <p>Zodall Platform — Monitoreo Continuo de Cumplimiento AML / KYC / OFAC</p>
      </footer>
    </div>
  );
}
