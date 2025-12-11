import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { appointmentService } from '../../services/appointmentService';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'appointmentDate',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 15,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await appointmentService.getAllAppointments(params);
      setAppointments(response.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.meta.pagination.totalPages,
        total: response.meta.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
        <p className="text-gray-600">View all appointments in the system</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={statusOptions}
            placeholder="Filter by status"
          />
          <Input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            placeholder="Start date"
          />
          <Input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            placeholder="End date"
          />
          <Select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleFilterChange}
            options={[
              { value: 'desc', label: 'Newest first' },
              { value: 'asc', label: 'Oldest first' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Showing {appointments.length} of {pagination.total} appointments
          </p>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Doctor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
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
                      <td className="py-3 px-4">
                        {appointment.startTime} - {appointment.endTime}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[appointment.status]
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {appointment.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {appointments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No appointments found</p>
              </div>
            )}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </div>
  );
};

export default AllAppointments;
