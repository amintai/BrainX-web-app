import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { PublicRouteList, PrivateRouteList, NotFoundPage } from './routeMapper';
import PublicRoute from './publicRoutes';
import PrivateRoute from './privateRoutes';
import PublicLayout from '../layouts/PublicLayout';

const Loader = () => (
  <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>
);

const RouteConfig = () => (
  <BrowserRouter>
    <Suspense fallback={<Loader />}>
      <Routes>
        {PublicRouteList.map(({ path, component: Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <PublicRoute>
                <PublicLayout>
                  <Component />
                </PublicLayout>
              </PublicRoute>
            }
          />
        ))}

        {PrivateRouteList.map(({ path, component: Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <PrivateRoute>
                <Component />
              </PrivateRoute>
            }
          />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default RouteConfig;
