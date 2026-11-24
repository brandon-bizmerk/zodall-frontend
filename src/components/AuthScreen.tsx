'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Shield, Lock, Mail, Building, User, Globe, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';
import { loginApi, registerApi, ApiError } from '@/lib/api';
import { AuthResponse } from '@/types/auth';
import { useTheme } from '@/context/ThemeContext';

interface AuthScreenProps {
  onAuthSuccess: (authData: AuthResponse) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Colombia');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!companyName.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
          throw new Error('Por favor completa todos los campos requeridos.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const data = await registerApi({
          company_name: companyName,
          full_name: fullName,
          email,
          password,
          country,
        });
        onAuthSuccess(data);
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Por favor ingresa tu correo y contraseña.');
        }

        const data = await loginApi(email, password);
        onAuthSuccess(data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage((err instanceof Error && err.message) || 'Ocurrió un error inesperado al procesar la solicitud.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-surface)] text-[var(--color-text-main)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Botón flotante para cambiar tema */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] shadow-sm transition"
        >
          {isDark ? <Sun className="w-4 h-4 text-[#5BE1E6]" /> : <Moon className="w-4 h-4 text-[#0b8a86]" />}
        </button>
      </div>

      {/* Header / Logo de Zodall */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center mb-4">
          {isDark ? (
            <Image
              src="/zodall-logo-turquesa.png"
              alt="Zodall"
              width={200}
              height={48}
              priority
              className="object-contain"
            />
          ) : (
            <Image
              src="/zodall-logo-carbon.png"
              alt="Zodall"
              width={200}
              height={48}
              priority
              className="object-contain"
            />
          )}
        </div>
        <p className="text-xs font-mono tracking-widest uppercase text-[#5BE1E6]">
          El filtro del comercio seguro
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Portal Administrativo de Cumplimiento AML / KYC
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[var(--color-bg-card)] py-8 px-6 shadow-xl rounded-2xl border border-[var(--color-border)] sm:px-10">
          {/* Selector de Pestañas */}
          <div className="flex rounded-xl bg-[var(--color-bg-card-subtle)] p-1 mb-6 border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage(null);
              }}
              className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-[#5BE1E6] text-[#181919] shadow-sm font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage(null);
              }}
              className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-[#5BE1E6] text-[#181919] shadow-sm font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              Registrar Empresa
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Nombre de la Empresa <span className="text-[#5BE1E6]">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[var(--color-text-faint)] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej. Mi Fintech SAS"
                      required
                      className="w-full rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-xs text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[#5BE1E6] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Tu Nombre Completo <span className="text-[#5BE1E6]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--color-text-faint)] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      required
                      className="w-full rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-xs text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[#5BE1E6] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    País de Operación
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[var(--color-text-faint)] absolute left-3.5 top-3" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-xs text-[var(--color-text-main)] focus:outline-none focus:border-[#5BE1E6] transition"
                    >
                      <option value="Colombia">Colombia</option>
                      <option value="México">México</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                      <option value="Perú">Perú</option>
                      <option value="Chile">Chile</option>
                      <option value="Argentina">Argentina</option>
                      <option value="España">España</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Correo Electrónico Corporativo <span className="text-[#5BE1E6]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--color-text-faint)] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuempresa.com"
                  required
                  className="w-full rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-xs text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[#5BE1E6] transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Contraseña <span className="text-[#5BE1E6]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--color-text-faint)] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-xs text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[#5BE1E6] transition font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#5BE1E6] hover:bg-[#19BFB7] text-[#181919] font-bold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_16px_rgba(91,225,230,0.3)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Crear Cuenta y Comenzar' : 'Acceder al Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
