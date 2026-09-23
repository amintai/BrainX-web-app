import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import RouteConfig from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" />
      <RouteConfig />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </Provider>
);

export default App;
