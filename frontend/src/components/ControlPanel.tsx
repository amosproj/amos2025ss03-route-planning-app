// frontend/src/components/ControlPanel.tsx
import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import Stack from '@mui/joy/Stack';

import IconButton from '@mui/joy/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import VehicleConfig from './VehicleConfig';
import SkillConfig from './SkillConfig';
import { VRPNode, VehicleSkills, ScenarioData, Route } from '../types';

interface ControlPanelProps {
  numVehicles: number;
  onNumVehiclesChange: (count: number) => void;
  availableSkills: string[];
  vehicleSkills: VehicleSkills;
  onSkillsChange: (
    newAvailableSkills: string[],
    newVehicleSkills: VehicleSkills,
  ) => void;
  selectedNode: VRPNode | null;
  onUpdateNode: (updatedNode: VRPNode) => void;
  onSolve: () => void;
  onClearRoutes: () => void;
  onClearAll: () => void;
  onLoadExample: () => void;
  getCurrentScenarioData: () => ScenarioData;
  setStatusMessage: (message: string) => void;
  setRoutes: (routes: Route[]) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  numVehicles,
  onNumVehiclesChange,
  availableSkills,
  vehicleSkills,
  onSkillsChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        zIndex: 1100,
        display: 'flex',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          height: '100%',
        }}
      >
        <Box
          sx={{
            width: 400,
            p: 2,
            height: '100%',
            overflow: 'auto',
            bgcolor: 'background.surface',
            boxShadow: 'sm',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2.5} sx={{ flexGrow: 1, height: '100%' }}>
            {/* Vehicle Configuration */}
            <VehicleConfig
              numVehicles={numVehicles}
              onNumVehiclesChange={onNumVehiclesChange}
            />
            <Divider />

            {/* Skills Configuration */}
            <SkillConfig
              availableSkills={availableSkills}
              vehicleSkills={vehicleSkills}
              numVehicles={numVehicles}
              onSkillsChange={onSkillsChange}
            />
            <Divider />
          </Stack>
        </Box>
      </Box>

      <IconButton
        sx={{
          position: 'absolute',
          top: 10,
          left: collapsed ? 10 : 360,
          zIndex: 1101,
          transition: 'left 0.3s ease-in-out',
          bgcolor: 'background.surface',
        }}
        variant="outlined"
        color="neutral"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>
    </Box>
  );
};

export default ControlPanel;
