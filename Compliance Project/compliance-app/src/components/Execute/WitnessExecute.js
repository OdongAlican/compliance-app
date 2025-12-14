import React from "react";

export default function WitnessStatementExecute({ reportId, onClose }) {
  // Dummy data — replace with dynamic fetch if needed
  const witness = {
    name: "Paul Selorm Amegah",
    jobTitle: "IT Manager",
    staffNumber: "EMP-09",
    email: "paulamegah@gmail.com",
    statementDate: "11th September, 2025",
    incidentDate: "10th September 2025",
    incidentTime: "12:59",
    location: "25th August PKVP-XP, Oyarifa, Ghana",
    coordinates: "(5.744036, -0.1833)",
    involvement: "Direct Witness",
    status: "Pending",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-green-600">👤 Witness Statement</h2>
          <p className="text-gray-700 mt-1">
            Report ID: <span className="font-bold">{reportId}</span>
          </p>
          <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
            {witness.status}
          </span>
        </div>

        {/* Witness Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Witness Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-gray-500">Name</h4>
              <p className="text-gray-800">{witness.name}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Job Title</h4>
              <p className="text-gray-800">{witness.jobTitle}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Staff Number</h4>
              <p className="text-gray-800">{witness.staffNumber}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Email</h4>
              <p className="text-gray-800">{witness.email}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Date of Statement</h4>
              <p className="text-gray-800">{witness.statementDate}</p>
            </div>
          </div>
        </div>

        {/* Witness Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Witness Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-gray-500">Date of Incident</h4>
              <p className="text-gray-800">{witness.incidentDate}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Time of Incident</h4>
              <p className="text-gray-800">{witness.incidentTime}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-sm text-gray-500">Location</h4>
              <p className="text-gray-800">
                {witness.location} <br />
                <span className="text-sm text-gray-600">{witness.coordinates}</span>
              </p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Email</h4>
              <p className="text-gray-800">{witness.email}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Involvement</h4>
              <p className="text-gray-800">{witness.involvement}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() => alert("Viewing Incident Notification")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            View Incident Notification
          </button>
        </div>
      </div>
    </div>
  );
}
