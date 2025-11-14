import './index.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { Home } from './components/Home/Home';
import InspectionForm from './components/Dashboard/InspectionDashboard';
import HealthAndSafetyForm from './components/Dashboard/HealthAndSafety';
import IncidentInvestigationForm from './components/Dashboard/IncidentManagement';
import Capa from './components/Dashboard/Capa';
import HazardRiskInterface from './components/HazardRiskManagement/HazardRiskInterface';
import HazardInterface from './components/HazardRiskManagement/Hazard/HazardInterface';
import RiskInterface from './components/HazardRiskManagement/RiskAssessment/RiskInterface';
import IncidentNotifyInterface from './Forms-interface/IncidentNotifyInterface';
import WitnessStateInterface from './Forms-interface/WitnessStateInterface';
import IncidentInvestigationInterface from './Forms-interface/IncidentInvestigationInterface';
import IncidentNotificationDelete from './components/Execute/IncidentNotificationDelete';
import { Products } from './components/Pages/Products';
import { Solutions } from './components/Pages/Solutions';
import { Contacts } from './components/Pages/Contacts';
import SignIn from './components/Pages/SignIn';
import LogIn from './components/Pages/LogIn';
// Form interfaces
import VehicleInspectionDashboard from './Forms-interface/vehicle-interface';
import CanteenInterface from './Forms-interface/CanteenInterface';
import FuelInterface from './Forms-interface/FuelInterface';
import ToolInterface from './Forms-interface/Tool-interface';
import PPEInterface from './Forms-interface/PPE-interface';
import ScienceLabInterface from './Forms-interface/Sciencelab-interface';
import SwimmingPoolInterface from './Forms-interface/Swimming-interface';







function HazardReportExecuteWrapper() {
  const { id } = useParams();
  const HazardReportExecute = React.lazy(() => import('./components/Execute/HazardReportExecute'));
  return <HazardReportExecute reportId={id} />;
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Public Home */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />

        {/* Dashboard pages */}
        <Route path="/inspection" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><InspectionForm /></Layout>} />
        <Route path="/health-and-safety" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><HealthAndSafetyForm /></Layout>} />
        <Route path="/incident-management" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><IncidentInvestigationForm /></Layout>} />
        <Route path="/capa" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><Capa /></Layout>} />
        <Route path="/hazard/report" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><HazardRiskInterface /></Layout>} />
        <Route path="/dashboard/hazardform" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><HazardInterface /></Layout>} />
        <Route path="/form/risk" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><RiskInterface /></Layout>} />
        <Route path="/dashboard/incidentform" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><IncidentNotifyInterface /></Layout>} />
        <Route path="/form/witness" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><WitnessStateInterface /></Layout>} />
        <Route path="/form/description" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><IncidentInvestigationInterface /></Layout>} />
        <Route path="/hazard/report/:id" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><HazardReportExecuteWrapper /></Layout>} />
        <Route path="/dashboard" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><IncidentNotificationDelete /></Layout>} />
        <Route path="/dashboard/incidentform/:id" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><IncidentNotificationDelete /></Layout>} />

        {/* Other pages */}
        <Route path="/products" element={<PublicLayout><Products /></PublicLayout>} />
        <Route path="/solutions" element={<PublicLayout><Solutions /></PublicLayout>} />
        <Route path="/contacts" element={<PublicLayout><Contacts /></PublicLayout>} />
        <Route path="/signin" element={<PublicLayout><SignIn /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><LogIn /></PublicLayout>} />

        {/* Form Interfaces */}
        <Route path="/form/tool" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><ToolInterface /></Layout>} />
        <Route path="/form/canteen" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><CanteenInterface /></Layout>} />
        <Route path="/form/fuel" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><FuelInterface /></Layout>} />
        <Route path="/form/ppe" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><PPEInterface /></Layout>} />
        <Route path="/form/vehicle" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><VehicleInspectionDashboard /></Layout>} />
        <Route path="/form/science-laboratory" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><ScienceLabInterface /></Layout>} />
        <Route path="/form/swimming-pool" element={<Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}><SwimmingPoolInterface /></Layout>} />
      </Routes>
    </Router>
  );
}
