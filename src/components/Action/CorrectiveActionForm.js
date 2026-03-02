import React, { useState } from "react";

function CorrectiveActionFormModal({ onClose, onSave }) {
  const [statement, setStatement] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-600"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-lg font-bold mb-4">Add Corrective Action</h2>

        {/* Form */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <label className="block mb-1 font-medium">Begin your statement here</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Enter incident description"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave?.(statement); // pass statement back to parent
              onClose();
            }}
            className="px-4 py-2 rounded bg-green-500 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default CorrectiveActionFormModal;
