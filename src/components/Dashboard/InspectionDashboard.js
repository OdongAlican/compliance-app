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
    <div className="p-6" style={{ backgroundImage: "url('/image.png')" }}>
      <h1 className="text-3xl font-bold mb-6">Inspection Forms</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20">
        {inspections.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-left text-center gap-4 p-6 rounded-lg bg-white border border-transparent transition-all duration-300 hover:shadow-2xl group cursor-pointer justify-between"
            onClick={() => handleCardClick(item.formPath)}
          >
            <div className="flex items-left gap-4">
              <img
                src={item.image}
                alt={item.title}
                className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <h2 
              className="text-lg font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-600"
            >
              {item.title}
            </h2>
            <div className="flex justify-end">
              <FaArrowRight 
                className="text-gray-400 transition-all duration-300 group-hover:text-blue-600" 
                size={20} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
