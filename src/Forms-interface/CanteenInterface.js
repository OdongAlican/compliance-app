import { useState, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import CanteenFormModal from '../Forms/CanteenForm';
import CreateInspectionModal from '../Forms/CreateInspectionModal';
import DeleteModal from '../components/Execute/Delete';
import CanteenExecute from '../components/Execute/CanteenExecute';

// Action menu for each row
function ActionMenu({ id, onStartInspection, onEdit, onDelete, setShowCreateModal, setCreateModalSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-gray-500 hover:text-gray-700"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="ui-menu absolute right-0 mt-2 w-48 z-10">
          <button
            onClick={() => {
              onStartInspection(id);
              setOpen(false);
            }}
            className="ui-menu-item text-primary"
          >
            Start Inspection
          </button>
          <button
            onClick={() => {
              setCreateModalSection(1); // 1 = Safety Officers section
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="ui-menu-item text-gray-800"
          >
            Assign Safetyofficer
          </button>
          <button
            onClick={() => {
              setCreateModalSection(2); // 2 = Supervisors section
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="ui-menu-item text-gray-800"
          >
            Assign Supervisor
          </button>
          <button
            onClick={() => {
              onEdit?.(id);
              setOpen(false);
            }}
            className="ui-menu-item text-yellow-700"
          >
            View
          </button>
          <button
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

export default function CanteenInterface({ darkMode }) {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0); // 0 = first section
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false); // for DeleteModal
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);

  useEffect(() => {
    const mockData = [
      {
        id: 1,
        schoolname: 'Sunrise High',
        location: 'Downtown',
        dateofinspection: '2024-08-15',
        time: '10:00 AM',
        safetyofficer: 'Jane Smith',
        supervisor: 'John Doe',
        status: 'Pending',
      },
    ];
    setData(mockData);
  }, []);

  // When Start Inspection is clicked, open the modal
  const handleStartInspection = (id) => {
    setShowFormModal(true);
  };

  const handleEdit = (inspection) => { setReportToView(inspection); setShowReportExecute(true); }

  const handleDelete = (id) => { setItemToDelete(id); setShowModal(true); };

  const statusColors = darkMode
    ? {
      Pending: 'text-red-300 bg-red-900',
      Completed: 'text-green-300 bg-green-900',
      'In Progress': 'text-yellow-300 bg-yellow-900',
      Approved: 'text-blue-300 bg-blue-900',
      All: 'text-blue-200 bg-gray-900',
    }
    : {
      Pending: 'text-red-600 bg-red-100',
      Completed: 'text-green-600 bg-green-100',
      'In Progress': 'text-yellow-600 bg-yellow-100',
      Approved: 'text-blue-600 bg-blue-100',
      All: 'text-blue-900 bg-blue-50',
    };

  return (
    <div className={`p-6 max-w-7xl mx-auto min-h-screen ${darkMode ? 'bg-gray-950 text-blue-100' : 'bg-white text-gray-900'}`}>
      {/* Title Card - now full width, reduced height, simplified text */}
      <div className={`w-full text-left mb-8 rounded-xl shadow-lg p-5 border ${darkMode ? 'bg-gray-900 border-blue-900' : 'bg-white border-blue-100'}`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-blue-900'}`}>Canteen Inspection</h1>
          <span className={`block w-10 h-1 rounded ${darkMode ? 'bg-blue-600' : 'bg-blue-400'}`}></span>
        </div>
        <p className={`mt-2 text-sm sm:text-base font-normal ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>All inspections and assignments in one place.</p>
      </div>

      <div className={`rounded-xl shadow-lg overflow-x-auto p-0 ${darkMode ? 'bg-gray-900 border border-blue-900' : 'bg-white border border-blue-100'}`}>
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th colSpan={10} className="sticky top-0 z-10 px-4 py-6 bg-white border-b border-blue-100 rounded-t-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex gap-2">
                    {['All', 'Pending', 'In Progress', 'Completed', 'Approved'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-full font-medium border text-sm transition-colors focus:outline-none ${activeTab === tab
                            ? `${statusColors[tab]} border-transparent shadow`
                            : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="px-4 py-2 rounded-lg border w-48 font-medium transition-colors focus:outline-none bg-white text-blue-900 border-blue-200 placeholder-blue-400"
                    />
                    <button
                      onClick={() => {
                        setCreateModalSection(0);
                        setShowCreateModal(true);
                      }}
                      className="px-5 py-2 rounded-lg font-semibold shadow-sm transition-colors border text-base bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    >
                      + Create Inspection
                    </button>
                  </div>
                  <CreateInspectionModal
                    key={`create-${createModalSection}`}
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    startSection={createModalSection}
                  />
                </div>
              </th>
            </tr>
            <tr>
              {[
                'ID',
                'School Name',
                'Location',
                'Date of Inspection',
                'Time',
                'Safety Officer',
                'Supervisor',
                'Status',
                'Action',
              ].map((header, idx) => (
                <th
                  key={header}
                  className={`sticky top-0 z-10 border-b ${darkMode ? 'border-blue-900 bg-gray-950 text-blue-200' : 'border-blue-100 bg-blue-50 text-blue-900'} py-4 px-4 text-left text-sm font-semibold backdrop-blur-sm backdrop-filter ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === 8 ? 'rounded-tr-xl' : ''}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-blue-900 bg-gray-900' : 'divide-y divide-blue-100 bg-white'}>
            {data.map((entry, idx) => (
              <tr
                key={entry.id}
                className={`transition-colors duration-150 ${darkMode ? (idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950/80 hover:bg-blue-950/80') : (idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/60 hover:bg-blue-100')}`}
              >
                <td className="py-6 px-4 font-semibold whitespace-nowrap">{entry.id}</td>
                <td className="py-6 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className={darkMode ? 'text-blue-100 font-semibold' : 'text-blue-900 font-semibold'}>{entry.schoolname}</div>
                      <div className={darkMode ? 'text-blue-300 text-xs' : 'text-blue-700 text-xs'}>{entry.location}</div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4 whitespace-nowrap">{entry.location}</td>
                <td className="py-6 px-4 whitespace-nowrap">{entry.dateofinspection}</td>
                <td className="py-6 px-4 whitespace-nowrap">{entry.time}</td>
                <td className="py-6 px-4 whitespace-nowrap">{entry.safetyofficer}</td>
                <td className="py-6 px-4 whitespace-nowrap">{entry.supervisor}</td>
                <td className="py-6 px-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[entry.status] || (darkMode ? 'bg-gray-900 text-blue-200' : 'bg-gray-100 text-gray-700')
                      }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="py-6 px-4 whitespace-nowrap">
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

      {/* Modal Form from CanteenForm.js */}
      <CanteenFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} />
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

      {showReportExecute && reportToView && (
        <CanteenExecute
          inspection={reportToView}   // full object
          onClose={() => {
            setShowReportExecute(false);
            setReportToView(null);
          }}
        />
      )}


    </div>
  );
}