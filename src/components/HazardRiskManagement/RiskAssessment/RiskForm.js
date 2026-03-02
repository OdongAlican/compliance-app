import React, { useState, useEffect } from "react";
// import { ChevronDown } from "lucide-react";

const AccordianContext = React.createContext();

function RiskForm({ children, value, onChange, ...props }) {
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

// NOTE: keeping these helpers commented out for future use.
// They are currently unused in the modal UI.
// function AccordianItem({ children, value, trigger, ...props }) {
//   const { selected, setSelected } = React.useContext(AccordianContext);
//   const open = selected === value;
//
//   return (
//     <li className="border rounded" {...props}>
//       <header
//         role="button"
//         onClick={() => setSelected(open ? null : value)}
//         className="flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 font-medium cursor-pointer"
//       >
//         {trigger}
//         <ChevronDown
//           size={16}
//           className={`transition-transform ${open ? "rotate-180" : ""}`}
//         />
//       </header>
//       <div className="overflow-hidden transition-all duration-300" style={{ height: open ? "auto" : 0 }}>
//         {open && <div className="p-4 bg-white">{children}</div>}
//       </div>
//     </li>
//   );
// }
//
// function ChecklistSection({ items }) {
//   return (
//     <table className="w-full border border-gray-300 table-auto border-collapse">
//       <thead className="bg-gray-100">
//         <tr>
//           <th className="px-4 py-2 text-left border border-gray-300">Item</th>
//           <th className="px-4 py-2 text-center border border-gray-300">√ / ⤫ / N/A</th>
//           <th className="px-4 py-2 text-left border border-gray-300">Comments</th>
//         </tr>
//       </thead>
//       <tbody className="divide-y divide-gray-200">
//         {items.map((item, i) => (
//           <tr key={i}>
//             <td className="px-4 py-2 border border-gray-300">{item}</td>
//             <td className="px-4 py-2 text-center">
//               <select className="border rounded px-2 py-1">
//                 <option value="√">√</option>
//                 <option value="⤫">⤫</option>
//                 <option value="N/A">N/A</option>
//               </select>
//             </td>
//             <td className="px-4 py-2">
//               <input
//                 type="text"
//                 placeholder="Enter comment"
//                 className="w-full border rounded px-2 py-1"
//               />
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

const sections = [
  "General Information",
  "Upload Documents",
  "SignOff",
  

];

export default function RiskFormModal({
  isOpen,
  onClose,
  startSection = 0,
}) {
  const [currentSection, setCurrentSection] = useState(startSection);
  // const [issues, setIssues] = useState([{ issue: "", action: "", person: "", date: "" }]);
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

  // const updateIssue = (idx, field, value) => {
  //   setIssues((prev) =>
  //     prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
  //   );
  // };
  //
  // const deleteIssue = (idx) => setIssues((prev) => prev.filter((_, i) => i !== idx));

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
          <RiskForm value="hazard">
            <div className="space-y-6">
              
          <div className="grid grid-cols-1 gap-4 mb-6">
            <input placeholder="Hazard Description" className="border p-2 rounded" />
            <input placeholder="People At Risk" className="border p-2 rounded" />
            <input type="date" className="border p-2 rounded" />

          </div>
        
            </div>
          </RiskForm>
        )}



        {currentSection === 1 && (
               <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Upload Before Image/Document</label>
        <div className="border rounded px-4 py-2 text-blue-600 italic shadow-sm">
          <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 12l8-8 8 8M12 4v12" />
          </svg>
          <span>Drag and drop your file or</span>
          <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Browse File</button>
        </div>

         <label className="block text-sm font-medium text-gray-600 mb-1">Proof of Completion</label>
        <div className="border rounded px-4 py-2 text-blue-600 italic shadow-sm">
          <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 12l8-8 8 8M12 4v12" />
          </svg>
          <span>Drag and drop your file or</span>
          <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Browse File</button>
        </div>
      </div>

        )}


         {currentSection === 2 && (
          <RiskForm value="hazard">
            <div className="space-y-6">

              <input placeholder="Name" className="border p-2 rounded" />
            <input type="date" className="border p-2 rounded" />
               <label className="block">
              <span className="text-gray-700">Note</span>
              <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" rows={4} />
            </label>
              

        
            </div>
          </RiskForm>
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





