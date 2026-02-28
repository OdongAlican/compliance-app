// ...existing code...
import './index.css';
import React, { useState } from 'react';
import { FaSun, FaMoon } from "react-icons/fa";
import { BrowserRouter as Router, Routes, Route,useParams } from 'react-router-dom';
import HazardReportExecute from './components/Execute/HazardReportExecute';
import { Sidebar } from './components/Sidebar';
import { Layout } from './components/Layout';
import { Home } from './components/Home/Home';
import IncidentInvestigationForm from './components/Dashboard/IncidentManagement';
import { Contacts } from './components/Pages/Contacts';
import { Products } from './components/Pages/Products';
import { Solutions } from './components/Pages/Solutions';
import SignIn from './components/Pages/SignIn';
import { PublicLayout } from './components/PublicLayout';
import InspectionForm from './components/Dashboard/InspectionDashboard';
import HealthAndSafetyForm from './components/Dashboard/HealthAndSafety';
import LogIn from './components/Pages/LogIn';
import Capa from './components/Dashboard/Capa';
// Forms & Interfaces
import VehicleInspectionDashboard from './Forms-interface/vehicle-interface';
import CanteenInterface from './Forms-interface/CanteenInterface';
import FuelInterface from './Forms-interface/FuelInterface';
import ToolInterface from './Forms-interface/Tool-interface';
import PPEInterface from './Forms-interface/PPE-interface';
import ScienceLabInterface from './Forms-interface/Sciencelab-interface';
import SwimmingPoolInterface from './Forms-interface/Swimming-interface';
import HazardRiskInterface from './components/HazardRiskManagement/HazardRiskInterface';
import HazardInterface from './components/HazardRiskManagement/Hazard/HazardInterface';
import RiskInterface from './components/HazardRiskManagement/RiskAssessment/RiskInterface';
import IncidentNotifyInterface from './Forms-interface/IncidentNotifyInterface';
import WitnessStateInterface from './Forms-interface/WitnessStateInterface';
import IncidentInvestigationInterface from './Forms-interface/IncidentInvestigationInterface';
import IncidentNotificationDelete from './components/Execute/Delete';
import Dashboard from './components/Dashboard';
import ChecklistInterface from './Forms-interface/ChecklistInterface';
import WorkPlaceInterface from './Forms-interface/WorkPlaceInterface';
import EmergencyInterface from './Forms-interface/EmergencyInterface';
import CapaInterface from './Forms-interface/CapaInterface';
import RecentAuditInterface from './Forms-interface/RecentAuditInterface';
import PPECompInterface from './Forms-interface/PPECompInterface';
import ManagementInterface from './Forms-interface/ManagementInterface';
import UserManagement from './components/Users/UserManagement';







function HazardReportExecuteWrapper() {
  const { id } = useParams();
  return <HazardReportExecute reportId={id} />;
}


export default function App() {
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Global Navbar for theme toggle
  const AppNavbar = () => (
    <nav className={`w-full flex items-center justify-between px-6 py-3 mb-8 rounded-lg shadow-sm ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      <span className={`font-bold text-lg ${darkMode ? "text-white" : "text-blue-900"}`}>Compliance App</span>
      <button
        className={`flex items-center gap-2 px-4 py-1 rounded-full font-medium border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-blue-50 text-blue-900 border-blue-200"}`}
        onClick={() => setDarkMode((d) => !d)}
      >
        {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-blue-700" />}
        {darkMode ? "Light Theme" : "Dark Theme"}
      </button>
    </nav>
  );

  return (
    <Router>
      <div className={darkMode ? "bg-gray-950 min-h-screen" : "bg-white min-h-screen"}>
        <AppNavbar />
        <Routes>
        {/* Public home */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        {/* Simple dashboard shell (no content inside yet) */}
        <Route
          path="/dashboard"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <Dashboard />
              </Layout>
            
          }
        />

       {/* <Route
          path="/sidebar"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <Sidebar />
              </Layout>
            
          }
        />*/}

           

        {/* Hazard routes */}
       <Route
          path="/sidebar"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <Sidebar />
            </Layout>
          }
        />


        <Route
          path="/capa"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <Capa />
            </Layout>
          }
        />

          <Route
          path="/user-management"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <UserManagement/>
            </Layout>
          }
        />





        <Route
          path="/hazard/report"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <HazardRiskInterface />

            </Layout>
          }
        />
      

               <Route
          path="/dashboard/hazardform"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <HazardInterface />
            </Layout>
          }
        />



             <Route
          path="/form/risk"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <RiskInterface />
            </Layout>
          }
        />

        {/* Health & Safety / Risk management */}
      

        {/* Other pages */}
        <Route
          path="/incident-management"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <IncidentInvestigationForm />
            </Layout>
          }
        />

                <Route
          path="/dashboard/incidentform"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <IncidentNotifyInterface />
            </Layout>
          }
        />

         <Route
          path="/form/witness"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <WitnessStateInterface />
            </Layout>
          }
        />

                 <Route
          path="/form/description"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <IncidentInvestigationInterface />
            </Layout>
          }
        />


        <Route
          path="/inspection"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <InspectionForm darkMode={darkMode} />
            </Layout>
          }
        />
                <Route
          path="/health-and-safety"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <HealthAndSafetyForm />
            </Layout>
          }
        />


        <Route
  path="/hazard/report/:id"
  element={
    <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
      <HazardReportExecuteWrapper />
    </Layout>
  }
/>
        <Route
  path="/dashboard/incidentform/:id"
  element={
    <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
      <IncidentNotificationDelete/>
    </Layout>
  }
/>





        <Route path="/products" element={<PublicLayout><Products /></PublicLayout>} />
        <Route path="/solutions" element={<PublicLayout><Solutions /></PublicLayout>} />
        <Route path="/contacts" element={<PublicLayout><Contacts /></PublicLayout>} />
        <Route path="/signin" element={<PublicLayout><SignIn /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><LogIn /></PublicLayout>} />

        {/* Form interfaces (use Layout where appropriate) */}
        <Route
          path="/form/tool"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <ToolInterface />
            </Layout>
          }
        />
        <Route
          path="/form/canteen"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <CanteenInterface />
            </Layout>
          }
        />
        <Route
          path="/form/fuel"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <FuelInterface />
            </Layout>
          }
        />
        <Route
          path="/form/ppe"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <PPEInterface />
            </Layout>
          }
        />
        <Route
          path="/form/vehicle"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <VehicleInspectionDashboard />
            </Layout>
          }
        />
        <Route
          path="/form/science-laboratory"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <ScienceLabInterface />
            </Layout>
          }
        />
        <Route
          path="/form/swimming-pool"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <SwimmingPoolInterface />
            </Layout>
          }
        />

        {/* Auditors */}
        <Route
          path="/form/checklist"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <ChecklistInterface/>
            </Layout>
          }
        />

                <Route
          path="/form/workplace"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <WorkPlaceInterface/>
            </Layout>
          }
        />
           <Route
          path="/form/emergency"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <EmergencyInterface/>
            </Layout>
          }
        />

             <Route
          path="/form/capa"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <CapaInterface/>
            </Layout>
          }
        />




              <Route
          path="/form/audit"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <RecentAuditInterface/>
            </Layout>
          }
        />

         <Route
          path="/form/ppe-com"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <PPECompInterface/>
            </Layout>
          }
        />

                 <Route
          path="/form/management"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <ManagementInterface/>
            </Layout>
          }
        />


      

        {/* Direct interface routes (developer/debug) */}
        <Route path="/forms-interface/vehicle-interface" element={<VehicleInspectionDashboard />} />
        <Route path="/forms-interface/canteen-interface" element={<CanteenInterface />} />
        <Route path="/forms-interface/fuel-interface" element={<FuelInterface />} />
        <Route path="/forms-interface/tool-interface" element={<ToolInterface />} />
        <Route path="/forms-interface/ppe-interface" element={<PPEInterface />} />
        <Route path="/forms-interface/sciencelab-interface" element={<ScienceLabInterface />} />
        <Route path="/forms-interface/swimmingpool-interface" element={<SwimmingPoolInterface />} />

      </Routes>
      </div>
    </Router>
  );
}
// ...existing code...