import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ScienceExecuteModal({ inspection, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("General House Keeping");

  if (!inspection) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={onClose || (() => navigate(-1))}
            className="absolute top-3 right-4 text-2xl font-bold text-gray-600"
          >
            ×
          </button>
          <div className="p-6 text-center text-red-600">Inspection not found.</div>
        </div>
      </div>
    );
  }

  const renderChecklist = () => (
    <table className="w-full table-auto border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Item</th>
          <th className="px-4 py-2 text-left">✓</th>
          <th className="px-4 py-2 text-left">N/A</th>
          <th className="px-4 py-2 text-left">Comments / Action Needed</th>
          <th className="px-4 py-2 text-left">Inspected By</th>
        </tr>
      </thead>
      <tbody>
        {inspection.checklist?.length ? (
          inspection.checklist.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{item.label || "N/A"}</td>
              <td className="px-4 py-2">{item.checked ? "✓" : ""}</td>
              <td className="px-4 py-2">{item.na ? "N/A" : ""}</td>
              <td className="px-4 py-2">{item.comments || "—"}</td>
              <td className="px-4 py-2">{item.inspector || "—"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="px-4 py-2 text-center text-gray-500">No checklist items available.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderIssues = () => (
    <table className="w-full table-auto border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Issue</th>
          <th className="px-4 py-2 text-left">Corrective Action</th>
          <th className="px-4 py-2 text-left">Responsible</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Priority</th>
          <th className="px-4 py-2 text-left">Due Date</th>
        </tr>
      </thead>
      <tbody>
        {inspection.issues?.length ? (
          inspection.issues.map((issue, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{issue.issue || "N/A"}</td>
              <td className="px-4 py-2">{issue.action || "N/A"}</td>
              <td className="px-4 py-2">{issue.responsible || "N/A"}</td>
              <td className="px-4 py-2">{issue.status || "N/A"}</td>
              <td className="px-4 py-2">{issue.priority || "—"}</td>
              <td className="px-4 py-2">{issue.dueDate || "—"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="px-4 py-2 text-center text-gray-500">No issues identified.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose || (() => navigate(-1))}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-600"
        >
          ×
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">Science Lab Inspection: {inspection.id || "N/A"}</h2>
          <p className="text-sm text-gray-500 mb-4">Status: {inspection.status || "N/A"}</p>

          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-gray-500">Location</div>
              <div className="font-medium">{inspection.location || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Coordinates</div>
              <div className="font-medium">{inspection.coordinates || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Date Assigned</div>
              <div className="font-medium">{inspection.dateAssigned || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Time</div>
              <div className="font-medium">{inspection.time || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Date Completed</div>
              <div className="font-medium">{inspection.dateCompleted || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Time Completed</div>
              <div className="font-medium">{inspection.timeCompleted || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Safety Officers</div>
              <div className="font-medium">
                {Array.isArray(inspection.officers)
                  ? inspection.officers.join(", ")
                  : "No officers listed"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Supervisor</div>
              <div className="font-medium">{inspection.supervisor || "N/A"}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex space-x-4 border-b mb-2">
              {["General House Keeping", "Issues Identified"].map((tab) => (
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
            {activeTab === "General House Keeping" ? renderChecklist() : renderIssues()}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Close</button>
            <button className="px-4 py-2 rounded bg-red-500 text-white">Reject</button>
            <button className="px-4 py-2 rounded bg-green-500 text-white">Approve</button>
            <button className="px-4 py-2 rounded bg-blue-500 text-white">Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}
