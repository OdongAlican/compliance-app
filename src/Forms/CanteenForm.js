import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

// Accordion context
const AccordianContext = React.createContext();

function CanteenForm({ children, value, onChange, ...props }) {
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
    <li className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }} {...props}>
      <header
        role="button"
        onClick={() => setSelected(open ? null : value)}
        className="flex justify-between items-center px-4 py-3 font-medium cursor-pointer select-none"
        style={{ background: "var(--bg-raised)", color: "var(--text)" }}
      >
        <span className="text-sm font-semibold">{trigger}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </header>
      <div className="overflow-hidden transition-all duration-300" style={{ height: open ? "auto" : 0 }}>
        {open && <div className="p-4" style={{ background: "var(--bg-surface)" }}>{children}</div>}
      </div>
    </li>
  );
}

function ChecklistSection({ items }) {
  const cellBorder = { borderBottom: "1px solid var(--border)" };
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
      <table className="min-w-full">
        <thead>
          <tr style={{ background: "var(--bg-raised)", ...cellBorder }}>
            <th className="ui-th text-left">Item</th>
            <th className="ui-th text-center">Result</th>
            <th className="ui-th text-left">Comments</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="ui-row" style={cellBorder}>
              <td className="ui-td text-sm" style={{ color: "var(--text)" }}>{item}</td>
              <td className="ui-td text-center">
                <select
                  className="text-sm rounded-lg px-2 py-1 outline-none"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  <option value="√">√ Pass</option>
                  <option value="⤫">⤫ Fail</option>
                  <option value="N/A">N/A</option>
                </select>
              </td>
              <td className="ui-td">
                <input
                  type="text"
                  placeholder="Enter comment"
                  className="w-full text-sm rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sections = [
  "General Information",
  "Category-Specific Information",
  "Issues & Action Plan",
  "Sign-Off"
];

export default function CanteenFormModal({ isOpen, onClose }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [issues, setIssues] = useState([
    { issue: "", action: "", person: "", date: "" }
  ]);

  // Add updateIssue function to update a specific field of an issue
  const updateIssue = (idx, field, value) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue, i) =>
        i === idx ? { ...issue, [field]: value } : issue
      )
    );
  };

  // Dummy handleSubmit function to prevent errors
  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    // Add your submit logic here
    alert("Form submitted!");
    onClose();
    setCurrentSection(0);
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

  // Only render modal if isOpen is true
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg, 0 25px 50px rgba(0,0,0,0.5))" }}>

        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                style={{ color: "var(--accent)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>CONFIDENTIAL</p>
              <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Canteen Inspection Form</h2>
            </div>
          </div>
          <button
            onClick={() => { onClose(); setCurrentSection(0); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold transition-colors"
            style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            &times;
          </button>
        </div>

        <div className="p-6">

        <div className="flex justify-between items-center mb-8 px-2">
          {sections.map((label, index) => {
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;

            return (
              <div key={index} className="flex flex-col items-center text-center flex-1">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mb-1"
                  style={
                    isCompleted
                      ? { background: "var(--success)", color: "#fff" }
                      : isCurrent
                      ? { background: "var(--accent)", color: "#fff" }
                      : { background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                  }
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className="text-xs font-semibold mt-1"
                  style={{
                    color: isCurrent ? "var(--accent)" : isCompleted ? "var(--success)" : "var(--text-muted)"
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wider mb-6"
          style={{ color: "var(--accent)" }}>
          Section {currentSection + 1} of {sections.length} — {sections[currentSection]}
        </h2>

        {/* Section Content */}
        {currentSection === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { placeholder: "Inspector Name", type: "text" },
              { placeholder: "Inspection Date", type: "date" },
              { placeholder: "Canteen Location", type: "text" },
              { placeholder: "Supervisor Name", type: "text" },
            ].map(({ placeholder, type }, i) => (
              <input
                key={i}
                type={type}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            ))}
          </div>
        )}

        {currentSection === 1 && (
          <CanteenForm value="serving">
            <AccordianItem value="serving" trigger="Serving Area">
              <ChecklistSection
                items={[
                  "Serving counters clean and clutter-free",
                  "Food handlers wear gloves/hairnets/aprons",
                  "Hot food held at proper temperature",
                  "Cold food kept refrigerated or on ice",
                  "Utensils and serving equipment clean",
                  "Displayed food covered and protected",
                  "Allergen information visibly posted"
                ]}
              />
            </AccordianItem>

            <CanteenForm value="issues">
              <AccordianItem value="kitchen" trigger="kitchen Area">
                <ChecklistSection
                  items={[
                    'Food preparation surfaces clean and sanitized.',
                    'Handwashing facilities available and functional.',
                    'Food stored at appropriate temperatures.',
                    'Perishables stored off the floor and covered.',
                    'Waste bins covered and emptied regularly.',
                    'Pest control measures in place and effective.',
                    'Refrigerators and freezers functioning properly.',
                    'Cooking equipment is clean and maintained.',
                    'Cleaning supplies stored separately.',
                    'Floor clean, dry, and slip-resistant.',
                    'No signs of pests.'
                  ]}
                />
              </AccordianItem>
            </CanteenForm>

            <AccordianItem value="eating" trigger="Eating Area">
              <ChecklistSection
                items={[
                  "Tables and chairs clean and undamaged",
                  "Waste bins available and emptied frequently",
                  "Floors swept/mopped regularly",
                  "Adequate ventilation and lighting",
                  "No signs of pests",
                  "Hand sanitizer or wash station nearby"
                ]}
              />
            </AccordianItem>

            <AccordianItem value="personnel" trigger="Personnel & Procedures">
              <ChecklistSection
                items={[
                  "Canteen staff trained in food safety",
                  "Staff wear clean uniforms/PPE",
                  "Cleaning schedules followed and documented",
                  "First aid kit available in canteen",
                  "Emergency numbers posted in visible area"
                ]}
              />
            </AccordianItem>
          </CanteenForm>
        )}

        {currentSection === 2 && (
          <CanteenForm value="issues">
            <AccordianItem value="issues" trigger="Issues & Action Plan">
              <div className="space-y-2">
                <button
                  onClick={() => setIssues([...issues, { issue: "", action: "", person: "", date: "" }])}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white mb-3"
                  style={{ background: "var(--accent)" }}
                >
                  + Add Issue
                </button>

                {issues.map((iss, idx) => (
                  <div key={idx} className="rounded-xl p-4 mb-3"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { field: "issue", placeholder: "Issue description" },
                        { field: "action", placeholder: "Corrective Action" },
                        { field: "person", placeholder: "Responsible Person" },
                      ].map(({ field, placeholder }) => (
                        <input
                          key={field}
                          placeholder={placeholder}
                          value={iss[field]}
                          onChange={(e) => updateIssue(idx, field, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "var(--bg-surface)", color: "var(--text)", border: "1px solid var(--border)" }}
                        />
                      ))}
                      <input
                        type="date"
                        value={iss.date}
                        onChange={(e) => updateIssue(idx, "date", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--bg-surface)", color: "var(--text)", border: "1px solid var(--border)" }}
                      />
                    </div>
                    <button
                      onClick={() => deleteIssue(idx)}
                      className="mt-2 px-3 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ background: "var(--danger)" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </AccordianItem>
          </CanteenForm>
        )}



        {currentSection === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Inspection Summary */}
            <div className="rounded-xl p-5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Inspection Summary</h3>
              <div className="space-y-2">
                {[
                  { label: "Kitchen Area", status: "checked" },
                  { label: "Serving Area", status: "checked" },
                  { label: "Eating Area", status: "checked" },
                  { label: "Personnel Procedures", status: "checked" },
                  { label: "Issues Identified", status: "missing" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <span style={{ color: item.status === "checked" ? "var(--success)" : "var(--warning)", fontSize: 16 }}>
                      {item.status === "checked" ? "✓" : "⚠"}
                    </span>
                    <span className="text-sm" style={{ color: "var(--text)" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Sign-Off Form */}
            <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Sign-Off</h3>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Inspector Name</label>
                <div className="px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                  Paul Amegah
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Canteen Committee Chair</label>
                <div className="px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>Paul</div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Signature Upload</label>
                <div className="flex flex-col items-center gap-2 px-4 py-5 rounded-lg"
                  style={{ background: "var(--bg)", border: "2px dashed var(--border)" }}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ color: "var(--accent)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 12l8-8 8 8M12 4v12" />
                  </svg>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Drag and drop or</span>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ background: "var(--accent)" }}>Browse File</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Note</label>
                <textarea
                  name="actionTaken"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>
            </div>
          </div>
        )}


        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-opacity"
            style={
              currentSection === 0
                ? { background: "var(--bg-raised)", color: "var(--text-muted)", opacity: 0.5, cursor: "not-allowed", border: "1px solid var(--border)" }
                : { background: "var(--bg-raised)", color: "var(--text)", border: "1px solid var(--border)" }
            }
          >
            ← Previous
          </button>

          <button
            onClick={currentSection === sections.length - 1 ? handleSubmit : nextSection}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
            style={{ background: currentSection === sections.length - 1 ? "var(--success)" : "var(--accent)" }}
          >
            {currentSection === sections.length - 1 ? "Submit Form" : "Next →"}
          </button>
        </div>
        </div>{/* end p-6 */}
      </div>
    </div>
  );
}