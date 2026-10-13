import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import dashboardReducer from './dashboard/dashboardSlice';
import employeesReducer from './hr/employeesSlice';
import leaveReducer from './hr/leaveSlice';
import attendanceReducer from './hr/attendanceSlice';
import recruitmentReducer from './hr/recruitmentSlice';
import onboardingReducer from './hr/onboardingSlice';
import deploymentReducer from './hr/deploymentSlice';
import trainingReducer from './hr/trainingSlice';
import payrollReducer from './hr/payrollSlice';
import grievanceReducer from './hr/grievanceSlice';
import usersReducer from './platform/usersSlice';
import notificationsReducer from './notifications/notificationsSlice';

// Any `src/store/<area>/reducers.js` that default-exports an object of reducers is registered
// automatically, so a module can add its slices without editing this file.
const moduleReducers = Object.values(
  import.meta.glob('./*/reducers.js', { eager: true, import: 'default' }),
).reduce((all, reducers) => ({ ...all, ...reducers }), {});

const store = configureStore({
  reducer: {
    ...moduleReducers,
    auth: authReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    employees: employeesReducer,
    leave: leaveReducer,
    attendance: attendanceReducer,
    recruitment: recruitmentReducer,
    onboarding: onboardingReducer,
    deployments: deploymentReducer,
    training: trainingReducer,
    payroll: payrollReducer,
    grievance: grievanceReducer,
    users: usersReducer,
    notifications: notificationsReducer,
  },
});

export default store;
