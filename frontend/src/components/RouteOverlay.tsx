import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { RouteRequest } from '@/types/RouteRequest';

const colors = [
  '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080', '#00FFFF',
  '#FFC0CB', '#A52A2A', '#FFFF00', '#808000', '#00FF00', '#000080',
  '#FF00FF', '#808080', '#00CED1', '#DA70D6', '#DC143C', '#7FFF00',
  '#D2691E', '#4682B4',
];

interface RouteOverlayProps {
  map: google.maps.Map | null;
  date: string;
}
import { Solution } from '@/types/Solution';
import example from '@/assets/NewTestdataSolution.json';

const exampleSolution: Solution = example as unknown as Solution;

export function RouteOverlay({ map, date }: RouteOverlayProps) {
  // const solution = useSelector((state: RootState) => state.solutions.byDate[date.split('"')[1]]);
  const solution = exampleSolution
  const polylineRefs = useRef<Record<string, google.maps.Polyline>>({});

  useEffect(() => {
    if (!map || !solution) return;
    const directionsService = new google.maps.DirectionsService();

    // build requests
    const requests: RouteRequest[] = solution.routes.map((route, idx) => {
      const waypoints = route.appointments.map((appt) => ({
        location: { lat: appt.location.lat, lng: appt.location.lng },
        stopover: true,
      }));
      const origin = route.appointments[0].location;
      const dest = route.appointments[route.appointments.length - 1].location;
      return {
        id: `Route-${route.route_id + 1}`,
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        waypoints,
        color: colors[idx % colors.length],
        appointments: route.appointments,
      };
    });

    // fetch and draw
    const promises = requests.map((req) =>
      new Promise<{ id: string; result: google.maps.DirectionsResult; color: string }>((resolve, reject) => {
        directionsService.route(
          { origin: req.origin, destination: req.destination, waypoints: req.waypoints, travelMode: google.maps.TravelMode.DRIVING },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve({ id: req.id, result, color: req.color });
            } else {
              reject(`failed ${req.id}: ${status}`);
            }
          }
        );
      })
    );

    Promise.all(promises)
      .then((results) => {
        const bounds = new google.maps.LatLngBounds();
        results.forEach(({ id, result, color }) => {
          const path = result.routes[0].overview_path;
          path.forEach((pt) => bounds.extend(pt));
          const poly = new google.maps.Polyline({ path, strokeColor: color, strokeOpacity: 0.8, strokeWeight: 5 });
          poly.setMap(map);
          polylineRefs.current[id] = poly;
        });
        map.fitBounds(bounds);
      })
      .catch(console.error);

    return () => {
      Object.values(polylineRefs.current).forEach((pl) => pl.setMap(null));
      polylineRefs.current = {};
    };
  }, [map, solution]);

  return null;
}
