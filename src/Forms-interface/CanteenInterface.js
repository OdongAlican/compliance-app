import { useState, useEffect, useRef } from 'react';
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import CanteenFormModal from '../Forms/CanteenForm';
import CreateInspectionModal from '../Forms/CreateInspectionModal';
import DeleteModal from '../components/Execute/Delete';
import CanteenExecute from '../components/Execute/CanteenExecute';

const STATUS_STYLE = {
  Pending:       { background: 'color-mix(in srgb,#f85149 15%,transparent)', color: '#f85149' },
  'In Progress': { background: 'color-mix(in srgb,#d29922 15%,transparent)', color: '#d29922' },
  Completed:     { background: 'color-mix(in srgb,#3fb950 15%,transparent)', color: '#3fb950' },
  Approved:      { background: 'color-mix(in srgb,#58a6ff 15%,transparent)', color: '#58a6ff' },
};

function ActionMenu({ id, entry, onStartInspection, onView, onDelete, setShowCreateModal, setCreateModalSection }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)', background: open ? 'var(--bg-raised)' : 'transparent' }}>
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="ui-menu absolute right-0 mt-1 w-52 z-30">
          <button className="ui-menu-item" style={{ color: 'var(--accent)' }}
            onClick={() => { onStartInspection(id); setOpen(false); }}>
            Start Inspection
          </button>
          <button className="ui-menu-item" style={{ color: 'var(--text)' }}
            onClick={() => { setCreateModalSection(1); setShowCreateModal(true); setOpen(false); }}>
            Assign Safety Officer
          </button>
          <button className="ui-menu-item" style={{ color: 'var(--text)' }}
            onClick={() => { setCreateModalSection(2); setShowCreateModal(true); setOpen(false); }}>
            Assign Supervisor
          </button>
          <button className="ui-menu-item" style={{ color: 'var(--warning)' }}
            onClick={() => { onView(entry); setOpen(false); }}>
            View Details
          </button>
          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
          <button className="ui-menu-item" style={{ color: 'var(--danger)' }}
            onClick={() => { onDelete(id); setOpen(false); }}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const COLS = ['#', 'School / Canteen', 'Location', 'Date', 'Time', 'Safety Officer', 'Supervisor', 'Status', ''];

export default function CanteenInterface() {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showExecute, setShowExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setData([
      { id: 1, schoolname: 'Sunrise High',    location: 'Downtown',     dateofinspection: '2025-08-15', time: '10:00 AM', safetyofficer: 'Jane Smith',  supervisor: 'John Doe',    status: 'Pending'     },
      { id: 2, schoolname: 'Greenfield Acad', location: 'North Ridge',  dateofinspection: '2025-08-20', time: '09:30 AM', safetyofficer: 'Mark Lee',    supervisor: 'Alice Brown', status: 'In Progress' },
      { id: 3, schoolname: 'Bayside College', location: 'Harbour View', dateofinspection: '2025-07-10', time: '02:00 PM', safetyofficer: 'Sarah Kim',   supervisor: 'Tom Clark',   status: 'Completed'   },
      { id: 4, schoolname: 'Mountain View',   location: 'Uptown',       dateofinspection: '2025-07-25', time: '11:15 AM', safetyofficer: 'Paul Amegah', supervisor: 'Grace Addo',  status: 'Approved'    },
    ]);
  }, []);

  const filtered = data.filter((e) => {
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchSearch = !search ||
      e.schoolname.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      e.safetyofficer.toLowerCase().includes(search.toLowerCase());
    const matchFrom = !dateFrom || e.dateofinspection >= dateFrom;
    const matchTo   = !dateTo   || e.dateofinspection <= dateTo;
    return matchStatus && matchSearch && matchFrom && matchTo;
  });

  const handleExport = () => {
    const rows = [
      ['ID', 'School Name', 'Location', 'Date', 'Time', 'Safety Officer', 'Supervisor', 'Status'],
      ...filtered.map(e => [e.id, e.schoolname, e.location, e.dateofinspection, e.time, e.safetyofficer, e.supervisor, e.status]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'canteen-inspections.csv' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const hasFilters = statusFilter !== 'All' || search || dateFrom || dateTo;

  return (
    <div className="ui-page" style={{ color: 'var(--text)' }}>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb,var(--accent) 15%,transparent)' }}>
            <ClipboardDocumentCheckIcon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)' }}>Canteen Inspection</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All inspections and assignments in one place.</p>
          </div>
        </div>
        <button
          onClick={() => { setCreateModalSection(0); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
          style={{ background: 'var(--accent)' }}>
          + Create Inspection
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="ui-card mb-4 p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg px-3 py-2.5"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search school, officer, location…"
              style={{ background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: '13px', width: '100%' }} />
          </div>
          {/* Status dropdown */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 min-w-[160px]"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <FunnelIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: '13px', width: '100%', border: 'none', cursor: 'pointer' }}>
              {['All', 'Pending', 'In Progress', 'Completed', 'Approved'].map(s => (
                <option key={s} value={s} style={{ background: 'var(--bg-surface)', color: 'var(--text)' }}>{s}</option>
              ))}
            </select>
          </div>
          {/* Date range */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              title="From date"
              style={{ background: 'transparent', outline: 'none', color: dateFrom ? 'var(--text)' : 'var(--text-muted)', fontSize: '13px', border: 'none', cursor: 'pointer' }} />
            <span style={{ color: 'var(--border)', fontWeight: 600 }}>–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              title="To date"
              style={{ background: 'transparent', outline: 'none', color: dateTo ? 'var(--text)' : 'var(--text-muted)', fontSize: '13px', border: 'none', cursor: 'pointer' }} />
          </div>
          {/* Export */}
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg)' }}>
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {COLS.map((h, i) => (
                  <th key={i} className="ui-th text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No records match the current filters.
                  </td>
                </tr>
              ) : filtered.map((entry) => {
                const s = STATUS_STYLE[entry.status] || { background: 'var(--bg-raised)', color: 'var(--text-muted)' };
                return (
                  <tr key={entry.id} className="ui-row">
                    <td className="ui-td font-mono text-xs" style={{ color: 'var(--text-muted)' }}>#{entry.id}</td>
                    <td className="ui-td">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{entry.schoolname}</span>
                    </td>
                    <td className="ui-td text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{entry.location}</td>
                    <td className="ui-td text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{entry.dateofinspection}</td>
                    <td className="ui-td text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{entry.time}</td>
                    <td className="ui-td text-sm" style={{ color: 'var(--text)' }}>{entry.safetyofficer}</td>
                    <td className="ui-td text-sm" style={{ color: 'var(--text)' }}>{entry.supervisor}</td>
                    <td className="ui-td">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={s}>{entry.status}</span>
                    </td>
                    <td className="ui-td">
                      <ActionMenu
                        id={entry.id}
                        entry={entry}
                        onStartInspection={() => setShowFormModal(true)}
                        onView={(e) => { setReportToView(e); setShowExecute(true); }}
                        onDelete={(id) => { setItemToDelete(id); setShowModal(true); }}
                        setShowCreateModal={setShowCreateModal}
                        setCreateModalSection={setCreateModalSection}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Table footer */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {data.length} records
          </span>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}
              className="text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--accent)' }}>
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateInspectionModal
        key={`create-${createModalSection}`}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        startSection={createModalSection}
      />
      <CanteenFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} />
      <DeleteModal
        isOpen={showModal}
        onCancel={() => { setShowModal(false); setItemToDelete(null); }}
        onConfirm={() => { setData(p => p.filter(e => e.id !== itemToDelete)); setShowModal(false); setItemToDelete(null); }}
      />
      {showExecute && reportToView && (
        <CanteenExecute
          inspection={reportToView}
          onClose={() => { setShowExecute(false); setReportToView(null); }}
        />
      )}
    </div>
  );
}
