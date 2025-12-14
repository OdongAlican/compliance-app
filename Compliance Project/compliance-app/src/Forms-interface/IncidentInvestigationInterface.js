import React, { useState, useEffect, } from "react";
import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import CreateInspectionModal from "../Forms/CreateInspectionModal";
import IncidentInvestigationFormModal from "../Forms/IncidentInvestigationForm";
import DeleteModal from "../components/Execute/Delete";
import IncidentInvestExecute from "../components/Execute/IncidentInvestExecute";



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
              onStartInspection(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
            aria-label={`Start inspection for ID ${id}`}
          >
            Start Investigation
          </button>
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









export default function IncidentNotifyInterface() {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showModal, setShowModal] = useState(false); // for DeleteModal
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);

  useEffect(() => {
    setData([
      {
        id: 1,
        typeofincident: "Slip and Fall",
        dateofinspection: "2024-08-15",
        timeofinspection: "10:00 AM",
        personinvolved: "Jane Smith",
        reportedby: "John Doe",
        status: "Pending",
      },
      {
        id: 2,
        typeofincident: "Slip and Fall",
        dateofinspection: "2024-08-15",
        timeofinspection: "10:00 AM",
        personinvolved: "Jane Smith",
        reportedby: "John Doe",
        status: "Completed",
      },
    ]);
  }, []);

  const handleStartInspection = (id) => {
    setActiveInspectionId(id);
    setShowFormModal(true);
  };

 const handleDelete = (id) => { setItemToDelete(id);setShowModal(true);};
  const handleEdit = (id) => {setReportToView(id);setShowReportExecute(true);};




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

  const navigate = useNavigate();

  // Filter data by status and search term
  const filteredData = data.filter((entry) => {
    const matchesTab = activeTab === "All" || entry.status === activeTab;
    const matchesSearch =
      entry.typeofincident.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.dateofinspection.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.timeofinspection.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.personinvolved.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reportedby.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Incident Investigation</h1>
      {/* Create Inspection Button and Modal */}
      <div className="flex justify-end mb-4">
                <button
          type="button"
          onClick={() => {
            setCreateModalSection(0);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-primary text-tertiary rounded"
          aria-label="Create inspection"
        >
          + Create Investigation
        </button>
      
        <CreateInspectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          startSection={createModalSection}
        />
      </div>



      {/* Search Bar */}
      <div className="mb-4">
        <input
          id="pool-search"
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded px-4 py-2"
        />
      </div>




      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                "ID",
                "Type of Incident",
                "Date of Inspection",
                "Time of Inspection",
                "Person in Involved",
                "Reported By",
                "Status",
                "Action",
              ].map((header) => (
                <th key={header} className="border px-4 py-2 text-left text-sm font-medium text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-sm">{entry.id}</td>
                <td className="border px-4 py-2 text-sm">{entry.typeofincident}</td>
                <td className="border px-4 py-2 text-sm">{entry.dateofinspection}</td>
                <td className="border px-4 py-2 text-sm">{entry.timeofinspection}</td>
                <td className="border px-4 py-2 text-sm">{entry.personinvolved}</td>
                <td className="border px-4 py-2 text-sm">{entry.reportedby}</td>
                <td className="border px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[entry.status]}`}>
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
      {showFormModal && activeInspectionId !== null && (
        <IncidentInvestigationFormModal
          isOpen={showFormModal}
          onClose={closeFormModal}
          inspectionId={activeInspectionId}
        />
      )}

            {showReportExecute && reportToView && (
  <IncidentInvestExecute
    reportId={reportToView}
    onClose={() => {
      setShowReportExecute(false);
      setReportToView(null);
    }}
  />
)}

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