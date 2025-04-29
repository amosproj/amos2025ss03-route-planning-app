import MenuIcon from '@mui/icons-material/Menu';
import {
  IconButton,
  Link as JoyLink,
  Sheet,
  Stack,
  Typography,
} from '@mui/joy';

const Navbar = () => {
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
        spacing={3}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        <JoyLink href="/" underline="none">
          Map View
        </JoyLink>
        <JoyLink href="/about" underline="none">
          Daily Plan
        </JoyLink>
        <JoyLink href="/contact" underline="none">
          Worker View
        </JoyLink>
      </Stack>

      {/* Mobile Menu Icon */}
      <IconButton sx={{ display: { xs: 'flex', sm: 'none' } }}>
        <MenuIcon />
      </IconButton>
    </Sheet>
  );
};

export default Navbar;
