import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ChevronDownIcon, CalendarDaysIcon } from "@heroicons/react/16/solid";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from "@heroicons/react/24/outline";

const sections = [
  { name: "Create Inspection" },
  { name: "Assign Safety Officer" },
  { name: "Assign Supervisor" },
];

const inputClass = [
  "w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none",
  "border focus:ring-2",
].join(" ");

const inputStyle = {
  background: "var(--bg)",
  color: "var(--text)",
  borderColor: "var(--border)",
};

export default function CreateInspectionModal(props) {
  const inspectionSchema = yup.object().shape({
    title:    yup.string().required("Title is required"),
    location: yup.string().required("Location is required"),
    date:     yup.string().required("Date is required"),
    time:     yup.string().required("Time is required"),
    notes:    yup.string(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: yupResolver(inspectionSchema),
    mode: "onChange",
    defaultValues: { title: "", location: "", date: "", time: "", notes: "" },
  });

  const { isOpen, onClose, startSection = 0 } = props;
  const [currentSection, setCurrentSection] = useState(startSection);

  useEffect(() => {
    if (isOpen) setCurrentSection(startSection ?? 0);
  }, [isOpen, startSection]);

  const handleClose = () => { setCurrentSection(0); onClose?.(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[120]" onClick={handleClose} />

      {/* Modal Card */}
      <div
        className="relative z-[130] w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="px-8 pt-7 pb-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)" }}
            >
              <CalendarDaysIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </span>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Create Inspection</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Step {currentSection + 1} of {sections.length}</p>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            &times;
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="px-8 pt-5 pb-0">
          {/* Mobile dropdown */}
          <div className="sm:hidden mb-4 relative">
            <select
              value={sections[currentSection].name}
              aria-label="Select a tab"
              className="ui-select w-full appearance-none"
              onChange={(e) => {
                const idx = sections.findIndex((s) => s.name === e.target.value);
                if (idx !== -1) setCurrentSection(idx);
              }}
            >
              {sections.map((tab) => <option key={tab.name}>{tab.name}</option>)}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </div>

          {/* Desktop tabs */}
          <div className="hidden sm:block">
            <div style={{ borderBottom: "1px solid var(--border)" }}>
              <nav className="-mb-px flex space-x-1" aria-label="Tabs">
                {sections.map((tab, idx) => {
                  const completed = idx < currentSection;
                  const isCurrent = idx === currentSection;
                  return (
                    <button
                      key={tab.name}
                      type="button"
                      onClick={() => setCurrentSection(idx)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
                      style={
                        isCurrent
                          ? { borderColor: "var(--accent)", color: "var(--accent)" }
                          : completed
                          ? { borderColor: "transparent", color: "var(--text-muted)" }
                          : { borderColor: "transparent", color: "var(--text-muted)" }
                      }
                    >
                      <span
                        className="inline-flex items-center justify-center rounded-full w-6 h-6 text-xs font-bold"
                        style={
                          completed
                            ? { background: "color-mix(in srgb,#3fb950 20%,transparent)", color: "#3fb950" }
                            : isCurrent
                            ? { background: "color-mix(in srgb,var(--accent) 20%,transparent)", color: "var(--accent)" }
                            : { background: "color-mix(in srgb,var(--text-muted) 15%,transparent)", color: "var(--text-muted)" }
                        }
                      >
                        {completed ? <CheckIcon className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Body */}
        <main className="px-8 py-6 min-h-[220px]">
          {currentSection === 0 && (
            <form onSubmit={handleSubmit(() => setCurrentSection(1))} autoComplete="off">
              <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--text)" }}>Inspection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input {...register("title")} placeholder="Title / Name" className={inputClass} style={inputStyle} />
                  {errors.title && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.title.message}</p>}
                </div>
                <div>
                  <input {...register("location")} placeholder="Location" className={inputClass} style={inputStyle} />
                  {errors.location && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.location.message}</p>}
                </div>
                <div>
                  <input type="date" {...register("date")} className={inputClass} style={inputStyle} />
                  {errors.date && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.date.message}</p>}
                </div>
                <div>
                  <input type="time" {...register("time")} className={inputClass} style={inputStyle} />
                  {errors.time && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.time.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <textarea {...register("notes")} rows={3} placeholder="Notes (optional)" className={inputClass} style={inputStyle} />
                </div>
              </div>
            </form>
          )}

          {currentSection === 1 && (
            <section>
              <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--text)" }}>Assign Safety Officer</h3>
              <div className="space-y-4">
                <input className={inputClass} style={inputStyle} placeholder="Search / Select safety officer" />
                <select className="ui-select w-full">
                  <option value="">-- Select Safety Officer --</option>
                </select>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Select a safety officer responsible for this inspection.</p>
              </div>
            </section>
          )}

          {currentSection === 2 && (
            <section>
              <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--text)" }}>Assign Supervisor</h3>
              <div className="space-y-4">
                <input className={inputClass} style={inputStyle} placeholder="Search / Select supervisor" />
                <select className="ui-select w-full">
                  <option value="">-- Select Supervisor --</option>
                </select>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Select a supervisor to oversee this inspection.</p>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <div
          className="px-8 py-5 flex justify-between items-center"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg-raised)" }}
        >
          <button
            type="button"
            onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
            disabled={currentSection === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={
              currentSection === 0
                ? { opacity: 0.4, cursor: "not-allowed", background: "transparent", color: "var(--text-muted)", borderColor: "var(--border)" }
                : { background: "transparent", color: "var(--text)", borderColor: "var(--border)" }
            }
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          {currentSection === 0 ? (
            <button
              type="button"
              onClick={async () => { const valid = await trigger(); if (valid) setCurrentSection(1); }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentSection < sections.length - 1) setCurrentSection((s) => s + 1);
                else { alert("Inspection created"); handleClose(); }
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={
                currentSection === sections.length - 1
                  ? { background: "#3fb950", color: "#fff" }
                  : { background: "var(--accent)", color: "#fff" }
              }
            >
              {currentSection === sections.length - 1 ? "Finish" : "Next"}
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
