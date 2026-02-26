import { useState } from 'react';

export default function SetPriorityModal({ isOpen, onClose, onSubmit }) {
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('2025-09-15');

  // const handleSubmit = () => {
  //   onSubmit({ priority, dueDate });
  //   onClose();
  // };



  const handleSubmit = () => {
  if (typeof onSubmit === 'function') {
    onSubmit({ priority, dueDate });
  } else {
    console.warn('onSubmit is not a function');
  }
  onClose();
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Set Priority Level</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Priority Level</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Set Priority Level
          </button>
        </div>
      </div>
    </div>
  );
}
