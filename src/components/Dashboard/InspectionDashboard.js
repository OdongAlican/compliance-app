import { useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
const inspections = [
  { title: 'Canteen Inspection', formPath: '/form/canteen', image: '/canteen.png' },
  { title: 'Fuel Storage Tank Inspection Checklist', formPath: '/form/fuel', image: '/fuel.png' },
  { title: 'Hand and Power Tool Inspection Form', formPath: '/form/tool', image: '/tools.png' },
  { title: 'PPE Inspection Form', formPath: '/form/ppe', image: '/ppe.png' },
  { title: 'Science Laboratory Inspection Form', formPath: '/form/science-laboratory', image: '/lab.png' },
  { title: 'Swimming Pool Inspection Checklist', formPath: '/form/swimming-pool', image: '/pool.png' },
  { title: 'Vehicle Inspection Form', formPath: '/form/vehicle', image: '/vehicle.png' },

];



export default function InspectionDashboard() {
  const navigate = useNavigate();

  const handleCardClick = (formPath) => {
    navigate(formPath);
  };

  return (
    <div className="bg-white min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h1 className="text-5xl font-black tracking-tight text-blue-900 mb-2">Inspection Forms</h1>
          <div className="flex justify-center mb-4">
            <span className="block w-16 h-1 rounded bg-blue-400"></span>
          </div>
          <p className="text-base sm:text-lg text-gray-500 font-normal leading-relaxed max-w-xl mx-auto">
            Access and complete all your safety and compliance inspections in one place.<br className="hidden sm:block" />
            <span className="text-green-700 font-medium">Click a card to begin.</span>
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {inspections.map((item, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center justify-center p-6 rounded-lg bg-white border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer"
              onClick={() => handleCardClick(item.formPath)}
            >
              <div className="flex items-center justify-center mb-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-12 h-12 rounded-full object-cover border border-blue-300 bg-white"
                />
              </div>
              <h2 className="text-base font-semibold text-blue-900 text-center mb-1">
                {item.title}
              </h2>
              <div className="flex justify-center items-center gap-2 mt-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-900 text-xs font-medium border border-green-200">Inspection</span>
                <FaArrowRight className="text-blue-400 group-hover:text-blue-700 transition-all duration-200" size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
