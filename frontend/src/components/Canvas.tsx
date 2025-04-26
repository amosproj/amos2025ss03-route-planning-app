// frontend/src/components/Canvas.tsx
import React, { useRef, MouseEvent, useCallback } from 'react';
import { VRPNode, Route } from '../types';
import { Tooltip } from '@mui/joy';

interface CanvasProps {
  nodes: VRPNode[];
  routes: Route[];
  selectedNodeId: number | null;
  onAddNode: (node: VRPNode) => void;
  onRemoveNode: (nodeId: number) => void;
  onSelectNode: (node: VRPNode | null) => void;
  width: number;
  height: number;
}

// Constants for styling and interaction
const SCALE_FACTOR = 5;
const NODE_RADIUS = 8;
const DEPOT_SIZE = 12;
const RING_WIDTH = 2;

// --- Define Node Colors ---
const NODE_COLORS = {
  DEPOT: { fill: '#DC143C', stroke: '#8B0000' },
  NO_SKILLS: { fill: '#1E90FF', stroke: '#0000CD' },
  HAS_SKILLS: { fill: '#9370DB', stroke: '#483D8B' },
  TIME_WINDOW: { stroke: '#FF7E65' },
  SELECTED: { fill: '#FFA500', stroke: '#FF8C00' },
};
// --- ---

const Canvas: React.FC<CanvasProps> = ({
  nodes,
  routes,
  selectedNodeId,
  onAddNode,
  onRemoveNode,
  onSelectNode,
  width,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nextNodeId =
    nodes.reduce((maxId, node) => Math.max(maxId, node.id), 0) + 1;

  const vrpToSvgCoords = useCallback(
    (x: number, y: number): { cx: number; cy: number } => {
      const cx = width / 2 + x * SCALE_FACTOR;
      const cy = height / 2 - y * SCALE_FACTOR;
      return { cx, cy };
    },
    [width, height],
  );

  const svgToVrpCoords = useCallback(
    (cx: number, cy: number): { x: number; y: number } => {
      const x = (cx - width / 2) / SCALE_FACTOR;
      const y = (height / 2 - cy) / SCALE_FACTOR;
      return { x, y };
    },
    [width, height],
  );

  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;

    let clickedExistingNode = false;
    for (const node of nodes) {
      const { cx, cy } = vrpToSvgCoords(node.x, node.y);
      const distSq = (svgX - cx) ** 2 + (svgY - cy) ** 2;
      const clickRadius = node.is_depot
        ? DEPOT_SIZE / Math.sqrt(2)
        : NODE_RADIUS;
      if (distSq <= clickRadius ** 2) {
        onSelectNode(node);
        clickedExistingNode = true;
        break;
      }
    }

    if (!clickedExistingNode) {
      const { x, y } = svgToVrpCoords(svgX, svgY);
      const newNode: VRPNode = {
        id: nextNodeId,
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
        is_depot: false,
        required_skills: [],
        time_window: null,
      };
      onAddNode(newNode);
      onSelectNode(newNode);
    }
  };

  const handleContextMenu = (event: MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;

    for (const node of nodes) {
      const { cx, cy } = vrpToSvgCoords(node.x, node.y);
      const distSq = (svgX - cx) ** 2 + (svgY - cy) ** 2;
      const clickRadius = node.is_depot
        ? DEPOT_SIZE / Math.sqrt(2)
        : NODE_RADIUS;
      if (distSq <= clickRadius ** 2) {
        if (!node.is_depot) {
          onRemoveNode(node.id);
        } else {
          console.log('Depot cannot be removed.');
        }
        return;
      }
    }
  };

  const getNodeById = (id: number): VRPNode | undefined =>
    nodes.find((n) => n.id === id);
  const routeColors = [
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
    '#9A6324',
  ];

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        border: '1px solid lightgray',
        backgroundColor: '#f9f9f9',
        cursor: 'crosshair',
      }}
    >
      {/* Axes */}
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="lightgray"
        strokeDasharray="4 2"
      />
      <line
        x1={width / 2}
        y1={0}
        x2={width / 2}
        y2={height}
        stroke="lightgray"
        strokeDasharray="4 2"
      />
      <text x={width / 2 + 5} y={height / 2 + 15} fontSize="10" fill="gray">
        (0,0)
      </text>

      {/* Routes */}
      {routes.map((route, routeIndex) => {
        if (route.length < 2) return null;
        const color = routeColors[routeIndex % routeColors.length];
        const points = route
          .map((nodeId) => getNodeById(nodeId))
          .filter((node): node is VRPNode => !!node)
          .map(
            (node) =>
              `${vrpToSvgCoords(node.x, node.y).cx},${vrpToSvgCoords(node.x, node.y).cy}`,
          )
          .join(' ');
        return (
          <polyline
            key={`route-${routeIndex}`}
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            markerEnd={`url(#arrow-${color})`}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const { cx, cy } = vrpToSvgCoords(node.x, node.y);
        const isSelected = node.id === selectedNodeId;

        // --- Determine Node State for Coloring ---
        const hasTimeWindow = !!node.time_window;
        const hasSkills =
          !!node.required_skills && node.required_skills.length > 0;

        // Base color determined by skills
        let nodeColor = node.is_depot
          ? NODE_COLORS.DEPOT
          : hasSkills
            ? NODE_COLORS.HAS_SKILLS
            : NODE_COLORS.NO_SKILLS;

        // Selected color overrides others
        if (isSelected) {
          nodeColor = NODE_COLORS.SELECTED;
        }

        // Stroke color changes if node has time window (except for selected nodes)
        const strokeColor =
          hasTimeWindow && !isSelected
            ? NODE_COLORS.TIME_WINDOW.stroke
            : nodeColor.stroke;
        const strokeWidth = hasTimeWindow ? RING_WIDTH : isSelected ? 2 : 1;
        // --- ---

        // --- Generate Tooltip Text ---
        const tooltipLines = [`Node ${node.id}`];

        if (node.time_window) {
          tooltipLines.push(
            `Time Window: [${node.time_window[0]}, ${node.time_window[1]}]`,
          );
        }
        if (node.required_skills && node.required_skills.length > 0) {
          tooltipLines.push(
            `Required Skills: ${node.required_skills.join(', ')}`,
          );
        }

        const tooltipContent = (
          <div>
            {tooltipLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
        // --- ---

        return (
          <Tooltip
            key={`tooltip-${node.id}`}
            title={tooltipContent}
            placement="top"
            variant="outlined"
            arrow
          >
            <g key={node.id} style={{ cursor: 'pointer' }}>
              {node.is_depot ? (
                <rect
                  x={cx - DEPOT_SIZE / 2}
                  y={cy - DEPOT_SIZE / 2}
                  width={DEPOT_SIZE}
                  height={DEPOT_SIZE}
                  fill={nodeColor.fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={NODE_RADIUS}
                  fill={nodeColor.fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              )}
              <text
                x={cx}
                y={cy + NODE_RADIUS + 10}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {node.id}
              </text>
            </g>
          </Tooltip>
        );
      })}

      {/* Arrow Markers Definitions */}
      {routeColors.map((color) => (
        <defs key={`arrow-def-${color}`}>
          <marker
            id={`arrow-${color}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        </defs>
      ))}
    </svg>
  );
};

export default Canvas;
