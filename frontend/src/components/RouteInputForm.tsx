'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';

import { RootState } from '@/store';
import { setCompanyInfo } from '@/store/companyInfoSlice';

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
import { OptimizationRequest } from '@/types/OptimizationRequest';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Address } from '@/types/Adress';

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
  const dispatch = useDispatch();
  // load Google maps places API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const existingCompany = useSelector(
    (state: RootState) => state.companyInfo[date],
  );

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const excluded = useSelector(
    (s: RootState) => s.excludedAppointments[date] ?? [],
  );
  const scenario = scenarios.find(
    (s) => s.date.toString() === date.split('"')[1],
  );

  const [startAddrObj, setStartAddrObj] = useState<Address>(defaultAddr);
  const [finishAddrObj, setFinishAddrObj] = useState<Address>(defaultAddr);
  const [startAuto, setStartAuto] = useState<google.maps.places.Autocomplete | null>(null);
  const [finishAuto, setFinishAuto] = useState<google.maps.places.Autocomplete | null>(null);

  const parseAddress = (place: google.maps.places.PlaceResult): Address => {
    let streetNum = '', route = '', zip = '', city = '';
    place.address_components?.forEach(comp => {
      if (comp.types.includes('street_number')) streetNum = comp.long_name;
      if (comp.types.includes('route')) route = comp.long_name;
      if (comp.types.includes('postal_code')) zip = comp.long_name;
      if (comp.types.includes('locality') || comp.types.includes('postal_town')) city = comp.long_name;
    });
    return { street: `${streetNum} ${route}`.trim(), zip_code: zip, city };
  };

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startAddress: '',
      finishAddress: '',
      workers: 1,
      optimizationPlan: 'profit',
    },
  });

  useEffect(() => {
    // preload form values with existingCompany or default fallback
    const comp = existingCompany ?? {
      start_address: defaultAddr,
      finish_address: defaultAddr,
      vehicles: [{ id: 0, skills: [], woker_amount: 1 }],
    };
    // Build display strings only if any part is non-empty
    const hasStart = comp.start_address.street || comp.start_address.zip_code || comp.start_address.city;
    const hasFinish = comp.finish_address.street || comp.finish_address.zip_code || comp.finish_address.city;
    const displayStart = hasStart
      ? `${comp.start_address.street}${comp.start_address.street && ','} ${comp.start_address.zip_code} ${comp.start_address.city}`.trim()
      : '';
    const displayFinish = hasFinish
      ? `${comp.finish_address.street}${comp.finish_address.street && ','} ${comp.finish_address.zip_code} ${comp.finish_address.city}`.trim()
      : '';
    form.reset({
      startAddress: displayStart,
      finishAddress: displayFinish,
      workers: comp.vehicles[0]?.woker_amount || 1,
      optimizationPlan: 'profit',
    });
    setStartAddrObj(comp.start_address);
    setFinishAddrObj(comp.finish_address);
  }, [existingCompany, form]);

  const onSubmit = (values: FormSchemaType) => {
    const { workers } = values;
    // build companyInfo object
    const companyInfo = {
      start_address: startAddrObj,
      finish_address: finishAddrObj,
      vehicles: [{ id: 1, skills: [], woker_amount: workers }],
    };
    dispatch(setCompanyInfo({ date, companyInfo }));
    console.log('Form submitted:', values);
    // filter out excluded jobs for this date
    const appointments = scenario?.jobs.filter((_, idx) => !excluded.includes(idx)) || [];
    const request: OptimizationRequest = {
      company_info: companyInfo,
      appointments,
    };
    console.log('Optimization request:', request);
  };

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading address autocomplete...</div>;
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full mx-auto p-4 bg-white flex gap-5 justify-between items-end"
      >
        <div className="w-full">
          <FormField
            control={form.control}
            name="startAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Address</FormLabel>
                <FormControl>
                  <Autocomplete
                    onLoad={setStartAuto}
                    onPlaceChanged={() => {
                      if (startAuto) {
                        const place = startAuto.getPlace();
                        const addr = parseAddress(place);
                        setStartAddrObj(addr);
                        field.onChange(place.formatted_address || `${addr.street}, ${addr.zip_code} ${addr.city}`);
                      }
                    }}
                  >
                    <Input placeholder="Enter start address" {...field} />
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
              <FormItem>
                <FormLabel>Finish Address</FormLabel>
                <FormControl>
                  <Autocomplete
                    onLoad={setFinishAuto}
                    onPlaceChanged={() => {
                      if (finishAuto) {
                        const place = finishAuto.getPlace();
                        const addr = parseAddress(place);
                        setFinishAddrObj(addr);
                        field.onChange(place.formatted_address || `${addr.street}, ${addr.zip_code} ${addr.city}`);
                      }
                    }}
                  >
                    <Input placeholder="Enter finish address" {...field} />
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
              <FormItem>
                <FormLabel>Number of Workers</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-4 py-1.5">
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
              <FormItem>
                <FormLabel>Optimization Plan</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
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

        <Button type="submit">Start Optimization</Button>
      </form>
    </Form>
  );
}
