import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { store } from './store.js';
import { queryClient } from './queryClient.js';
import { router } from './router.jsx';
import { AuthProvider } from '../features/auth/AuthProvider.jsx';

export function Providers() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}
