import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import RouteConfig from './routes';

const App = () => (
  <Provider store={store}>
    <Toaster position="top-center" />
    <RouteConfig />
  </Provider>
);

export default App;
