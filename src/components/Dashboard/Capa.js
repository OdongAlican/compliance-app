import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import HazardReportExecute from "../Execute/HazardReportExecute";
import DeleteModal from "../Execute/Delete";
import CreateInspectionModal from "../../Forms/Auditors";

const STATUS_STYLE = {
  Pending:      { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" },
  "In Progress":{ background: "color-mix(in srgb,#58a6ff 15%,transparent)", color: "#58a6ff" },
  Completed:    { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
  Approved:     { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
};

function ActionMenu({ id, onEdit, onDelete, setShowCreateModal, setCreateModalSection }) {
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
          <div
            role="menu"
            aria-label={`Actions for row ${id}`}
            className="ui-menu absolute right-0 mt-1 z-50"
          >
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

export default function HazardInterface() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [, setShowFormModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [, setActiveInspectionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setData([
      { id: 1, reportId: "RPT-001", assessmentId: "ASM-001", activity: "Chemical Mixing", date: "2025-08-30", safetyofficer: "Alice", supervisor: "John", location: "Building A", status: "Pending" },
      { id: 2, reportId: "RPT-002", assessmentId: "ASM-002", activity: "Electrical Maintenance", date: "2025-08-28", safetyofficer: "Bob", supervisor: "Jane", location: "Warehouse", status: "In Progress" },
    ]);
  }, []);

  const handleStartInspection = (id) => { setActiveInspectionId(id); setShowFormModal(true); };
  const handleEdit = (id) => navigate(`/hazard/report/${id}`);
  const handleDelete = (id) => { setItemToDelete(id); setShowModal(true); };

  const TABS = ["All", "Pending", "In Progress", "Completed", "Approved"];

  const filteredData = data.filter((entry) => {
    const matchesTab = activeTab === "All" || entry.status === activeTab;
    const haystack = [entry.reportId, entry.assessmentId, entry.activity, entry.location, entry.safetyofficer, entry.supervisor]
      .filter(Boolean).join(" ").toLowerCase();
    return matchesTab && haystack.includes((searchTerm || "").toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ color: "var(--text)" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>CAPA Tracking Audit</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Corrective and preventive action tracking</p>
        </div>
      </div>

      <CreateInspectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        startSection={createModalSection}
      />

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <input
            id="capa-search"
            type="text"
            placeholder="Search reports…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ui-input pl-9 w-full"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
              style={
                activeTab === tab
                  ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                  : { background: "transparent", color: "var(--text-muted)", borderColor: "var(--border)" }
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ui-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                {["Report ID", "Assessment ID", "Activity", "Date", "Safety Officer", "Supervisors", "Location", "Status", "Action"].map((h) => (
                  <th key={h} className="ui-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No records found.
                  </td>
                </tr>
              ) : filteredData.map((entry) => (
                <tr key={entry.id} className="ui-row">
                  <td className="ui-td font-mono text-xs">{entry.reportId}</td>
                  <td className="ui-td font-mono text-xs">{entry.assessmentId}</td>
                  <td className="ui-td font-medium">{entry.activity}</td>
                  <td className="ui-td">{entry.date}</td>
                  <td className="ui-td">{entry.safetyofficer}</td>
                  <td className="ui-td">{entry.supervisor}</td>
                  <td className="ui-td">{entry.location}</td>
                  <td className="ui-td">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={STATUS_STYLE[entry.status] || { background: "color-mix(in srgb,var(--text-muted) 15%,transparent)", color: "var(--text-muted)" }}
                    >
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

      {showReportExecute && reportToView && (
        <HazardReportExecute
          reportId={reportToView}
          onClose={() => { setShowReportExecute(false); setReportToView(null); }}
        />
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