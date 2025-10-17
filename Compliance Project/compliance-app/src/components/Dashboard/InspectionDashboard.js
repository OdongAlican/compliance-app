import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="p-6" style={{ backgroundImage: "url('/image.png')" }}>
      <h1 className="text-3xl font-bold mb-6">Inspection Forms</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20">
        {inspections.map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.formPath)}
              className="flex flex-col items-left text-center gap-2 cursor-pointer shadow-gray-300 p-6 rounded-lg shadow-md hover:bg-primary hover:text-tertiary transition duration-200"
          >
            <div className="flex items-left gap-4 ...">
                <img
      src={item.image}
      alt={item.title}
      className="w-10 h-10 object-contain"
    />
    </div>
            <h2 className="text-lg font-semibold">{item.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

