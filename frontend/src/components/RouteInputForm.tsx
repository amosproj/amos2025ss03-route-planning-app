'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';

import { RootState } from '@/store';
import { setWorkers } from '@/store/workersSlice';

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
  const dispatch = useDispatch();

  const existingWorker = useSelector(
    (state: RootState) => state.workers.workers,
  );

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startAddress: '',
      finishAddress: '',
      workers: 1,
      optimizationPlan: 'profit',
    },
  });

  // Set form values when store data is available
  useEffect(() => {
    if (existingWorker) {
      form.reset({
        startAddress: existingWorker.startAddress,
        finishAddress: existingWorker.finishAddress,
        workers: existingWorker.workers,
        optimizationPlan: 'profit', // keep default or load from another slice if needed
      });
    }
  }, [existingWorker, form]);

  const onSubmit = (values: FormSchemaType) => {
    const { startAddress, finishAddress, workers } = values;
    dispatch(setWorkers({ startAddress, finishAddress, workers }));
    console.log('Form submitted:', values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className=" w-full mx-auto p-4 bg-white  flex gap-5 justify-between items-end"
      >
        <div className="w-full ">
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
        </div>

        <div className="w-full">
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
        </div>

        <div className="w-full">
          <FormField
            control={form.control}
            name="workers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Workers</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-4  py-1.5">
                    <Slider
                      value={[field.value]}
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
