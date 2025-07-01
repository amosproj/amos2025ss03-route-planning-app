import React from 'react';
import type { FieldArrayWithId, Control } from 'react-hook-form';
import type { FormSchemaType } from '@/schemas/formSchema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, Warehouse, Euro, X } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { getRouteColor } from '@/utils/routeColors';
import { timeToMinutes, minutesToTime } from '@/utils/helper';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWatch } from 'react-hook-form';

const AVAILABLE_SKILLS = [
  'Plumbing',
  'Electrical',
  'Painting',
  'Roofing',
  'Landscaping',
];

// Props for section
interface VehiclesSectionProps {
  fields: FieldArrayWithId<FormSchemaType, 'vehicles', 'id'>[];
  control: Control<FormSchemaType>;
  append: (value: FormSchemaType['vehicles'][0]) => void;
  remove: (index: number) => void;
  onEditDepot: (idx: number) => void;
  onEditCost: (idx: number) => void;
}

export const VehiclesSection: React.FC<VehiclesSectionProps> = ({
  fields,
  control,
  append,
  remove,
  onEditDepot,
  onEditCost,
}) => {
  // watch vehicles array to detect depot and cost presence
  const vehicles = useWatch({ control, name: 'vehicles' }) || [];
  console.log('VehiclesSection rendered with fields:', fields);
  return (
    <TabsContent value="vehicles">
      <div className="p-4 space-y-4 border rounded-lg bg-background h-full">
        <div className="overflow-y-auto h-[450px] space-y-4">
          {fields.map((field, index) => {
            const hasDepot = Boolean(vehicles[index]?.depot);
            const hasCost =
              vehicles[index]?.cost_per_km != null &&
              vehicles[index]?.cost_per_hour != null &&
              vehicles[index].cost_per_km > 0 &&
              vehicles[index].cost_per_hour > 0;
            return (
              <Card
                key={field.id}
                className="p-3 border-l-8"
                style={{ borderLeftColor: getRouteColor(index) }}
              >
                <div className="flex items-center justify-between space-x-4">
                  <div
                    className="w-16 h-16 rounded-xl border-2 flex items-center justify-center my-auto"
                    style={{ borderColor: getRouteColor(index) }}
                  >
                    <h4 className="text-2xl font-bold">{index + 1}</h4>
                  </div>
                  <div className="flex-1 flex flex-col lg:flex-row items-center gap-4">
                    <div className="flex flex-col space-y-2 items-center">
                      <FormField
                        control={control}
                        name={`vehicles.${index}.worker_amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-center">
                              Workers
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md w-32">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={field.value <= 1}
                                  onClick={() =>
                                    field.onChange(Math.max(1, field.value - 1))
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="flex-1 text-center py-1 text-sm">
                                  {field.value}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={field.value >= 4}
                                  onClick={() =>
                                    field.onChange(Math.min(4, field.value + 1))
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
                      <Separator />
                      <FormField
                        control={control}
                        name={`vehicles.${index}.operation_hours`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-2 p-1 border rounded-md bg-muted/20">
                                <Input
                                  type="time"
                                  value={minutesToTime(
                                    field.value.start_minutes,
                                  )}
                                  onChange={(e) =>
                                    field.onChange({
                                      ...field.value,
                                      start_minutes: timeToMinutes(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="h-7 text-xs"
                                />
                                <span className="text-xs text-muted-foreground">
                                  to
                                </span>
                                <Input
                                  type="time"
                                  value={minutesToTime(field.value.end_minutes)}
                                  onChange={(e) =>
                                    field.onChange({
                                      ...field.value,
                                      end_minutes: timeToMinutes(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="h-7 text-xs"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name={`vehicles.${index}.skills`}
                      render={({ field }) => {
                        const selected: string[] = Array.isArray(field.value) ? field.value : [];
                        const toggle = (skill: string) => {
                          const updated: string[] = selected.includes(skill)
                            ? selected.filter((s: string) => s !== skill)
                            : [...selected, skill];
                          field.onChange(updated);
                        };
                        return (
                          <FormItem className="w-full">
                            <FormLabel className="text-sm">Skills</FormLabel>
                            <FormControl>
                              <div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {selected.map((s: string) => (
                                    <Badge
                                      key={s}
                                      variant="default"
                                      className="cursor-pointer text-xs h-6"
                                      onClick={() => toggle(s)}
                                    >
                                      <span className="flex items-center">
                                        {s}
                                        <X className="h-3 w-3 ml-1" />
                                      </span>
                                    </Badge>
                                  ))}
                                </div>
                                <div className="border rounded-md p-2 bg-muted/30 text-xs">
                                  {AVAILABLE_SKILLS.filter(
                                    (s: string) => !selected.includes(s),
                                  ).map((skill: string) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="cursor-pointer text-xs h-6 mr-1 mb-1"
                                      onClick={() => toggle(skill)}
                                    >
                                      <span>{skill}</span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <div className="flex flex-col justify-end p-2 space-y-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={hasCost ? undefined : 'outline'}
                        onClick={() => onEditCost(index)}
                      >
                        <Euro className="h-4 w-4 mr-1" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={hasDepot ? undefined : 'outline'}
                        onClick={() => onEditDepot(index)}
                      >
                        <Warehouse className="h-4 w-4 mr-1" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Card
          onClick={() =>
            append({
              vehicle_id: fields.length,
              skills: [],
              worker_amount: 1,
              operation_hours: { start_minutes: 480, end_minutes: 960 },
              cost_per_km: 0.5,
              cost_per_hour: 45.0,
            })
          }
          className="p-3 border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 cursor-pointer"
        >
          <div className="flex items-center justify-center h-20">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </TabsContent>
  );
};
