import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { userKeys, useUsers } from './users.queries.js';

function Probe({ search, page, pageSize }) {
  const query = useUsers({ search, page, pageSize });
  if (!query.data) return <div>loading</div>;
  return (
    <div>
      {query.data.items.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

describe('userKeys', () => {
  it('namespaces list queries under "users"', () => {
    expect(userKeys.list({ search: '', page: 1, pageSize: 10 })).toEqual([
      'users',
      'list',
      { search: '', page: 1, pageSize: 10 },
    ]);
  });
});

describe('useUsers', () => {
  it('resolves only matching users for a search term', async () => {
    renderWithProviders(<Probe search="marcus" page={1} pageSize={10} />, {
      authStatus: 'authenticated',
    });
    expect(await screen.findByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.queryByText('Elena Rostova')).not.toBeInTheDocument();
  });
});
