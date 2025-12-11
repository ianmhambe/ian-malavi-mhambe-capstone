const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@caresync.com' },
    update: {},
    create: {
      email: 'admin@caresync.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+1234567890',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Doctor Users
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctors = [
    {
      email: 'dr.smith@caresync.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567891',
      specialization: 'Cardiology',
      licenseNumber: 'MED-001-2024',
      bio: 'Experienced cardiologist with 15 years of practice.',
      consultationFee: 150,
      experience: 15,
    },
    {
      email: 'dr.johnson@caresync.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567892',
      specialization: 'Dermatology',
      licenseNumber: 'MED-002-2024',
      bio: 'Board-certified dermatologist specializing in skin conditions.',
      consultationFee: 120,
      experience: 10,
    },
    {
      email: 'dr.williams@caresync.com',
      firstName: 'Michael',
      lastName: 'Williams',
      phone: '+1234567893',
      specialization: 'Pediatrics',
      licenseNumber: 'MED-003-2024',
      bio: 'Caring pediatrician dedicated to child health.',
      consultationFee: 100,
      experience: 8,
    },
    {
      email: 'dr.brown@caresync.com',
      firstName: 'Emily',
      lastName: 'Brown',
      phone: '+1234567894',
      specialization: 'Orthopedics',
      licenseNumber: 'MED-004-2024',
      bio: 'Orthopedic surgeon specializing in sports injuries.',
      consultationFee: 200,
      experience: 12,
    },
  ];

  for (const doctorData of doctors) {
    const doctor = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        password: doctorPassword,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        phone: doctorData.phone,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialization: doctorData.specialization,
            licenseNumber: doctorData.licenseNumber,
            bio: doctorData.bio,
            consultationFee: doctorData.consultationFee,
            experience: doctorData.experience,
          },
        },
      },
      include: { doctorProfile: true },
    });

    // Add availability for each doctor (Monday to Friday, 9 AM to 5 PM)
    if (doctor.doctorProfile) {
      for (let day = 1; day <= 5; day++) {
        await prisma.doctorAvailability.upsert({
          where: {
            doctorProfileId_dayOfWeek: {
              doctorProfileId: doctor.doctorProfile.id,
              dayOfWeek: day,
            },
          },
          update: {},
          create: {
            doctorProfileId: doctor.doctorProfile.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            isActive: true,
          },
        });
      }
    }

    console.log('✅ Doctor user created:', doctor.email);
  }

  // Create Patient Users
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patients = [
    {
      email: 'patient1@example.com',
      firstName: 'Alice',
      lastName: 'Cooper',
      phone: '+1234567895',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Female',
      bloodGroup: 'A+',
    },
    {
      email: 'patient2@example.com',
      firstName: 'Bob',
      lastName: 'Davis',
      phone: '+1234567896',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'Male',
      bloodGroup: 'B+',
    },
    {
      email: 'patient3@example.com',
      firstName: 'Carol',
      lastName: 'Evans',
      phone: '+1234567897',
      dateOfBirth: new Date('1978-11-08'),
      gender: 'Female',
      bloodGroup: 'O-',
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.user.upsert({
      where: { email: patientData.email },
      update: {},
      create: {
        email: patientData.email,
        password: patientPassword,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phone: patientData.phone,
        role: 'PATIENT',
        patientProfile: {
          create: {
            dateOfBirth: patientData.dateOfBirth,
            gender: patientData.gender,
            bloodGroup: patientData.bloodGroup,
          },
        },
      },
    });
    console.log('✅ Patient user created:', patient.email);
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin: admin@caresync.com / admin123');
  console.log('Doctor: dr.smith@caresync.com / doctor123');
  console.log('Patient: patient1@example.com / patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
