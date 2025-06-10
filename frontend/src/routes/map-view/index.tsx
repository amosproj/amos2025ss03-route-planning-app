import { OptimizationBar } from '@/components/OptimizationBar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setEnrichedAppointments } from '../../store/enrichedAppointmentsSlice';
import { addSolution } from '../../store/solutionsSlice';
import { EnhancedAddressResponse } from '../../types/EnhancedAddressResponse';
import { Solution } from '../../types/Solution';
import { OptimizationRequest } from '../../types/OptimizationRequest';
import apiClient from '../../utils/apiClient';
import {
  toggleExcludedAppointment,
  setExcludedAppointments,
} from '../../store/excludedAppointmentsSlice';
import { Button } from '@/components/ui/button';
import { Fullscreen } from 'lucide-react';
import { RouteOverlay } from '@/components/RouteOverlay';
import Panel from '@/components/Panel';
import { createDepotMarkerIcon } from '@/utils/helper';

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
      address: job.address,
      number_of_workers: job.number_of_workers,
      service_time: 30,
      appointment_start: new Date(job.appointment_start).toISOString(),
      appointment_end: new Date(job.appointment_end).toISOString(),
    })) || [];

  // console.log('MapView appointmentsPayload', appointmentsPayload);

  const cachedResponses = useSelector(
    (s: RootState) => s.enrichedAppointments[date],
  );
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
    libraries: ['places'],
  });
  const defaultCenter = { lat: 52.4369434, lng: 13.5451477 };
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    defaultCenter,
  );

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const companyInfo = useSelector(
    (s: RootState) => s.companyInfo[date.split('"')[1]] ?? null,
  );
  const solution = useSelector(
    (s: RootState) => s.solutions.byDate[date],
  );

  // console.log('MapView companyInfo', companyInfo);
  const [startLoc, setStartLoc] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [finishLoc, setFinishLoc] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Optimization mutation
  const optimizationMutation = useMutation<
    Solution,
    Error,
    OptimizationRequest
  >({
    mutationFn: (req) =>
      apiClient
        .post<Solution>('/api/check-and-solve', req)
        .then((res) => res.data),
    onSuccess: (data) => {
      dispatch(addSolution({ date, solution: data }));
      console.log('Received solution:', data);
    },
    onError: (error) => console.error('Failed to get solution:', error),
  });

  const handleOptimize = () => {
    if (!scenario || !companyInfo) {
      alert('Please ensure scenario and company information are configured.');
      return;
    }

    const enhancedAppointments =
      scenario.jobs
        .filter((_, idx) => !excluded.includes(idx))
        .map((app) => {
          return {
            appointment_start: new Date(app.appointment_start)
              .toISOString()
              .replace('T', ' ')
              .split('.')[0]
              .concat('.000'),
            appointment_end: new Date(app.appointment_end)
              .toISOString()
              .replace('T', ' ')
              .split('.')[0]
              .concat('.000'),
            address: app.address,
            number_of_workers: app.number_of_workers,
            service_time: 15,
          };
        }) || [];

    // Create the request with properly formatted skills for the backend
    const alteredCompanyInfo = {
      start_address: companyInfo.start_address,
      finish_address: companyInfo.finish_address,
      vehicles: companyInfo.vehicles.map((v) => ({
        vehicle_id: v.vehicle_id,
        skills: [],
        worker_amount: v.worker_amount,
        operation_hours: v.operation_hours,
        start_address: v.depot?.start || companyInfo.start_address,
        finish_address: v.depot?.finish || companyInfo.finish_address,
      })),
    };

    // The backend expects an array of skills, not the frontend's string format
    const request: OptimizationRequest = {
      //@ts-expect-error // The backend expects a specific format for company info
      company_info: alteredCompanyInfo,
      appointments: enhancedAppointments,
    } ;

    // console.log(JSON.stringify(request, null, 2));
    optimizationMutation.mutate(request);
  };

  // Calculate metrics for OptimizationBar
  const includedJobs = scenario ? scenario.jobs.length - excluded.length : 0;
  const totalWorkers = companyInfo.vehicles.length || 0;
  const canOptimize = !!scenario && !!companyInfo && includedJobs > 0;

  // Check if start and end locations are the same (depot scenario)
  const isSameLocation = useMemo(() => {
    if (!startLoc || !finishLoc) return false;
    const threshold = 0.0001; // ~10 meters tolerance
    return (
      Math.abs(startLoc.lat - finishLoc.lat) < threshold &&
      Math.abs(startLoc.lng - finishLoc.lng) < threshold
    );
  }, [startLoc, finishLoc]);

  useEffect(() => {
    if (isLoaded && companyInfo) {
      const geocoder = new window.google.maps.Geocoder();
      const formatAddr = (addr: {
        street: string;
        zip_code: string;
        city: string;
      }) => `${addr.street}, ${addr.zip_code} ${addr.city}`;
      // Geocode start address
      if (companyInfo.start_address.street) {
        geocoder.geocode(
          { address: formatAddr(companyInfo.start_address) },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setStartLoc(results[0].geometry.location.toJSON());
            }
          },
        );
      }
      // Geocode finish address
      if (companyInfo.finish_address.street) {
        geocoder.geocode(
          { address: formatAddr(companyInfo.finish_address) },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setFinishLoc(results[0].geometry.location.toJSON());
            }
          },
        );
      }
    }
  }, [isLoaded, companyInfo]);

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
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        const center = bounds.getCenter();
        setMapCenter(center.toJSON());
      }
    },
    [locations],
  );

  const goHomeView = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = new window.google.maps.LatLngBounds();
    locations.forEach((loc) => {
      if (loc.latitude != null && loc.longitude != null) {
        bounds.extend({ lat: loc.latitude, lng: loc.longitude });
      }
    });
    if (startLoc) bounds.extend(startLoc);
    if (finishLoc) bounds.extend(finishLoc);
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [locations, startLoc, finishLoc]);

  if (!scenario)
    return <div>No scenario found for date: {date.split('"')}</div>;
  if (error) return <div>Error loading map data: {String(error)}</div>;
  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <>
      <div className="flex w-full h-[calc(100vh-4rem)]">
        <Panel
          date={date}
          jobs={scenario.jobs}
          locations={locations}
          excluded={excluded}
          selectedIdx={selectedIdx}
          onSelect={(idx) => {
            const loc = locations[idx];
            if (
              loc?.latitude != null &&
              loc?.longitude != null &&
              mapRef.current
            ) {
              mapRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
              mapRef.current.setZoom(14);
              setMapCenter({ lat: loc.latitude, lng: loc.longitude });
              setSelectedIdx(idx);
            }
          }}
          onToggleExclude={(idx) =>
            dispatch(toggleExcludedAppointment({ date, idx }))
          }
          onToggleAll={(selectAll) => {
            const allIdx = scenario.jobs.map((_, i) => i);
            dispatch(
              setExcludedAppointments({
                date,
                idxList: selectAll ? [] : allIdx,
              }),
            );
          }}
          optimizationErrors={[]}
        />
        {!isLoading ? (
          <div className="flex-1 flex flex-col">
            {/* Route input Form */}
            <div className="p-2 flex items-center justify-between border-b ">
              <span className="flex items-center ">
                <button
                  onClick={() => navigate({ to: '/scenarios' })}
                  className="pr-2 py-1 font-semibold text-2xl cursor-pointer"
                >
                  ←
                </button>
              </span>
              <OptimizationBar
                includedJobs={includedJobs}
                totalWorkers={totalWorkers}
                isOptimizing={optimizationMutation.isPending}
                canOptimize={canOptimize}
                onOptimize={handleOptimize}
                scenarioDate={scenario ? new Date(scenario.date) : undefined}
              />

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

            <div className="relative flex-1">
              <Button
                onClick={goHomeView}
                className="absolute top-3 right-14 z-10  rounded shadow"
              >
                <Fullscreen />{' '}
              </Button>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={12}
                onLoad={onMapLoad}
              >
                {locations.map((loc: EnhancedAddressResponse, idx: number) =>
                  !excluded.includes(idx) &&
                  loc.latitude != null &&
                  loc.longitude != null ? (
                    <Marker
                      key={idx}
                      position={{ lat: loc.latitude, lng: loc.longitude }}
                      onClick={() => setSelectedIdx(idx)}
                    />
                  ) : null,
                )}
                {/* Start and finish markers - or depot marker if same location */}
                {solution &&
                solution.routes.map((route) => {
                  if (route.appointments[0].address.street !== companyInfo?.start_address.street) {
                    return (
                      <Marker
                        key={route.vehicle_id}
                        position={{
                          lat: route.appointments[0].location.lat,
                          lng: route.appointments[0].location.lng,
                        }}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        }}
                        title="Depot (Start)"
                      />
                    );
                  }
                  
                })
                }
                {isSameLocation && startLoc ? (
                  <Marker
                    position={startLoc}
                    icon={{
                      url: createDepotMarkerIcon(),
                      scaledSize: new window.google.maps.Size(40, 40),
                      anchor: new window.google.maps.Point(20, 40),
                    }}
                    title="Depot (Start & End)"
                  />
                ) : (
                  <>
                    {startLoc && (
                      <Marker
                        position={startLoc}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        }}
                        title="Start Location"
                      />
                    )}
                    {finishLoc && (
                      <Marker
                        position={finishLoc}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        }}
                        title="End Location"
                      />
                    )}
                  </>
                )}
                <RouteOverlay map={mapRef.current} date={date} />
                {/* InfoWindow for selected appointment */}
                {selectedIdx !== null && locations[selectedIdx] && (
                  <InfoWindow
                    position={{
                      lat: locations[selectedIdx].latitude!,
                      lng: locations[selectedIdx].longitude!,
                    }}
                    onCloseClick={() => setSelectedIdx(null)}
                  >
                    <div className="bg-white p-4 rounded-lg shadow-lg min-w-[200px] space-y-2">
                      <div className="text-lg font-bold text-gray-800">
                        {new Date(
                          scenario.jobs[selectedIdx].appointment_start,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(
                          scenario.jobs[selectedIdx].appointment_end,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold">
                          {locations[selectedIdx].street}
                        </span>
                        , {locations[selectedIdx].zipcode}{' '}
                        {locations[selectedIdx].city}
                      </div>
                      <div className="text-sm text-gray-500">
                        Workers: {scenario.jobs[selectedIdx].number_of_workers}
                      </div>
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
