// frontend/src/components/SkillConfig.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Input,
  IconButton,
  Stack,
  FormControl,
  FormLabel,
  Table,
  Sheet,
} from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { VehicleSkills } from '../types';

interface SkillConfigProps {
  availableSkills: string[];
  vehicleSkills: VehicleSkills;
  numVehicles: number;
  onSkillsChange: (
    newAvailableSkills: string[],
    newVehicleSkills: VehicleSkills,
  ) => void;
}

const SkillConfig: React.FC<SkillConfigProps> = ({
  availableSkills,
  vehicleSkills,
  numVehicles,
  onSkillsChange,
}) => {
  const [newSkill, setNewSkill] = useState<string>('');

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSkill(e.target.value);
  };

  const handleAddSkill = () => {
    if (newSkill && !availableSkills.includes(newSkill)) {
      const updatedSkills = [...availableSkills, newSkill];

      // Add the new skill to the vehicleSkills object for each vehicle
      const updatedVehicleSkills = { ...vehicleSkills };
      for (let i = 0; i < numVehicles; i++) {
        const vehicleId = i;
        if (!updatedVehicleSkills[vehicleId]) {
          updatedVehicleSkills[vehicleId] = [];
        }
        // By default, new skills are not assigned to existing vehicles
      }

      onSkillsChange(updatedSkills, updatedVehicleSkills);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = availableSkills.filter(
      (skill) => skill !== skillToRemove,
    );

    // Remove the skill from all vehicles
    const updatedVehicleSkills: VehicleSkills = {};
    for (let i = 0; i < numVehicles; i++) {
      const vehicleId = i;
      if (vehicleSkills[vehicleId]) {
        updatedVehicleSkills[vehicleId] = vehicleSkills[vehicleId].filter(
          (skill) => skill !== skillToRemove,
        );
      }
    }

    onSkillsChange(updatedSkills, updatedVehicleSkills);
  };

  const handleSkillToggle = (vehicleId: number, skill: string) => {
    const updatedVehicleSkills = { ...vehicleSkills };

    if (!updatedVehicleSkills[vehicleId]) {
      updatedVehicleSkills[vehicleId] = [];
    }

    const hasSkill = updatedVehicleSkills[vehicleId].includes(skill);

    if (hasSkill) {
      updatedVehicleSkills[vehicleId] = updatedVehicleSkills[vehicleId].filter(
        (s) => s !== skill,
      );
    } else {
      updatedVehicleSkills[vehicleId] = [
        ...updatedVehicleSkills[vehicleId],
        skill,
      ];
    }

    onSkillsChange(availableSkills, updatedVehicleSkills);
  };

  return (
    <Box>
      <Typography level="title-md" sx={{ mb: 2 }}>
        Skills Configuration
      </Typography>

      <FormControl sx={{ mb: 2 }}>
        <FormLabel>Add a new skill</FormLabel>
        <Stack direction="row" spacing={1}>
          <Input
            placeholder="New skill name"
            value={newSkill}
            onChange={handleSkillInputChange}
            sx={{ flexGrow: 1 }}
          />
          <IconButton
            onClick={handleAddSkill}
            disabled={!newSkill || availableSkills.includes(newSkill)}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Stack>
      </FormControl>

      <Sheet
        sx={{ mb: 2, maxHeight: 300, overflow: 'hidden', borderRadius: 'md' }}
      >
        <Table stickyHeader>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Skill Name</th>
              <th>Assigned To Vehicle</th>
              <th style={{ width: '15%' }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {availableSkills.map((skill) => (
              <tr key={skill}>
                <td>{skill}</td>
                <td>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Array.from({ length: numVehicles }, (_, i) => i).map(
                      (vehicleId) => {
                        const hasSkill =
                          vehicleSkills[vehicleId]?.includes(skill) || false;
                        return (
                          <Chip
                            key={vehicleId}
                            variant={hasSkill ? 'solid' : 'outlined'}
                            color={hasSkill ? 'primary' : 'neutral'}
                            onClick={() => handleSkillToggle(vehicleId, skill)}
                            sx={{ cursor: 'pointer' }}
                          >
                            {vehicleId}
                          </Chip>
                        );
                      },
                    )}
                  </Box>
                </td>
                <td>
                  <IconButton
                    size="sm"
                    variant="plain"
                    color="danger"
                    onClick={() => handleRemoveSkill(skill)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </td>
              </tr>
            ))}
            {availableSkills.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <Typography level="body-sm" textAlign="center" sx={{ py: 2 }}>
                    No skills added yet
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Sheet>
    </Box>
  );
};

export default SkillConfig;
