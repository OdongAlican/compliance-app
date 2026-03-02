import React, { useState, useEffect, } from "react";
// import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import CreateInspectionModal from "../Forms/CreateInspectionModal";
import WitnessFormModal from "../Forms/WitnessForm";
import DeleteModal from "../components/Execute/Delete";
import WitnessExecute from "../components/Execute/WitnessExecute";



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
            className="ui-menu-item"
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
            className="ui-menu-item"
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









export default function WitnessStateInterface() {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showModal, setShowModal] = useState(false); // for DeleteModal
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
    const [showReportExecute, setShowReportExecute] = useState(false); //for Edit/view modal
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

  // const navigate = useNavigate();

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
    <div className="p-6 max-w-7xl mx-auto ui-page">
      <h1 className="ui-title mb-6">Witness Statement</h1>
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
          + Create Statement
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
          className="ui-input w-full md:w-1/3"
        />
      </div>




      <div className="ui-card p-4">
        <table className="ui-table border border-gray-200">
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
                <th key={header} className="ui-th border border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry.id} className="ui-row">
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
        <WitnessFormModal
          isOpen={showFormModal}
          onClose={closeFormModal}
          inspectionId={activeInspectionId}
        />
      )}

            {showReportExecute && reportToView && (
        <WitnessExecute
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