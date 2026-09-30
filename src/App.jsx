import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import EmployeeList from './pages/hr/employees/EmployeeList';
import EmployeeProfile from './pages/hr/employees/EmployeeProfile';
import LeaveManagement from './pages/hr/leave/LeaveManagement';
import Recruitment from './pages/hr/recruitment/Recruitment';
import Deployment from './pages/hr/deployment/Deployment';
import TrainingCertifications from './pages/hr/training/TrainingCertifications';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import {
  RecruitmentPage,
  DeploymentPage,
  TrainingCertificationsPage,
} from './pages/hr/PlaceholderPage';
import Onboarding from './pages/hr/onboarding/Onboarding';
import PayrollInputs from './pages/hr/payroll/PayrollInputs';
import GrievancesDiscipline from './pages/hr/grievances/GrievancesDiscipline';
import AttendanceTimesheets from './pages/hr/attendance/AttendanceTimesheets';
import HRDocuments from './pages/hr/documents/HRDocuments';
import Tasks from './pages/hr/tasks/Tasks';
import Reports from './pages/hr/reports/Reports';
import Requests from './pages/hr/requests/Requests';
import OffshoreTravelDocuments from './pages/hse/OffshoreTravelDocuments';
import EmergencyPreparedness from './pages/hse/EmergencyPreparedness';
import HSETasks from './pages/hse/HSETasks';
import HSEDocuments from './pages/hse/HSEDocuments';
import HSEReports from './pages/hse/HSEReports';
import TechnicalProjects from './pages/technical/TechnicalProjects';
import ProjectDetail from './pages/technical/ProjectDetail';
import EngineeringDocuments from './pages/technical/EngineeringDocuments';
import CalibrationRecords from './pages/technical/CalibrationRecords';
import ResourceAllocation from './pages/technical/ResourceAllocation';
import TechnicalTasks from './pages/technical/TechnicalTasks';
import TechnicalReports from './pages/technical/TechnicalReports';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverview />} />

        {/* HR Module Routes */}
        <Route path="hr">
          <Route index element={<Navigate to="/hr/employees" replace />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeProfile />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="deployment" element={<Deployment />} />
          <Route path="certifications" element={<TrainingCertifications />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="attendance" element={<AttendanceTimesheets />} />
          <Route path="payroll" element={<PayrollInputs />} />
          <Route path="grievances" element={<GrievancesDiscipline />} />
          <Route path="requests" element={<Requests />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="documents" element={<HRDocuments />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* HSE Module Routes */}
        <Route path="hse">
          <Route index element={<Navigate to="/hse/offshore-travel" replace />} />
          <Route path="offshore-travel" element={<OffshoreTravelDocuments />} />
          <Route path="emergency" element={<EmergencyPreparedness />} />
          <Route path="tasks" element={<HSETasks />} />
          <Route path="documents" element={<HSEDocuments />} />
          <Route path="reports" element={<HSEReports />} />
        </Route>

        {/* Technical Module Routes */}
        <Route path="technical">
          <Route index element={<Navigate to="/technical/projects" replace />} />
          <Route path="projects" element={<TechnicalProjects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="engineering-docs" element={<EngineeringDocuments />} />
          <Route path="calibration" element={<CalibrationRecords />} />
          <Route path="resources" element={<ResourceAllocation />} />
          <Route path="tasks" element={<TechnicalTasks />} />
          <Route path="reports" element={<TechnicalReports />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/hr/employees" replace />} />
      </Route>
    </Routes>
  );
}
