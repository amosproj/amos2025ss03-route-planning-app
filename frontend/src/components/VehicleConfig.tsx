// frontend/src/components/VehicleConfig.tsx
import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Input,
  FormControl,
  FormLabel,
  Stack
} from '@mui/joy';

interface VehicleConfigProps {
  numVehicles: number;
  onNumVehiclesChange: (count: number) => void;
}

const VehicleConfig: React.FC<VehicleConfigProps> = ({ numVehicles, onNumVehiclesChange }) => {
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    onNumVehiclesChange(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? 0 : Number(event.target.value);
    onNumVehiclesChange(value);
  };

  return (
    <Box>
      <Typography level="title-md" sx={{ mb: 2 }}>Vehicles</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl sx={{ width: '80%' }}>
          <FormLabel>Number of Vehicles</FormLabel>
          <Slider
            aria-label="Number of vehicles"
            value={numVehicles}
            onChange={handleSliderChange}
            min={0}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </FormControl>
        <FormControl sx={{ width: '20%' }}>
          <FormLabel>Value</FormLabel>
          <Input
            value={numVehicles}
            onChange={handleInputChange}
            type="number"
            slotProps={{
              input: {
                min: 0,
                max: 10,
                step: 1,
              }
            }}
          />
        </FormControl>
      </Stack>
    </Box>
  );
};

export default VehicleConfig;