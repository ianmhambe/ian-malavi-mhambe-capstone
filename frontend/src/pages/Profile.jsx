import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Lock } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    // Patient specific
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    address: '',
    emergencyContact: '',
    // Doctor specific
    specialization: '',
    experience: '',
    qualification: '',
    consultationFee: '',
    bio: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.patientProfile?.dateOfBirth?.split('T')[0] || '',
        gender: user.patientProfile?.gender || '',
        bloodGroup: user.patientProfile?.bloodGroup || '',
        allergies: user.patientProfile?.allergies || '',
        medicalHistory: user.patientProfile?.medicalHistory || '',
        address: user.patientProfile?.address || '',
        emergencyContact: user.patientProfile?.emergencyContact || '',
        specialization: user.doctorProfile?.specialization || '',
        experience: user.doctorProfile?.experience || '',
        qualification: user.doctorProfile?.qualification || '',
        consultationFee: user.doctorProfile?.consultationFee || '',
        bio: user.doctorProfile?.bio || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-5 h-5" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 ${
            activeTab === 'password'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lock className="w-5 h-5" />
          Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="card">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="First Name"
              name="firstName"
              value={profileData.firstName}
              onChange={handleProfileChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={profileData.lastName}
              onChange={handleProfileChange}
              required
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={profileData.phone}
              onChange={handleProfileChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Patient specific fields */}
          {user?.role === 'PATIENT' && (
            <>
              <h3 className="text-lg font-semibold mb-4">Health Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={handleProfileChange}
                />
                <Select
                  label="Gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleProfileChange}
                  options={genderOptions}
                  placeholder="Select gender"
                />
                <Select
                  label="Blood Group"
                  name="bloodGroup"
                  value={profileData.bloodGroup}
                  onChange={handleProfileChange}
                  options={bloodGroupOptions}
                  placeholder="Select blood group"
                />
                <Input
                  label="Emergency Contact"
                  name="emergencyContact"
                  type="tel"
                  value={profileData.emergencyContact}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allergies
                  </label>
                  <textarea
                    name="allergies"
                    value={profileData.allergies}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="List any allergies..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={profileData.medicalHistory}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any relevant medical history..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Doctor specific fields */}
          {user?.role === 'DOCTOR' && (
            <>
              <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Specialization"
                  name="specialization"
                  value={profileData.specialization}
                  onChange={handleProfileChange}
                />
                <Input
                  label="Experience (years)"
                  name="experience"
                  type="number"
                  value={profileData.experience}
                  onChange={handleProfileChange}
                />
                <Input
                  label="Qualification"
                  name="qualification"
                  value={profileData.qualification}
                  onChange={handleProfileChange}
                />
                <Input
                  label="Consultation Fee"
                  name="consultationFee"
                  type="number"
                  value={profileData.consultationFee}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Write a brief bio about yourself..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="card max-w-md">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          
          <div className="space-y-4">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="mt-6">
            <Button type="submit" loading={loading}>
              Change Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
