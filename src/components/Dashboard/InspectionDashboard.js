import { FaArrowRight, FaClipboardCheck, FaShieldAlt, FaFireExtinguisher, FaUserCheck, FaTools } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const inspections = [
  { title: 'Canteen Inspection', formPath: '/form/canteen' },
  { title: 'Fuel Storage Tank Inspection Checklist', formPath: '/form/fuel' },
  { title: 'Hand and Power Tool Inspection Form', formPath: '/form/tool' },
  { title: 'PPE Inspection Form', formPath: '/form/ppe' },
  { title: 'Science Laboratory Inspection Form', formPath: '/form/science-laboratory' },
  { title: 'Swimming Pool Inspection Checklist', formPath: '/form/swimming-pool' },
  { title: 'Vehicle Inspection Form', formPath: '/form/vehicle' },

];



export default function InspectionDashboard({ darkMode }) {
    // Map inspection titles to suitable icons
    const iconMap = {
      "Canteen Inspection": FaUserCheck,
      "Fuel Storage Tank Inspection Checklist": FaFireExtinguisher,
      "Hand and Power Tool Inspection Form": FaTools,
      "PPE Inspection Form": FaShieldAlt,
      "Science Laboratory Inspection Form": FaClipboardCheck,
      "Swimming Pool Inspection Checklist": FaShieldAlt,
      "Vehicle Inspection Form": FaTools,
    };
  const navigate = useNavigate();

  const handleCardClick = (formPath) => {
    navigate(formPath);
  };

  return (
    <div className={darkMode ? "bg-gray-950 min-h-screen py-16 sm:py-24" : "bg-white min-h-screen py-16 sm:py-24"}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center mb-12 ${darkMode ? "text-white" : ""}`}>
          <h1 className={`text-5xl font-black tracking-tight mb-2 ${darkMode ? "text-white" : "text-blue-900"}`}>Inspection Forms</h1>
          <div className="flex justify-center mb-4">
            <span className={`block w-16 h-1 rounded ${darkMode ? "bg-blue-600" : "bg-blue-400"}`}></span>
          </div>
          <p className={`text-base sm:text-lg font-normal leading-relaxed max-w-xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            Access and complete all your safety and compliance inspections in one place.<br className="hidden sm:block" />
            <span className={darkMode ? "text-blue-300 font-semibold" : "text-blue-700 font-semibold"}>Click a card to begin.</span>
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {inspections.map((item, idx) => {
            const Icon = iconMap[item.title] || FaClipboardCheck;
            return (
              <div
                key={idx}
                className={`group flex flex-col items-center justify-center p-6 rounded-lg border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer ${darkMode ? "bg-gray-900 border-blue-900 hover:border-blue-600" : "bg-white border-blue-100 hover:border-blue-400"}`}
                onClick={() => handleCardClick(item.formPath)}
              >
                <div className="flex items-center justify-center mb-3">
                  <Icon className={darkMode ? "text-blue-400" : "text-blue-600"} size={36} />
                </div>
                <h2 className={`text-base font-semibold text-center mb-1 ${darkMode ? "text-blue-200" : "text-blue-900"}`}>
                  {item.title}
                </h2>
                <div className="flex justify-center items-center gap-2 mt-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${darkMode ? "bg-blue-950 text-blue-300 border-blue-800" : "bg-blue-50 text-blue-800 border-blue-200"}`}>Inspection</span>
                  <FaArrowRight className={darkMode ? "text-blue-400 group-hover:text-blue-600" : "text-blue-400 group-hover:text-blue-700"} size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
