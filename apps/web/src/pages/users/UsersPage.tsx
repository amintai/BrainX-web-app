import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiSuccess, PaginatedResponse, Profile } from '@brainx/shared';
import { ROLE_LABELS } from '@brainx/shared';
import { useFetchAPI } from '../../hooks/useFetchAPI';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { refreshUser } from '../../store/slices/authSlice';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import { ROUTES } from '../../routes/routePaths';

const ROLES = ['member', 'manager', 'admin'] as const;
const PAGE_SIZE = 20;

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  const { data, isLoading } = useFetchAPI<void, PaginatedResponse<Profile>>({
    apiFunction: () =>
      client
        .get<ApiSuccess<PaginatedResponse<Profile>>>(
          `${endpoints.users.list}?page=${page}&limit=${PAGE_SIZE}`,
        )
        .then((r) => ({ ...r, data: r.data.data })),
    apiCallCondition: true,
    dependencyArray: [page],
  });

  const [rolePayload, setRolePayload] = useState<{ userId: string; role: string } | null>(null);
  const { isLoading: isRolePending } = useFetchAPI<{ userId: string; role: string }, Profile>({
    apiFunction: (params) =>
      client
        .patch<ApiSuccess<Profile>>(endpoints.users.role(params.userId), { role: params.role })
        .then((r) => ({ ...r, data: r.data.data })),
    apiCallCondition: !!rolePayload,
    apiParams: rolePayload ?? undefined,
    dependencyArray: [rolePayload],
    showSuccessMessage: true,
    successMessage: 'Role updated',
    errorMessage: 'Failed to update role',
    successCb: async () => {
      const wasCurrentUser = rolePayload?.userId === currentUserId;
      setRolePayload(null);
      if (wasCurrentUser) {
        await dispatch(refreshUser());
        navigate(ROUTES.unauthorized);
      }
    },
    failureCb: () => setRolePayload(null),
  });

  if (isLoading) {
    return <p className="text-gray-500">Loading users…</p>;
  }

  const users = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const total = data?.pagination.total ?? 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Users</h1>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={isRolePending}
                      onChange={(e) => setRolePayload({ userId: u.id, role: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages} · {total} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
