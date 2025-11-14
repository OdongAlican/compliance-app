import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HazardDashboard from "./HazardDashboard";




// Accordion context
const AccordianContext = React.createContext();

function HazardForm({ children, value, onChange, ...props }) {
  const [selected, setSelected] = useState(value);
  React.useEffect(() => {
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
    <table className="w-full border border-gray-300 table-auto border-collapse  ">
      <thead className="bg-gray-100 ">
        <tr>
          <th className="px-4 py-2 text-left border border-gray-300">Item</th>
          <th className="px-4 py-2 text-center border border-gray-300">√ / ⤫ / N/A</th>
          <th className="px-4 py-2 text-left border border-gray-300">Comments</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 ">
        {items.map((item, i) => (
          <tr key={i}  className={item.isCategoryEnd ? "mb-6" : ""}>
            <td className="px-4 py-2  border border-gray-300">{item}</td>
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
  "Report Details",
  "Hazard Description",
  "Injury Information",
  "Action Taken"
];



// Main component function
export default function HazardReportPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [issues, setIssues] = useState([
      { issue: "", action: "", person: "", date: "" }
    ]);
  

  // Dummy handleSubmit function to prevent errors
  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    // Add your submit logic here
    alert("Form submitted!");
    closeModal();
  };

    // Add updateIssue function to update a specific field of an issue
  const updateIssue = (idx, field, value) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue, i) =>
        i === idx ? { ...issue, [field]: value } : issue
      )
    );
  };

  // Add deleteIssue function to remove an issue by index
  const deleteIssue = (idx) => {
    setIssues((prevIssues) => prevIssues.filter((_, i) => i !== idx));
  };

  



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

  const closeModal = () => {
    setIsOpen(false);
    setCurrentSection(0);
  };

  // Dummy state and handlers for Section 4 (Sign-Off) form
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    location: "",
    hazard: "",
    hurt: "",
    hurtDetails: "",
    actionTaken: ""
  });

    const hazardOptions = [
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
  ];
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  


  return (
    <div>
      <div className="flex justify-end p-4">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary text-tertiary rounded"
        >
          + Add Hazard Report
        </button>
      </div>

    <HazardDashboard/>
    
      


      


      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
            <button
              onClick={closeModal}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>

            <div className="flex justify-between items-center mb-8 px-4">
              {sections.map((label, index) => {
                const isCompleted = index < currentSection;
                const isCurrent = index === currentSection;

                return (
                  <div key={index} className="flex flex-col items-center text-center flex-1 ">
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

            <h2 className="text-xl font-semibold mb-4">
              SECTION {currentSection + 1}: {sections[currentSection]}
            </h2>

            {/* Section Content */}
            {currentSection === 0 && (
              <div className="grid grid-cols-1 gap-10 mb-6">
                <input placeholder="Name" className="border p-2 rounded" />
                <input type="date" placeholder="Date of Report" className="border p-2 rounded" />
                <input type="text" placeholder="Site Map" className="border p-2 rounded" />
              </div>
            )}

            {currentSection === 1 && (
              <HazardForm value="hazard">
                <div className="space-y-10">

                <AccordianItem value="hazard" trigger="Hazard Type">

                  <ChecklistSection
                    items={[
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
                    ]}
                  />
                </AccordianItem>
                    <div className="mt-10 ">
      <span className="block text-sm font-medium text-gray-700 mb-1 ">Others</span>
      <input
        type="text"
        placeholder="Name"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
      />
    </div>
                </div>
              </HazardForm>
            )}


            {currentSection === 2 && (
              <HazardForm value="issues">
                <AccordianItem value="issues" trigger="Issues & Action Plan">
                                  <div className="space-y-2">
                                <button
                onClick={() =>
                  setIssues([
                    ...issues,
                    { issue: "", action: "", person: "", date: "" }
                  ])
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Issue
              </button>

              {/*Issue Rows*/}
              {issues.map((issues, idx) =>(
                  <div key={idx} className="grid grid-col-1 gap-8 mb-6">
                    <span>Name</span>
                  <input
                  value={issues.issue}
                  onChange={(e) =>
                    updateIssue(idx, "issue", e.target.value)
                  }
                  className="border p-2 rounded"
                  />
                  <span>Type of Injury</span>
                  <select name="hazard" value={formData.hazard} onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                      <option value="">-- Select an Option --</option>
                      {hazardOptions.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                    <span>Injury description</span>
                     <label className="block">
                    <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows={4} />
                  </label>

                  
                  
                  <button
                  onClick={() => deleteIssue(idx)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Delete

                  </button>


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
                    <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows={4} />
                  </label>
                  <div className="flex justify-end mt-4">
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
                    ? handleSubmit  // Replace with your actual submit logic
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
      )}
    </div>
  );
}


