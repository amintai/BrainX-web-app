import { useState } from 'react';
import { QueryState } from '../../components/QueryState.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { useUsers } from './api/users.queries.js';
import { UsersPageHeader } from './components/UsersPageHeader.jsx';
import { UserSearchInput } from './components/UserSearchInput.jsx';
import { UserTable } from './components/UserTable.jsx';

const DEFAULT_PAGE_SIZE = 10;

/** User Management page (FR-022/023/025): owns search/page/pageSize state. */
export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const query = useUsers({ search, page, pageSize });

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSize(size) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="flex flex-col w-full">
      <UsersPageHeader />

      <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-md mb-space-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        <UserSearchInput value={search} onChange={handleSearch} />
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <QueryState
            query={query}
            skeleton={<div className="h-64 animate-pulse p-space-lg" aria-hidden="true" />}
            errorMessage="Could not load users."
          >
            {(data) => <UserTable users={data.items} />}
          </QueryState>
        </div>
        {query.data && (
          <Pagination
            page={query.data.page}
            pageSize={query.data.pageSize}
            total={query.data.total}
            itemLabel="users"
            onPageChange={setPage}
            onPageSizeChange={handlePageSize}
          />
        )}
      </div>
    </div>
  );
}
