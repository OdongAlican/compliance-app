import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const AccordianContext = React.createContext();

function HazardForm({ children, value, onChange, ...props }) {
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

function ChecklistSection({ items }) {
  return (
    <table className="w-full border border-gray-300 table-auto border-collapse">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left border border-gray-300">Item</th>
          <th className="px-4 py-2 text-center border border-gray-300">√ / ⤫ / N/A</th>
          <th className="px-4 py-2 text-left border border-gray-300">Comments</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {items.map((item, i) => (
          <tr key={i}>
            <td className="px-4 py-2 border border-gray-300">{item}</td>
            <td className="px-4 py-2 text-center">
              <select className="border rounded px-2 py-1">
                <option value="√">√</option>
                <option value="⤫">⤫</option>
                <option value="N/A">N/A</option>
              </select>
            </td>
            <td className="px-4 py-2">
              <input
                type="text"
                placeholder="Enter comment"
                className="w-full border rounded px-2 py-1"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const sections = [
  "Assessment Types",
  "Assignees",
  "Assessment Details",
  "Risk Matrix",

];

export default function HazardFormModal({
  isOpen,
  onClose,
  startSection = 0,
}) {
  const [currentSection, setCurrentSection] = useState(startSection);
  const [issues, setIssues] = useState([{ issue: "", action: "", person: "", date: "" }]);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    location: "",
    hazard: "",
    hurt: "",
    hurtDetails: "",
    actionTaken: ""
  });

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
          <div className="grid grid-cols-1 gap-4 mb-6">
            <input name="name" placeholder="Name" className="border p-2 rounded" value={formData.name} onChange={handleChange} />
            <input name="date" type="date" className="border p-2 rounded" value={formData.date} onChange={handleChange} />
            <input name="location" placeholder="Site Map" className="border p-2 rounded" value={formData.location} onChange={handleChange} />
          </div>
        )}

        {currentSection === 1 && (
          <HazardForm value="hazard">
            <div className="space-y-6">
              <AccordianItem value="hazard" trigger="Hazard Type">
                <ChecklistSection items={[
                  "Slippery floor or wet surface",
                  "Broken furniture or equipment",
                  "Loose or damaged electric wires",
                  "Poor lighting",
                  "Blocked exit or fire escape",
                  "Playground equipment issue",
                  "Trip hazard (e.g. uneven floor, cables)",
                  "Dangerous chemicals or substances",
                  "Unsafe behavior (e.g. running in halls, bullying)",
                  "Environmental issue",
                  "Other"
                ]} />
              </AccordianItem>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Others</span>
                <input type="text" className="w-full border rounded px-3 py-2" placeholder="Name" />
              </div>
            </div>
          </HazardForm>
        )}

        {currentSection === 2 && (
          <HazardForm value="issues">
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
          </HazardForm>
        )}

        {currentSection === 3 && (
          <div className="p-4">
            <label className="block">
              <span className="text-gray-700">Action Taken (if any):</span>
              <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" rows={4} />
            </label>
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