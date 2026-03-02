import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import DeleteModal from "../components/Execute/Delete";
import PPECompExecuteModal from "../components/Auditors-View/ChecklistExecute";
import CorrectiveActionFormModal from "../components/Action/CorrectiveActionForm";
import PPECompFormModal from "../Forms/PPECompForm";
import PPECreateInspectionModal from "../components/Audit-Create/PPECreateform";
import SetPriorityModal from "../components/Auditors-View/SetPriorityform";



function ActionMenu({
  id,
  onStartInspection,
  onEdit,
  onDelete,
  setShowCreateModal,
  setPriorityModalId,
  setShowPriorityModal,
  setCreateModalSection,
  onAddCorrective,
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
          className="absolute right-0 mt-2 w-44 z-50 ui-menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onStartInspection(id);
              setOpen(false);
            }}
            className="ui-menu-item text-primary"
          >
            Start Audit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setCreateModalSection(1);
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="ui-menu-item"
          >
            Assign Auditors
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onEdit?.(id);
              setOpen(false);
            }}
            className="ui-menu-item text-yellow-700"
          >
            View
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAddCorrective?.(id);
              setOpen(false);
            }}
            className="ui-menu-item text-emerald-700"
          >
            Add Corrective Actions
          </button>
          <button
            type="button"
            role="menuitem"
               onClick={() => {
              setPriorityModalId(id);
              setShowPriorityModal(true);
              setOpen(false);
            }}

            className="ui-menu-item text-yellow-700"
          >
            Set Priority
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDelete?.(id);
              setOpen(false);
            }}
            className="ui-menu-item text-red-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function CapaInterface() {
  // const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityModalId, setPriorityModalId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);
  const [showCorrectiveForm, setShowCorrectiveForm] = useState(false);
  const [correctiveInspection, setCorrectiveInspection] = useState(null);

  useEffect(() => {
    setData([
      {
        id: 1,
        reportId: "RPT-001",
        assessmentId: "ASM-001",
        date: "2025-08-30",
        area: "Warehouse Safety",
        auditors: "Alice",
        status: "Pending",
        issues: [],
      },
      {
        id: 2,
        reportId: "RPT-002",
        assessmentId: "ASM-002",
        date: "2025-08-28",
        area: "Forklift Operation",
        auditors: "Bob",
        status: "In Progress",
        issues: [],
      },
    ]);
  }, []);

  const handleStartInspection = (id) => {
    setActiveInspectionId(id);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowModal(true);
  };

  const handleEdit = (id) => {
    setReportToView(id);
    setShowReportExecute(true);
  };

  const handleAddCorrective = (id) => {
    const inspection = data.find((d) => d.id === id);
    if (inspection) {
      setCorrectiveInspection(inspection);
      setShowCorrectiveForm(true);
    }
  };

   const handleSaveCorrective = (newIssue) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === correctiveInspection.id
          ? { ...entry, issues: [...(entry.issues || []), newIssue] }
          : entry
      )
    );
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
      entry.date,
      entry.area,
      entry.auditors,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes((searchTerm || "").toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto ui-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="ui-title">PPE Compliance</h1>
        <button
          onClick={() => {
            setCreateModalSection(0);
            setShowCreateModal(true);  
          }}
          className="ui-btn ui-btn-primary"
        >
          + Create
        </button>
      </div>



      <PPECreateInspectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        startSection={createModalSection}
      />

              <SetPriorityModal
             isOpen={showPriorityModal}
             onClose={() => {
               setShowPriorityModal(false);
               setPriorityModalId(null);
             }}
             inspectionId={priorityModalId}
           />
      
      

      {/* Status Tabs */}
      <div className="ui-tabs mb-6" role="tablist">
        {["All", "Pending", "In Progress", "Completed", "Approved"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`ui-tab border ${
              activeTab === tab
                ? `${statusColors[tab]} border-transparent`
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
          className="ui-input w-full md:w-1/3"
        />
      </div>

      {/* Table */}
      <div className="ui-card p-4">
        <table className="ui-table border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Report ID",
                "Assessment ID",
                "Date",
                "Area",
                "Auditors",
                "Status",
                "Action",
              ].map((header) => (
                <th
                  key={header}
                  className="ui-th border border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry.id} className="ui-row">
                <td className="border px-4 py-2 text-sm">{entry.reportId}</td>
                <td className="border px-4 py-2 text-sm">{entry.assessmentId}</td>
                <td className="border px-4 py-2 text-sm">{entry.date}</td>
                <td className="border px-4 py-2 text-sm">{entry.area}</td>
                <td className="border px-4 py-2 text-sm">{entry.auditors}</td>
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
                    setPriorityModalId={setPriorityModalId}
                    setShowPriorityModal={setShowPriorityModal}
                    onAddCorrective={handleAddCorrective}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Corrective Action Modal */}
      {showCorrectiveForm && correctiveInspection && (
        <CorrectiveActionFormModal
          inspection={correctiveInspection}
          onClose={() => {
            setShowCorrectiveForm(false);
            setCorrectiveInspection(null);
          }}
          onSave={handleSaveCorrective}
        />
      )}

            {showFormModal && activeInspectionId !== null && (
              <PPECompFormModal
                isOpen={showFormModal}
                onClose={closeFormModal}
                inspectionId={activeInspectionId}
              />
            )}

       {showReportExecute && reportToView && (
                    <PPECompExecuteModal
                      inspection={reportToView}
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
