import { UserRow } from './UserRow.jsx';

/** Comprehensive user data table (FR-024). */
export function UserTable({ users }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-surface-container-low text-outline text-label-sm uppercase tracking-wider">
          <th className="py-3.5 px-space-md">User</th>
          <th className="py-3.5 px-space-md">Role</th>
          <th className="py-3.5 px-space-md text-right pr-space-md">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y-0 text-on-surface text-body-md">
        {users.length === 0 ? (
          <tr>
            <td colSpan={3} className="py-6 px-space-md text-center text-on-surface-variant">
              No users match your search.
            </td>
          </tr>
        ) : (
          users.map((user, index) => <UserRow key={user.id} user={user} index={index} />)
        )}
      </tbody>
    </table>
  );
}
