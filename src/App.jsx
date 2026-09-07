import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import EmployeeList from './pages/hr/employees/EmployeeList';
import EmployeeProfile from './pages/hr/employees/EmployeeProfile';
import LeaveManagement from './pages/hr/leave/LeaveManagement';
import Recruitment from './pages/hr/recruitment/Recruitment';
import Deployment from './pages/hr/deployment/Deployment';
import TrainingCertifications from './pages/hr/training/TrainingCertifications';
import {
  DashboardPage,
  RecruitmentPage,
  OnboardingPage,
  DeploymentPage,
  TrainingCertificationsPage,
  AttendanceTimesheetsPage,
  PayrollInputsPage,
  GrievancesDisciplinePage,
  RequestsPage,
  TasksPage,
  HRDocumentsPage,
  ReportsPage,
} from './pages/hr/PlaceholderPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/hr/employees" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* HR Module Routes */}
        <Route path="hr">
          <Route index element={<Navigate to="/hr/employees" replace />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeProfile />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="deployment" element={<Deployment />} />
          <Route path="certifications" element={<TrainingCertifications />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="attendance" element={<AttendanceTimesheetsPage />} />
          <Route path="payroll" element={<PayrollInputsPage />} />
          <Route path="grievances" element={<GrievancesDisciplinePage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="documents" element={<HRDocumentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/hr/employees" replace />} />
      </Route>
    </Routes>
  );
}
