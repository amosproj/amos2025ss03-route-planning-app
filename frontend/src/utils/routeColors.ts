// Helper for route colors
export const routeColors = [
  '#E03E36',
  '#3B82F6',
  '#16A34A',
  '#F59E0B',
  '#8B5CF6',
  '#38BDF8',
  '#EC4899',
  '#B45309',
  '#EAB308',
  '#65A30D',
  '#22C55E',
  '#1E3A8A',
  '#D946EF',
  '#6B7280',
  '#14B8A6',
  '#E879F9',
  '#DC2626',
  '#84CC16',
  '#EA580C',
  '#60A5FA',
];

/**
 * Get the assigned color for a route by its index.
 * Maintains consistency across components.
 */
export function getRouteColor(idx: number): string {
  return routeColors[idx % routeColors.length];
}
