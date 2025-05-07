import { createFileRoute } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { EnhancedAddressResponse } from '../../types/EnhancedAddressResponse';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/map-view/')({ component: MapView });

function MapView() {
  const navigate = useNavigate();
  // Extract 'date' from URL query string (non-hook)
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const scenario = scenarios.find((s) => s.date.toString() === date.split("\"")[1]);
  
  console.log('MapView scenario:', scenario);
  // Prepare appointments payload
  const appointmentsPayload = scenario?.jobs.map((job) => ({
    appointment_start: new Date(job.start).toISOString(),
    appointment_end: new Date(job.end).toISOString(),
    address: {
      street: job.street,
      zip_code: job.zip,
      city: job.city,
    },
    number_of_workers: job.workers,
  })) || [];


  // Fetch enriched addresses including lat/lng
  const { data, isLoading, error } = useQuery<EnhancedAddressResponse[]>({
    queryKey: ['enriched-appointments', date],
    queryFn: () =>
      axios.post('http://localhost:8080/api/appointments', appointmentsPayload).then((res) => res.data.address_responses),
    enabled: !!scenario,
    staleTime: 1000 * 60 * 60 * 10, //10 hours
  });
  const locations = data ?? [];


  // Load Google Maps SDK
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
  });
  const defaultCenter = { lat: 0, lng: 0 };

  // InfoWindow state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const bounds = new window.google.maps.LatLngBounds();
    locations.forEach((loc) => {
      if (loc.latitude != null && loc.longitude != null) {
        bounds.extend({ lat: loc.latitude, lng: loc.longitude });
      }
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds);
  }, [locations]);

  // guard before rendering map
  if (!scenario) return <div>No scenario found for date: {date.split("\"")}</div>;
  if (isLoading) return <div>Loading map data...</div>;
  if (error) return <div>Error loading map data: {String(error)}</div>;
  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  // render map
  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)]">
      <div className="p-2 bg-white shadow-md flex items-center">
        <button
          className="px-3 py-1 text-sm font-medium text-primary"
          onClick={() => navigate({ to: '/scenarios' })}
        >
          ← Back to Calendar
        </button>
      </div>
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={defaultCenter}
          zoom={12}
          onLoad={onMapLoad}
        >
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {locations.map((loc, idx) =>
                  loc.latitude != null && loc.longitude != null ? (
                    <Marker
                      key={idx}
                      position={{ lat: loc.latitude, lng: loc.longitude }}
                      onClick={() => setSelectedIdx(idx)}
                      clusterer={clusterer}
                    />
                  ) : null
                )}
              </>
            )}
          </MarkerClusterer>
          {selectedIdx !== null && locations[selectedIdx] && (
            <InfoWindow
              position={{ lat: locations[selectedIdx].latitude!, lng: locations[selectedIdx].longitude! }}
              onCloseClick={() => setSelectedIdx(null)}
            >
              <div className="p-2 text-sm">
                <strong>{locations[selectedIdx].street}</strong><br />
                {locations[selectedIdx].zipcode} {locations[selectedIdx].city}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
