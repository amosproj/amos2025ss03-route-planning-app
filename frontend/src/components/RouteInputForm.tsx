'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

const formSchema = z.object({
  startAddress: z.string().min(1, 'Start Address is required'),
  finishAddress: z.string().min(1, 'Finish Address is required'),
  workers: z.number().min(1).max(100),
  optimizationPlan: z.enum(['profit', 'time']).default('profit'),
});

type FormSchemaType = z.infer<typeof formSchema>;

export function RouteInputForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startAddress: '',
      finishAddress: '',
      workers: 1,
      optimizationPlan: 'profit',
    },
  });

  const onSubmit = (values: FormSchemaType) => {
    console.log('Form values:', values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full mx-auto p-6 bg-white rounded shadow"
      >
        {/* Start Address */}
        <FormField
          control={form.control}
          name="startAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter start address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Finish Address */}
        <FormField
          control={form.control}
          name="finishAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Finish Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter finish address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Number of Workers */}
        <FormField
          control={form.control}
          name="workers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Workers</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-4">
                  <Slider
                    defaultValue={[field.value]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([val]) => field.onChange(val)}
                    className="w-full"
                  />
                  <span className="font-medium">{field.value}</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optimization Plan */}
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
                    <SelectItem value="profit">Profit Optimization</SelectItem>
                    <SelectItem value="time">Time Optimization</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit"> Start Optimization</Button>
      </form>
    </Form>
  );
}
