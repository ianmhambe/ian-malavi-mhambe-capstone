import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Clock } from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour = h.toString().padStart(2, '0');
    const minute = m.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${hour}:${minute}`);
  }
}

const DoctorAvailability = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState(
    DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.value,
      isActive: day.value >= 1 && day.value <= 5, // Mon-Fri default
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
    }))
  );

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await doctorService.getMyAvailability();
      if (response.data && response.data.length > 0) {
        const existingAvailability = [...availability];
        response.data.forEach((item) => {
          const index = existingAvailability.findIndex(
            (a) => a.dayOfWeek === item.dayOfWeek
          );
          if (index !== -1) {
            existingAvailability[index] = {
              ...existingAvailability[index],
              isActive: item.isActive,
              startTime: item.startTime,
              endTime: item.endTime,
              slotDuration: item.slotDuration,
            };
          }
        });
        setAvailability(existingAvailability);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    // Validate times
    const invalidDays = availability.filter(
      (item) => item.isActive && item.startTime >= item.endTime
    );

    if (invalidDays.length > 0) {
      toast.error('End time must be after start time for all active days');
      return;
    }

    setSaving(true);
    try {
      await doctorService.setBulkAvailability(availability);
      toast.success('Availability updated successfully');
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
        <p className="text-gray-600">Set your working hours for each day of the week</p>
      </div>

      <div className="card">
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayAvailability = availability.find(
              (a) => a.dayOfWeek === day.value
            );

            return (
              <div
                key={day.value}
                className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border ${
                  dayAvailability?.isActive
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Day toggle */}
                <div className="flex items-center gap-3 w-32">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayAvailability?.isActive || false}
                      onChange={() => handleToggleDay(day.value)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                  <span className="font-medium">{day.label}</span>
                </div>

                {/* Time selectors */}
                {dayAvailability?.isActive && (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <select
                        value={dayAvailability.startTime}
                        onChange={(e) =>
                          handleTimeChange(day.value, 'startTime', e.target.value)
                        }
                        className="input py-1 px-2 w-24"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-500">to</span>
                      <select
                        value={dayAvailability.endTime}
                        onChange={(e) =>
                          handleTimeChange(day.value, 'endTime', e.target.value)
                        }
                        className="input py-1 px-2 w-24"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">Slot duration:</span>
                      <select
                        value={dayAvailability.slotDuration}
                        onChange={(e) =>
                          handleTimeChange(
                            day.value,
                            'slotDuration',
                            parseInt(e.target.value)
                          )
                        }
                        className="input py-1 px-2 w-24"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>
                  </div>
                )}

                {!dayAvailability?.isActive && (
                  <span className="text-gray-500 text-sm">Not available</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Availability
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
