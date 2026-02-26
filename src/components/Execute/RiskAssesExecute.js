import React, { useState } from "react";

const mockAssessment = {
  name: "RA1123",
  date: "22nd September 2025",
  location: "PRPV-RK, Oyarifa, Ghana",
  coordinates: "5.744036, -0.1631",
  reportedBy: "Eric",
  safetyOfficers: ["Paul Amegsh", "Debby", "Eric"],
  supervisors: ["King"],
  hazards: [
    {
      description: "Description",
      peopleAtRisk: "All Staff/Visitors",
      inherentRisk: 20,
      residualRisk: null,
      responsiblePerson: null,
      status: "Pending",
    },
    {
      description: "Description",
      peopleAtRisk: "Maintenance staff",
      inherentRisk: 15,
      residualRisk: null,
      responsiblePerson: null,
      status: "Pending",
    },
  ],
  correctiveAction: "Corrective action added for Faulty Refrigerator",
};

export default function RiskAssessmentView({ onClose }) {
  const [activeTab, setActiveTab] = useState("Hazard Description");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Hazard Description":
        return (
          <div className="space-y-4">
            {mockAssessment.hazards.map((hazard, index) => (
              <div key={index} className="border p-4 rounded bg-gray-50">
                <div className="text-sm font-semibold mb-2">Hazard {index + 1}</div>
                <div><span className="text-xs text-gray-500">Description:</span> {hazard.description}</div>
                <div><span className="text-xs text-gray-500">People at Risk:</span> {hazard.peopleAtRisk}</div>
                <div><span className="text-xs text-gray-500">Inherent Risk:</span> {hazard.inherentRisk}</div>
                <div><span className="text-xs text-gray-500">Residual Risk:</span> {hazard.residualRisk ?? "Not specified"}</div>
                <div><span className="text-xs text-gray-500">Person Responsible:</span> {hazard.responsiblePerson ?? "Not specified"}</div>
                <div><span className="text-xs text-gray-500">Status:</span> {hazard.status}</div>
              </div>
            ))}
          </div>
        );
      case "Injury Information":
        return <div className="text-sm text-gray-700">No injuries reported.</div>;
      case "Action Taken":
        return <div className="text-sm text-gray-700">{mockAssessment.correctiveAction}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-600"
        >
          ×
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Risk Assessment Report: {mockAssessment.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><span className="text-xs text-gray-500">Date of Report:</span> {mockAssessment.date}</div>
            <div><span className="text-xs text-gray-500">Reported By:</span> {mockAssessment.reportedBy}</div>
            <div className="md:col-span-2">
              <span className="text-xs text-gray-500">Location:</span> {mockAssessment.location} ({mockAssessment.coordinates})
            </div>
            <div><span className="text-xs text-gray-500">Safety Officer/s:</span> {mockAssessment.safetyOfficers.join(", ")}</div>
            <div><span className="text-xs text-gray-500">Supervisor/s:</span> {mockAssessment.supervisors.join(", ")}</div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-4 flex space-x-4">
            {["Hazard Description", "Injury Information", "Action Taken"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {renderTabContent()}

          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
