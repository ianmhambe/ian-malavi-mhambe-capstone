import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { useAuthStore } from '../../store/authStore';
import StatsCard from '../../components/StatsCard';
import AppointmentCard from '../../components/AppointmentCard';
import Spinner from '../../components/Spinner';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    todayCount: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [upcomingRes, allAppointmentsRes] = await Promise.all([
        appointmentService.getUpcomingAppointments(5),
        appointmentService.getMyAppointments({ limit: 100 }),
      ]);

      const allAppointments = allAppointmentsRes.data;
      const today = new Date().toISOString().split('T')[0];
      
      setUpcomingAppointments(upcomingRes.data);
      setPendingAppointments(allAppointments.filter((a) => a.status === 'PENDING').slice(0, 5));
      
      setStats({
        total: allAppointments.length,
        pending: allAppointments.filter((a) => a.status === 'PENDING').length,
        todayCount: allAppointments.filter((a) => 
          a.appointmentDate.split('T')[0] === today && 
          ['PENDING', 'ACCEPTED'].includes(a.status)
        ).length,
        completed: allAppointments.filter((a) => a.status === 'COMPLETED').length,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (status, appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, { status });
      toast.success(`Appointment ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update appointment');
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
          Welcome, Dr. {user?.lastName}! 👋
        </h1>
        <p className="text-gray-600">Here&apos;s your appointment overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Appointments"
          value={stats.total}
          icon={Calendar}
          color="primary"
        />
        <StatsCard
          title="Pending Requests"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Today's Schedule"
          value={stats.todayCount}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/doctor/availability" className="btn-primary">
            <Clock className="w-5 h-5 mr-2" />
            Manage Availability
          </Link>
          <Link to="/doctor/appointments" className="btn-outline">
            <Calendar className="w-5 h-5 mr-2" />
            View All Appointments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
            <Link to="/doctor/appointments?status=PENDING" className="text-primary-600 hover:underline text-sm">
              View All
            </Link>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="card text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="DOCTOR"
                  onAction={handleAppointmentAction}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
            <Link to="/doctor/appointments" className="text-primary-600 hover:underline text-sm">
              View All
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="card text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="DOCTOR"
                  onAction={handleAppointmentAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
