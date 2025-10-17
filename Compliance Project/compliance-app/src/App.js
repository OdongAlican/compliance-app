


import './index.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Layout } from './components/Layout';
import { Home } from './components/Home/Home';
import  RiskAssessmentForm  from './components/Dashboard/HealthAndSafety';
import IncidentInvestigationForm from './components/Dashboard/IncidentsInvestigationForm';
import  ScienceLabForm from './Forms/ScienceLabForm'
import SwimmingPoolForm from './Forms/SwimmingPoolForm'
import PPEForm from './Forms/PPEForm'
import { Contacts } from './components/Pages/Contacts';
import { Products } from './components/Pages/Products';
import { Solutions } from './components/Pages/Solutions';
import SignIn from './components/Pages/SignIn'
import { PublicLayout } from './components/PublicLayout';
import InspectionForm from './components/Dashboard/InspectionDashboard'
import FuelStorageForm from './Forms/FuelStorageForm';
import HandAndPowerForm from './Forms/ToolInspectionForm';
import LogIn from './components/Pages/LogIn';
import VehicleForm from './Forms/VehicleForm';
import VehicleInspectionDashboard from './Forms-interface/vehicle-interface';
import CanteenInterface from './Forms-interface/CanteenInterface.js';
import FuelInterface from './Forms-interface/FuelInterface';
import ToolInterface from './Forms-interface/Tool-interface';
import PPEInterface from './Forms-interface/PPE-interface.js';
import ScienceLabInterface from './Forms-interface/Sciencelab-interface.js';
import SwimmingPoolInterface from './Forms-interface/Swimming-interface.js';
import HazardDashboard from './components/Dashboard/HazardDashboard';
import RiskAssessmentFormForm from './Forms-interface/Risk-interface.js';
import HazardReportPage from './components/Dashboard/HazardForm.js';






export default function App() {
  const [sidebarToggle, setSidebarToggle] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Home page with no sidebar */}

        <Route
  path="/"
  element={
    <PublicLayout>
      <Home />
    </PublicLayout>
  }
/>




        {/* Dashboard page with sidebar */}
        <Route
          path="/dashboard"
          element={
            <div className="flex">
              <Sidebar sidebarToggle={sidebarToggle} />
              
            </div>
          }
        />


<Route
  path="/hazard/dashboard"
  element={
    <Layout sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
      <HazardDashboard />
    </Layout>
  }
/>



<Route
  path="/hazard/report"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <HazardReportPage />
    </Layout>
  }
/>

<Route
  path="/health-and-safety"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <RiskAssessmentForm />
    </Layout>
  }
/>

<Route
  path="/incident-management"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <IncidentInvestigationForm />
    </Layout>
  }
/>

<Route
  path="/inspection"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <InspectionForm />
    </Layout>
  }
/>






<Route
  path="/products"
  element={
    <PublicLayout>
      <Products />
    </PublicLayout>
  }
/>

<Route
  path="/solutions"
  element={
    <PublicLayout>
      <Solutions />
    </PublicLayout>
  }
/>

<Route
  path="/contacts"
  element={
    <PublicLayout>
      <Contacts />
    </PublicLayout>
  }
/>

<Route
  path="/signin"
  element={
    <PublicLayout>
      <SignIn />
    </PublicLayout>
  }
/>

<Route
  path="/login"
  element={
    <PublicLayout>
      <LogIn />
    </PublicLayout>
  }
/>

                <Route
  path="/form/tool"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
    {/*  <HandAndPowerForm />*/}
      <ToolInterface />
    </Layout>
  }
/>





<Route
  path="/form/canteen"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <CanteenInterface />
    </Layout>
  }
/>




        <Route
  path="/form/fuel"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <FuelInterface />
    </Layout>
  }
/>

        <Route
  path="/form/ppe"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <PPEInterface />
    </Layout>
  }
/>
        <Route
  path="/form/vehicle"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
     {/* <VehicleForm />*/}
            <VehicleInspectionDashboard />
    </Layout>
  }
/>


        <Route
  path="/form/science-laboratory"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      {/*<ScienceLabForm />*/}
      <ScienceLabInterface />

    </Layout>
  }
/>
        <Route
  path="/form/swimming-pool"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
     {/* <SwimmingPoolForm />*/}
      <SwimmingPoolInterface />
    </Layout>
  }
/>
<Route
  path="/form/risk"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <RiskAssessmentFormForm />
    </Layout>
  }
/>

<Route
  path="/dashboard/hazardform"
  element={
    <Layout
      sidebarToggle={sidebarToggle}
      setSidebarToggle={setSidebarToggle}
    >
      <HazardReportPage/>
    </Layout>
  }
/>


        <Route path="/forms-interface/vehicle-interface" element={<VehicleInspectionDashboard />} />
        <Route path='/forms-interface/canteen-interface' element={<CanteenInterface />} />
        <Route path='/forms-interface/fuel-interface' element={<FuelInterface />} />
        <Route path='/forms-interface/tool-interface' element={<ToolInterface />} />
        <Route path='/forms-interface/ppe-interface' element={<PPEInterface />} />
        <Route path='/forms-interface/sciencelab-interface' element={<ScienceLabInterface />} />
        <Route path='/forms-interface/swimmingpool-interface' element={<SwimmingPoolInterface />} />
        <Route path='/form/risk' element={<RiskAssessmentFormForm />} />
                <Route path="/" element={<HazardDashboard />} />
        {/* Add other routes here */}




      </Routes>
    </Router>
  );
}
