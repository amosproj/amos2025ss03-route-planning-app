import { createFileRoute } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { EnhancedAddressResponse } from '../../types/EnhancedAddressResponse';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer,
} from '@react-google-maps/api';
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/map-view/')({ component: MapView });

function MapView() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const scenario = scenarios.find(
    (s) => s.date.toString() === date.split('"')[1],
  );

  console.log('MapView scenario:', scenario);
  // Prepare appointments payload
  const appointmentsPayload =
    scenario?.jobs.map((job) => ({
      appointment_start: new Date(job.start).toISOString(),
      appointment_end: new Date(job.end).toISOString(),
      address: {
        street: job.street,
        zip_code: job.zip,
        city: job.city,
      },
      number_of_workers: job.workers,
    })) || [];

  interface AppointmentResponse {
    address_responses: EnhancedAddressResponse[];
    errors: string[];
  }
  const {
    data: resp,
    isLoading,
    error,
  } = useQuery<AppointmentResponse>({
    queryKey: ['enriched-appointments', date],
    queryFn: () =>
      axios
        .post('http://localhost:8080/api/appointments', appointmentsPayload)
        .then((res) => res.data as AppointmentResponse),
    enabled: !!scenario,
    staleTime: 1000 * 60 * 60 * 10,
  });
  const locations = resp?.address_responses ?? [];

  // Load Google Maps SDK
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
  });
  const defaultCenter = { lat: 52.4369434, lng: 13.5451477 };

  // InfoWindow state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach((loc) => {
        if (loc.latitude != null && loc.longitude != null) {
          bounds.extend({ lat: loc.latitude, lng: loc.longitude });
        }
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds);
    },
    [locations],
  );

  if (!scenario)
    return <div>No scenario found for date: {date.split('"')}</div>;
  if (isLoading) return <div>Loading map data...</div>;
  if (error) return <div>Error loading map data: {String(error)}</div>;
  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="flex w-full h-[calc(100vh-4rem)]">
      {/* Side panel */}
      <aside
        className="w-80 bg-white border-r overflow-y-auto p-4"
        role="region"
        aria-label="Appointments list"
      >
        <h3 className="text-lg font-semibold mb-2">Appointments</h3>
        <ul role="list" className="space-y-2">
          {scenario.jobs
            .map((job, idx) => ({ job, idx }))
            .sort((a, b) => a.job.start - b.job.start)
            .map(({ job, idx }) => {
              const loc = locations[idx];
              const hasError = loc?.could_be_fully_found === false;
              return (
                <li
                  key={idx}
                  role="listitem"
                  aria-selected={selectedIdx === idx}
                  aria-invalid={hasError}
                  tabIndex={0}
                  onClick={() => {
                    if (
                      loc?.latitude != null &&
                      loc?.longitude != null &&
                      mapRef.current
                    ) {
                      mapRef.current.panTo({
                        lat: loc.latitude,
                        lng: loc.longitude,
                      });
                      mapRef.current.setZoom(14);
                      setSelectedIdx(idx);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.click();
                    }
                  }}
                  className={
                    `p-2 rounded cursor-pointer flex justify-between items-center` +
                    (selectedIdx === idx ? 'bg-blue-100 ' : '') + 
                    (hasError
                      ? 'border border-red-500 text-red-600'
                      : 'hover:bg-gray-200 border border-blue-400')
                  }
                >
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(job.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(job.end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-700">
                      {job.street}, {job.zip} {job.city}
                    </div>
                  </div>
                  {hasError && <span className="text-red-500">⚠️</span>}
                </li>
              );
            })}
        </ul>
      </aside>
      {/* Map container */}
      <div className="flex-1 flex flex-col">
        <div className="p-2 bg-white shadow-md flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/scenarios' })}
            className="px-3 py-1 text-sm font-medium text-primary"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-primary">
            Map for {new Date(scenario.date).toLocaleDateString()}
          </h2>
        </div>
        <div className="flex-1">
          {/* Existing GoogleMap component */}
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
                    ) : null,
                  )}
                </>
              )}
            </MarkerClusterer>
            {selectedIdx !== null && locations[selectedIdx] && (
              <InfoWindow
                position={{
                  lat: locations[selectedIdx].latitude!,
                  lng: locations[selectedIdx].longitude!,
                }}
                onCloseClick={() => setSelectedIdx(null)}
              >
                {/* Info content */}
                <div className="p-2 text-sm">
                  <strong>
                    {new Date(
                      scenario.jobs[selectedIdx].start,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(
                      scenario.jobs[selectedIdx].end,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                  <br />
                  <strong>{locations[selectedIdx].street}</strong>
                  <br />
                  {locations[selectedIdx].zipcode} {locations[selectedIdx].city}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}
