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
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/70 via-white/80 to-blue-200/80 backdrop-blur-sm z-[120]" />
      {/* Modal Card */}
      <div className={`relative z-[130] bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 border border-blue-200 flex flex-col${typeof window !== 'undefined' && window.darkMode ? ' dark:bg-gray-950 dark:border-blue-900' : ''}`}>
        <button
          aria-label="Close create inspection"
          onClick={handleClose}
          className="absolute top-5 right-6 text-gray-400 hover:text-blue-600 text-3xl font-bold focus:outline-none"
        >
          &times;
        </button>

        <header className="mb-6 flex items-center gap-3">
          <svg width="32" height="32" fill="none" viewBox="0 0 32 32" className="text-blue-600"><circle cx="16" cy="16" r="16" fill="currentColor" /></svg>
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">Create Inspection</h1>
        </header>

        {/* Stepper */}
        <div className="mb-8 px-2">
          <div className="flex items-center justify-center gap-0">
            {sections.map((label, idx) => {
              const completed = idx < currentSection;
              const isCurrent = idx === currentSection;
              return (
                <React.Fragment key={label}>
                  <div
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => setCurrentSection(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setCurrentSection(idx); }}
                  >
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold text-lg transition-all duration-200
                        ${completed ? "bg-green-600 text-white border-green-600" : isCurrent ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white text-gray-700 border-gray-300"}
                      `}
                      aria-current={isCurrent}
                    >
                      {completed ? <span>&#10003;</span> : idx + 1}
                    </div>
                    <div className={`mt-2 text-sm ${isCurrent ? "font-semibold text-blue-900" : "text-gray-500"}`}>
                      {label}
                    </div>
                  </div>
                  {/* connector */}
                  {idx !== sections.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${idx < currentSection ? "bg-green-600" : "bg-gray-200"}`}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <main className="min-h-[200px]">
          {currentSection === 0 && (
            <section>
              <h3 className="font-semibold mb-4 text-blue-900">Inspection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600" placeholder="Title / Name" />
                <input className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600" placeholder="Location" />
                <input type="date" className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 focus:ring-2 focus:ring-blue-600" />
                <input type="time" className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 focus:ring-2 focus:ring-blue-600" />
                <textarea className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600 md:col-span-2" placeholder="Notes (optional)" />
              </div>
            </section>
          )}

          {currentSection === 1 && (
            <section>
              <h3 className="font-semibold mb-4 text-blue-900">Assign Safety Officer</h3>
              <div className="space-y-4">
                <input className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600" placeholder="Search / Select safety officer" />
                <select className="border border-blue-200 rounded-lg px-4 py-3 w-full bg-white text-blue-900 focus:ring-2 focus:ring-blue-600">
                  <option value="">-- Select Safety Officer --</option>
                </select>
                <p className="text-xs text-blue-400">Select a safety officer for this inspection.</p>
              </div>
            </section>
          )}

          {currentSection === 2 && (
            <section>
              <h3 className="font-semibold mb-4 text-blue-900">Assign Supervisor</h3>
              <div className="space-y-4">
                <input className="border border-blue-200 rounded-lg px-4 py-3 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600" placeholder="Search / Select supervisor" />
                <select className="border border-blue-200 rounded-lg px-4 py-3 w-full bg-white text-blue-900 focus:ring-2 focus:ring-blue-600">
                  <option value="">-- Select Supervisor --</option>
                </select>
                <p className="text-xs text-blue-400">Select a supervisor for this inspection.</p>
              </div>
            </section>
          )}
        </main>

        {/* Navigation / actions */}
        <footer className="mt-8 flex justify-between items-center">
          <div>
            <button
              type="button"
              onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
              disabled={currentSection === 0}
              className={`px-5 py-2 rounded-lg mr-2 font-semibold transition-colors border text-base
                ${currentSection === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"}
              `}
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
              className="px-5 py-2 rounded-lg font-semibold transition-colors border text-base bg-green-600 text-white border-green-600 hover:bg-green-700"
            >
              {currentSection === sections.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
          <div className="text-sm text-blue-400">Step {currentSection + 1} of {sections.length}</div>
        </footer>
      </div>
    </div>
  );
}

