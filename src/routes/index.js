/**
 * routes/index.js — Master route registry.
 *
 * All application routes are declared here.
 * App.js simply renders <AppRoutes /> inside ThemeProvider + BrowserRouter.
 *
 * Structure:
 *  - Public routes (no auth required): /, /products, /solutions, /contacts, /signin, /login
 *  - Protected routes (auth required):  everything else, wrapped in <Layout>
 */
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import PermissionRoute from './PermissionRoute';

// ── Layouts ────────────────────────────────────────────────────────────────
import { Layout }       from '../components/layout/Layout';
import { PublicLayout } from '../components/layout/PublicLayout';

// ── Auth / Public pages ────────────────────────────────────────────────────
import LogIn  from '../pages/auth/LoginPage';
import SignIn from '../pages/auth/SignUpPage';
import { Home }      from '../pages/public/HomePage';
import { Contacts }  from '../pages/public/ContactsPage';
import { Products }  from '../pages/public/ProductsPage';
import { Solutions } from '../pages/public/SolutionsPage';
import AccessDenied  from '../pages/AccessDenied';

// ── Dashboard ─────────────────────────────────────────────────────────────
import Dashboard              from '../components/Dashboard';
import Capa                   from '../components/Dashboard/Capa';
import InspectionForm         from '../components/Dashboard/InspectionDashboard';
import HealthAndSafetyForm    from '../components/Dashboard/HealthAndSafety';
import IncidentInvestigationForm from '../components/Dashboard/IncidentManagement';
import AnalyticsPage          from '../pages/analytics/AnalyticsPage';

// ── Users & Admin ─────────────────────────────────────────────────────
import UserManagement from '../components/Users/UserManagement';
import UserDashboard  from '../components/Users/UserDashboard';
import RolesPage      from '../pages/admin/RolesPage';
import ProfilePage    from '../pages/admin/ProfilePage';

// ── Hazard & Risk ─────────────────────────────────────────────────────────
import HazardRiskInterface from '../components/HazardRiskManagement/HazardRiskInterface';
import HazardInterface     from '../components/HazardRiskManagement/Hazard/HazardInterface';
import RiskInterface       from '../components/HazardRiskManagement/RiskAssessment/RiskInterface';
import HazardReportExecute from '../components/Execute/HazardReportExecute';
import HazardReportsPage            from '../components/HazardRiskManagement/HazardReports';
import RiskAssessmentsPage          from '../components/HazardRiskManagement/RiskAssessments';
import PerformedRiskAssessmentsPage from '../components/HazardRiskManagement/PerformedRiskAssessments';

// ── Incidents ─────────────────────────────────────────────────────────────
import IncidentNotifyInterface        from '../Forms-interface/IncidentNotifyInterface';
import WitnessStateInterface          from '../Forms-interface/WitnessStateInterface';
import IncidentInvestigationInterface from '../Forms-interface/IncidentInvestigationInterface';
import IncidentNotificationDelete     from '../components/Execute/Delete';
import IncidentNotificationsPage      from '../components/Incidents/IncidentNotifications';
import StartInvestigationsPage        from '../components/Incidents/StartInvestigations';

// ── Inspections ───────────────────────────────────────────────────────────
import VehicleInspectionDashboard from '../Forms-interface/vehicle-interface';
import CanteenInterface           from '../Forms-interface/CanteenInterface';
import FuelInterface              from '../Forms-interface/FuelInterface';
import ToolInterface              from '../Forms-interface/Tool-interface';
import PPEInterface               from '../Forms-interface/PPE-interface';
import ScienceLabInterface        from '../Forms-interface/Sciencelab-interface';
import SwimmingPoolInterface      from '../Forms-interface/Swimming-interface';

// ── Audits ────────────────────────────────────────────────────────────────
import ChecklistInterface   from '../Forms-interface/ChecklistInterface';
import WorkPlaceInterface   from '../Forms-interface/WorkPlaceInterface';
import EmergencyInterface   from '../Forms-interface/EmergencyInterface';
import CapaInterface        from '../Forms-interface/CapaInterface';
import RecentAuditInterface from '../Forms-interface/RecentAuditInterface';
import ManagementInterface  from '../Forms-interface/ManagementInterface';
import ChecklistPage        from '../components/HealthAndSafety/Checklist';
import WirPage              from '../components/HealthAndSafety/WorkplaceInspectionReport';
import TcPage               from '../components/HealthAndSafety/TrainingAndCompetency';
import EpPage               from '../components/HealthAndSafety/EmergencyPreparedness';
import PpeCompliancePage    from '../components/HealthAndSafety/PPECompliance';
import CsPage               from '../components/HealthAndSafety/ContractorSafety';
import MrmPage              from '../components/HealthAndSafety/ManagementReviewMeeting';
import CapaPage             from '../components/HealthAndSafety/CapaTracking';

// ── Param wrappers ────────────────────────────────────────────────────────
function HazardReportExecuteWrapper() {
  const { id } = useParams();
  return <HazardReportExecute reportId={id} />;
}

function IncidentDeleteWrapper() {
  const { id } = useParams();
  return <IncidentNotificationDelete id={id} />;
}

// ── AppRoutes ─────────────────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <Routes>

      {/* ── Public (no auth) ── */}
      <Route path="/"         element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/products" element={<PublicLayout><Products /></PublicLayout>} />
      <Route path="/solutions" element={<PublicLayout><Solutions /></PublicLayout>} />
      <Route path="/contacts" element={<PublicLayout><Contacts /></PublicLayout>} />
      <Route path="/signin"   element={<PublicLayout><SignIn /></PublicLayout>} />
      <Route path="/login"    element={<PublicLayout><LogIn /></PublicLayout>} />

      {/* ── Access Denied — rendered by ForbiddenListener or PermissionRoute ── */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* ── Protected — Dashboard (no per-page permission — all authenticated users) ── */}
      <Route path="/dashboard"         element={<Layout><Dashboard /></Layout>} />
      <Route path="/inspection"        element={<Layout><InspectionForm /></Layout>} />
      <Route path="/health-and-safety" element={<Layout><HealthAndSafetyForm /></Layout>} />
      <Route path="/capa"              element={<Layout><Capa /></Layout>} />

      {/* ── Protected — Users & Roles ── */}
      <Route path="/user-management" element={<Layout><UserDashboard /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      <Route element={<PermissionRoute permission="users.index" />}>
        <Route path="/user-management/users" element={<Layout><UserManagement /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="roles.index" />}>
        <Route path="/roles" element={<Layout><RolesPage /></Layout>} />
      </Route>

      {/* ── Protected — Hazard & Risk ── */}
      <Route element={<PermissionRoute permission="hazard_reports.index" />}>
        <Route path="/hazard/reports" element={<Layout><HazardReportsPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="risk_assessments.index" />}>
        <Route path="/hazard/risk-assessments" element={<Layout><RiskAssessmentsPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="perform_risk_assessments.index" />}>
        <Route path="/hazard/performed-risk-assessments" element={<Layout><PerformedRiskAssessmentsPage /></Layout>} />
      </Route>
      <Route path="/hazard/report"         element={<Layout><HazardRiskInterface /></Layout>} />
      <Route path="/dashboard/hazardform"  element={<Layout><HazardInterface /></Layout>} />
      <Route path="/form/risk"             element={<Layout><RiskInterface /></Layout>} />
      <Route path="/hazard/report/:id"     element={<Layout><HazardReportExecuteWrapper /></Layout>} />

      {/* ── Protected — Incidents ── */}
      <Route path="/incident-management" element={<Layout><IncidentInvestigationForm /></Layout>} />
      <Route element={<PermissionRoute permission="incident_notifications.index" />}>
        <Route path="/incident/notifications" element={<Layout><IncidentNotificationsPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="start_incident_investigations.index" />}>
        <Route path="/incident/investigations" element={<Layout><StartInvestigationsPage /></Layout>} />
      </Route>
      <Route path="/dashboard/incidentform"    element={<Layout><IncidentNotifyInterface /></Layout>} />
      <Route path="/form/witness"              element={<Layout><WitnessStateInterface /></Layout>} />
      <Route path="/form/description"          element={<Layout><IncidentInvestigationInterface /></Layout>} />
      <Route path="/dashboard/incidentform/:id" element={<Layout><IncidentDeleteWrapper /></Layout>} />

      {/* ── Protected — Inspections ── */}
      <Route element={<PermissionRoute permission="hand_power_tools_inspections.index" />}>
        <Route path="/form/tool" element={<Layout><ToolInterface /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="canteen_inspections.index" />}>
        <Route path="/form/canteen" element={<Layout><CanteenInterface /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="fuel_tank_inspections.index" />}>
        <Route path="/form/fuel" element={<Layout><FuelInterface /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="ppe_inspections.index" />}>
        <Route path="/form/ppe" element={<Layout><PPEInterface /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="vehicle_inspections.index" />}>
        <Route path="/form/vehicle" element={<Layout><VehicleInspectionDashboard /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="science_lab_inspections.index" />}>
        <Route path="/form/science-laboratory" element={<Layout><ScienceLabInterface /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="swimming_pool_inspections.index" />}>
        <Route path="/form/swimming-pool" element={<Layout><SwimmingPoolInterface /></Layout>} />
      </Route>

      {/* ── Protected — Audits / HSA modules ── */}
      <Route element={<PermissionRoute permission="health_and_safety_audit_checklists.index" />}>
        <Route path="/health-and-safety/checklist" element={<Layout><ChecklistPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="workplace_inspection_reports.index" />}>
        <Route path="/health-and-safety/workplace-inspection-report" element={<Layout><WirPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="training_and_competencies.index" />}>
        <Route path="/health-and-safety/training-and-competency" element={<Layout><TcPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="emergency_preparednesses.index" />}>
        <Route path="/health-and-safety/emergency-preparedness" element={<Layout><EpPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="ppe_compliances.index" />}>
        <Route path="/health-and-safety/ppe-compliance" element={<Layout><PpeCompliancePage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="contractor_safeties.index" />}>
        <Route path="/health-and-safety/contractor-safety" element={<Layout><CsPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="management_review_meetings.index" />}>
        <Route path="/health-and-safety/management-review-meeting" element={<Layout><MrmPage /></Layout>} />
      </Route>
      <Route element={<PermissionRoute permission="capa_trackings.index" />}>
        <Route path="/health-and-safety/capa-tracking" element={<Layout><CapaPage /></Layout>} />
      </Route>
      <Route path="/form/checklist"   element={<Layout><ChecklistInterface /></Layout>} />
      <Route path="/form/workplace"   element={<Layout><WorkPlaceInterface /></Layout>} />
      <Route path="/form/emergency"   element={<Layout><EmergencyInterface /></Layout>} />
      <Route path="/form/capa"        element={<Layout><CapaInterface /></Layout>} />
      <Route path="/form/audit"       element={<Layout><RecentAuditInterface /></Layout>} />
      <Route path="/form/management"  element={<Layout><ManagementInterface /></Layout>} />

      <Route path="/analytics" element={<Layout><AnalyticsPage /></Layout>} />

    </Routes>
  );
}
