import React, { useState } from 'react';
import {
  Sheet,
  Typography,
  Box,
  Table,
  Chip,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton
} from '@mui/joy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Route, VRPNode, VehicleSkills } from '../types';

const ROUTE_COLORS = [
  '#E6194B',
  '#3CB44B',
  '#4363D8',
  '#F58231',
  '#911EB4',
  '#46F0F0',
  '#F032E6',
  '#BCF60C',
  '#FABEBE',
  '#008080',
  '#E6BEFF',
  '#9A6324'
];

interface RouteSummaryPanelProps {
  routes: Route[];
  nodes: VRPNode[];
  vehicleSkills: VehicleSkills;
  maxDistance?: number;
  totalDistance?: number;
  onClose: () => void;
}

const RouteSummaryPanel: React.FC<RouteSummaryPanelProps> = ({
  routes,
  nodes,
  vehicleSkills,
  maxDistance,
  totalDistance,
  onClose
}) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const getNodeById = (id: number): VRPNode | undefined => 
    nodes.find(node => node.id === id);
  
  const getRouteStats = (routeNodeIds: number[]) => {
    if (!routeNodeIds || routeNodeIds.length < 2) {
      return { 
        nodeCount: 0,
        hasTimeWindows: false,
        hasSkillRequirements: false,
      };
    }

    const routeNodes = routeNodeIds
      .map(id => getNodeById(id))
      .filter((node): node is VRPNode => !!node);
    
    const hasTimeWindows = routeNodes.some(node => !!node.time_window);
    const hasSkillRequirements = routeNodes.some(
      node => node.required_skills && node.required_skills.length > 0
    );
    
    const customerNodeCount = routeNodes.filter(node => !node.is_depot).length;

    return { 
      nodeCount: customerNodeCount,
      hasTimeWindows,
      hasSkillRequirements,
    };
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex'
      }}
    >
      {/* Toggle Button */}
      <IconButton
        sx={{
          position: 'absolute',
          top: 10,
          right: collapsed ? 10 : 'auto',
          left: collapsed ? 'auto' : 0,
          transform: collapsed ? 'none' : 'translateX(-100%)',
          zIndex: 1001,
          bgcolor: 'background.surface'
        }}
        variant='outlined'
        color='neutral'
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
      
      <Sheet
        sx={{
          width: 380,
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          p: 2,
          borderRadius: 'md',
          boxShadow: 'md',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          transform: collapsed ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography level="title-lg">Solution Summary</Typography>
          <IconButton 
            size="sm" 
            variant="soft" 
            color="neutral" 
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Overall Statistics */}
        <Sheet variant="outlined" sx={{ p: 1.5, borderRadius: 'md', mb: 2 }}>
          <Typography level="title-sm" sx={{ mb: 1 }}>Solution Statistics</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography level="body-sm">Total Routes:</Typography>
            <Typography level="body-sm">{routes.length}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography level="body-sm">Maximum Route Distance:</Typography>
            <Typography level="body-sm">{maxDistance?.toFixed(2) ?? 'N/A'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography level="body-sm">Total Solution Distance:</Typography>
            <Typography level="body-sm">{totalDistance?.toFixed(2) ?? 'N/A'}</Typography>
          </Box>
        </Sheet>

        {/* Route Accordion */}
        {routes.map((route, index) => {
          const vehicleId = index;
          const skills = vehicleSkills[vehicleId.toString()] || [];
          const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
          const routeStats = getRouteStats(route);

          return (
            <Accordion key={`route-${index}`}>
              <AccordionSummary 
                indicator={<ExpandMoreIcon />}
                sx={{ 
                  '&:hover': { bgcolor: 'background.level1' },
                  borderLeft: `4px solid ${routeColor}`,
                  paddingLeft: 1,
                }}
              >
                <Box color='' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    Vehicle {vehicleId}
                  </Typography>
                  <Chip 
                    size="sm" 
                    variant="soft"
                  >{routeStats.nodeCount} stops</Chip>
                  {skills.length > 0 && (
                    <Chip 
                      size="sm" 
                      variant="soft" 
                      color="primary"
                    >{skills.length} skills</Chip>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Skills */}
                {skills.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography level="title-sm">Skills:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {skills.map(skill => (
                        <Chip key={skill} size="sm">{skill}</Chip>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Route Details Table */}
                <Table size="sm" sx={{ mt: 1 }} stickyHeader>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Stop</th>
                      <th style={{ width: '15%' }}>ID</th>
                      <th style={{ width: '30%' }}>Window</th>
                      <th>Skills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {route.map((nodeId, stopIdx) => {
                      const node = getNodeById(nodeId);
                      if (!node) return null;
                      
                      return (
                        <tr key={`stop-${stopIdx}-${nodeId}`}>
                          <td>{stopIdx}</td>
                          <td>
                            <Chip 
                              size="sm" 
                              variant="soft"
                              color={node.is_depot ? "success" : "primary"}
                            >
                              {node.id}
                            </Chip>
                          </td>
                          <td>
                            {node.time_window ? (
                              <Typography level="body-xs">
                                {`[${node.time_window[0]}, ${node.time_window[1]}]`}
                              </Typography>
                            ) : (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                None
                              </Typography>
                            )}
                          </td>
                          <td>
                            {node.required_skills && node.required_skills.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {node.required_skills.map(skill => (
                                  <Chip 
                                    key={skill} 
                                    size="sm"
                                    variant="outlined"
                                    color={skills.includes(skill) ? "success" : "danger"}
                                  >
                                    {skill}
                                  </Chip>
                                ))}
                              </Box>
                            ) : (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                None
                              </Typography>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {routes.length === 0 && (
          <Typography level="body-md" sx={{ textAlign: 'center', py: 4 }}>
            No routes in solution
          </Typography>
        )}
      </Sheet>
    </Box>
  );
};

export default RouteSummaryPanel;