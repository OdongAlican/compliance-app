import React, { useState } from "react";

// Dummy user list
const users = [
  { id: 1, name: 'Paul Ameyah', email: 'paul@gmail.com' },
  { id: 2, name: 'Debby Boateng', email: 'debby@gmail.com' },
  { id: 3, name: 'Kwame Mensah', email: 'kwame@gmail.com' },
];

// UserSelector component
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
    <div>
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

const sections = [
  "General Information",
  "Safety Officers",
  "Supervisors",
  "Review & Submit"
];

export default function CreateInspectionModal({ isOpen, onClose, startSection = 0 }) {
  const [currentSection, setCurrentSection] = useState(startSection);
  const [selectedSafetyOfficers, setSelectedSafetyOfficers] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // handle form submission here
    onClose();
    setCurrentSection(0);
    setSelectedSafetyOfficers([]);
    setSelectedSupervisors([]);
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

    if (!isOpen) return null;





  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={() => {
            onClose();
            setCurrentSection(0);
            setSelectedSafetyOfficers([]);
            setSelectedSupervisors([]);
          }}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
        >
          &times;
        </button>
        {/* Stepper */}
        <div className="flex justify-between items-center mb-8 px-4">
          {sections.map((label, index) => {
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;
            return (
              <div key={index} className="flex flex-col items-center text-center flex-1">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mb-1
                    ${isCompleted ? "bg-green-600 text-white" : isCurrent ? "bg-primary text-tertiary" : "bg-gray-300 text-gray-700"}
                  `}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={`text-sm rounded-full font-bold mb-1 ${
                    isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <h1 className="text-2xl font-bold text-center text-green-700 mb-2">
          CREATE CANTEEN INSPECTION
        </h1>
        <form onSubmit={handleSubmit}>
          {/* Section Content */}
          {currentSection === 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <input className="border p-2 rounded" placeholder="Inspector Name" />
              <input type="date" className="border p-2 rounded" />
              <input className="border p-2 rounded" placeholder="Canteen Location" />
              <input className="border p-2 rounded" placeholder="Supervisor Name" />
            </div>
          )}
          {currentSection === 1 && (
            <div className="mb-6">
              <label className="font-semibold">Safety Officers</label>
              <UserSelector
                selectedUsers={selectedSafetyOfficers}
                setSelectedUsers={setSelectedSafetyOfficers}
              />
            </div>
          )}
          {currentSection === 2 && (
            <div className="mb-6">
              <label className="font-semibold">Safetyofficer</label>
              <UserSelector
                selectedUsers={selectedSupervisors}
                setSelectedUsers={setSelectedSupervisors}
              />
            </div>
          )}
                    {currentSection === 3 && (
            <div className="mb-6">
              <label className="font-semibold">Supervisors</label>
              <UserSelector
                selectedUsers={selectedSupervisors}
                setSelectedUsers={setSelectedSupervisors}
              />
            </div>
          )}
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={prevSection}
              disabled={currentSection === 0}
              className={`px-4 py-2 rounded ${
                currentSection === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            <button
              type={currentSection === sections.length - 1 ? "submit" : "button"}
              onClick={currentSection === sections.length - 1 ? undefined : nextSection}
              className={`px-4 py-2 rounded ${
                currentSection === sections.length - 1
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-primary text-tertiary"
              }`}
            >
              {currentSection === sections.length - 1 ? "Submit" : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}