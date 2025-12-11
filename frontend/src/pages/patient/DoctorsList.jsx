import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, DollarSign, Clock } from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    sortBy: 'createdAt',
  });

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
        limit: 9,
        search: filters.search,
        specialization: filters.specialization,
        sortBy: filters.sortBy,
      });
      setDoctors(response.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.meta.pagination.totalPages,
        total: response.meta.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
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

  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'experience', label: 'Experience' },
    { value: 'consultationFee', label: 'Consultation Fee' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-600">Browse our network of qualified healthcare professionals</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search doctors..."
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
          <Select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            options={sortOptions}
            placeholder="Sort by"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600 mb-4">
        Found {pagination.total} doctor{pagination.total !== 1 ? 's' : ''}
      </p>

      {/* Doctors grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No doctors found matching your criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {doctor.firstName[0]}{doctor.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h3>
                    <p className="text-primary-600 text-sm">
                      {doctor.doctorProfile?.specialization}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {doctor.doctorProfile?.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {doctor.doctorProfile.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {doctor.doctorProfile?.experience || 0} years
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      ${doctor.doctorProfile?.consultationFee || 0}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to={`/patient/book/${doctor.id}`}
                    className="btn-primary w-full text-center"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
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

export default DoctorsList;
