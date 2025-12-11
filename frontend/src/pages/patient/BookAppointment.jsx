import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Clock, DollarSign, User } from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import Calendar from '../../components/Calendar';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchDoctor = async () => {
    try {
      const response = await doctorService.getDoctorById(doctorId);
      setDoctor(response.data);
    } catch (error) {
      toast.error('Failed to load doctor information');
      navigate('/patient/doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await doctorService.getAvailableSlots(doctorId, dateStr);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Please select a date, time, and provide a reason');
      return;
    }

    setBookingLoading(true);
    try {
      await appointmentService.createAppointment({
        doctorId,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason,
      });

      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to book appointment';
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Doctor not found</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Doctors
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor info */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {doctor.firstName[0]}{doctor.lastName[0]}
                </span>
              </div>
              <h2 className="text-xl font-semibold">
                Dr. {doctor.firstName} {doctor.lastName}
              </h2>
              <p className="text-primary-600">{doctor.doctorProfile?.specialization}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>{doctor.doctorProfile?.experience || 0} years experience</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span>${doctor.doctorProfile?.consultationFee || 0} consultation fee</span>
              </div>
            </div>

            {doctor.doctorProfile?.bio && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-gray-600 text-sm">{doctor.doctorProfile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Select Date</h3>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={new Date()}
            />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                Available Times for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>

              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No available slots for this date
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                      disabled={!slot.isAvailable}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors
                        ${
                          !slot.isAvailable
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedSlot?.startTime === slot.startTime
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-primary-100'
                        }
                      `}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          {selectedSlot && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Reason for Visit</h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe your symptoms or reason for the appointment..."
                className="input min-h-[120px]"
                required
              />
            </div>
          )}

          {/* Book button */}
          {selectedDate && selectedSlot && (
            <div className="card">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-gray-600">Selected appointment:</p>
                  <p className="font-semibold">
                    {format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot.startTime}
                  </p>
                </div>
                <Button
                  onClick={handleBookAppointment}
                  loading={bookingLoading}
                  disabled={!reason.trim()}
                  className="w-full sm:w-auto"
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
