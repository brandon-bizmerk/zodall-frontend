'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Building,
  Mail,
  Loader2,
  RefreshCw,
  PowerOff,
  Power,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { getAdminUsersApi, toggleAdminUserStatusApi } from '@/lib/api';
import { AdminUserItem } from '@/types/auth';

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsersApi();
      setUsers(data);
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: (err instanceof Error ? err.message : undefined) || 'Error cargando listado de usuarios clientes.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: AdminUserItem) => {
    const isCurrentlyActive = user.tenant?.account_status === 'ACTIVE';
    const actionText = isCurrentlyActive ? 'desactivar' : 'activar';

    if (
      !confirm(
        `¿Estás seguro de que deseas ${actionText} la cuenta de ${user.full_name} (${user.email})?\n${
          isCurrentlyActive
            ? 'El cliente perderá inmediatamente el acceso al panel y sus peticiones a la API serán bloqueadas.'
            : 'El cliente podrá volver a iniciar sesión y consumir la API normalmente.'
        }`
      )
    ) {
      return;
    }

    setUpdatingId(user.id);
    setNotification(null);
    try {
      const res = await toggleAdminUserStatusApi(user.id);
      const newStatus = res.account_status;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id && u.tenant
            ? { ...u, tenant: { ...u.tenant, account_status: newStatus } }
            : u
        )
      );

      setNotification({
        type: 'success',
        message: `Cuenta de ${user.email} ${newStatus === 'ACTIVE' ? 'activada' : 'desactivada'} exitosamente.`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: (err instanceof Error ? err.message : undefined) || 'Error al cambiar el estado del usuario.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.tenant?.company_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)]">
              Administración de Usuarios Clientes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Visualiza las empresas clientes registradas en Zodall, su consumo y desactiva su acceso al sistema cuando sea requerido.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Notificaciones */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline hover:no-underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Barra de búsqueda y métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, correo o empresa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-xs sm:text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-xs text-[var(--color-text-muted)]">
          <span>Clientes Registrados:</span>
          <span className="font-bold text-sm text-[var(--color-text-main)]">{users.length}</span>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs font-mono">Cargando directorio de clientes...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)] text-sm">
            No se encontraron usuarios clientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Empresa (Tenant)</th>
                  <th className="py-3 px-4">Plan Actual</th>
                  <th className="py-3 px-4">Consumo de Consultas</th>
                  <th className="py-3 px-4">Estado de Acceso</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-main)]">
                {filteredUsers.map((u) => {
                  const isUpdating = updatingId === u.id;
                  const isActive = u.tenant?.account_status === 'ACTIVE';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[var(--color-bg-card-subtle)] transition ${
                        !isActive ? 'opacity-70 bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--color-text-main)]">{u.full_name}</div>
                        <div className="text-xs text-[var(--color-text-faint)] flex items-center gap-1.5 mt-0.5 font-mono">
                          <Mail className="w-3 h-3" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.tenant ? (
                          <div>
                            <div className="font-medium text-[var(--color-text-main)] flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{u.tenant.company_name}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-faint)] italic">Sin empresa</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 uppercase tracking-wide">
                          {u.tenant?.plan_name || 'Free'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        {u.tenant ? (
                          <div>
                            <span className="font-semibold">{u.tenant.query_count.toLocaleString()}</span>
                            <span className="text-[var(--color-text-faint)]">
                              {' '}
                              / {u.tenant.query_limit.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <Ban className="w-3.5 h-3.5" />
                            Desactivado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                            isActive
                              ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={isActive ? 'Desactivar acceso al cliente' : 'Reactivar acceso al cliente'}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isActive ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                          <span>{isActive ? 'Desactivar' : 'Activar'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
