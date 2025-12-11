import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Trash2, UserX, UserCheck } from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
  });
  const [specializations, setSpecializations] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, doctor: null });

  useEffect(() => {
    fetchSpecializations();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [pagination.page, filters]);

  const fetchSpecializations = async () => {
    try {
      const response = await doctorService.getSpecializations();
      setSpecializations(response.data);
    } catch (error) {
      console.error('Failed to fetch specializations:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getAllDoctors({
        page: pagination.page,
        limit: 10,
        search: filters.search,
        specialization: filters.specialization,
      });
      setDoctors(response.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.meta.pagination.totalPages,
        total: response.meta.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (doctorId) => {
    try {
      await doctorService.toggleDoctorStatus(doctorId);
      toast.success('Doctor status updated');
      fetchDoctors();
    } catch (error) {
      toast.error('Failed to update doctor status');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.doctor) return;
    try {
      await doctorService.deleteDoctor(deleteModal.doctor.id);
      toast.success('Doctor deleted successfully');
      setDeleteModal({ open: false, doctor: null });
      fetchDoctors();
    } catch (error) {
      toast.error('Failed to delete doctor');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const specializationOptions = specializations.map((s) => ({
    value: s,
    label: s,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
        <p className="text-gray-600">View and manage registered doctors</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name or email..."
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <Select
            name="specialization"
            value={filters.specialization}
            onChange={handleFilterChange}
            options={specializationOptions}
            placeholder="All Specializations"
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
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Specialization</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Experience</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {doctor.firstName[0]}{doctor.lastName[0]}
                            </span>
                          </div>
                          <span>Dr. {doctor.firstName} {doctor.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{doctor.email}</td>
                      <td className="py-3 px-4">{doctor.doctorProfile?.specialization}</td>
                      <td className="py-3 px-4">{doctor.doctorProfile?.experience || 0} years</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          `}
                        >
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(doctor.id)}
                            className={`p-2 rounded-lg ${
                              doctor.isActive
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={doctor.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {doctor.isActive ? (
                              <UserX className="w-5 h-5" />
                            ) : (
                              <UserCheck className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, doctor })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {doctors.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No doctors found</p>
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, doctor: null })}
        title="Delete Doctor"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete Dr. {deleteModal.doctor?.firstName}{' '}
          {deleteModal.doctor?.lastName}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setDeleteModal({ open: false, doctor: null })}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageDoctors;
