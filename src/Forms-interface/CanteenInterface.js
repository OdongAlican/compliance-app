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
    <div className="p-6 max-w-7xl mx-auto ui-page">
      <h1 className="ui-title mb-6">Canteen Inspection</h1>

      {/* + Create Inspection button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setCreateModalSection(0); // Always start at first section for create
            setShowCreateModal(true);
          }}
          className="ui-btn ui-btn-primary"
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
      <div className="ui-tabs mb-6">
        {['All', 'Pending', 'In Progress', 'Completed', 'Approved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`ui-tab border ${
              activeTab === tab
                ? `${statusColors[tab]} border-transparent`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
          className="ui-input w-full md:w-1/3"
        />
      </div>

      <div className="ui-card p-4">
        <table className="ui-table">
          <thead>
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
                  className="ui-th"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className="ui-row">
                <td className="ui-td">{entry.id}</td>
                <td className="ui-td">{entry.schoolname}</td>
                <td className="ui-td">{entry.location}</td>
                <td className="ui-td">{entry.dateofinspection}</td>
                <td className="ui-td">{entry.time}</td>
                <td className="ui-td">{entry.safetyofficer}</td>
                <td className="ui-td">{entry.supervisor}</td>
                <td className="ui-td">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      statusColors[entry.status] || 'bg-gray-100 text-gray-700'
                    }`}
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