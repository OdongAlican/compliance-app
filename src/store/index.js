/**
 * src/store/index.js
 *
 * Redux Toolkit store — single source of truth.
 *
 * Slices registered here:
 *   auth   → authSlice   (login, logout, hydration)
 *   users  → usersSlice  (user list, filters, pagination)
 *   roles  → rolesSlice  (roles list, permissions matrix)
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer        from './slices/authSlice';
import usersReducer       from './slices/usersSlice';
import rolesReducer       from './slices/rolesSlice';
import canteenReducer     from './slices/canteenSlice';
import fuelReducer        from './slices/fuelSlice';
import ppeReducer         from './slices/ppeSlice';
import toolReducer        from './slices/toolSlice';
import swimmingPoolReducer from './slices/swimmingPoolSlice';
import vehicleReducer     from './slices/vehicleSlice';
import scienceLabReducer  from './slices/scienceLabSlice';
import hazardReportsReducer          from './slices/hazardReportSlice';
import riskAssessmentsReducer        from './slices/riskAssessmentSlice';
import performedRiskAssessmentsReducer from './slices/performedRiskAssessmentSlice';
import incidentNotificationsReducer  from './slices/incidentNotificationSlice';
import startInvestigationsReducer    from './slices/startInvestigationSlice';
import hsaChecklistReducer           from './slices/hsaChecklistSlice';
import wirReducer                    from './slices/wirSlice';
import tcReducer                     from './slices/tcSlice';
import epReducer                     from './slices/epSlice';
import ppeComplianceReducer          from './slices/ppeComplianceSlice';
import csReducer                     from './slices/contractorSafetySlice';
import mrmReducer                    from './slices/mrmSlice';
import capaReducer                   from './slices/capaTrackingSlice';

const store = configureStore({
  reducer: {
    auth:         authReducer,
    users:        usersReducer,
    roles:        rolesReducer,
    canteen:      canteenReducer,
    fuel:         fuelReducer,
    ppe:          ppeReducer,
    tool:         toolReducer,
    swimmingPool: swimmingPoolReducer,
    vehicle:      vehicleReducer,
    scienceLab:   scienceLabReducer,
    hazardReports:            hazardReportsReducer,
    riskAssessments:          riskAssessmentsReducer,
    performedRiskAssessments: performedRiskAssessmentsReducer,
    incidentNotifications:    incidentNotificationsReducer,
    startInvestigations:      startInvestigationsReducer,
    hsaChecklist:             hsaChecklistReducer,
    wir:                      wirReducer,
    tc:                       tcReducer,
    ep:                       epReducer,
    ppeCompliance:            ppeComplianceReducer,
    cs:                       csReducer,
    mrm:                      mrmReducer,
    capa:                     capaReducer,
  },
  // Redux Toolkit adds redux-thunk and (in development) the Immer proxy by default.
  // The devTools flag is automatically false in production builds.
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
