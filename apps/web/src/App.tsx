import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import RouteConfig from './routes';
import { useAuth } from './hooks/useAuth';

const AuthInit = () => {
  useAuth();
  return null;
};

const App = () => (
  <Provider store={store}>
    <AuthInit />
    <Toaster position="top-center" />
    <RouteConfig />
  </Provider>
);

export default App;
