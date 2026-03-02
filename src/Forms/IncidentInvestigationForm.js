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
  "General Information",
  "People Involved",
  "Property Involved",
  "Incident Description",
  "Action Taken",
  "Sign Off"
];


export default function IncidentInvestigationFormModal({ isOpen, onClose, inspectionId }) {
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




  const [people, setPeople,] = useState([]);

const updatePerson = (index, field, value) => {
  setPeople((prev) =>
    prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
  );
};


const deletePerson = (index) => {
  setPeople((prev) => prev.filter((_, i) => i !== index));
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
  <div className="grid grid-cols-1 gap-6 mb-6">
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

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Date of Inspection</label>
      <input  className="w-full border rounded-lg px-4 py-2 bg-gray-100" />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
    </div>
  </div>
)}





{currentSection === 1 && (
  <div className="space-y-6">
    {/* Add Person Button */}
    <button
      onClick={() =>
        setPeople((prev) => [
          ...prev,
          { name: "", role: "", injurySustained: "No", injuryDescription: "" },
        ])
      }
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      + Add Person
    </button>

    {/* Person Forms */}
    {people.map((person, idx) => (
      <div key={idx} className="border rounded p-4 space-y-4">
        {/* Header with Delete */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Person {idx + 1}</span>
          <button
            onClick={() => deletePerson(idx)}
            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Delete Person</span>
          </button>
        </div>

        {/* Name Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <select
            value={person.name}
            onChange={(e) => updatePerson(idx, "name", e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">-- Select Name --</option>
            <option value="Debby">Debby</option>
            {/* Add more names as needed */}
          </select>
        </div>

        {/* Role Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            value={person.role}
            onChange={(e) => updatePerson(idx, "role", e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">-- Select Role --</option>
            <option value="Employee">Employee</option>
            {/* Add more roles as needed */}
          </select>
        </div>

        {/* Injury Sustained Radio Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Injury Sustained</label>
          <div className="flex space-x-4 mt-1">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`injury-${idx}`}
                value="Yes"
                checked={person.injurySustained === "Yes"}
                onChange={(e) => updatePerson(idx, "injurySustained", e.target.value)}
                className="form-radio"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`injury-${idx}`}
                value="No"
                checked={person.injurySustained === "No"}
                onChange={(e) => updatePerson(idx, "injurySustained", e.target.value)}
                className="form-radio"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>

        {/* Nature of Injury Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nature of Injury</label>
          <textarea
            value={person.injuryDescription}
            onChange={(e) => updatePerson(idx, "injuryDescription", e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
            rows={3}
          />
        </div>
      </div>
    ))}
  </div>
)}







        {currentSection === 2 && (
          <div className="grid grid-cols-1 gap-4 mb-6">

                  <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
                       
                <label >Nature of Damage</label>
                      <textarea className="w-full border rounded px-3 py-2"rows={4}
      />
                <label >Description</label>
                      <textarea className="w-full border rounded px-3 py-2" rows={4}/>
          </div>
        )}
        

        {currentSection === 3 && (
          <div className="grid grid-cols-1 gap-4 mb-6">
         <label className="block mb-1 font-medium">Incident Description</label>
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={4} />
        <label className="block mb-1 font-medium">Attach Media</label>
        <div className="flex flex-col items-center justify-center h-full text-center">

         <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 12l8-8 8 8M12 4v12" />
          </svg>
          <span>Drag and drop your file or</span>
          <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Browse File</button>
          </div>
          </div>
        )}

        {currentSection === 4 && (
  <div className="space-y-6">
    {/* Add Action Button */}
    <button
      onClick={() =>
        setPeople((prev) => [
          ...prev,
          { name: "", role: "", injurySustained: "No", injuryDescription: "" },
        ])
      }
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      + Action Taken
    </button>

    {/* Person Forms */}
    {people.map((person, idx) => (
      <div key={idx} className="border rounded p-4 space-y-4">
        {/* Header with Delete */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Person {idx + 1}</span>
          <button
            onClick={() => deletePerson(idx)}
            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Delete Person</span>
          </button>
        </div>

        {/* Name Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">By Who</label>
          <select
            value={person.name}
            onChange={(e) => updatePerson(idx, "name", e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">-- Select Name --</option>
            <option value="Debby">Debby</option>
            {/* Add more names as needed */}
          </select>
        </div>

        {/* Role Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Action Taken</label>
          <select
            value={person.role}
            onChange={(e) => updatePerson(idx, "role", e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">-- Select Role --</option>
            <option value="Employee">Employee</option>
            {/* Add more roles as needed */}
          </select>
        </div>

        {/* Injury Sustained Radio Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Injury Sustained</label>
          <div className="flex space-x-4 mt-1">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`injury-${idx}`}
                value="Yes"
                checked={person.injurySustained === "Yes"}
                onChange={(e) => updatePerson(idx, "injurySustained", e.target.value)}
                className="form-radio"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`injury-${idx}`}
                value="No"
                checked={person.injurySustained === "No"}
                onChange={(e) => updatePerson(idx, "injurySustained", e.target.value)}
                className="form-radio"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>

        {/* Nature of Injury Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Action Taken</label>
          <textarea
            value={person.injuryDescription}
            onChange={(e) => updatePerson(idx, "injuryDescription", e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
            rows={3}
          />
        </div>
      </div>
    ))}
  </div>
)}


          
                  {currentSection === 5 && (
  <div className="grid grid-cols-1 gap-6 mb-6">
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700 mb-1 ">Name</label>
      <input className="w-full border rounded-lg px-4 py-2 bg-gray-100"  />
    </div>

    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
      <input  className="w-full border rounded-lg px-4 py-2 bg-gray-100" />
    </div>
    <div>

    <label className="block mb-1 text-sm font-medium text-gray-700">Note</label>
          <textarea
            className="mt-1 block w-full border rounded-md p-2"
             rows={3}

          />
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