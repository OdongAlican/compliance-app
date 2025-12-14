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
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
          <button
            onClick={() => {
              onStartInspection(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
          >
            Start Inspection
          </button>
          <button
            onClick={() => {
              setCreateModalSection(1); // 1 = Safety Officers section
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-black-600 hover:bg-gray-100"
          >
            Assign Safetyofficer
          </button>
          <button
            onClick={() => {
              setCreateModalSection(2); // 2 = Supervisors section
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-black-600 hover:bg-gray-100"
          >
            Assign Supervisor
          </button>
          <button
            onClick={() => {
              onEdit?.(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
          >
            View
          </button>
          <button
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

export default function CanteenInterface() {
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

  const handleEdit = (inspection) => { setReportToView(inspection); setShowReportExecute(true);}

const handleDelete = (id) => {setItemToDelete(id); setShowModal(true);};

  const statusColors = {
    Pending: 'text-red-600 bg-red-100',
    Completed: 'text-green-600 bg-green-100',
    'In Progress': 'text-yellow-600 bg-yellow-100',
    Approved: 'text-blue-600 bg-blue-100',
    All: 'text-gray-700 bg-gray-100',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Canteen Inspection</h1>

      {/* + Create Inspection button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setCreateModalSection(0); // Always start at first section for create
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-primary text-tertiary rounded"
        >
          + Create Inspection
        </button>
       {/* <CreateInspectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          startSection={createModalSection}
        />*/}
                <CreateInspectionModal
          key={`create-${createModalSection}`} // ✅ Optional key if section changes
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          startSection={createModalSection}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {['All', 'Pending', 'In Progress', 'Completed', 'Approved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded font-medium border ${
              activeTab === tab
                ? `${statusColors[tab]} border-transparent`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search"
          className="w-full md:w-1/3 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring focus:border-blue-500"
        />
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
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
              ].map((header) => (
                <th
                  key={header}
                  className="border px-4 py-2 text-left text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-sm">{entry.id}</td>
                <td className="border px-4 py-2 text-sm">{entry.schoolname}</td>
                <td className="border px-4 py-2 text-sm">{entry.location}</td>
                <td className="border px-4 py-2 text-sm">{entry.dateofinspection}</td>
                <td className="border px-4 py-2 text-sm">{entry.time}</td>
                <td className="border px-4 py-2 text-sm">{entry.safetyofficer}</td>
                <td className="border px-4 py-2 text-sm">{entry.supervisor}</td>
                <td className="border px-4 py-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      statusColors[entry.status] || 'bg-gray-100 text-gray-700'
                    }`}
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