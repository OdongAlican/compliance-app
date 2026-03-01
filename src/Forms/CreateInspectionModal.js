import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ChevronDownIcon } from '@heroicons/react/16/solid';


const sections = [
  { name: "Create Inspection", count: null },
  { name: "Assign Safety Officer", count: null },
  { name: "Assign Supervisor", count: null },
];

export default function CreateInspectionModal(props) {
  // Validation schema for step 1
  const inspectionSchema = yup.object().shape({
    title: yup.string().required("Title is required"),
    location: yup.string().required("Location is required"),
    date: yup.string().required("Date is required"),
    time: yup.string().required("Time is required"),
    notes: yup.string(),
  });

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      // isValid 
    },
    trigger,
    // getValues,
    // reset,
  } = useForm({
    resolver: yupResolver(inspectionSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      location: "",
      date: "",
      time: "",
      notes: "",
    },
  });

  const { isOpen, onClose, startSection = 0 } = props;
  const [currentSection, setCurrentSection] = useState(startSection);

  // When modal opens, jump to requested section
  useEffect(() => {
    if (isOpen) {
      setCurrentSection(startSection ?? 0);
    }
  }, [isOpen, startSection]);

  const handleClose = () => {
    setCurrentSection(0);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[120]" />
      {/* Modal Card */}
      <div className={`relative z-[130] bg-white rounded-3xl shadow-3xl w-full max-w-2xl p-0 border border-blue-100 flex flex-col overflow-hidden${typeof window !== 'undefined' && window.darkMode ? ' dark:bg-gray-950 dark:border-blue-900' : ''}`}>
        <div className="px-8 pt-8 pb-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3v2.25m4.5-2.25v2.25m-7.5 4.5h12.75m-1.5 0v9a2.25 2.25 0 01-2.25 2.25H8.25A2.25 2.25 0 016 18.75v-9m12.75 0a2.25 2.25 0 00-2.25-2.25H7.5A2.25 2.25 0 005.25 9.75m0 0V18.75A2.25 2.25 0 007.5 21h9a2.25 2.25 0 002.25-2.25V9.75" />
              </svg>
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-blue-900">Create Inspection</h1>
          </div>
          <button
            aria-label="Close create inspection"
            onClick={handleClose}
            className="text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
          >
            &times;
          </button>
        </div>

        {/* Modern Tabs Navigation - Tailwind style, replaces old stepper */}
        <div className="px-8 pt-6 pb-2">
          {/* Mobile dropdown */}
          <div className="grid grid-cols-1 sm:hidden mb-4">
            <select
              value={sections[currentSection].name}
              aria-label="Select a tab"
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
              onChange={e => {
                const idx = sections.findIndex(s => s.name === e.target.value);
                if (idx !== -1) setCurrentSection(idx);
              }}
            >
              {sections.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
            />
          </div>
          {/* Desktop tabs */}
          <div className="hidden sm:block mb-4">
            <div className="border-b border-blue-100">
              <nav aria-label="Tabs" className="-mb-px flex space-x-8">
                {sections.map((tab, idx) => {
                  const completed = idx < currentSection;
                  const isCurrent = idx === currentSection;
                  return (
                    <button
                      key={tab.name}
                      type="button"
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={() => setCurrentSection(idx)}
                      className={[
                        isCurrent
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-blue-200 hover:text-blue-700',
                        'flex items-center border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                      ].join(' ')}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className={[
                          'inline-flex items-center justify-center rounded-full w-6 h-6 text-xs font-semibold',
                          completed ? 'bg-green-100 text-green-700 border border-green-300' : isCurrent ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500 border border-gray-200',
                        ].join(' ')}>
                          {completed ? <span>&#10003;</span> : idx + 1}
                        </span>
                        {tab.name}
                        {tab.count ? (
                          <span className={[
                            isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900',
                            'ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                          ].join(' ')}>
                            {tab.count}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        <main className="px-8 pb-8 pt-2 min-h-[200px]">
          {currentSection === 0 && (
            <form onSubmit={handleSubmit(() => setCurrentSection(1))} autoComplete="off">
              <h3 className="font-medium mb-6 text-blue-900">Inspection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input {...register("title")}
                    className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all w-full"
                    placeholder="Title / Name" />
                  {errors.title && <p className="text-xs text-red-500 mt-1 font-normal text-left">{errors.title.message}</p>}
                </div>
                <div>
                  <input {...register("location")}
                    className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all w-full"
                    placeholder="Location" />
                  {errors.location && <p className="text-xs text-red-500 mt-1 font-normal text-left">{errors.location.message}</p>}
                </div>
                <div>
                  <input type="date" {...register("date")}
                    className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all w-full"
                  />
                  {errors.date && <p className="text-xs text-red-500 mt-1 font-normal text-left">{errors.date.message}</p>}
                </div>
                <div>
                  <input type="time" {...register("time")}
                    className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all w-full"
                  />
                  {errors.time && <p className="text-xs text-red-500 mt-1 font-normal text-left">{errors.time.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <textarea {...register("notes")}
                    className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all w-full"
                    placeholder="Notes (optional)" />
                </div>
              </div>
            </form>
          )}

          {currentSection === 1 && (
            <section>
              <h3 className="font-medium mb-6 text-blue-900">Assign Safety Officer</h3>
              <div className="space-y-6">
                <input className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all" placeholder="Search / Select safety officer" />
                <select className="border border-blue-200 rounded-xl px-4 py-2 w-full bg-white text-blue-900 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all">
                  <option value="">-- Select Safety Officer --</option>
                </select>
                <p className="text-xs text-blue-400">Select a safety officer for this inspection.</p>
              </div>
            </section>
          )}

          {currentSection === 2 && (
            <section>
              <h3 className="font-medium mb-6 text-blue-900">Assign Supervisor</h3>
              <div className="space-y-6">
                <input className="border border-blue-200 rounded-xl px-4 py-2 bg-white text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all" placeholder="Search / Select supervisor" />
                <select className="border border-blue-200 rounded-xl px-4 py-2 w-full bg-white text-blue-900 focus:ring-2 focus:ring-blue-600 text-base font-normal shadow-sm transition-all">
                  <option value="">-- Select Supervisor --</option>
                </select>
                <p className="text-xs text-blue-400">Select a supervisor for this inspection.</p>
              </div>
            </section>
          )}
        </main>

        {/* Navigation / actions */}
        <footer className="px-8 pb-8 flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
              disabled={currentSection === 0}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-md font-semibold transition-all border text-base shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400
                ${currentSection === 0 ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-900"}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            {currentSection === 0 ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  const valid = await trigger();
                  if (valid) setCurrentSection(1);
                  // If not valid, errors will show below fields automatically
                }}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-md font-semibold transition-all border text-base shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentSection < sections.length - 1) {
                    setCurrentSection((s) => s + 1);
                  } else {
                    // final submit action for create inspection flow
                    alert("Inspection created");
                    handleClose();
                  }
                }}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-md font-semibold transition-all border text-base shadow-md focus:outline-none focus:ring-2 focus:ring-green-400
                  ${currentSection === sections.length - 1 ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"}
                `}
              >
                {currentSection === sections.length - 1 ? "Finish" : "Next"}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-sm font-medium text-blue-500 bg-blue-50 rounded-full px-4 py-1 shadow-sm">Step {currentSection + 1} of {sections.length}</div>
        </footer>
      </div>
    </div>
  );
}

