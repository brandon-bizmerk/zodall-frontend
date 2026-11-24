'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Building,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  Save,
} from 'lucide-react';
import { updateProfileApi } from '@/lib/api';
import { UserProfile, TenantInfo } from '@/types/auth';

interface AdminProfileManagerProps {
  user: UserProfile;
  tenant: TenantInfo;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export function AdminProfileManager({
  user,
  tenant,
  onProfileUpdated,
}: AdminProfileManagerProps) {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage({ type: 'error', text: 'Debes ingresar tu contraseña actual para cambiarla.' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim(),
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await updateProfileApi(payload);
      onProfileUpdated(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Perfil y credenciales actualizados exitosamente.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err instanceof Error ? err.message : undefined) || 'Error al actualizar el perfil.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)]">
            Administrar Perfil de SuperAdmin
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
          Actualiza tu nombre visible, correo electrónico y renueva tu contraseña de acceso administrativo.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tarjeta de Información General */}
      <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
              {user.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div className="font-bold text-base text-[var(--color-text-main)]">{user.full_name}</div>
              <div className="text-xs text-[var(--color-text-faint)] flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide">
            <Shield className="w-3.5 h-3.5" />
            {user.role}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cambio de Contraseña */}
          <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-main)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Seguridad y Contraseña</span>
              </h3>
              <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                Deja estos campos en blanco si no deseas cambiar tu contraseña actual.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Guardando Cambios...' : 'Guardar Información'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

