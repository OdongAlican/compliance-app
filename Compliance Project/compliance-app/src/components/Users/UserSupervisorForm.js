import { useState } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function AddStaffFormModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Submitted:", { staffId, ...formData });

    // Show success screen
    setShowSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">

        {/* Close (X) Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-6">Add Supervisor</h2>

        {/* SUCCESS SCREEN */}
        {showSuccess && (
          <div className="text-center py-10">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Supervisor Added Successfully</h3>
            <p className="text-gray-600 mb-6">
              The supervisor has been added to the system.
            </p>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        )}

        {/* FORM CONTENT */}
        {!showSuccess && (
          <>
            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-8">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                {step > 1 ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500" />
                )}
                <span className={step === 1 ? "font-semibold text-blue-600" : ""}>
                  1 Staff ID
                </span>
              </div>

              <div className="flex-1 h-[1px] bg-gray-300" />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                {step === 2 ? (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                )}
                <span className={step === 2 ? "font-semibold text-blue-600" : ""}>
                  2 Personal Information
                </span>
              </div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <label className="block text-sm font-medium mb-1">Staff ID</label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-blue-400 outline-none"
                />

                <div className="flex justify-between">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Verify
                  </button>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                {/* First Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                {/* Last Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                {/* Department */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                {/* Phone */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
