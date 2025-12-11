import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, Stethoscope } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { useAuthStore } from '../../store/authStore';
import StatsCard from '../../components/StatsCard';
import AppointmentCard from '../../components/AppointmentCard';
import Spinner from '../../components/Spinner';
import { toast } from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, allAppointmentsRes] = await Promise.all([
        appointmentService.getUpcomingAppointments(5),
        appointmentService.getMyAppointments({ limit: 100 }),
      ]);

      setUpcomingAppointments(appointmentsRes.data);

      const appointments = allAppointmentsRes.data;
      setStats({
        total: appointments.length,
        upcoming: appointments.filter((a) => ['PENDING', 'ACCEPTED'].includes(a.status)).length,
        completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (status, appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, { status });
      toast.success('Appointment cancelled successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel appointment');
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
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600">Here&apos;s an overview of your health appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Total Appointments"
          value={stats.total}
          icon={Calendar}
          color="primary"
        />
        <StatsCard
          title="Upcoming"
          value={stats.upcoming}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={Users}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/patient/doctors" className="btn-primary">
            <Stethoscope className="w-5 h-5 mr-2" />
            Find a Doctor
          </Link>
          <Link to="/patient/appointments" className="btn-outline">
            <Calendar className="w-5 h-5 mr-2" />
            View All Appointments
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
          <Link to="/patient/appointments" className="text-primary-600 hover:underline text-sm">
            View All
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="card text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No upcoming appointments</p>
            <Link to="/patient/doctors" className="btn-primary">
              Book an Appointment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                userRole="PATIENT"
                onAction={handleCancelAppointment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
