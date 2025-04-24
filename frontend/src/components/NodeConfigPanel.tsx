import React, { useState, useEffect } from 'react';
import { VRPNode } from '../types';
import { 
  Button, 
  Divider, 
  Stack, 
  Typography, 
  Input, 
  FormControl, 
  FormLabel, 
  Checkbox, 
  Box,
  Sheet
} from '@mui/joy';


interface NodeConfigPanelProps {
  node: VRPNode;
  availableSkills: string[];
  updateNode: (updatedNode: VRPNode) => void;
  onClose: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, availableSkills, updateNode, onClose }) => {
  const [editableNode, setEditableNode] = useState<VRPNode>(node);

  useEffect(() => {
    setEditableNode(node);
  }, [node]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;

    setEditableNode(prev => {
        if (name === 'x' || name === 'y') {
            return { ...prev, [name]: parseFloat(value) || 0 };
        }
        if (name === 'time_window_start' || name === 'time_window_end') {
             const win = prev.time_window || [0,0];
             const index = name === 'time_window_start' ? 0 : 1;
             win[index] = parseInt(value, 10) || 0;
            return { ...prev, time_window: win as [number, number]};
        }
        if (type === 'checkbox') {
             const { checked } = event.target as HTMLInputElement;
             const skill = name;
             const currentSkills = prev.required_skills || [];
             let newSkills: string[];
             if(checked) {
                newSkills = [...currentSkills, skill];
             } else {
                newSkills = currentSkills.filter(s => s !== skill);
             }
            return { ...prev, required_skills: newSkills };
        }

        return { ...prev, [name]: value };
    });
  };

  const handleSave = () => {
    updateNode(editableNode);
  };

  return (
    <Sheet 
      className="node-config-panel" 
      sx={{ 
        padding: 3, 
        borderRadius: 'md', 
        boxShadow: 'md',
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000, 
        width: 300,
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <Typography 
        level="title-lg" 
        endDecorator={
          <Button 
            size='sm' 
            onClick={onClose} 
            variant='soft' 
            color='danger' 
            className="close-button"
          >
            X
          </Button>
        } 
      >
        Node {editableNode.id} Config
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      <Stack spacing={2}>
        {/* Node coordinates display */}
        <Sheet variant="outlined" sx={{ p: 1, borderRadius: 'sm' }}>
          <Stack direction="row" spacing={1} justifyContent="space-between">
        <Typography level="body-sm">
          <strong>X:</strong> {editableNode.x.toFixed(1)}
        </Typography>
        <Typography level="body-sm">
          <strong>Y:</strong> {editableNode.y.toFixed(1)}
        </Typography>
        <Typography level="body-sm" sx={{ 
          fontWeight: editableNode.is_depot ? 'bold' : 'normal',
          color: editableNode.is_depot ? 'primary.main' : 'neutral.main'
        }}>
          {editableNode.is_depot ? '🏠 Depot' : '📦 Node'}
        </Typography>
          </Stack>
        </Sheet>
        <FormControl>
          <FormLabel>Time Window:</FormLabel>
          <Stack direction="row" spacing={1}>
            <Input
              name="time_window_start"
              type="number"
              placeholder="Start"
              value={editableNode.time_window?.[0] ?? ''}
              onChange={handleChange}
              disabled={editableNode.is_depot}
            />
            <Input
              name="time_window_end"
              type="number"
              placeholder="End"
              value={editableNode.time_window?.[1] ?? ''}
              onChange={handleChange}
              disabled={editableNode.is_depot}
            />
          </Stack>
        </FormControl>
        
        <Box>
          <Typography level="title-sm" sx={{ mb: 1 }}>Required Skills</Typography>
          <Stack spacing={1}>
            {availableSkills.map(skill => (
              <Checkbox
                key={skill}
                label={skill}
                name={skill}
                checked={editableNode.required_skills?.includes(skill) || false}
                onChange={handleChange}
                disabled={editableNode.is_depot}
              />
            ))}
          </Stack>
        </Box>
        
        <Button
          variant="solid"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 1 }}
        >
          Update Node
        </Button>
      </Stack>
    </Sheet>
  );
};

export default NodeConfigPanel;