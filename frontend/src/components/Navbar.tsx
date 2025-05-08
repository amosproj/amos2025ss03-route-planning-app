import { Link } from '@tanstack/react-router';

const Navbar = () => {
  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Calendar', path: '/scenarios' },
    { name: 'Map View', path: '/map-view' },
    { name: 'Daily Plan', path: '/daily-plan' },
    { name: 'Worker View', path: '/worker-view' },
  ];

  return (
    <div className=" sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto container flex items-center justify-between p-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <img src="/team-logo.svg" alt="Team Logo" width={52} height={52} />
          <h1 className="text-xl font-semibold text-primary">
            AMOS - Smart Route Planning
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-primary hover:font-bold px-2"
              activeProps={{ className: 'font-bold ' }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
