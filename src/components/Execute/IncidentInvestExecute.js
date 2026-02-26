import React, { useState } from 'react';

export default function IncidentReportModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Root Cause Analysis");


  // Reusable Components
const Section = ({ title, children }) => (
  <section className="mb-6">
    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
    {children}
  </section>
);

const Input = ({ label, type = "text", ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      type={type}
      className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  </div>
);

const Table = ({ headers, children }) => (
  <table className="w-full table-auto border border-gray-300">
    <thead className="bg-gray-100">
      <tr>
        {headers.map((header, idx) => (
          <th key={idx} className="border px-4 py-2 text-left">{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

const TableRow = ({ cells }) => (
  <tr>
    {cells.map((cell, idx) => (
      <td key={idx} className="border px-4 py-2">{cell}</td>
    ))}
  </tr>
);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 overflow-y-auto max-h-screen relative">

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold"
            >
              &times;
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-6 text-center">Incident Report Form</h2>

            {/* Section: General Information */}
            <Section title="General Information">
              <div className="grid grid-cols-2 gap-4">
                <Input defaultValue="Injury" label="Type of Incident" />
                <Input type="date" defaultValue="2025-08-25" label="Date of Incident" />
                <Input type="time" defaultValue="13:45" label="Time of Incident" />
                <Input type="email" defaultValue="paulamegah@gmail.com" label="Reporter Email" />
                <Input defaultValue="25th August PRVP-XP, Oyarifa, Ghana" label="Location" />
                <Input defaultValue="5.744036, -0.1631" label="Coordinates" />
                <Input defaultValue="Debby" label="Safety Officer" />
                <Input defaultValue="Debby" label="Supervisor" />
              </div>
            </Section>

            {/* Section: Witness Details */}
            <Section title="Witness Details">
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" defaultValue="2025-09-10" label="Date of Incident" />
                <Input type="time" defaultValue="12:59" label="Time of Incident" />
                <Input defaultValue="25th August PRVP-XP, Oyarifa, Ghana" label="Location" />
                <Input type="email" defaultValue="paulamegah@gmail.com" label="Email" />
                <Input defaultValue="Direct Witness" label="Involvement" />
              </div>
            </Section>

            {/* Section: Action Taken */}
            <Section title="Action Taken">
              <Table headers={["Person", "Action"]}>
                <TableRow cells={[
                  "Eric",
                  <Input defaultValue="Action" />
                ]} />
                <TableRow cells={[
                  "Debby",
                  <Input defaultValue="Action" />
                ]} />
              </Table>
            </Section>

            {/* Section: People Involved */}
            <Section title="People Involved">
              <Table headers={["Name", "Role", "Injury Sustained", "Nature of Injury"]}>
                <TableRow cells={[
                  <Input defaultValue="Action" />,
                  <Input defaultValue="Action" />,
                  <Input defaultValue="Action" />,
                  <Input defaultValue="Action" />
                ]} />
              </Table>
            </Section>

            {/* Section: Property Involved */}
            <Section title="Property Involved">
              <Table headers={["Type of Property", "Description", "Nature of Damage"]}>
                <TableRow cells={[
                  <Input defaultValue="Action" />,
                  <Input defaultValue="Action" />,
                  <Input defaultValue="Action" />
                ]} />
              </Table>
            </Section>

            {/* Section: Incident Summary */}
            <Section title="Incident Summary">
              <textarea
                className="w-full border border-gray-300 rounded p-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the incident..."
              />
            </Section>

            {/* Section: Tabs */}
            <Section>
              <div className="border-b mb-4 flex space-x-4">
                {["Root Cause Analysis", "Corrective and Preventive Action"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === tab
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-blue-500"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "Root Cause Analysis" && (
                <Table headers={["Issue", "Corrective Action"]}>
                  <TableRow cells={[
                    <Input placeholder="Issue" />,
                    <Input placeholder="Corrective Action" />
                  ]} />
                </Table>
              )}

              {activeTab === "Corrective and Preventive Action" && (
                <Table headers={["Issue", "Corrective Action"]}>
                  <TableRow cells={[
                    <Input placeholder="Issue" />,
                    <Input placeholder="Corrective Action" />
                  ]} />
                </Table>
              )}
            </Section>


            {/* Section: Cause Documentation */}
<Section title="Cause Documentation">
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Underlying / Contributing Factors
    </label>
    <textarea
      className="w-full border border-gray-300 rounded p-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Describe contributing factors..."
    />
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Agency</label>
    <div className="grid grid-cols-1 gap-2">
      {["Human", "Equipment", "Process/Procedure", "Environment", "Other"].map((option) => (
        <label key={option} className="inline-flex items-center">
          <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
          <span className="ml-2 text-sm text-gray-700">{option}</span>
        </label>
      ))}
    </div>
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">If Other</label>
    <textarea
      className="w-full border border-gray-300 rounded p-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Specify other cause..."
    />
  </div>

  <div className="flex justify-end">
    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      + Add Cause
    </button>
  </div>
</Section>


            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




