'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header, TabType } from '@/components/Header';
import { AuthScreen } from '@/components/AuthScreen';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { PlansManager } from '@/components/PlansManager';
import { TenantMetrics } from '@/components/TenantMetrics';
import { HistoryTab } from '@/components/HistoryTab';
import { DocsTab } from '@/components/DocsTab';
import { checkBackendHealth, getMeApi, getAuthToken, removeAuthToken } from '@/lib/api';
import { UserProfile, TenantInfo, AuthResponse } from '@/types/auth';
import { Loader2, Check, AlertCircle, X } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);

  // Authentication State
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  // Regreso desde Stripe Checkout (?payment=success&session_id=...)
  const router = useRouter();
  const paymentHandled = useRef(false);
  const [paymentNotice, setPaymentNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserProfile();
    handleRefreshBackend();
  }, [fetchUserProfile, handleRefreshBackend]);

  useEffect(() => {
    if (!user || !tenant || paymentHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;
    paymentHandled.current = true; // evita la doble ejecución de React Strict Mode
    const targetPlan = params.get('plan');
    const basePlan = tenant.plan_id;
    router.replace('/'); // limpia la query: recargar no repite el sondeo

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab('plans');
    if (payment !== 'success') {
      setPaymentNotice({ text: 'El pago fue cancelado. Tu plan no cambió.', type: 'info' });
      return;
    }

    // El plan lo activa el webhook de Stripe: se sondea el perfil (cada 2 s, máx. 20 s).
    setPaymentNotice({ text: 'Procesando tu pago…', type: 'info' });
    const isActivated = (planId: string) => (targetPlan ? planId === targetPlan : planId !== basePlan);
    const poll = async () => {
      for (let i = 0; i < 10; i++) {
        try {
          const me = await getMeApi();
          if (isActivated(me.tenant.plan_id)) {
            setUser(me.user);
            setTenant(me.tenant);
            setPaymentNotice({ text: `Pago confirmado. Tu plan ahora es ${me.tenant.plan_name}.`, type: 'success' });
            return;
          }
        } catch {
          // reintenta en el siguiente ciclo
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      setPaymentNotice({ text: 'El pago se está confirmando; recarga en unos minutos.', type: 'info' });
    };
    poll();
  }, [user, tenant, router]);

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
        {paymentNotice && (
          <div
            role="status"
            className={`mb-6 p-4 rounded-xl text-xs font-medium border flex items-center gap-2 max-w-xl mx-auto ${
              paymentNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : paymentNotice.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            {paymentNotice.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1">{paymentNotice.text}</span>
            <button type="button" onClick={() => setPaymentNotice(null)} aria-label="Cerrar aviso">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'metrics' && (
          <TenantMetrics
            tenant={tenant}
            onNavigateTab={setActiveTab}
            onRefreshMetrics={fetchUserProfile}
          />
        )}

        {activeTab === 'apikey' && (
          <ApiKeyManager onApiKeyGenerated={handleApiKeyGenerated} />
        )}

        {activeTab === 'plans' && (
          <PlansManager
            currentPlanId={tenant.plan_id || 'free'}
            onPlanUpdated={fetchUserProfile}
          />
        )}

        {activeTab === 'history' && <HistoryTab />}

        {activeTab === 'docs' && <DocsTab backendOnline={backendOnline} />}
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>RegTech Platform — Monitoreo Continuo de Cumplimiento AML / KYC / OFAC</p>
      </footer>
    </div>
  );
}
