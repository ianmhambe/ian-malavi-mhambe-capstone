const { z } = require('zod');

// Update doctor profile schema
const updateDoctorSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  consultationFee: z.number().positive().optional(),
  experience: z.number().int().min(0).optional(),
});

// Doctor availability schema
const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  slotDuration: z.number().int().min(15).max(120).default(30),
  isActive: z.boolean().default(true),
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

// Bulk availability schema
const bulkAvailabilitySchema = z.object({
  availability: z.array(availabilitySchema).min(1),
});

// Doctor query params
const doctorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  specialization: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'consultationFee', 'experience']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Doctor slots query
const doctorSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

module.exports = {
  updateDoctorSchema,
  availabilitySchema,
  bulkAvailabilitySchema,
  doctorQuerySchema,
  doctorSlotsQuerySchema,
};
