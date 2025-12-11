const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { calculatePagination } = require('../utils/apiResponse');
const { isPastDate, getDayOfWeek, timeToMinutes } = require('../utils/dateHelper');
const notificationService = require('./notification.service');

class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(patientUserId, data) {
    const { doctorId, appointmentDate, startTime, endTime, reason } = data;

    // Get patient profile
    const patient = await prisma.user.findFirst({
      where: { id: patientUserId, role: 'PATIENT' },
      include: { patientProfile: true },
    });

    if (!patient || !patient.patientProfile) {
      throw new AppError('Patient profile not found', 404);
    }

    // Get doctor
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new AppError('Doctor not found', 404);
    }

    // Validate appointment date is not in the past
    if (isPastDate(appointmentDate)) {
      throw new AppError('Cannot book appointments in the past', 400);
    }

    // Check doctor availability for this day
    const dayOfWeek = getDayOfWeek(appointmentDate);
    const availability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorProfileId_dayOfWeek: {
          doctorProfileId: doctor.doctorProfile.id,
          dayOfWeek,
        },
      },
    });

    if (!availability || !availability.isActive) {
      throw new AppError('Doctor is not available on this day', 400);
    }

    // Validate time is within doctor's availability
    const slotStart = timeToMinutes(startTime);
    const slotEnd = timeToMinutes(endTime);
    const availStart = timeToMinutes(availability.startTime);
    const availEnd = timeToMinutes(availability.endTime);

    if (slotStart < availStart || slotEnd > availEnd) {
      throw new AppError('Selected time is outside doctor\'s available hours', 400);
    }

    // Check for conflicting appointments
    const appointmentDateObj = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.doctorProfile.id,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new AppError('This time slot is already booked', 409);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.patientProfile.id,
        doctorId: doctor.doctorProfile.id,
        appointmentDate: appointmentDateObj,
        startTime,
        endTime,
        reason,
        status: 'PENDING',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Send notification to doctor
    await notificationService.createNotification(
      doctor.id,
      'New Appointment Request',
      `${patient.firstName} ${patient.lastName} has requested an appointment on ${appointmentDate} at ${startTime}`,
      'appointment',
      { appointmentId: appointment.id }
    );

    return appointment;
  }

  /**
   * Get appointments with filters
   */
  async getAppointments(userId, role, query) {
    const { page, limit, status, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on role
    let where = {};

    if (role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({
        where: { userId },
      });
      if (!patient) throw new AppError('Patient profile not found', 404);
      where.patientId = patient.id;
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId },
      });
      if (!doctor) throw new AppError('Doctor profile not found', 404);
      where.doctorId = doctor.id;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.appointmentDate.lte = end;
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: calculatePagination(total, page, limit),
    };
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId, userId, role) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check authorization
    if (role !== 'ADMIN') {
      if (role === 'PATIENT') {
        const patient = await prisma.patientProfile.findUnique({ where: { userId } });
        if (!patient || appointment.patientId !== patient.id) {
          throw new AppError('Not authorized to view this appointment', 403);
        }
      } else if (role === 'DOCTOR') {
        const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
        if (!doctor || appointment.doctorId !== doctor.id) {
          throw new AppError('Not authorized to view this appointment', 403);
        }
      }
    }

    return appointment;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, userId, role, data) {
    const { status, notes } = data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Authorization checks
    if (role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId } });
      if (!patient || appointment.patientId !== patient.id) {
        throw new AppError('Not authorized to update this appointment', 403);
      }
      // Patients can only cancel
      if (status !== 'CANCELLED') {
        throw new AppError('Patients can only cancel appointments', 403);
      }
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
      if (!doctor || appointment.doctorId !== doctor.id) {
        throw new AppError('Not authorized to update this appointment', 403);
      }
      // Doctors can accept, reject, or complete
      if (!['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
        throw new AppError('Invalid status for doctor', 400);
      }
    }

    // Validate status transitions
    const validTransitions = {
      PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['COMPLETED', 'CANCELLED'],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[appointment.status].includes(status)) {
      throw new AppError(`Cannot change status from ${appointment.status} to ${status}`, 400);
    }

    // Update appointment
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        notes: notes || appointment.notes,
      },
      include: {
        patient: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        doctor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    });

    // Send notifications
    const statusMessages = {
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      COMPLETED: 'marked as completed',
      CANCELLED: 'cancelled',
    };

    if (role === 'DOCTOR') {
      await notificationService.createNotification(
        appointment.patient.user.id,
        `Appointment ${statusMessages[status]}`,
        `Your appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName} has been ${statusMessages[status]}.`,
        'appointment',
        { appointmentId: appointment.id }
      );
    } else if (role === 'PATIENT' && status === 'CANCELLED') {
      await notificationService.createNotification(
        appointment.doctor.user.id,
        'Appointment Cancelled',
        `${appointment.patient.user.firstName} ${appointment.patient.user.lastName} has cancelled their appointment.`,
        'appointment',
        { appointmentId: appointment.id }
      );
    }

    return updated;
  }

  /**
   * Get upcoming appointments for dashboard
   */
  async getUpcomingAppointments(userId, role, limit = 5) {
    let where = {
      appointmentDate: { gte: new Date() },
      status: { in: ['PENDING', 'ACCEPTED'] },
    };

    if (role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId } });
      if (!patient) return [];
      where.patientId = patient.id;
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
      if (!doctor) return [];
      where.doctorId = doctor.id;
    }

    return prisma.appointment.findMany({
      where,
      take: limit,
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      include: {
        patient: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  /**
   * Get all appointments (admin)
   */
  async getAllAppointments(query) {
    const { page, limit, status, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.appointmentDate.lte = end;
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          doctor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: calculatePagination(total, page, limit),
    };
  }
}

module.exports = new AppointmentService();
