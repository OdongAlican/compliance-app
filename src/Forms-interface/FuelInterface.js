import React, { useState, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import CreateInspectionModal from "../Forms/CreateInspectionModal";
import FuelStorageFormModal from "../Forms/FuelStorageForm";
import DeleteModal from "../components/Execute/Delete";
import FuelExecute from "../components/Execute/FuelExecute";

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
          className="ui-menu absolute right-0 mt-2 w-48 z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onStartInspection(id);
              setOpen(false);
            }}
            className="ui-menu-item text-primary"
            aria-label={`Start inspection for ID ${id}`}
          >
            Start Inspection
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setCreateModalSection(1);
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="ui-menu-item text-gray-800"
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
            className="ui-menu-item text-gray-800"
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
            className="ui-menu-item text-yellow-700"
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
            className="ui-menu-item text-red-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function FuelInterface() {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false); // for DeleteModal
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);

  useEffect(() => {
    setData([
      {
        id: 1,
        labname: "Central Science Lab",
        location: "Downtown",
        dateofinspection: "2024-08-15",
        time: "10:00 AM",
        safetyofficer: "Jane Smith",
        supervisor: "John Doe",
        status: "Pending",
      },
      {
        id: 2,
        labname: "Airport Science Lab",
        location: "Airport",
        dateofinspection: "2024-08-16",
        time: "11:00 AM",
        safetyofficer: "Mike Brown",
        supervisor: "Sarah Lee",
        status: "Completed",
      },
    ]);
  }, []);

  const handleStartInspection = (id) => {
    setActiveInspectionId(id);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {setItemToDelete(id); setShowModal(true);};
  const handleEdit = (inspection) => { setReportToView(inspection); setShowReportExecute(true);}
 



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

  // Filter data by status and search term
  const filteredData = data.filter((entry) => {
    const matchesTab = activeTab === "All" || entry.status === activeTab;
    const matchesSearch =
      entry.labname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.safetyofficer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto ui-page">
      <h1 className="ui-title mb-6">Fuel Inspection</h1>
      {/* Create Inspection Button and Modal */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            setCreateModalSection(0);
            setShowCreateModal(true);
          }}
          className="ui-btn ui-btn-primary"
          aria-label="Create inspection"
        >
          + Create Inspection
        </button>
        <CreateInspectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          startSection={createModalSection}
        />
      </div>
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
          id="pool-search"
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ui-input w-full md:w-1/3"
        />
      </div>
      <div className="ui-card p-4">
        <table className="ui-table">
          <thead>
            <tr>
              {[
                "ID",
                "Lab Name",
                "Location",
                "Date of Inspection",
                "Time",
                "Safety Officer",
                "Supervisor",
                "Status",
                "Action",
              ].map((header) => (
                <th key={header} className="ui-th">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry.id} className="ui-row">
                <td className="ui-td">{entry.id}</td>
                <td className="ui-td">{entry.labname}</td>
                <td className="ui-td">{entry.location}</td>
                <td className="ui-td">{entry.dateofinspection}</td>
                <td className="ui-td">{entry.time}</td>
                <td className="ui-td">{entry.safetyofficer}</td>
                <td className="ui-td">{entry.supervisor}</td>
                <td className="ui-td">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[entry.status]}`}>
                    {entry.status}
                  </span>
                </td>
                <td className="ui-td">
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
        <FuelStorageFormModal
          isOpen={showFormModal}
          onClose={closeFormModal}
          inspectionId={activeInspectionId}
        />
      )}

{showReportExecute && reportToView && (
  <FuelExecute
    inspection={reportToView}   // full object
    onClose={() => {
      setShowReportExecute(false);
      setReportToView(null);
    }}
  />
)}




      <DeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          setData((prev) => prev.filter((entry) => entry.id !== itemToDelete));
          setShowModal(false);
        }}
      />
    </div>
  );
}