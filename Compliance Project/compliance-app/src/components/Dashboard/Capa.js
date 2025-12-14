import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import HazardReportExecute from "../Execute/HazardReportExecute";
import DeleteModal from "../Execute/Delete";
import CreateInspectionModal from "../../Forms/Auditors";

function ActionMenu({
  id,
  onStartInspection,
  onEdit,
  onDelete,
  setShowCreateModal,
  setCreateModalSection,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1 text-gray-500 hover:text-gray-700"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`Actions for row ${id}`}
          className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setCreateModalSection(1);
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
          >
            Assign Safety Officer
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setCreateModalSection(2);
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
          >
            Assign Supervisor
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onEdit?.(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
          >
            View
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDelete?.(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function HazardInterface() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setData([
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
      },
      {
        id: 2,
        reportId: "RPT-002",
        assessmentId: "ASM-002",
        activity: "Electrical Maintenance",
        date: "2025-08-28",
        safetyofficer: "Bob",
        supervisor: "Jane",
        location: "Warehouse",
        status: "In Progress",
      },
    ]);
  }, []);

  const handleStartInspection = (id) => {
    setActiveInspectionId(id);
    setShowFormModal(true);
  };

  const handleEdit = (id) => navigate(`/hazard/report/${id}`);

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setActiveInspectionId(null);
  };

  const statusColors = {
    Pending: "text-red-600 bg-red-100",
    Completed: "text-green-600 bg-green-100",
    "In Progress": "text-yellow-600 bg-yellow-100",
    Approved: "text-blue-600 bg-blue-100",
    All: "text-gray-700 bg-gray-100",
  };

  const filteredData = data.filter((entry) => {
    const matchesTab = activeTab === "All" || entry.status === activeTab;
    const haystack = [
      entry.reportId,
      entry.assessmentId,
      entry.activity,
      entry.location,
      entry.safetyofficer,
      entry.supervisor,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes((searchTerm || "").toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Capa Tracking Audit</h1>
      </div>

      <CreateInspectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        startSection={createModalSection}
      />

      {/* Status Tabs */}
      <div className="flex space-x-4 mb-6" role="tablist">
        {["All", "Pending", "In Progress", "Completed", "Approved"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded font-medium border ${
              activeTab === tab
                ? `${statusColors[tab]} border-transparent`
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          id="risk-search"
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded px-4 py-2"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Report ID",
                "Assessment ID",
                "Activity",
                "Date",
                "Safety Officer",
                "Supervisors",
                "Location",
                "Status",
                "Action",
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
            {filteredData.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-sm">{entry.reportId}</td>
                <td className="border px-4 py-2 text-sm">{entry.assessmentId}</td>
                <td className="border px-4 py-2 text-sm">{entry.activity}</td>
                <td className="border px-4 py-2 text-sm">{entry.date}</td>
                <td className="border px-4 py-2 text-sm">{entry.safetyofficer}</td>
                <td className="border px-4 py-2 text-sm">{entry.supervisor}</td>
                <td className="border px-4 py-2 text-sm">{entry.location}</td>
                <td className="border px-4 py-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[entry.status]}`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="border px-4 py-2 text-sm">
                  <ActionMenu
                    id={entry.id}
                    onStartInspection={handleStartInspection}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    setShowCreateModal={setShowCreateModal}
                    setCreateModalSection={setCreateModalSection}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* inline report view modal/pane */}
      {showReportExecute && reportToView && (
        <HazardReportExecute
          reportId={reportToView}
          onClose={() => {
            setShowReportExecute(false);
            setReportToView(null);
          }}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showModal}
        onCancel={() => {
          setShowModal(false);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          setData((prev) => prev.filter((entry) => entry.id !== itemToDelete));
          setShowModal(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}