import { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, TrendingUp } from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatsCard from '../../components/StatsCard';
import Spinner from '../../components/Spinner';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await adminService.getMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusData = metrics?.appointmentsByStatus
    ? Object.entries(metrics.appointmentsByStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of the CareSync platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Users"
          value={metrics?.overview?.totalUsers || 0}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Doctors"
          value={metrics?.overview?.totalDoctors || 0}
          icon={Stethoscope}
          color="secondary"
        />
        <StatsCard
          title="Patients"
          value={metrics?.overview?.totalPatients || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Completion Rate"
          value={`${metrics?.overview?.completionRate || 0}%`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Stats Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Appointments</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#3b82f6" name="Appointments" />
                <Bar dataKey="newUsers" fill="#14b8a6" name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Status */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Appointments by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Appointments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Patient</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Doctor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recentAppointments?.map((appointment) => (
                <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                  </td>
                  <td className="py-3 px-4">
                    Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                  </td>
                  <td className="py-3 px-4">
                    {format(parseISO(appointment.appointmentDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4">{appointment.startTime}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          appointment.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : appointment.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
