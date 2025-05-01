import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import Navbar from '../components/Navbar'

export const Route = createRootRoute({
    component: () => (
        <>
            {/* <div className="p-2 flex gap-2">
                <Link to="/" className="[&.active]:font-bold">
                    Home
                </Link>{' '}
                <Link to="/about" className="[&.active]:font-bold">
                    About
                </Link>
                <Link to="/posts" className="[&.active]:font-bold">
                    Posts
                </Link>
            </div>
            <hr /> */}
            <Navbar />
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
})