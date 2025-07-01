import { z } from 'zod';

export const formSchema = z.object({
  startAddress: z.string().min(1, 'Start Address is required'),
  finishAddress: z.string().min(1, 'Finish Address is required'),
  vehicles: z
    .array(
      z.object({
        vehicle_id: z.number(),
        skills: z.array(z.string()),
        worker_amount: z
          .number()
          .min(1, 'Worker amount must be at least 1')
          .max(4, 'Worker amount cannot exceed 4'),
        operation_hours: z
          .object({
            start_minutes: z
              .number()
              .min(0, 'Start time must be at least 0 minutes')
              .max(1440, 'Start time cannot exceed 1440 minutes'),
            end_minutes: z
              .number()
              .min(0, 'End time must be at least 0 minutes')
              .max(1440, 'End time cannot exceed 1440 minutes'),
          })
          .refine((period) => {
            return period.end_minutes > period.start_minutes;
          }, 'Operation periods cannot overlap and end time must be after start time'),
        vehicle_break: z
          .object({
            duration: z
              .number()
              .min(1, 'Break duration must be at least 1 minute')
              .max(480, 'Break duration cannot exceed 480 minutes'),
            start_min: z
              .number()
              .min(0, 'Break start_min must be at least 0 minutes')
              .max(1440, 'Break start_min cannot exceed 1440 minutes'),
            start_max: z
              .number()
              .min(0, 'Break start_max must be at least 0 minutes')
              .max(1440, 'Break start_max cannot exceed 1440 minutes'),
          })
          .refine((b) => b.start_max > b.start_min, {
            message: 'Break start_max must be after start_min',
          })
          .nullable()
          .optional(),

        cost_per_km: z.number().min(0, 'Cost per km cannot be negative'),
        cost_per_hour: z.number().min(0, 'Cost per hour cannot be negative'),
        depot: z
          .object({
            start: z.object({
              street: z.string(),
              zip_code: z.string(),
              city: z.string(),
            }),
            finish: z.object({
              street: z.string(),
              zip_code: z.string(),
              city: z.string(),
            }),
          })
          .optional(),
      }),
    )
    .min(1, 'At least one vehicle is required'),
});

export type FormSchemaType = z.infer<typeof formSchema>;
