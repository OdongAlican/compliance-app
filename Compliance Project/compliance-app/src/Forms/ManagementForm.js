import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const AccordianContext = React.createContext();

function ManagementForm({ children, value, onChange, ...props }) {
  const [selected, setSelected] = useState(value);
  useEffect(() => {
    onChange?.(selected);
  }, [selected, onChange]);

  return (
    <ul {...props} className="space-y-2">
      <AccordianContext.Provider value={{ selected, setSelected }}>
        {children}
      </AccordianContext.Provider>
    </ul>
  );
}

function AccordianItem({ children, value, trigger, ...props }) {
  const { selected, setSelected } = React.useContext(AccordianContext);
  const open = selected === value;

  return (
    <li className="border rounded" {...props}>
      <header
        role="button"
        onClick={() => setSelected(open ? null : value)}
        className="flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 font-medium cursor-pointer"
      >
        {trigger}
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </header>
      <div className="overflow-hidden transition-all duration-300" style={{ height: open ? "auto" : 0 }}>
        {open && <div className="p-4 bg-white">{children}</div>}
      </div>
    </li>
  );
}


const sections = [
  "General Information",
  "Objectives And Scope",
  "Auditors",
];

export default function RiskFormModal({
  isOpen,
  onClose,
  startSection = 0,
}) {
  const [currentSection, setCurrentSection] = useState(startSection);
  const [issues, setIssues] = useState([{ issue: "", action: "", person: "", date: "" }]);

  const [objectiveStatement, setObjectiveStatement] = useState("");
  const [scopeStatement, setScopeStatement] = useState("");
 

  useEffect(() => {
    if (isOpen) setCurrentSection(startSection ?? 0);
  }, [isOpen, startSection]);

  const updateIssue = (idx, field, value) => {
    setIssues((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  };

  const deleteIssue = (idx) => setIssues((prev) => prev.filter((_, i) => i !== idx));

  const nextSection = () => setCurrentSection((s) => Math.min(sections.length - 1, s + 1));
  const prevSection = () => setCurrentSection((s) => Math.max(0, s - 1));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    alert("Form submitted!");
    onClose?.();
    setCurrentSection(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={() => { onClose?.(); setCurrentSection(0); }}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
        >
          &times;
        </button>

        <div className="flex justify-between items-center mb-8 px-4">
          {sections.map((label, index) => {
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;
            return (
              <div key={index} className="flex flex-col items-center text-center flex-1">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mb-1 ${isCompleted ? "bg-green-600 text-white" : isCurrent ? "bg-primary text-tertiary" : "bg-gray-300 text-gray-700"}`}>
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span className={`text-sm font-bold mb-1 ${isCurrent ? "text-blue-600" : "text-gray-500"}`}>{label}</span>
              </div>
            );
          })}
        </div>

        <h2 className="text-xl font-semibold mb-4">SECTION {currentSection + 1}: {sections[currentSection]}</h2>

        {currentSection === 0 && (
          <ManagementForm value="hazard">
            <div className="space-y-6">
              
          <div className="grid grid-cols-1 gap-4 mb-6">
            <input placeholder="Auditors Number" className="border p-2 rounded" />
            <input placeholder="Area Audited" className="border p-2 rounded" />
            <input type="date" className="border p-2 rounded" />
          </div>
            </div>
          </ManagementForm>
        )}



          {currentSection === 1 && (
  <section>
    <h3 className="font-medium mb-2">Objective & Scope</h3>
    <div className="space-y-3">
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={4}
        placeholder="Enter objective audit description"
        value={objectiveStatement}
        onChange={(e) => setObjectiveStatement(e.target.value)}
      />
      <div>Scope Of Audit</div>
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={4}
        placeholder="Enter scope of audit description"
        value={scopeStatement}
        onChange={(e) => setScopeStatement(e.target.value)}
      />
    </div>
  </section>
)}

        {currentSection === 2 && (
            <section>
              <h3 className="font-medium mb-2">Assign Auditors</h3>
              <div className="space-y-3">
                <input className="border rounded px-3 py-2" placeholder="Search / Select supervisor" />
                <select className="border rounded px-3 py-2 w-full">
                  <option value="">-- Select Supervisor --</option>
                </select>
                <p className="text-xs text-gray-500">Select a auditor for this inspection.</p>
              </div>
            </section>
          )}





        <div className="flex justify-between mt-6">
          <button onClick={prevSection} disabled={currentSection === 0} className={`px-4 py-2 rounded ${currentSection === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white"}`}>
            Previous
          </button>

          <button onClick={currentSection === sections.length - 1 ? handleSubmit : nextSection} className={`px-4 py-2 rounded ${currentSection === sections.length - 1 ? "bg-purple-600 text-white" : "bg-green-600 text-white"}`}>
            {currentSection === sections.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}



