import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const AccordianContext = React.createContext();

function WorkPlaceForm({ children, value, onChange, ...props }) {
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



        <h2 className="text-xl font-semibold mb-4">SECTION {currentSection + 1}: {sections[currentSection]}</h2>

        

        {currentSection === 0 && (
            <section>
              <h3 className="font-medium mb-4">Auditors Information</h3>
              <div className="space-y-4">
                    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700 mb-1 ">Name</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Job Title</label>
      <input  className="w-full border rounded-lg px-4 py-2 bg-gray-100" />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Staff Number</label>
      <input type="email" className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
    </div>
                <p>Incident Description</p>
                      <textarea
        className="w-full border rounded px-3 py-2"
        rows={4}
        placeholder="Enter incident description"
      />
      <p>Incident Description</p>
         <textarea
        className="w-full border rounded px-3 py-2"
        rows={4}
        placeholder="Enter incident description"
      />
 </div>
            </section>
          )}




        {currentSection === 1 && (
          <WorkPlaceForm value="issues">
            <AccordianItem value="issues" trigger="Issues & Action Plan">
              <div className="space-y-4">
                <button onClick={() => setIssues((s) => [...s, { issue: "", action: "", person: "", date: "" }])} className="px-4 py-2 bg-blue-600 text-white rounded">+ Add Issue</button>

                {issues.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 mb-4 border p-3 rounded">
                    <label className="block text-sm">Name</label>
                    <input value={it.issue} onChange={(e) => updateIssue(idx, "issue", e.target.value)} className="border p-2 rounded" />
                    <label className="block text-sm mt-2">Type of Injury</label>
                    <select className="mt-1 block w-full border rounded-md p-2">
                      <option>-- Select an Option --</option>
                    </select>
                    <label className="block text-sm mt-2">Injury description</label>
                    <textarea className="mt-1 block w-full border rounded-md p-2" rows={3} />
                    <div className="flex justify-end mt-2">
                      <button onClick={() => deleteIssue(idx)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordianItem>
          </WorkPlaceForm>
        )}


                {currentSection === 2 && (
          <div className="grid grid-cols-1 gap-4 mb-6">

          <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
                <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
                       
                <label >Nature of Damage</label>
                      <textarea className="w-full border rounded px-3 py-2"rows={4}
      />
      <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 12l8-8 8 8M12 4v12" />
          </svg>
          <span>Drag and drop your file or</span>
          <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Browse File</button>
                
          </div>
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



