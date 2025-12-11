import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Trash2, UserX, UserCheck } from 'lucide-react';
import { patientService } from '../../services/patientService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, patient: null });

  useEffect(() => {
    fetchPatients();
  }, [pagination.page, search]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await patientService.getAllPatients({
        page: pagination.page,
        limit: 10,
        search,
      });
      setPatients(response.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.meta.pagination.totalPages,
        total: response.meta.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (patientId) => {
    try {
      await patientService.togglePatientStatus(patientId);
      toast.success('Patient status updated');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to update patient status');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.patient) return;
    try {
      await patientService.deletePatient(deleteModal.patient.id);
      toast.success('Patient deleted successfully');
      setDeleteModal({ open: false, patient: null });
      fetchPatients();
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
        <p className="text-gray-600">View and manage registered patients</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative max-w-md">
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Gender</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Blood Group</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-secondary-600">
                              {patient.firstName[0]}{patient.lastName[0]}
                            </span>
                          </div>
                          <span>{patient.firstName} {patient.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{patient.email}</td>
                      <td className="py-3 px-4 text-gray-600">{patient.phone || '-'}</td>
                      <td className="py-3 px-4">{patient.patientProfile?.gender || '-'}</td>
                      <td className="py-3 px-4">{patient.patientProfile?.bloodGroup || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${patient.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          `}
                        >
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(patient.id)}
                            className={`p-2 rounded-lg ${
                              patient.isActive
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={patient.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {patient.isActive ? (
                              <UserX className="w-5 h-5" />
                            ) : (
                              <UserCheck className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, patient })}
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

            {patients.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No patients found</p>
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
        onClose={() => setDeleteModal({ open: false, patient: null })}
        title="Delete Patient"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {deleteModal.patient?.firstName}{' '}
          {deleteModal.patient?.lastName}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setDeleteModal({ open: false, patient: null })}
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

export default ManagePatients;
