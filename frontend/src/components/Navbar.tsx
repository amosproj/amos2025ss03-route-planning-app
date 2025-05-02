import MenuIcon from '@mui/icons-material/Menu';
import { IconButton, Sheet, Stack, Typography } from '@mui/joy';

import { Link } from '@tanstack/react-router';

const Navbar = () => {
  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Map View', path: '/map-view' },
    { name: 'Daily Plan', path: '/daily-plan' },
    { name: 'Worker View', path: '/worker-view' },
  ];

  return (
    <Sheet
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderRadius: 'md',
        boxShadow: 'sm',
        position: 'sticky',
        top: 0,
        zIndex: 1400,
      }}
    >
      {/* Logo and Title */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <img
          src="/team-logo.svg"
          alt="Team Logo"
          style={{ width: 52, height: 52 }}
        />
        <Typography level="title-lg" color="primary">
          AMOS - Smart Route Planning
        </Typography>
      </Stack>

      {/* Desktop Nav */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            style={{ textDecoration: 'none' }}
            activeProps={{ style: { fontWeight: 'bold' } }}
          >
            <Typography
              level="body-md"
              color="primary"
              sx={{
                minWidth: '100px', // or whatever is suitable
                textAlign: 'center',
                display: 'inline-block',
                '&:hover': {
                  fontWeight: 'bold',
                },
              }}
            >
              {item.name}
            </Typography>
          </Link>
        ))}
      </Stack>

      {/* Mobile Menu Icon */}
      <IconButton sx={{ display: { xs: 'flex', sm: 'none' } }}>
        <MenuIcon />
      </IconButton>
    </Sheet>
  );
};

export default Navbar;
