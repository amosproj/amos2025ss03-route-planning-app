// Helper for route colors
export const routeColors = [
  '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080', '#38BDF8',
  '#FFC0CB', '#A52A2A', '#FFFF00', '#808000', '#00FF00', '#000080',
  '#FF00FF', '#808080', '#00CED1', '#DA70D6', '#DC143C', '#7FFF00',
  '#D2691E', '#4682B4',
];

/**
 * Get the assigned color for a route by its index.
 * Maintains consistency across components.
 */
export function getRouteColor(idx: number): string {
  return routeColors[idx % routeColors.length];
}
