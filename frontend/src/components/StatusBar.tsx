import React from 'react';
import { Sheet, Typography, Box } from '@mui/joy';

interface StatusBarProps {
  message: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ message }) => {
  return (
    <Sheet
      variant="soft"
      color="neutral"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 1.5,
        display: 'flex',
        justifyContent: 'space-between',
        zIndex: 1000,
        boxShadow: '0px -1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Typography level="body-sm">
        {message || 'Ready'}
      </Typography>
      
      <Box>
        <Typography level="body-sm">
          VRP Solver App
        </Typography>
      </Box>
    </Sheet>
  );
};

export default StatusBar;