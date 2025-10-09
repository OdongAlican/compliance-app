import { useState, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import CreateInspectionModal from '../Forms/CreateInspectionModal';
import FuelStorageFormModal from '../Forms/FuelStorageForm';



// ...ActionMenu remains unchanged...

export default function FuelInterface() {
  const [data, setData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSection, setCreateModalSection] = useState(0);
  const [activeTab, setActiveTab] = useState('All');

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

  const handleStartInspection = (id) => {
    console.log("Opening fuel inspection for ID:", id);
    setShowFormModal(true);
  };

  const handleEdit = (id) => {
    alert(`Edit/View inspection with ID: ${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      setData((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const statusColors = {
    Pending: 'text-red-600 bg-red-100',
    Completed: 'text-green-600 bg-green-100',
    'In Progress': 'text-yellow-600 bg-yellow-100',
    Approved: 'text-blue-600 bg-blue-100',
    All: 'text-gray-700 bg-gray-100',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Fuel Inspection</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setCreateModalSection(0);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-primary text-tertiary rounded"
        >
          + Create-Fuel Inspection
        </button>
        <CreateInspectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          startSection={createModalSection}
        />
      </div>

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

      {/* ✅ Correct modal now wired */}
      <FuelStorageFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
      />
    </div>
  );
}
