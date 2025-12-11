import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/AppointmentCard';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';

const DoctorAppointments = () => {
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
    sortOrder: 'asc',
  });

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 10,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await appointmentService.getMyAppointments(params);
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

  const handleStatusChange = async (status, appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, { status });
      toast.success(`Appointment ${status.toLowerCase()} successfully`);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to update appointment');
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
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600">Manage your patient appointments</p>
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
              { value: 'asc', label: 'Oldest first' },
              { value: 'desc', label: 'Newest first' },
            ]}
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No appointments found</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Showing {appointments.length} of {pagination.total} appointments
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                userRole="DOCTOR"
                onAction={handleStatusChange}
              />
            ))}
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

export default DoctorAppointments;
