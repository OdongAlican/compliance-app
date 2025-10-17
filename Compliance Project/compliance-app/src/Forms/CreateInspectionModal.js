import React, { useState, useEffect } from "react";

const sections = [
  "Create Inspection",
  "Assign Safety Officer",
  "Assign Supervisor",
];

export default function CreateInspectionModal({
  isOpen,
  onClose,
  startSection = 0,
}) {
  const [currentSection, setCurrentSection] = useState(startSection);

  // When modal opens, jump to requested section
  useEffect(() => {
    if (isOpen) {
      setCurrentSection(startSection ?? 0);
    }
  }, [isOpen, startSection]);

  const handleClose = () => {
    setCurrentSection(0);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
        <button
          aria-label="Close create inspection"
          onClick={handleClose}
          className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>

        <header className="mb-4">
          <h1 className="text-xl font-semibold items-center">Create Inspection</h1>
        </header>

        {/* Stepper */}
        <div className="mb-6 px-2">
          <div className="flex items-center">
            {sections.map((label, idx) => {
              const completed = idx < currentSection;
              const isCurrent = idx === currentSection;
              return (
                <React.Fragment key={label}>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => setCurrentSection(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setCurrentSection(idx); }}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full border shrink-0
                        ${completed ? "bg-green-600 text-white border-green-600" : isCurrent ? "bg-primary text-tertiary border-primary" : "bg-white text-gray-700 border-gray-300"}
                      `}
                      aria-current={isCurrent}
                    >
                      {completed ? "✓" : idx + 1}
                    </div>
                    <div className={`ml-3 text-sm ${isCurrent ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                      {label}
                    </div>
                  </div>

                  {/* connector */}
                  {idx !== sections.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${idx < currentSection ? "bg-green-600" : "bg-gray-200"}`}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <main className="min-h-[180px]">
          {currentSection === 0 && (
            <section>
              <h3 className="font-medium mb-2">Inspection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Title / Name" />
                <input className="border rounded px-3 py-2" placeholder="Location" />
                <input type="date" className="border rounded px-3 py-2" />
                <input type="time" className="border rounded px-3 py-2" />
                <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Notes (optional)" />
              </div>
            </section>
          )}

          {currentSection === 1 && (
            <section>
              <h3 className="font-medium mb-2">Assign Safety Officer</h3>
              <div className="space-y-3">
                <input className="border rounded px-3 py-2" placeholder="Search / Select safety officer" />
                <select className="border rounded px-3 py-2 w-full">
                  <option value="">-- Select Safety Officer --</option>
                </select>
                <p className="text-xs text-gray-500">Select a safety officer for this inspection.</p>
              </div>
            </section>
          )}

          {currentSection === 2 && (
            <section>
              <h3 className="font-medium mb-2">Assign Supervisor</h3>
              <div className="space-y-3">
                <input className="border rounded px-3 py-2" placeholder="Search / Select supervisor" />
                <select className="border rounded px-3 py-2 w-full">
                  <option value="">-- Select Supervisor --</option>
                </select>
                <p className="text-xs text-gray-500">Select a supervisor for this inspection.</p>
              </div>
            </section>
          )}
        </main>

        {/* Navigation / actions */}
       <footer className="mt-6 flex justify-between items-center">
          <div>
            <button
              type="button"
              onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
              disabled={currentSection === 0}
              className={`px-4 py-2 rounded mr-2 ${
                currentSection === 0 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentSection < sections.length - 1) {
                  setCurrentSection((s) => s + 1);
                } else {
                  // final submit action for create inspection flow
                  alert("Inspection created");
                  handleClose();
                }
              }}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              {currentSection === sections.length - 1 ? "Finish" : "Next"}
            </button>
          </div>

          <div className="text-sm text-gray-500">Step {currentSection + 1} of {sections.length}</div>
        </footer>
      </div>
    </div>
  );
}

 