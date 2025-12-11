import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/AppointmentCard';
import Select from '../../components/Select';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'appointmentDate',
    sortOrder: 'asc',
  });

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentService.getMyAppointments({
        page: pagination.page,
        limit: 10,
        ...filters,
      });
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

  const sortOptions = [
    { value: 'appointmentDate', label: 'Date' },
    { value: 'createdAt', label: 'Created' },
    { value: 'status', label: 'Status' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600">View and manage your scheduled appointments</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={statusOptions}
            placeholder="Filter by status"
          />
          <Select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            options={sortOptions}
            placeholder="Sort by"
          />
          <Select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleFilterChange}
            options={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' },
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
                userRole="PATIENT"
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

export default PatientAppointments;
