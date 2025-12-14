import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ToolExecute({ inspection, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Issues Identified");

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

  const renderIssues = () => {
    return (
      <div className="overflow-x-auto">
        {inspection.issues?.length ? (
          <table className="w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Issue</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Responsible</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {inspection.issues.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{item.issue || "N/A"}</td>
                  <td className="px-4 py-2">{item.action || "N/A"}</td>
                  <td className="px-4 py-2">{item.responsible || "N/A"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-white text-xs ${
                      item.status === "Resolved"
                        ? "bg-green-500"
                        : item.status === "Pending"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-white text-xs ${
                      item.priority === "High"
                        ? "bg-red-500"
                        : item.priority === "Medium"
                        ? "bg-orange-400"
                        : "bg-blue-400"
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2">{item.dueDate || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">No issues identified.</div>
        )}
      </div>
    );
  };

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
          {/* Notification Banner */}
          {inspection.priorityUpdated && (
            <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3">
              Priority updated to <strong>{inspection.priorityUpdated}</strong>
            </div>
          )}

          {/* Header */}
          <h2 className="text-xl font-semibold mb-2">
            PPE Inspection: {inspection.inspectionId || "N/A"}
          </h2>
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
              <div className="text-xs text-gray-500">Time Assigned</div>
              <div className="font-medium">{inspection.timeAssigned || "N/A"}</div>
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
                {inspection.officers?.join(", ") || "No officers listed"}
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
    {["Issues Identified", "Inspection Checklist"].map((tab) => (
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

  {/* Tab Content */}
  {activeTab === "Issues Identified" && (
    <div className="overflow-x-auto">
      {inspection.issues?.length ? (
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
            {inspection.issues.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2">{item.issue || "N/A"}</td>
                <td className="px-4 py-2">{item.action || "N/A"}</td>
                <td className="px-4 py-2">{item.responsible || "N/A"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-white text-xs ${
                    item.status === "Resolved"
                      ? "bg-green-500"
                      : item.status === "Pending"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-white text-xs ${
                    item.priority === "High"
                      ? "bg-red-500"
                      : item.priority === "Medium"
                      ? "bg-orange-400"
                      : "bg-blue-400"
                  }`}>
                    {item.priority || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-2">{item.dueDate || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">No issues identified.</div>
      )}
    </div>
  )}

  {activeTab === "Inspection Checklist" && (
    <div className="overflow-x-auto">
      {inspection.checklist?.length ? (
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Comments</th>
              <th className="px-4 py-2 text-left">Inspector</th>
            </tr>
          </thead>
          <tbody>
            {inspection.checklist.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2">{item.label || "N/A"}</td>
                <td className="px-4 py-2">{item.status || "N/A"}</td>
                <td className="px-4 py-2">{item.comments || "N/A"}</td>
                <td className="px-4 py-2">{item.inspector || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">No checklist items available.</div>
      )}
    </div>
  )}
</div>

          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">
              Close
            </button>
            <button className="px-4 py-2 rounded bg-red-500 text-white">Reject</button>
            <button className="px-4 py-2 rounded bg-green-500 text-white">Approve</button>
            <button className="px-4 py-2 rounded bg-blue-500 text-white">Print</button>
          </div>
        </div>
      </div>
   
  );
}
