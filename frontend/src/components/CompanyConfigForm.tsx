'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { z } from 'zod';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Address } from '@/types/Adress';
import { CompanyInfo } from '@/types/CompanyInfo';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, Truck, Minus, X } from 'lucide-react';
import { getRouteColor } from '@/utils/routeColors';

// validation schema for the form
const formSchema = z.object({
  startAddress: z.string().min(1, 'Start Address is required'),
  finishAddress: z.string().min(1, 'Finish Address is required'),
  vehicles: z
    .array(
      z.object({
        vehicle_id: z.number(),
        skills: z.string().nullable(),
        worker_amount: z
          .number()
          .min(1, 'Worker amount must be at least 1')
          .max(4, 'Worker amount cannot exceed 4'),
        operation_hours: z
          .array(
            z.object({
              start_minutes: z
                .number()
                .min(0, 'Start time must be at least 0 minutes')
                .max(1440, 'Start time cannot exceed 1440 minutes'),
              end_minutes: z
                .number()
                .min(0, 'End time must be at least 0 minutes')
                .max(1440, 'End time cannot exceed 1440 minutes'),
            }),
          )
          .min(1, 'At least one operation period is required')
          .refine((periods) => {
            // Check for overlapping periods and ensure end > start
            for (let i = 0; i < periods.length; i++) {
              if (periods[i].end_minutes <= periods[i].start_minutes) {
                return false;
              }
              for (let j = i + 1; j < periods.length; j++) {
                const a = periods[i];
                const b = periods[j];
                if (
                  a.start_minutes < b.end_minutes &&
                  a.end_minutes > b.start_minutes
                ) {
                  return false;
                }
              }
            }
            return true;
          }, 'Operation periods cannot overlap and end time must be after start time'),
      }),
    )
    .min(1, 'At least one vehicle is required'),
});

type FormSchemaType = z.infer<typeof formSchema>;

// predefined list of available skills
const AVAILABLE_SKILLS = [
  'Plumbing',
  'Electrical',
  'Painting',
  'Roofing',
  'Landscaping',
];

// default address for fallbacks
const defaultAddr: Address = { street: '', zip_code: '', city: '' };

// Helper functions for time conversion
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function CompanyConfigForm() {
  const dispatch = useDispatch<AppDispatch>();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Get default company info for all scenarios
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const firstScenarioDate =
    scenarios.length > 0 ? scenarios[0].date.toString() : null;
  const existingCompany = useSelector((state: RootState) =>
    firstScenarioDate ? state.companyInfo[firstScenarioDate] : null,
  );

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
      startAddress: '',
      finishAddress: '',
      vehicles: [
        {
          vehicle_id: 0,
          skills: null,
          worker_amount: 1,
          operation_hours: [{ start_minutes: 480, end_minutes: 960 }], // 8:00 AM to 4:00 PM
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'vehicles',
  });

  useEffect(() => {
    if (existingCompany) {
      const hasStart =
        existingCompany.start_address.street ||
        existingCompany.start_address.zip_code ||
        existingCompany.start_address.city;
      const hasFinish =
        existingCompany.finish_address.street ||
        existingCompany.finish_address.zip_code ||
        existingCompany.finish_address.city;

      const displayStart = hasStart
        ? `${existingCompany.start_address.street}${existingCompany.start_address.street && ','} ${existingCompany.start_address.zip_code} ${existingCompany.start_address.city}`.trim()
        : '';
      const displayFinish = hasFinish
        ? `${existingCompany.finish_address.street}${existingCompany.finish_address.street && ','} ${existingCompany.finish_address.zip_code} ${existingCompany.finish_address.city}`.trim()
        : '';

      form.reset({
        startAddress: displayStart,
        finishAddress: displayFinish,
        vehicles:
          existingCompany.vehicles.length > 0
            ? existingCompany.vehicles.map((vehicle) => ({
                ...vehicle,
                operation_hours: vehicle.operation_hours || [
                  { start_minutes: 480, end_minutes: 960 },
                ],
              }))
            : [
                {
                  vehicle_id: 0,
                  skills: null,
                  worker_amount: 1,
                  operation_hours: [{ start_minutes: 480, end_minutes: 960 }], // 8:00 AM to 4:00 PM
                },
              ],
      });

      setStartAddrObj(existingCompany.start_address);
      setFinishAddrObj(existingCompany.finish_address);
    }
  }, [existingCompany, form]);

  const onSubmit = (values: FormSchemaType) => {
    const companyInfo: CompanyInfo = {
      start_address: startAddrObj,
      finish_address: finishAddrObj,
      vehicles: values.vehicles,
    };

    // Apply to all scenarios
    scenarios.forEach((scenario) => {
      dispatch(
        setCompanyInfo({
          date: scenario.date.toString(),
          companyInfo,
        }),
      );
    });

    // alert('Company information saved successfully!');
  };

  const addVehicle = () => {
    const newId =
      fields.length > 0 ? Math.max(...fields.map((f) => f.vehicle_id)) + 1 : 0;
    append({
      vehicle_id: newId,
      skills: null,
      worker_amount: 1,
      operation_hours: [{ start_minutes: 480, end_minutes: 960 }], // 8:00 AM to 4:00 PM
    });
  };

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading address autocomplete...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="addresses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Vehicles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Addresses</CardTitle>
                <CardDescription>
                  Configure the start and finish addresses for your company
                  operations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                              field.onChange(
                                place.formatted_address ||
                                  `${addr.street}, ${addr.zip_code} ${addr.city}`,
                              );
                            }
                          }}
                        >
                          <Input {...field} placeholder="Enter start address" />
                        </Autocomplete>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              field.onChange(
                                place.formatted_address ||
                                  `${addr.street}, ${addr.zip_code} ${addr.city}`,
                              );
                            }
                          }}
                        >
                          <Input
                            {...field}
                            placeholder="Enter finish address"
                          />
                        </Autocomplete>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Fleet Configuration</CardTitle>
                <CardDescription>
                  Configure your vehicle fleet and worker assignments.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid space-y-4">
                {fields.map((field, index) => (
                  <Card
                    key={field.id}
                    className="p-3 border-l-8"
                    style={{ borderLeftColor: getRouteColor(index) }}
                  >
                    <div className="flex flex-row items-center justify-between mb-1">
                      <div
                        style={{
                          // backgroundColor: `${getRouteColor(index)}20`,
                          borderColor: getRouteColor(index),
                        }}
                        className="w-16 h-16 rounded-xl border-2 shadow-lg flex items-center justify-center bg-opacity-10 hover:shadow-xl transition-shadow duration-200"
                      >
                        <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {index + 1}
                        </h4>
                      </div>
                      <div className="flex flex-col items-center justify-between gap-4">
                        <FormField
                          control={form.control}
                          name={`vehicles.${index}.worker_amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-center">Workers</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md w-32">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-r-none border-r"
                                    disabled={field.value <= 1}
                                    onClick={() =>
                                      field.onChange(
                                        Math.max(1, field.value - 1),
                                      )
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <div className="flex-1 text-center py-1 bg-background text-sm">
                                    {field.value}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-l-none border-l"
                                    disabled={field.value >= 4}
                                    onClick={() =>
                                      field.onChange(
                                        Math.min(4, field.value + 1),
                                      )
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className='h-0.5 bg-gray-300/60 w-full rounded-2xl'></div>
                        {/* <hr className="my-1 border-gray-400 " /> */}
                        <FormField
                          control={form.control}
                          name={`vehicles.${index}.operation_hours`}
                          render={({ field }) => (
                            <FormItem className="">
                              <FormControl>
                                <div className="space-y-2">
                                  {/* Time periods */}
                                  {field.value.map((period, periodIndex) => (
                                    <div
                                      key={periodIndex}
                                      className="flex items-center gap-2 p-1 border rounded-md bg-muted/20"
                                    >
                                      <Input
                                        type="time"
                                        value={minutesToTime(
                                          period.start_minutes,
                                        )}
                                        onChange={(e) => {
                                          const newPeriods = [...field.value];
                                          newPeriods[
                                            periodIndex
                                          ].start_minutes = timeToMinutes(
                                            e.target.value,
                                          );
                                          field.onChange(newPeriods);
                                        }}
                                        className="h-7 text-xs"
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        to
                                      </span>
                                      <Input
                                        type="time"
                                        value={minutesToTime(
                                          period.end_minutes,
                                        )}
                                        onChange={(e) => {
                                          const newPeriods = [...field.value];
                                          newPeriods[periodIndex].end_minutes =
                                            timeToMinutes(e.target.value);
                                          field.onChange(newPeriods);
                                        }}
                                        className="h-7 text-xs"
                                      />
                                      {field.value.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => {
                                            const newPeriods =
                                              field.value.filter(
                                                (_, i) => i !== periodIndex,
                                              );
                                            field.onChange(newPeriods);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  {/* Add period button */}
                                  {/* <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const newPeriod = {
                                        start_minutes: 480,
                                        end_minutes: 960,
                                      }; // 8:00 AM to 4:00 PM
                                      field.onChange([
                                        ...field.value,
                                        newPeriod,
                                      ]);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Period
                                  </Button> */}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.skills`}
                        render={({ field }) => {
                          const selectedSkills = field.value
                            ? field.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : [];

                          const toggleSkill = (skill: string) => {
                            const currentSkills = selectedSkills;
                            const updatedSkills = currentSkills.includes(skill)
                              ? currentSkills.filter((s) => s !== skill)
                              : [...currentSkills, skill];
                            field.onChange(
                              updatedSkills.length > 0
                                ? updatedSkills.join(', ')
                                : null,
                            );
                          };

                          const removeSkill = (skill: string) => {
                            const updatedSkills = selectedSkills.filter(
                              (s) => s !== skill,
                            );
                            field.onChange(
                              updatedSkills.length > 0
                                ? updatedSkills.join(', ')
                                : null,
                            );
                          };

                          return (
                            <FormItem className="w-1/2">
                              <FormLabel className="text-sm">Skills</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  {/* Display selected skills */}
                                  {selectedSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {selectedSkills.map((skill) => (
                                        <Badge
                                          key={skill}
                                          variant="default"
                                          className="cursor-pointer hover:bg-destructive hover:text-white text-xs h-6"
                                          onClick={() => removeSkill(skill)}
                                        >
                                          {skill}
                                          <X className="h-3 w-3 ml-1" />
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* Available skills selection */}
                                  <div className="border rounded-md p-2 bg-muted/30">
                                    <div className="text-xs font-medium mb-1">
                                      Available:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {AVAILABLE_SKILLS.filter(
                                        (skill) =>
                                          !selectedSkills.includes(skill),
                                      ).map((skill) => (
                                        <Badge
                                          key={skill}
                                          variant="outline"
                                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs h-6"
                                          onClick={() => toggleSkill(skill)}
                                        >
                                          {skill}
                                          <Plus className="h-3 w-3 ml-1" />
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {fields.length > 1 && (
                        <Button
                          className="mr-4"
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Add Vehicle Skeleton Component */}
                <Card
                  className="p-3 border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-all duration-200 cursor-pointer group shadow-inner"
                  onClick={addVehicle}
                  role="button"
                  tabIndex={0}
                  aria-label="Add new vehicle"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      addVehicle();
                    }
                  }}
                >
                  <div className="flex items-center justify-center min-h-[120px] opacity-60 group-hover:opacity-80 transition-opacity duration-200">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border-2 border-muted-foreground/40 flex items-center justify-center bg-muted/40 group-hover:border-primary/60 group-hover:bg-primary/10 transition-all duration-200">
                        <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                      </div>
                      {/* <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors duration-200">
                        Add Vehicle
                      </span> */}
                    </div>
                  </div>
                </Card>

                {fields.length === 0 && (
                  <div className="text-center p-8 text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      No vehicles configured. Add at least one vehicle to
                      continue.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button type="submit" size="lg">
            Save Company Configuration
          </Button>
        </div>
      </form>
    </Form>
  );
}
