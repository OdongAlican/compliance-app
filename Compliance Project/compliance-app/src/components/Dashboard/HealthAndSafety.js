import { useNavigate } from 'react-router-dom';
const inspections = [
  { title: 'Checklist', formPath: '/form/checklist', image: '/canteen.png' },
  { title: 'Workplace Inspection', formPath: '/form/workplace', image: '/fuel.png' },
  { title: 'Emergency Preparedness', formPath: '/form/emergency', image: '/tools.png' },
  { title: 'PPE Compliance', formPath: '/form/ppe-com', image: '/ppe.png' },
  { title: 'Capa Tracking', formPath: '/form/capa', image: '/lab.png' },
  { title: 'Management Review Meeting', formPath: '/form/management', image: '/pool.png' },
  { title: 'Recent Audit', formPath: '/form/audit', image: '/vehicle.png' },

];



export default function HealthAndSafetyDashboard() {
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

