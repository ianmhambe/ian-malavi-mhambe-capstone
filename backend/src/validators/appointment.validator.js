const { z } = require('zod');

// Create appointment schema
const createAppointmentSchema = z.object({
  doctorId: z.string().cuid('Invalid doctor ID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
}).refine(
  (data) => {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Update appointment status schema
const updateAppointmentStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
});

// Appointment query params
const appointmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  sortBy: z.enum(['appointmentDate', 'createdAt', 'status']).default('appointmentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
};
