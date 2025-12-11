import { format, parseISO } from 'date-fns';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const AppointmentCard = ({ appointment, userRole, onAction }) => {
  const { doctor, patient, appointmentDate, startTime, endTime, status, reason } = appointment;

  const formattedDate = format(
    typeof appointmentDate === 'string' ? parseISO(appointmentDate) : appointmentDate,
    'EEEE, MMMM d, yyyy'
  );

  return (
    <div className="card-hover">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Doctor info (for patients) */}
        {userRole === 'PATIENT' && doctor && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Stethoscope className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Doctor</p>
              <p className="font-medium">
                Dr. {doctor.user?.firstName} {doctor.user?.lastName}
              </p>
            </div>
          </div>
        )}

        {/* Patient info (for doctors) */}
        {userRole === 'DOCTOR' && patient && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <User className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Patient</p>
              <p className="font-medium">
                {patient.user?.firstName} {patient.user?.lastName}
              </p>
            </div>
          </div>
        )}

        {/* Date and time */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium">
              {startTime} - {endTime}
            </p>
          </div>
        </div>

        {/* Reason */}
        {reason && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Reason</p>
            <p className="text-gray-700">{reason}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {onAction && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          {userRole === 'DOCTOR' && status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction('ACCEPTED', appointment.id)}
                className="btn-primary flex-1"
              >
                Accept
              </button>
              <button
                onClick={() => onAction('REJECTED', appointment.id)}
                className="btn-danger flex-1"
              >
                Reject
              </button>
            </>
          )}
          {userRole === 'DOCTOR' && status === 'ACCEPTED' && (
            <button
              onClick={() => onAction('COMPLETED', appointment.id)}
              className="btn-secondary flex-1"
            >
              Mark Complete
            </button>
          )}
          {userRole === 'PATIENT' && ['PENDING', 'ACCEPTED'].includes(status) && (
            <button
              onClick={() => onAction('CANCELLED', appointment.id)}
              className="btn-danger flex-1"
            >
              Cancel Appointment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
