import React from 'react';

const DeleteModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center">
        {/* Trash Icon */}
        <div className="bg-red-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title and Message */}
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete this notification?</h2>
        <p className="text-sm text-gray-600">
          This action cannot be undone. Are you sure you want to permanently delete this notification?
        </p>

        {/* Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
