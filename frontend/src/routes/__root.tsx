import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import Navbar from '../components/Navbar';
import '../css/tailwind.css';

export const Route = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
