import { RouteInputForm } from '@/components/RouteInputForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GoogleMap,
  InfoWindow,
  Marker,
  MarkerClusterer,
  useJsApiLoader,
} from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setEnrichedAppointments } from '../../store/enrichedAppointmentsSlice';
import { EnhancedAddressResponse } from '../../types/EnhancedAddressResponse';
import apiClient from '../../utils/apiClient';
import { toggleExcludedAppointment } from '../../store/excludedAppointmentsSlice';

export const Route = createFileRoute('/map-view/')({ component: MapView });

function MapView() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const dispatch = useDispatch<AppDispatch>();
  const excluded = useSelector(
    (s: RootState) => s.excludedAppointments[date] ?? [],
  );
  const scenario = scenarios.find(
    (s) => s.date.toString() === date.split('"')[1],
  );

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

  const cachedResponses = useSelector(
    (s: RootState) => s.enrichedAppointments[date],
  );
  // console.log('Cached responses:', cachedResponses);
  const initialData:
    | { address_responses: EnhancedAddressResponse[]; errors: string[] }
    | undefined = cachedResponses
    ? { address_responses: cachedResponses, errors: [] }
    : undefined;

  interface AppointmentResponse {
    address_responses: EnhancedAddressResponse[];
    errors: string[];
  }

  const queryOptions = {
    queryKey: ['enriched-appointments', date],
    queryFn: () =>
      apiClient
        .post('/api/appointments', appointmentsPayload)
        .then((res) => res.data as AppointmentResponse),
    enabled: !!scenario,
    staleTime: Infinity,
    select: (data: AppointmentResponse) => {
      dispatch(
        setEnrichedAppointments({
          date,
          address_responses: data.address_responses,
        }),
      );
      return data;
    },
    ...(initialData ? { initialData } : {}),
  };

  const {
    data: resp,
    isLoading,
    error,
  } = useQuery<AppointmentResponse, unknown>(queryOptions);

  const locations = useMemo<EnhancedAddressResponse[]>(
    () => resp?.address_responses ?? [],
    [resp],
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
  });
  const defaultCenter = { lat: 52.4369434, lng: 13.5451477 };

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach((loc: EnhancedAddressResponse) => {
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
  // if (isLoading) return <div>Loading map data...</div>;
  if (error) return <div>Error loading map data: {String(error)}</div>;
  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <>
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
                const isExcluded = excluded.includes(idx);
                return (
                  <li
                    key={idx}
                    role="listitem"
                    aria-selected={!isExcluded && selectedIdx === idx}
                    aria-invalid={hasError}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.click();
                      }
                    }}
                    className={
                      `p-2 rounded flex justify-between items-center ` +
                      (isExcluded
                        ? 'opacity-50 line-through cursor-default '
                        : 'cursor-pointer ') +
                      (!isExcluded && selectedIdx === idx
                        ? 'bg-blue-100 '
                        : '') +
                      (hasError
                        ? 'border border-red-500 text-red-600'
                        : 'hover:bg-gray-200 border border-blue-400')
                    }
                  >
                    <div
                      onClick={() => {
                        if (
                          !isExcluded &&
                          !hasError &&
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
                    >
                      <div className="text-sm font-medium text-left">
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
                    <Checkbox
                      checked={!isExcluded && !hasError}
                      onChange={() =>
                        dispatch(toggleExcludedAppointment({ date, idx }))
                      }
                      onClick={() =>
                        dispatch(toggleExcludedAppointment({ date, idx }))}
                      className="mr-2"
                      aria-label={
                        isExcluded
                          ? 'Include appointment'
                          : 'Exclude appointment'
                      }
                    />
                    {hasError && <span className="text-red-500">⚠️</span>}
                  </li>
                );
              })}
          </ul>
        </aside>
        {/* Map container */}

        {!isLoading ? (
          <div className="flex-1 flex flex-col">
            {/* Route input Form */}
            <div className="container p-1  rounded shadow">
              <div className="p-2 flex items-center justify-between border-b mb-2 ">
                <span className="flex items-center ">
                  <button
                    onClick={() => navigate({ to: '/scenarios' })}
                    className="pr-2 py-1 font-semibold text-2xl cursor-pointer"
                  >
                    ←
                  </button>
                  <h3 className="font-semibold text-lg  ">
                    Route & Worker Information
                  </h3>
                </span>

                <h2 className="text-lg font-semibold text-primary">
                  Map for{' '}
                  {new Date(scenario.date).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </h2>
              </div>
              <RouteInputForm date={date} />
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
                      {locations.map(
                        (loc: EnhancedAddressResponse, idx: number) =>
                          !excluded.includes(idx) &&
                          loc.latitude != null &&
                          loc.longitude != null ? (
                            <Marker
                              key={idx}
                              position={{
                                lat: loc.latitude,
                                lng: loc.longitude,
                              }}
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
                      {locations[selectedIdx].zipcode}{' '}
                      {locations[selectedIdx].city}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </div>
        ) : (
          <Skeleton className="flex-1 flex flex-col">
            <div className="p-2 bg-white shadow-md flex items-center justify-between">
              <button
                onClick={() => navigate({ to: '/scenarios' })}
                className="px-3 py-1 text-sm font-medium text-primary"
              >
                ← Back
              </button>
              <span>Loading Locations for map view...</span>
              <h2 className="text-lg font-semibold text-primary">
                Map for {new Date(scenario.date).toLocaleDateString()}
              </h2>
            </div>
          </Skeleton>
        )}
      </div>
    </>
  );
}
