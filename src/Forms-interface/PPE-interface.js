import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchPpeSetups,
  deletePpeSetup,
  setPpeFilter,
  setPpePage,
  clearPpeFilters,
  clearPpeError,
  clearPpeActionError,
  selectPpeSetups,
  selectPpeSetupsMeta,
  selectPpeLoading,
  selectPpeError,
  selectPpeFilters,
} from "../store/slices/ppeSlice";
import useAuth from "../hooks/useAuth";
import { STATUS_STYLE, TABLE_COLS } from "./ppe/constants";
import { Pagination, TableSkeleton } from "./ppe/shared";
import ActionMenu from "./ppe/ActionMenu";
import SetupFormModal from "./ppe/SetupFormModal";
import ReassignModal from "./ppe/ReassignModal";
import DeleteConfirmModal from "./ppe/DeleteConfirmModal";
import StartInspectionModal from "./ppe/StartInspectionModal";
import DetailDrawer from "./ppe/DetailDrawer";
import moment from "moment";

export default function PPEInterface() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();
  const setups  = useAppSelector(selectPpeSetups);
  const meta    = useAppSelector(selectPpeSetupsMeta);
  const loading = useAppSelector(selectPpeLoading);
  const error   = useAppSelector(selectPpeError);
  const filters = useAppSelector(selectPpeFilters);

  const canCreate = hasPermission("ppe_inspections.create");
  const canUpdate = hasPermission("ppe_inspections.update");
  const canDelete = hasPermission("ppe_inspections.destroy");

  const [setupModal,    setSetupModal]    = useState({ open: false, setup: null });
  const [reassignModal, setReassignModal] = useState({ open: false, mode: null, setupId: null });
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [startModal,    setStartModal]    = useState({ open: false, setup: null });
  const [detailDrawer,  setDetailDrawer]  = useState({ open: false, setup: null });
  const [searchInput,   setSearchInput]   = useState("");
  const searchTimer = useRef(null);

  useEffect(() => {
    dispatch(fetchPpeSetups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.department, filters.date_from, filters.date_to]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearPpeError()); }
  }, [error, dispatch]);

  function handleSearch(val) {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => dispatch(setPpeFilter({ key: "department", value: val })),
      400
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deletePpeSetup(deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    if (deletePpeSetup.fulfilled.match(result)) toast.success("Inspection deleted.");
    else toast.error(result.payload || "Delete failed.");
  }

  function handleExport() {
    const rows = [
      ["ID", "Department", "PPE User", "Date", "Safety Officer", "Supervisor"],
      ...setups.map((s) => [
        s.id,
        s.department ?? "",
        s.ppe_user ? s.ppe_user.firstname + " " + s.ppe_user.lastname : "",
        s.date ?? "",
        s.safety_officer ? s.safety_officer.firstname + " " + s.safety_officer.lastname : "",
        s.supervisor ? s.supervisor.firstname + " " + s.supervisor.lastname : "",
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "ppe-inspections.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  const hasFilters = !!(filters.department || filters.date_from || filters.date_to);

  return (
    <div className="ui-page" style={{ color: "var(--text)" }}>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)" }}
          >
            <ShieldCheckIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text)" }}>
              PPE Inspections
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {meta
                ? meta.total + " inspection" + (meta.total !== 1 ? "s" : "")
                : "Manage PPE inspection setups."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchPpeSetups())}
            disabled={loading}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
            title="Refresh"
          >
            <ArrowPathIcon className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
          </button>
          {canCreate && (
            <button
              onClick={() => setSetupModal({ open: true, setup: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              <PlusIcon className="h-4 w-4" /> New Inspection
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="ui-card mb-4 p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
          <div
            className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg px-3 py-2.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by Department..."
              style={{
                background: "transparent",
                outline: "none",
                color: "var(--text)",
                fontSize: "13px",
                width: "100%",
              }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); dispatch(setPpeFilter({ key: "department", value: "" })); }}
                style={{ color: "var(--text-muted)" }}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => dispatch(setPpeFilter({ key: "date_from", value: e.target.value }))}
              title="From date"
              style={{
                background: "transparent",
                outline: "none",
                color: filters.date_from ? "var(--text)" : "var(--text-muted)",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
              }}
            />
            <span style={{ color: "var(--border)", fontWeight: 600 }}>-</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => dispatch(setPpeFilter({ key: "date_to", value: e.target.value }))}
              title="To date"
              style={{
                background: "transparent",
                outline: "none",
                color: filters.date_to ? "var(--text)" : "var(--text-muted)",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
              }}
            />
          </div>
          <button
            onClick={handleExport}
            disabled={setups.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg)" }}
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
          {hasFilters && (
            <button
              onClick={() => { setSearchInput(""); dispatch(clearPpeFilters()); }}
              className="text-xs font-medium px-3 py-2 rounded-lg hover:opacity-80"
              style={{ color: "var(--accent)", background: "color-mix(in srgb,var(--accent) 10%,transparent)" }}
            >
              <FunnelIcon className="h-3.5 w-3.5 inline mr-1" />Clear filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {TABLE_COLS.map((h, i) => (
                  <th key={i} className="ui-th text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={TABLE_COLS.length} rows={filters.per_page ?? 10} />
            ) : setups.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={TABLE_COLS.length} className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {hasFilters
                      ? "No records match the current filters."
                      : "No PPE inspections yet."}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {setups.map((setup) => {
                  const ppeUserName = setup.ppe_user
                    ? setup.ppe_user.firstname + " " + setup.ppe_user.lastname
                    : "-";
                  const soName  = setup.safety_officer
                    ? setup.safety_officer.firstname + " " + setup.safety_officer.lastname
                    : "-";
                  const supName = setup.supervisor
                    ? setup.supervisor.firstname + " " + setup.supervisor.lastname
                    : "-";
                  const status = setup.status ?? "Pending";
                  const sStyle = STATUS_STYLE[status] ?? {
                    background: "var(--bg-raised)",
                    color: "var(--text-muted)",
                  };
                  const actions = [
                    {
                      label: "View Details",
                      color: "var(--accent)",
                      onClick: () => setDetailDrawer({ open: true, setup }),
                    },
                    {
                      label: "Start Inspection",
                      color: "#3fb950",
                      onClick: () => setStartModal({ open: true, setup }),
                    },
                    ...(canUpdate
                      ? [
                          { label: "Edit", onClick: () => setSetupModal({ open: true, setup }) },
                          {
                            label: "Reassign Safety Officer",
                            onClick: () =>
                              setReassignModal({ open: true, mode: "safety_officer", setupId: setup.id }),
                          },
                          {
                            label: "Reassign Supervisor",
                            onClick: () =>
                              setReassignModal({ open: true, mode: "supervisor", setupId: setup.id }),
                          },
                        ]
                      : []),
                    ...(canDelete
                      ? [{ divider: true }, { label: "Delete", danger: true, onClick: () => setDeleteTarget(setup) }]
                      : []),
                  ];

                  return (
                    <tr key={setup.id} className="ui-row">
                      <td className="ui-td font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        #{setup.id}
                      </td>
                      <td className="ui-td">
                        <button
                          onClick={() => setDetailDrawer({ open: true, setup })}
                          className="font-semibold text-sm hover:underline text-left"
                          style={{ color: "var(--accent)" }}
                        >
                          {setup.department}
                        </button>
                      </td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>
                        {ppeUserName}
                      </td>
                      <td className="ui-td text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {moment(setup.date).format("MMMM Do, YYYY")}
                      </td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>{soName}</td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>{supName}</td>
                      <td className="ui-td">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={sStyle}>
                          {status}
                        </span>
                      </td>
                      <td className="ui-td">
                        <ActionMenu actions={actions} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        <Pagination meta={meta} onPage={(p) => dispatch(setPpePage(p))} />
      </div>

      {/* MODALS & DRAWERS */}
      <SetupFormModal
        isOpen={setupModal.open}
        onClose={() => {
          setSetupModal({ open: false, setup: null });
          dispatch(clearPpeActionError());
        }}
        setup={setupModal.setup}
      />
      <ReassignModal
        isOpen={reassignModal.open}
        onClose={() => setReassignModal({ open: false, mode: null, setupId: null })}
        mode={reassignModal.mode}
        setupId={reassignModal.setupId}
      />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        setup={deleteTarget}
        loading={deleting}
        onConfirm={handleDelete}
      />
      <StartInspectionModal
        isOpen={startModal.open}
        onClose={() => setStartModal({ open: false, setup: null })}
        setup={startModal.setup}
      />
      <DetailDrawer
        isOpen={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, setup: null })}
        setup={detailDrawer.setup}
      />
    </div>
  );
}
