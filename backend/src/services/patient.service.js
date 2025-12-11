const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { calculatePagination } = require('../utils/apiResponse');

class PatientService {
  /**
   * Get all patients with pagination
   */
  async getAllPatients(query) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      role: 'PATIENT',
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          patientProfile: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      patients,
      pagination: calculatePagination(total, page, limit),
    };
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId) {
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: 'PATIENT',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        patientProfile: true,
      },
    });

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return patient;
  }

  /**
   * Get patient profile by user ID
   */
  async getPatientProfile(userId) {
    const patient = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'PATIENT',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        patientProfile: true,
      },
    });

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return patient;
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(userId, data) {
    const { firstName, lastName, phone, ...profileData } = data;

    // Update user data
    const userData = {};
    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    if (phone !== undefined) userData.phone = phone;

    // Update profile data
    const patientData = {};
    if (profileData.dateOfBirth) patientData.dateOfBirth = new Date(profileData.dateOfBirth);
    if (profileData.gender !== undefined) patientData.gender = profileData.gender;
    if (profileData.address !== undefined) patientData.address = profileData.address;
    if (profileData.bloodGroup !== undefined) patientData.bloodGroup = profileData.bloodGroup;
    if (profileData.allergies !== undefined) patientData.allergies = profileData.allergies;
    if (profileData.medicalHistory !== undefined) patientData.medicalHistory = profileData.medicalHistory;

    const patient = await prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        patientProfile: {
          update: patientData,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        patientProfile: true,
      },
    });

    return patient;
  }

  /**
   * Toggle patient active status
   */
  async togglePatientStatus(patientId) {
    const patient = await prisma.user.findFirst({
      where: { id: patientId, role: 'PATIENT' },
    });

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: patientId },
      data: { isActive: !patient.isActive },
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
   * Delete patient
   */
  async deletePatient(patientId) {
    const patient = await prisma.user.findFirst({
      where: { id: patientId, role: 'PATIENT' },
    });

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    await prisma.user.delete({
      where: { id: patientId },
    });

    return true;
  }
}

module.exports = new PatientService();
