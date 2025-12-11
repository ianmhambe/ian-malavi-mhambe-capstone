const prisma = require('../config/database');
const { getMonthBounds } = require('../utils/dateHelper');

class AdminService {
  /**
   * Get dashboard metrics
   */
  async getMetrics() {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      appointmentsByStatus,
      recentAppointments,
      monthlyStats,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total doctors
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      
      // Total patients
      prisma.user.count({ where: { role: 'PATIENT' } }),
      
      // Total appointments
      prisma.appointment.count(),
      
      // Appointments by status
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      
      // Recent appointments
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      
      // Monthly statistics
      this.getMonthlyStats(),
    ]);

    // Calculate completion rate
    const completed = appointmentsByStatus.find((s) => s.status === 'COMPLETED')?._count?.status || 0;
    const total = appointmentsByStatus.reduce((sum, s) => sum + s._count.status, 0);
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    // Format appointments by status
    const statusCounts = {
      PENDING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    appointmentsByStatus.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    return {
      overview: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        completionRate: parseFloat(completionRate),
      },
      appointmentsByStatus: statusCounts,
      recentAppointments,
      monthlyStats,
    };
  }

  /**
   * Get monthly statistics for the current year
   */
  async getMonthlyStats() {
    const currentYear = new Date().getFullYear();
    const stats = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);

      const [appointments, newUsers] = await Promise.all([
        prisma.appointment.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ]);

      stats.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        appointments,
        newUsers,
      });
    }

    return stats;
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(query) {
    const { page = 1, limit = 10, role, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Toggle user status
   */
  async toggleUserStatus(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deactivating admin
    if (user.role === 'ADMIN') {
      throw new Error('Cannot deactivate admin user');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete admin user');
    }

    await prisma.user.delete({ where: { id: userId } });
    return true;
  }

  /**
   * Get specialization statistics
   */
  async getSpecializationStats() {
    const stats = await prisma.doctorProfile.groupBy({
      by: ['specialization'],
      _count: { specialization: true },
    });

    return stats.map((s) => ({
      specialization: s.specialization,
      count: s._count.specialization,
    }));
  }
}

module.exports = new AdminService();
