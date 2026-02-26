import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HazardReportExecute({ reportId, report: initialReport, onClose }) {
  const navigate = useNavigate();
  const [report, setReport] = useState(initialReport ?? null);
  const [loading, setLoading] = useState(!initialReport);
  const [activeTab, setActiveTab] = useState("Hazard Description");

  useEffect(() => {
    if (initialReport) return;
    if (!reportId) {
      setLoading(false);
      setReport(null);
      return;
    }

    setLoading(true);
    const mockDb = [
      {
        id: 1,
        reportId: "RPT-001",
        assessmentId: "ASM-001",
        activity: "Chemical Mixing",
        date: "2025-08-30",
        safetyofficer: "Alice",
        supervisor: "John",
        location: "Building A",
        status: "Pending",
        time: "15:15:15",
        reportedBy: "Eric",
        coordinates: "5.744036, -0.1631",
        hazardType: "Wet floor in main hallway",
        injuryInfo: "No injuries reported.",
        actionTaken: "Warning sign placed. Floor cleaned.",
      },
    ];

    const found =
      mockDb.find((r) => String(r.id) === String(reportId)) ||
      mockDb.find((r) => r.reportId === String(reportId));

    setTimeout(() => {
      setReport(found ?? null);
      setLoading(false);
    }, 150);
  }, [reportId, initialReport]);

  const handleClose = () => {
    if (onClose) return onClose();
    navigate(-1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Hazard Description":
        return (
          <div>
            <div className="text-xs text-gray-500">Hazard Type</div>
            <div className="mt-2 text-sm text-gray-700">{report.hazardType}</div>
          </div>
        );
      case "Injury Information":
        return (
          <div>
            <div className="text-xs text-gray-500">Injury Details</div>
            <div className="mt-2 text-sm text-gray-700">{report.injuryInfo}</div>
          </div>
        );
      case "Action Taken":
        return (
          <div>
            <div className="text-xs text-gray-500">Actions</div>
            <div className="mt-2 text-sm text-gray-700">{report.actionTaken}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <button
          aria-label="Close report"
          onClick={handleClose}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-600"
        >
          ×
        </button>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !report ? (
            <div className="text-center py-8 text-red-600">Report not found.</div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Hazard Report: {report.reportId}</h2>
              <p className="text-sm text-gray-500 mb-4">Assessment: {report.assessmentId}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Activity</div>
                  <div className="font-medium">{report.activity}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium">{report.date}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Time</div>
                  <div className="font-medium">{report.time}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Reported By</div>
                  <div className="font-medium">{report.reportedBy}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Safety Officer</div>
                  <div className="font-medium">{report.safetyofficer}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Supervisor</div>
                  <div className="font-medium">{report.supervisor}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="font-medium">
                    {report.location} ({report.coordinates})
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-4">
                <div className="flex space-x-4 border-b mb-2">
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
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={handleClose} className="px-4 py-2 rounded bg-gray-200">Close</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
