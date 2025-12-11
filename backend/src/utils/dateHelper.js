/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format time to HH:mm
 */
const formatTime = (date) => {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
};

/**
 * Parse time string (HH:mm) to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight to time string (HH:mm)
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Get day of week (0-6) from date
 */
const getDayOfWeek = (date) => {
  return new Date(date).getDay();
};

/**
 * Check if a time slot is available
 */
const isTimeSlotAvailable = (startTime, endTime, existingSlots) => {
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  for (const existing of existingSlots) {
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime);

    // Check for overlap
    if (slotStart < existingEnd && slotEnd > existingStart) {
      return false;
    }
  }

  return true;
};

/**
 * Generate time slots based on availability
 */
const generateTimeSlots = (startTime, endTime, slotDuration, bookedSlots = []) => {
  const slots = [];
  let currentStart = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (currentStart + slotDuration <= end) {
    const slotStartTime = minutesToTime(currentStart);
    const slotEndTime = minutesToTime(currentStart + slotDuration);

    const isBooked = bookedSlots.some(
      (booked) => booked.startTime === slotStartTime
    );

    slots.push({
      startTime: slotStartTime,
      endTime: slotEndTime,
      isAvailable: !isBooked,
    });

    currentStart += slotDuration;
  }

  return slots;
};

/**
 * Check if date is in the past
 */
const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

/**
 * Check if date is today
 */
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};

/**
 * Get start and end of day
 */
const getDayBounds = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of week
 */
const getWeekBounds = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of month
 */
const getMonthBounds = (date) => {
  const d = new Date(date);
  
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Add days to date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

module.exports = {
  formatDate,
  formatTime,
  timeToMinutes,
  minutesToTime,
  getDayOfWeek,
  isTimeSlotAvailable,
  generateTimeSlots,
  isPastDate,
  isToday,
  getDayBounds,
  getWeekBounds,
  getMonthBounds,
  addDays,
};
