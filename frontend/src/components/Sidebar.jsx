import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCog, 
  Clock,
  BarChart3,
  Stethoscope,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  const getNavLinks = () => {
    switch (user?.role) {
      case 'PATIENT':
        return [
          { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/patient/doctors', icon: Stethoscope, label: 'Find Doctors' },
          { to: '/patient/appointments', icon: Calendar, label: 'My Appointments' },
        ];
      case 'DOCTOR':
        return [
          { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/doctor/availability', icon: Clock, label: 'Availability' },
          { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/admin/doctors', icon: Stethoscope, label: 'Manage Doctors' },
          { to: '/admin/patients', icon: Users, label: 'Manage Patients' },
          { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
          { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen pt-20 transition-transform bg-white border-r border-gray-200 w-64 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>

          <ul className="space-y-2 mt-4">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
