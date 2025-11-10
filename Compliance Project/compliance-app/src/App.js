// ...existing code...
import './index.css';
import React, { useState } from 'react';
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

// Hazard / Risk
{/*import HazardDashboard from './components/Dashboard/HazardDashboard';*/}
{/*import HazardRiskFormModal from './components/HazardRiskManagement/HazardRiskFormModal';*/}

import HazardRiskInterface from './components/HazardRiskManagement/HazardRiskInterface';
import HazardInterface from './components/HazardRiskManagement/Hazard/HazardInterface';
import RiskInterface from './components/HazardRiskManagement/RiskAssessment/RiskInterface';
import IncidentNotifyInterface from './Forms-interface/IncidentNotifyInterface';
import WitnessStateInterface from './Forms-interface/WitnessStateInterface';
import IncidentInvestigationInterface from './Forms-interface/IncidentInvestigationInterface';
import IncidentNotificationDelete from './components/Execute/IncidentNotificationDelete';




function HazardReportExecuteWrapper() {
  const { id } = useParams();
  return <HazardReportExecute reportId={id} />;
}


export default function App() {
  const [sidebarToggle, setSidebarToggle] = useState(false);

  return (
    <Router>
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
            <div className="flex">
              <Sidebar sidebarToggle={sidebarToggle} />
            </div>
          }
        />

        {/* Hazard routes */}
      {/* <Route
          path="/hazard/dashboard"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <HazardDashboard />
            </Layout>
          }
        />*/}


        <Route
          path="/capa"
          element={
            <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
              <Capa />
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
              <InspectionForm />
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

        {/* Risk form route (fixed) */}
      

        {/* Direct interface routes (developer/debug) */}
        <Route path="/forms-interface/vehicle-interface" element={<VehicleInspectionDashboard />} />
        <Route path="/forms-interface/canteen-interface" element={<CanteenInterface />} />
        <Route path="/forms-interface/fuel-interface" element={<FuelInterface />} />
        <Route path="/forms-interface/tool-interface" element={<ToolInterface />} />
        <Route path="/forms-interface/ppe-interface" element={<PPEInterface />} />
        <Route path="/forms-interface/sciencelab-interface" element={<ScienceLabInterface />} />
        <Route path="/forms-interface/swimmingpool-interface" element={<SwimmingPoolInterface />} />

      </Routes>
    </Router>
  );
}
// ...existing code...