'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from '@/components/Header';
import { AuthScreen } from '@/components/AuthScreen';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { PlansManager } from '@/components/PlansManager';
import { TenantMetrics } from '@/components/TenantMetrics';
import { checkBackendHealth, getMeApi, getAuthToken, removeAuthToken } from '@/lib/api';
import { UserProfile, TenantInfo, AuthResponse } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);

  // Authentication State
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  // Comprobar la conexión con la API en la nube
  const handleRefreshBackend = useCallback(async () => {
    setCheckingBackend(true);
    const health = await checkBackendHealth();
    setBackendOnline(health.online);
    setCheckingBackend(false);
  }, []);

  // Cargar perfil del usuario autenticado
  const fetchUserProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadingAuth(false);
      setUser(null);
      setTenant(null);
      return;
    }

    try {
      const data = await getMeApi();
      setUser(data.user);
      setTenant(data.tenant);
    } catch (err) {
      removeAuthToken();
      setUser(null);
      setTenant(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    handleRefreshBackend();
  }, [fetchUserProfile, handleRefreshBackend]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setUser(authData.user);
    // Refrescar el perfil completo del tenant
    fetchUserProfile();
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setTenant(null);
  };

  // 1. Pantalla de carga mientras se verifica el token
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium">Verificando sesión segura...</p>
      </div>
    );
  }

  // 2. Si no hay sesión iniciada, exige Login / Registro obligatoriamente
  if (!user || !tenant) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Panel Administrativo para Clientes Autenticados
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendOnline={backendOnline}
        checkingBackend={checkingBackend}
        onRefreshBackend={handleRefreshBackend}
        companyName={tenant.company_name}
        userName={user.full_name}
        planName={tenant.plan_name || 'Free'}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'metrics' && (
          <TenantMetrics tenant={tenant} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'apikey' && (
          <ApiKeyManager />
        )}

        {activeTab === 'plans' && (
          <PlansManager
            currentPlanId={tenant.plan_id || 'free'}
            onPlanUpdated={fetchUserProfile}
          />
        )}
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>RegTech Platform — Monitoreo Continuo de Cumplimiento AML / KYC / OFAC</p>
      </footer>
    </div>
  );
}
