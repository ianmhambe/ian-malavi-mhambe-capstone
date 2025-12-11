const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { calculatePagination } = require('../utils/apiResponse');
const { generateTimeSlots, getDayOfWeek } = require('../utils/dateHelper');

class DoctorService {
  /**
   * Get all doctors with pagination
   */
  async getAllDoctors(query) {
    const { page, limit, search, specialization, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      role: 'DOCTOR',
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { doctorProfile: { specialization: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(specialization && {
        doctorProfile: {
          specialization: { contains: specialization, mode: 'insensitive' },
        },
      }),
    };

    // Handle sorting for nested fields
    let orderBy = {};
    if (['consultationFee', 'experience'].includes(sortBy)) {
      orderBy = { doctorProfile: { [sortBy]: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [doctors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          createdAt: true,
          doctorProfile: {
            select: {
              id: true,
              specialization: true,
              bio: true,
              consultationFee: true,
              experience: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      doctors,
      pagination: calculatePagination(total, page, limit),
    };
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId) {
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        createdAt: true,
        doctorProfile: {
          include: {
            availability: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    return doctor;
  }

  /**
   * Get doctor profile by user ID
   */
  async getDoctorProfile(userId) {
    const doctor = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        createdAt: true,
        doctorProfile: {
          include: {
            availability: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    return doctor;
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(userId, data) {
    const { firstName, lastName, phone, ...profileData } = data;

    // Update user data
    const userData = {};
    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    if (phone !== undefined) userData.phone = phone;

    // Update profile data
    const doctorData = {};
    if (profileData.specialization) doctorData.specialization = profileData.specialization;
    if (profileData.bio !== undefined) doctorData.bio = profileData.bio;
    if (profileData.consultationFee !== undefined) doctorData.consultationFee = profileData.consultationFee;
    if (profileData.experience !== undefined) doctorData.experience = profileData.experience;

    const doctor = await prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        doctorProfile: {
          update: doctorData,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        doctorProfile: {
          include: {
            availability: true,
          },
        },
      },
    });

    return doctor;
  }

  /**
   * Get doctor availability
   */
  async getDoctorAvailability(doctorId) {
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new AppError('Doctor not found', 404);
    }

    const availability = await prisma.doctorAvailability.findMany({
      where: { doctorProfileId: doctor.doctorProfile.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availability;
  }

  /**
   * Set doctor availability
   */
  async setDoctorAvailability(userId, availabilityData) {
    const doctor = await prisma.user.findFirst({
      where: { id: userId, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new AppError('Doctor profile not found', 404);
    }

    const { dayOfWeek, startTime, endTime, slotDuration, isActive } = availabilityData;

    const availability = await prisma.doctorAvailability.upsert({
      where: {
        doctorProfileId_dayOfWeek: {
          doctorProfileId: doctor.doctorProfile.id,
          dayOfWeek,
        },
      },
      update: {
        startTime,
        endTime,
        slotDuration,
        isActive,
      },
      create: {
        doctorProfileId: doctor.doctorProfile.id,
        dayOfWeek,
        startTime,
        endTime,
        slotDuration,
        isActive,
      },
    });

    return availability;
  }

  /**
   * Set bulk doctor availability
   */
  async setBulkAvailability(userId, availabilityList) {
    const doctor = await prisma.user.findFirst({
      where: { id: userId, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new AppError('Doctor profile not found', 404);
    }

    const results = await Promise.all(
      availabilityList.map((item) =>
        prisma.doctorAvailability.upsert({
          where: {
            doctorProfileId_dayOfWeek: {
              doctorProfileId: doctor.doctorProfile.id,
              dayOfWeek: item.dayOfWeek,
            },
          },
          update: {
            startTime: item.startTime,
            endTime: item.endTime,
            slotDuration: item.slotDuration,
            isActive: item.isActive,
          },
          create: {
            doctorProfileId: doctor.doctorProfile.id,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            slotDuration: item.slotDuration,
            isActive: item.isActive,
          },
        })
      )
    );

    return results;
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId, date) {
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new AppError('Doctor not found', 404);
    }

    const dayOfWeek = getDayOfWeek(date);

    // Get availability for this day
    const availability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorProfileId_dayOfWeek: {
          doctorProfileId: doctor.doctorProfile.id,
          dayOfWeek,
        },
      },
    });

    if (!availability || !availability.isActive) {
      return { slots: [], message: 'Doctor is not available on this day' };
    }

    // Get existing appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.doctorProfile.id,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate available slots
    const slots = generateTimeSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDuration,
      existingAppointments
    );

    return { slots };
  }

  /**
   * Get specializations list
   */
  async getSpecializations() {
    const specializations = await prisma.doctorProfile.findMany({
      select: { specialization: true },
      distinct: ['specialization'],
      orderBy: { specialization: 'asc' },
    });

    return specializations.map((s) => s.specialization);
  }

  /**
   * Toggle doctor active status
   */
  async toggleDoctorStatus(doctorId) {
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: doctorId },
      data: { isActive: !doctor.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return updated;
  }

  /**
   * Delete doctor
   */
  async deleteDoctor(doctorId) {
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    await prisma.user.delete({
      where: { id: doctorId },
    });

    return true;
  }
}

module.exports = new DoctorService();
