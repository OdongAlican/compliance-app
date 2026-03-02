import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon, UserGroupIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import CreateInspectionModal from "../HazardRiskManagement/CreateInspectionModal";
import IncidentFormModal from "../../Forms/IncidentForm";
import DeleteModal from "../Execute/Delete";
import IncidentExecute from "../Execute/IncidentExecute";

const STATUS_STYLE = {
  Pending:      { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" },
  "In Progress":{ background: "color-mix(in srgb,#58a6ff 15%,transparent)", color: "#58a6ff" },
  Completed:    { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
  Approved:     { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
};

const INCIDENT_CARDS = [
  { label: "Incident Notification", icon: ExclamationTriangleIcon, color: "#f85149", route: "/dashboard/incidentform" },
  { label: "Witness Statement",     icon: UserGroupIcon,             color: "#d29922", route: "/form/witness" },
  { label: "Incident Investigation",icon: ClipboardDocumentListIcon, color: "#58a6ff", route: "/form/description" },
];

function ActionMenu({ id, onStartInspection, onEdit, onDelete, setShowCreateModal, setCreateModalSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ color: "var(--text-muted)" }}
        className="p-1 rounded hover:opacity-80 transition-opacity"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" aria-label={`Actions for row ${id}`} className="ui-menu absolute right-0 mt-1 z-50">
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { setCreateModalSection(1); setShowCreateModal(true); setOpen(false); }}>
              Assign Safety Officer
            </button>
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { setCreateModalSection(2); setShowCreateModal(true); setOpen(false); }}>
              Assign Supervisor
            </button>
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { onEdit?.(id); setOpen(false); }}
              style={{ color: "var(--accent)" }}>
              View
            </button>
            <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { onDelete?.(id); setOpen(false); }}
              style={{ color: "var(--danger)" }}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function IncidentInterface() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);

  useEffect(() => {
    setData([
      { id: 1, typeofincident: "Slip and Fall", dateofinspection: "2024-08-15", timeofinspection: "10:00 AM", personinvolved: "Jane Smith", reportedby: "John Doe", status: "Pending" },
      { id: 2, typeofincident: "Slip and Fall", dateofinspection: "2024-08-15", timeofinspection: "10:00 AM", personinvolved: "Jane Smith", reportedby: "John Doe", status: "Completed" },
    ]);
  }, []);

  const handleStartInspection = (id) => { setActiveInspectionId(id); setShowFormModal(true); };
  const handleDelete = (id) => { setItemToDelete(id); setShowModal(true); };
  const handleEdit = (id) => { setReportToView(id); setShowReportExecute(true); };
  const closeFormModal = () => { setShowFormModal(false); setActiveInspectionId(null); };

  const filteredData = data.filter((entry) => {
    const matchesTab = activeTab === "All" || entry.status === activeTab;
    const matchesSearch = [entry.typeofincident, entry.dateofinspection, entry.timeofinspection, entry.personinvolved, entry.reportedby]
      .join(" ").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Incidents Inspection</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Track and manage workplace incident reports</p>
      </div>

      <CreateInspectionModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} startSection={createModalSection} />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {INCIDENT_CARDS.map(({ label, icon: Icon, color, route }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(route)}
            className="ui-card flex items-center gap-4 p-5 text-left hover:scale-[1.01] transition-transform group cursor-pointer"
          >
            <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `color-mix(in srgb,${color} 15%,transparent)` }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </span>
            <span className="flex-1 font-semibold text-sm" style={{ color: "var(--text)" }}>{label}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>→</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <input
          id="incident-search"
          type="text"
          placeholder="Search incidents…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ui-input pl-9 w-full"
        />
      </div>

      {/* Table */}
      <div className="ui-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                {["ID", "Type of Incident", "Date", "Time", "Person Involved", "Reported By", "Status", "Action"].map((h) => (
                  <th key={h} className="ui-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>No incidents found.</td></tr>
              ) : filteredData.map((entry) => (
                <tr key={entry.id} className="ui-row">
                  <td className="ui-td font-mono text-xs">{entry.id}</td>
                  <td className="ui-td font-medium">{entry.typeofincident}</td>
                  <td className="ui-td">{entry.dateofinspection}</td>
                  <td className="ui-td">{entry.timeofinspection}</td>
                  <td className="ui-td">{entry.personinvolved}</td>
                  <td className="ui-td">{entry.reportedby}</td>
                  <td className="ui-td">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={STATUS_STYLE[entry.status] || { background: "color-mix(in srgb,var(--text-muted) 15%,transparent)", color: "var(--text-muted)" }}>
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
      </div>

      {showFormModal && activeInspectionId !== null && (
        <IncidentFormModal isOpen={showFormModal} onClose={closeFormModal} inspectionId={activeInspectionId} />
      )}

      {showReportExecute && reportToView && (
        <IncidentExecute reportId={reportToView} onClose={() => { setShowReportExecute(false); setReportToView(null); }} />
      )}

      <DeleteModal
        isOpen={showModal}
        onCancel={() => { setShowModal(false); setItemToDelete(null); }}
        onConfirm={() => {
          setData((prev) => prev.filter((entry) => entry.id !== itemToDelete));
          setShowModal(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}