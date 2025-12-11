import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Spinner from '../../components/Spinner';
import {
  LineChart,
  Line,
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
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [specializationStats, setSpecializationStats] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, specRes] = await Promise.all([
        adminService.getMetrics(),
        adminService.getSpecializationStats(),
      ]);
      setMetrics(metricsRes.data);
      setSpecializationStats(specRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
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
    ? Object.entries(metrics.appointmentsByStatus)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          name: status,
          value: count,
        }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Detailed analytics and reports</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">
            {metrics?.overview?.totalUsers || 0}
          </p>
          <p className="text-gray-600 text-sm">Total Users</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-secondary-600">
            {metrics?.overview?.totalDoctors || 0}
          </p>
          <p className="text-gray-600 text-sm">Doctors</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">
            {metrics?.overview?.totalPatients || 0}
          </p>
          <p className="text-gray-600 text-sm">Patients</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">
            {metrics?.overview?.completionRate || 0}%
          </p>
          <p className="text-gray-600 text-sm">Completion Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Appointments"
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Status */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Appointments by Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctors by Specialization */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Doctors by Specialization</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={specializationStats}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="specialization" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Doctors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Appointments Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Appointments per Month</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#14b8a6" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
