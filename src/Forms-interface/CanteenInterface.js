import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchCanteenSetups,
  deleteCanteenSetup,
  setCanteenPage,
  setCanteenName,
  setCanteenDateFrom,
  setCanteenDateTo,
  clearCanteenFilters,
  clearCanteenError,
  clearActionError,
  selectCanteenSetups,
  selectCanteenMeta,
  selectCanteenLoading,
  selectCanteenError,
  selectCanteenFilters,
} from "../store/slices/canteenSlice";
import useAuth from "../hooks/useAuth";
import UsersService from "../services/users.service";
import { STATUS_STYLE } from "./canteen/constants";
import { Pagination, TableSkeleton } from "./canteen/shared";
import ActionMenu from "./canteen/ActionMenu";
import SetupFormModal from "./canteen/SetupFormModal";
import ReassignModal from "./canteen/ReassignModal";
import DeleteConfirmModal from "./canteen/DeleteConfirmModal";
import StartInspectionModal from "./canteen/StartInspectionModal";
import DetailDrawer from "./canteen/DetailDrawer";


/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                              */
/* ═══════════════════════════════════════════════════════════════════════ */
const COLS = [
  "#",
  "Name",
  "Location",
  "Date",
  "Time",
  "Safety Officer",
  "Supervisor",
  "Status",
  "",
];

export default function CanteenInterface() {
  const dispatch = useAppDispatch();
  const { hasPermission } = useAuth();

  const setups = useAppSelector(selectCanteenSetups);
  const meta = useAppSelector(selectCanteenMeta);
  const loading = useAppSelector(selectCanteenLoading);
  const error = useAppSelector(selectCanteenError);
  const filters = useAppSelector(selectCanteenFilters);

  const canCreate = hasPermission("canteen_inspections.create");
  const canUpdate = hasPermission("canteen_inspections.update");
  const canDelete = hasPermission("canteen_inspections.delete");

  const [users, setUsers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [setupModal, setSetupModal] = useState({ open: false, setup: null });
  const [reassignModal, setReassignModal] = useState({ open: false, mode: null, setupId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [startModal, setStartModal] = useState({ open: false, setup: null });
  const [detailDrawer, setDetailDrawer] = useState({ open: false, setup: null });
  const [searchInput, setSearchInput] = useState("");
  const searchTimer = useRef(null);

  /* Load setups when filters change */
  useEffect(() => {
    dispatch(fetchCanteenSetups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.name, filters.date_from, filters.date_to]);

  /* Load users once */
  useEffect(() => {
    UsersService.list({ per_page: 200 })
      .then((res) => setUsers(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => { });

    /* Try to load inspection catalog */
    import("../services/inspections.service")
      .then((m) => {
        const svc = m.default;
        const fn = typeof svc?.list === "function" ? svc.list.bind(svc) : null;
        if (fn)
          fn()
            .then((r) => setCatalogItems(Array.isArray(r) ? r : r.data ?? []))
            .catch(() => { });
      })
      .catch(() => { });
  }, []);

  /* Surface API errors via toast */
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCanteenError());
    }
  }, [error, dispatch]);

  /* Search debounce */
  function handleSearch(val) {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => dispatch(setCanteenName(val)), 400);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteCanteenSetup(deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    if (deleteCanteenSetup.fulfilled.match(result)) toast.success("Inspection deleted.");
    else toast.error(result.payload || "Delete failed.");
  }

  function handleExport() {
    const rows = [
      ["ID", "Name", "Location", "Date", "Time", "Safety Officer", "Supervisor"],
      ...setups.map((s) => [
        s.id,
        s.name,
        s.location,
        s.date,
        s.time,
        s.safety_officer
          ? s.safety_officer.firstname + " " + s.safety_officer.lastname
          : s.safetyofficer ?? "",
        s.supervisor
          ? s.supervisor.firstname + " " + s.supervisor.lastname
          : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "canteen-inspections.csv",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  const hasFilters = !!(filters.name || filters.date_from || filters.date_to);

  return (
    <div className="ui-page" style={{ color: "var(--text)" }}>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)" }}
          >
            <ClipboardDocumentCheckIcon
              className="w-5 h-5"
              style={{ color: "var(--accent)" }}
            />
          </div>
          <div>
            <h1
              className="text-xl font-bold leading-tight"
              style={{ color: "var(--text)" }}
            >
              Canteen Inspection
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {meta
                ? meta.total + " inspection" + (meta.total !== 1 ? "s" : "")
                : "Manage canteen inspection setups."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchCanteenSetups())}
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
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg px-3 py-2.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <MagnifyingGlassIcon
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or location…"
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
                onClick={() => { setSearchInput(""); dispatch(setCanteenName("")); }}
                style={{ color: "var(--text-muted)" }}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Date range */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <CalendarDaysIcon
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => dispatch(setCanteenDateFrom(e.target.value))}
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
            <span style={{ color: "var(--border)", fontWeight: 600 }}>–</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => dispatch(setCanteenDateTo(e.target.value))}
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
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={setups.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-50"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              background: "var(--bg)",
            }}
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => { setSearchInput(""); dispatch(clearCanteenFilters()); }}
              className="text-xs font-medium px-3 py-2 rounded-lg hover:opacity-80"
              style={{
                color: "var(--accent)",
                background: "color-mix(in srgb,var(--accent) 10%,transparent)",
              }}
            >
              <FunnelIcon className="h-3.5 w-3.5 inline mr-1" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="ui-card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {COLS.map((h, i) => (
                  <th key={i} className="ui-th text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={COLS.length} rows={filters.per_page ?? 10} />
            ) : setups.length === 0 ? (
              <tbody>
                <tr>
                  <td
                    colSpan={COLS.length}
                    className="py-16 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {hasFilters
                      ? "No records match the current filters."
                      : "No canteen inspections yet."}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {setups.map((setup) => {
                  const soName = setup.safety_officer
                    ? setup.safety_officer.firstname +
                    " " +
                    setup.safety_officer.lastname
                    : setup.safetyofficer ?? "—";
                  const supName = setup.supervisor
                    ? setup.supervisor.firstname + " " + setup.supervisor.lastname
                    : "—";
                  const status = setup.status ?? "Pending";
                  const sStyle =
                    STATUS_STYLE[status] ?? {
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
                        {
                          label: "Edit",
                          onClick: () => setSetupModal({ open: true, setup }),
                        },
                        {
                          label: "Reassign Safety Officer",
                          onClick: () =>
                            setReassignModal({
                              open: true,
                              mode: "safety_officer",
                              setupId: setup.id,
                            }),
                        },
                        {
                          label: "Reassign Supervisor",
                          onClick: () =>
                            setReassignModal({
                              open: true,
                              mode: "supervisor",
                              setupId: setup.id,
                            }),
                        },
                      ]
                      : []),
                    ...(canDelete
                      ? [
                        { divider: true },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: () => setDeleteTarget(setup),
                        },
                      ]
                      : []),
                  ];
                  return (
                    <tr key={setup.id} className="ui-row">
                      <td
                        className="ui-td font-mono text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        #{setup.id}
                      </td>
                      <td className="ui-td">
                        <button
                          onClick={() => setDetailDrawer({ open: true, setup })}
                          className="font-semibold text-sm hover:underline text-left"
                          style={{ color: "var(--accent)" }}
                        >
                          {setup.name}
                        </button>
                      </td>
                      <td
                        className="ui-td text-sm whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {setup.location}
                      </td>
                      <td
                        className="ui-td text-sm whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {setup.date}
                      </td>
                      <td
                        className="ui-td text-sm whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {setup.time}
                      </td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>
                        {soName}
                      </td>
                      <td className="ui-td text-sm" style={{ color: "var(--text)" }}>
                        {supName}
                      </td>
                      <td className="ui-td">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={sStyle}
                        >
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
        <Pagination meta={meta} onPage={(p) => dispatch(setCanteenPage(p))} />
        {!meta && setups.length > 0 && (
          <div
            className="px-4 py-3 text-xs"
            style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
          >
            {setups.length} record{setups.length !== 1 ? "s" : ""} loaded
          </div>
        )}
      </div>

      {/* MODALS & DRAWERS */}
      <SetupFormModal
        isOpen={setupModal.open}
        onClose={() => {
          setSetupModal({ open: false, setup: null });
          dispatch(clearActionError());
        }}
        setup={setupModal.setup}
        catalogItems={catalogItems}
      />
      <ReassignModal
        isOpen={reassignModal.open}
        onClose={() => setReassignModal({ open: false, mode: null, setupId: null })}
        mode={reassignModal.mode}
        setupId={reassignModal.setupId}
        users={users}
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
