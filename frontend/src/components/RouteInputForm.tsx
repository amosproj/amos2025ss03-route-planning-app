'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '@/utils/apiClient';
import { addSolution } from '@/store/solutionsSlice';
import { Solution } from '@/types/Solution';
import type { AppDispatch, RootState } from '@/store';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Address } from '@/types/Adress';
import { OptimizationRequest } from '@/types/OptimizationRequest';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// validation schema for the form
const formSchema = z.object({
  startAddress: z.string().min(1, 'Start Address is required'),
  finishAddress: z.string().min(1, 'Finish Address is required'),
  workers: z.number().min(1).max(100),
  optimizationPlan: z.enum(['profit', 'time']).default('profit').optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

// default address for fallbacks
const defaultAddr: Address = { street: '', zip_code: '', city: '' };

export function RouteInputForm({ date }: { date: string }) {
  const dispatch = useDispatch<AppDispatch>();

  const parsedDate = date.split('"')[1];
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const existingCompany = useSelector(
    (state: RootState) => state.companyInfo[parsedDate],
  );

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const excluded = useSelector(
    (s: RootState) => s.excludedAppointments[date] ?? [],
  );
  const scenario = scenarios.find((s) => s.date.toString() === parsedDate);

  const [startAddrObj, setStartAddrObj] = useState<Address>(defaultAddr);
  const [finishAddrObj, setFinishAddrObj] = useState<Address>(defaultAddr);
  const [startAuto, setStartAuto] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [finishAuto, setFinishAuto] =
    useState<google.maps.places.Autocomplete | null>(null);

  // function to parse Google Places API response into Address object
  const parseAddress = (place: google.maps.places.PlaceResult): Address => {
    let streetNum = '',
      route = '',
      zip = '',
      city = '';
    place.address_components?.forEach((comp) => {
      if (comp.types.includes('street_number')) streetNum = comp.long_name;
      if (comp.types.includes('route')) route = comp.long_name;
      if (comp.types.includes('postal_code')) zip = comp.long_name;
      if (comp.types.includes('locality') || comp.types.includes('postal_town'))
        city = comp.long_name;
    });
    return { street: `${streetNum} ${route}`.trim(), zip_code: zip, city };
  };

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startAddress: existingCompany?.start_address
        ? `${existingCompany.start_address.street}, ${existingCompany.start_address.zip_code} ${existingCompany.start_address.city}`
        : '',
      finishAddress: existingCompany?.finish_address
        ? `${existingCompany.finish_address.street}, ${existingCompany.finish_address.zip_code} ${existingCompany.finish_address.city}`
        : '',
      workers: existingCompany?.vehicles.length || 1,
      optimizationPlan: 'profit',
    },
  });

  useEffect(() => {
    // preload form values with existingCompany or default fallback
    const comp = existingCompany ?? {
      start_address: defaultAddr,
      finish_address: defaultAddr,
      // vehicles: [{ id: 0, skills: [], woker_amount: 1 }],
    };
    // Build display strings only if any part is non-empty
    const hasStart =
      comp.start_address.street ||
      comp.start_address.zip_code ||
      comp.start_address.city;
    const hasFinish =
      comp.finish_address.street ||
      comp.finish_address.zip_code ||
      comp.finish_address.city;
    const displayStart = hasStart
      ? `${comp.start_address.street}${comp.start_address.street && ','} ${comp.start_address.zip_code} ${comp.start_address.city}`.trim()
      : '';
    const displayFinish = hasFinish
      ? `${comp.finish_address.street}${comp.finish_address.street && ','} ${comp.finish_address.zip_code} ${comp.finish_address.city}`.trim()
      : '';
    form.reset({
      startAddress: displayStart,
      finishAddress: displayFinish,
      workers: comp.vehicles.length || 1,
      optimizationPlan: 'profit',
    });
    setStartAddrObj(comp.start_address);
    setFinishAddrObj(comp.finish_address);
  }, [existingCompany, form]);

  // react-query mutation for optimization
  const mutation = useMutation<Solution, Error, OptimizationRequest>({
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

  // form submit handler triggers react-query mutation
  const onSubmit = () => {
    const enhancedAppointments =
      scenario?.jobs
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
    const companyInfo = {
      start_address: startAddrObj,
      finish_address: finishAddrObj,
      number_of_workers: existingCompany.vehicles,
    };
    const request: OptimizationRequest = {
      //@ts-expect-error type mismatch, but we handle it
      company_info: companyInfo,
      appointments: enhancedAppointments,
    };
    console.log('Optimization request:', request);
    mutation.mutate(request);
  };

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading address autocomplete...</div>;
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full mx-auto p-1 bg-white flex gap-2 justify-between items-end"
      >
        <div className="w-full">
          <FormField
            control={form.control}
            name="startAddress"
            render={({ field }) => (
              <FormItem className="gap-1 py-1">
                <FormLabel>Start Address</FormLabel>
                <FormControl>
                  <Autocomplete
                    onLoad={setStartAuto}
                    onPlaceChanged={() => {
                      if (startAuto) {
                        const place = startAuto.getPlace();
                        const addr = parseAddress(place);
                        setStartAddrObj(addr);
                        field.onChange(
                          place.formatted_address ||
                            `${addr.street}, ${addr.zip_code} ${addr.city}`,
                        );
                      }
                    }}
                  >
                    <Input {...field} placeholder="Enter start address" className="h-7" />
                  </Autocomplete>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-full">
          <FormField
            control={form.control}
            name="finishAddress"
            render={({ field }) => (
              <FormItem className="gap-1 py-1">
                <FormLabel>Finish Address</FormLabel>
                <FormControl>
                  <Autocomplete
                    onLoad={setFinishAuto}
                    onPlaceChanged={() => {
                      if (finishAuto) {
                        const place = finishAuto.getPlace();
                        const addr = parseAddress(place);
                        setFinishAddrObj(addr);
                        field.onChange(
                          place.formatted_address ||
                            `${addr.street}, ${addr.zip_code} ${addr.city}`,
                        );
                      }
                    }}
                  >
                    <Input {...field} placeholder="Enter finish address" className="h-7" />
                  </Autocomplete>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-full">
          <FormField
            control={form.control}
            name="workers"
            render={({ field }) => (
              <FormItem className="gap-1 py-1">
                <FormLabel>Number of Workers</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-1 py-1">
                    <Slider
                      value={[field.value ?? 1]}
                      onValueChange={([val]) => field.onChange(val)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <span className="font-medium">{field.value}</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-full">
          <FormField
            control={form.control}
            name="optimizationPlan"
            render={({ field }) => (
              <FormItem className="gap-1 py-1">
                <FormLabel>Optimization Plan</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger size="sm" className="w-full h-7">
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit">
                        Profit Optimization
                      </SelectItem>
                      <SelectItem value="time">Time Optimization</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button size="sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Optimizing...' : 'Start Optimization'}
        </Button>
      </form>
    </Form>
  );
}
