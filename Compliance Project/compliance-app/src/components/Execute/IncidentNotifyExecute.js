import React from "react";

export default function IncidentNotifyExecute({ reportId, onClose }) {
  // Dummy data for demonstration — replace with actual fetch logic if needed
  const report = {
    id: reportId,
    type: "Injury",
    date: "25th August 2025",
    time: "13:45",
    location: "25th August PRVP+XP, Oyarifa, Ghana",
    coordinates: "(5.7444036, -0.1631)",
    description: "Description of the incident goes here.",
    reportedBy: "Paul",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Modal Content */}
        <h2 className="text-2xl font-semibold text-green-600 mb-4">✅ Notification created</h2>
        <p className="text-gray-700 mb-6">
          Incident <span className="font-bold">INC-{report.id}</span> has been created successfully.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Type of Incident</h3>
            <p className="text-base text-gray-800">{report.type}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Date</h3>
            <p className="text-base text-gray-800">{report.date}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Time</h3>
            <p className="text-base text-gray-800">{report.time}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="text-base text-gray-800">
              {report.location} <br />
              <span className="text-sm text-gray-600">{report.coordinates}</span>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Brief description of what happened</h3>
            <p className="text-base text-gray-800">{report.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Reported By</h3>
            <p className="text-base text-gray-800">{report.reportedBy}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Skip for Now
          </button>
          <button
            onClick={() => alert("Add Witness Statement")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Witness Statement
          </button>
        </div>
      </div>
    </div>
  );
}
