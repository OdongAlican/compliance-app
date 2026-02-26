import React, { useState } from "react";
// import { ChevronDown } from "lucide-react";

// Accordion context
// const AccordianContext = React.createContext();



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


const sections = [
  "Inspection Details",
  "Incident Summary",
  "Reported By",
  
];

export default function NotificationFormModal({ isOpen, onClose, inspectionId }) {
  const [currentSection, setCurrentSection] = useState(0);
  // const [issues, setIssues] = useState([
  //   { issue: "", action: "", person: "", date: "" }
  // ]);

  // const updateIssue = (idx, field, value) => {
  //   setIssues((prevIssues) =>
  //     prevIssues.map((issue, i) =>
  //       i === idx ? { ...issue, [field]: value } : issue
  //     )
  //   );
  // };

  // const deleteIssue = (idx) => {
  //   setIssues((prevIssues) => prevIssues.filter((_, i) => i !== idx));
  // };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    alert("Form submitted!");
    onClose?.();
    setCurrentSection(0);
  };

  // Only render modal if isOpen is true
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={() => {
            onClose?.();
            setCurrentSection(0);
          }}
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
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mb-1
                    ${isCompleted ? "bg-white text-white" : isCurrent ? "bg-primary text-tertiary" : "bg-gray-300 text-gray-700"}
                  `}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={`text-sm rounded-full font-bold mb-1 ${
                    isCurrent ? "text-blue-600" : isCompleted ? "text-secondary2" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
       
        {/* Section Content */}
        {currentSection === 0 && (
          <div className="grid grid-cols-1 gap-4 mb-6">
                  <fieldset>
        <legend className="text-sm font-semibold mb-2">Type of Incident</legend>
        <div className="grid grid-cols-1 gap-2">
          {["Injury", "Near Miss", "Property Damage", "Environmental", "Fatality", "Other"].map((type) => (
            <label key={type} className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox" />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </fieldset>
            <label >Specify</label>
                <input  className="border rounded-lg px-4 py-2" />
                <label >Time of Incident</label>
                <input  className="border rounded-lg px-4 py-2" />
                <label >Email</label>
                <input  className="border rounded-lg px-4 py-2" />
                <label >Date of inspection</label>
                <input  className="border rounded-lg px-4 py-2" />
                <label >Location of Incident</label>
                <input  className="border rounded-lg px-4 py-2" />
                <label >Location</label>
                <input  className="border rounded-lg px-4 py-2" />

          </div>
        )}
        
        {currentSection === 1 && (
          <div className="grid grid-cols-1 gap-4 mb-6">
         <label className="block mb-1 font-medium">Brief Description of What Happened</label>
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={4}
        placeholder="Enter incident description"
       
      />
          </div>
        )}
          
          {currentSection === 2 && (
  <div className="grid grid-cols-1 gap-6 mb-6">
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
      <input className="w-full border rounded-lg px-4 py-2"  />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Job Title</label>
      <input  className="w-full border rounded-lg px-4 py-2" />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Staff Number</label>
      <input type="email" className="w-full border rounded-lg px-4 py-2"  />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Date of Inspection</label>
      <input type="date" className="w-full border rounded-lg px-4 py-2" />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
      <input className="w-full border rounded-lg px-4 py-2"  />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
      <input className="w-full border rounded-lg px-4 py-2"  />
    </div>
  </div>
)}

        


       
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className={`px-4 py-2 rounded ${
              currentSection === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Previous
          </button>
          <button
            onClick={
              currentSection === sections.length - 1
                ? handleSubmit
                : nextSection
            }
            className={`px-4 py-2 rounded ${
              currentSection === sections.length - 1
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {currentSection === sections.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}