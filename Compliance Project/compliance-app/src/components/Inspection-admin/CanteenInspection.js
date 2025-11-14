import React, { useState, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';

// Dummy user list
const users = [
  { id: 1, name: 'Paul Ameyah', email: 'paul@gmail.com' },
  { id: 2, name: 'Debby Boateng', email: 'debby@gmail.com' },
  { id: 3, name: 'Kwame Mensah', email: 'kwame@gmail.com' },
];

// Reusable user selector
function UserSelector({ selectedUsers, setSelectedUsers }) {
  const handleSelect = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemove = (id) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== id));
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search by name or email"
        className="border p-2 rounded w-full mb-2"
      />
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center bg-gray-100 p-2 rounded cursor-pointer"
            onClick={() => handleSelect(user)}
          >
            <span>{user.name}</span>
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Selected:</h4>
        {selectedUsers.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center bg-green-100 p-2 rounded mb-1"
          >
            <span>{user.name}</span>
            <button
              onClick={() => handleRemove(user.id)}
              className="text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CanteenFormModal({ isOpen, setIsOpen }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedSafetyOfficers, setSelectedSafetyOfficers] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);

  const sections = ['General Information', 'Safety Officers', 'Supervisors'];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted!');
    closeModal();
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentSection(0);
    setSelectedSafetyOfficers([]);
    setSelectedSupervisors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={closeModal}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
        >
          &times;
        </button>

        <h1 className="text-2xl font-bold text-center text-green-700 mb-2">
          CANTEEN INSPECTION FORM
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          CONFIDENTIAL COMPLIANCE DOCUMENT
        </p>

        <h2 className="text-xl font-semibold mb-4">
          SECTION {currentSection + 1}: {sections[currentSection]}
        </h2>

        {currentSection === 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <input placeholder="Inspector Name" className="border p-2 rounded" />
            <input type="date" className="border p-2 rounded" />
            <input placeholder="Canteen Location" className="border p-2 rounded" />
            <input placeholder="Supervisor Name" className="border p-2 rounded" />
          </div>
        )}

        {currentSection === 1 && (
          <UserSelector
            selectedUsers={selectedSafetyOfficers}
            setSelectedUsers={setSelectedSafetyOfficers}
          />
        )}

        {currentSection === 2 && (
          <UserSelector
            selectedUsers={selectedSupervisors}
            setSelectedUsers={setSelectedSupervisors}
          />
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className={`px-4 py-2 rounded ${
              currentSection === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>

          <button
            onClick={currentSection === sections.length - 1 ? handleSubmit : nextSection}
            className={`px-4 py-2 rounded ${
              currentSection === sections.length - 1
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {currentSection === sections.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ id, onStart }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-gray-500 hover:text-gray-700"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
          <button
            onClick={() => {
              onStart(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
          >
            Start Inspection
          </button>
        </div>
      )}
    </div>
  );
}

export default function CanteenInterface() {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);

  useEffect(() => {
    const mockData = [
      {
        id: 1,
        schoolname: 'Sunrise High',
        location: 'Downtown',
        dateofinspection: '2024-08-15',
        time: '10:00 AM',
        safetyofficer: 'Jane Smith',
        supervisor: 'John Doe',
        status: 'Pending',
      },
    ];
    setData(mockData);
  }, []);

  const handleStartInspection = (id) => {
    setShowFormModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Canteen Inspection</h1>

      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                'ID',
                'School Name',
                'Location',
                'Date of Inspection',
                'Time',
                'Safety Officer',
                'Supervisor',
                'Status',
                'Action',
              ].map((header) => (
                <th
                  key={header}
                  className="border px-4 py-2 text-left text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-sm">{entry.id}</td>
                <td className="border px-4 py-2 text-sm">{entry.schoolname}</td>
                <td className="border px-4 py-2 text-sm">{entry.location}</td>
                <td className="border px-4 py-2 text-sm">{entry.dateofinspection}</td>
                <td className="border px-4 py-2 text-sm">{entry.time}</td>
                <td className="border px-4 py-2 text-sm">{entry.time}</td>
                <td className="border px-4 py-2 text-sm">{entry.safetyofficer}</td>
                <td className="border px-4 py-2 text-sm">{entry.supervisor}</td>
                <td className="border px-4 py-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      entry.status === 'Pending'
                        ? 'bg-red-100 text-red-700'
                        : entry.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="border px-4 py-2 text-sm">
                  <ActionMenu id={entry.id} onStart={handleStartInspection} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      <CanteenFormModal isOpen={showFormModal} setIsOpen={setShowFormModal} />
    </div>
  );
}


