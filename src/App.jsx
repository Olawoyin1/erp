import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser, setBootstrapping } from './store/authSlice';
import { getAccessToken, getRefreshToken } from './services/apiClient';
import RequireAuth from './components/auth/RequireAuth';
import NotFound from './components/auth/NotFound';
import { SectionIndex, LandingRedirect } from './components/auth/RouteGate';
import ForceChangePassword from './pages/auth/ForceChangePassword';
import NotificationsPage from './pages/notifications/NotificationsPage';

// ─── Auth Pages ───────────────────────────────────────────────────────────────
import Login from './pages/auth/Login';
import SetupPassword from './pages/auth/SetupPassword';
import VerifyIdentity from './pages/auth/VerifyIdentity';
import ForgotPassword from './pages/auth/ForgotPassword';
import CheckEmail from './pages/auth/CheckEmail';
import CreateNewPassword from './pages/auth/CreateNewPassword';
import PasswordResetSuccess from './pages/auth/PasswordResetSuccess';
import AccountSetupComplete from './pages/auth/AccountSetupComplete';
import Layout from './components/layout/Layout';
import EmployeeList from './pages/hr/employees/EmployeeList';
import EmployeeProfile from './pages/hr/employees/EmployeeProfile';
import LeaveManagement from './pages/hr/leave/LeaveManagement';
import Recruitment from './pages/hr/recruitment/Recruitment';
import Deployment from './pages/hr/deployment/Deployment';
import TrainingCertifications from './pages/hr/training/TrainingCertifications';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import Onboarding from './pages/hr/onboarding/Onboarding';
import PayrollInputs from './pages/hr/payroll/PayrollInputs';
import GrievancesDiscipline from './pages/hr/grievances/GrievancesDiscipline';
import AttendanceTimesheets from './pages/hr/attendance/AttendanceTimesheets';
import HRDocuments from './pages/hr/documents/HRDocuments';
import Tasks from './pages/hr/tasks/Tasks';
import Settings from './pages/settings/Settings';
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
import AdministrativeRequests from './pages/administration/AdministrativeRequests';
import AssetSupplies from './pages/administration/AssetSupplies';
import Documents from './pages/administration/Documents';
import EDMS from './pages/administration/EDMS';
import FacilityMaintenance from './pages/administration/FacilityMaintenance';
import Memos from './pages/administration/Memos';
import AdminReports from './pages/administration/AdminReports';
import AdminTasks from './pages/administration/AdminTasks';
import TravelsLogistics from './pages/administration/TravelsLogistics';
import WasteDisposal from './pages/administration/WasteDisposal';

import ClientPipeline from './pages/bizdev/ClientPipeline';
import RFQsTenders from './pages/bizdev/RFQsTenders';
import Proposals from './pages/bizdev/Proposals';
import CRMContacts from './pages/bizdev/CRMContacts';
import PurchaseRequests from './pages/procurement/PurchaseRequests';
import RFQManagement from './pages/procurement/RFQManagement';
import PurchaseOrders from './pages/procurement/PurchaseOrders';
import ExpeditingDelivery from './pages/procurement/ExpeditingDelivery';
import VendorManagement from './pages/procurement/VendorManagement';
import InventoryStore from './pages/procurement/InventoryStore';
import ProcurementTasks from './pages/procurement/ProcurementTasks';
import ProcurementDocuments from './pages/procurement/ProcurementDocuments';
import ProcurementReports from './pages/procurement/ProcurementReports';

import GeneralLedger from './pages/finance/GeneralLedger';
import BudgetingForecasting from './pages/finance/BudgetingForecasting';
import AccountsPayableReceivable from './pages/finance/AccountsPayableReceivable';
import Invoicing from './pages/finance/Invoicing';
import ContractsClaimsManagement from './pages/finance/ContractsClaimsManagement';
import CommercialRisksInsurance from './pages/finance/CommercialRisksInsurance';
import BankReconciliation from './pages/finance/BankReconciliation';
import TaxManagement from './pages/finance/TaxManagement';
import FinanceForms from './pages/finance/FinanceForms';
import FinanceTasks from './pages/finance/FinanceTasks';
import FinanceReports from './pages/finance/FinanceReports';

import UserManagement from './pages/users/UserManagement';
import RolesPermissions from './pages/roles/RolesPermissions';

import AuditManagement from './pages/quality/AuditManagement';
import QualityCalibrationRecords from './pages/quality/CalibrationRecords';
import MaterialsInspection from './pages/quality/MaterialsInspection';
import QualityTasks from './pages/quality/QualityTasks';
import QMSDocuments from './pages/quality/QMSDocuments';
import QualityReports from './pages/quality/QualityReports';

export default function App() {
  const dispatch = useDispatch();

  // On mount restore the session: from this tab's access token, or (new tab) from the stored refresh token
  useEffect(() => {
    if (getAccessToken() || getRefreshToken()) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(setBootstrapping(false));
    }
  }, [dispatch]);

  return (
    <Routes>
      {/* ─── Auth Routes (outside the main layout) ─── */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/setup-password" element={<SetupPassword />} />
      {/* Links inside the emails the server sends */}
      <Route path="/accept-invite" element={<SetupPassword />} />
      <Route path="/reset-password" element={<CreateNewPassword />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
      <Route path="/auth/change-password" element={<RequireAuth><ForceChangePassword /></RequireAuth>} />
      <Route path="/auth/verify" element={<VerifyIdentity />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/check-email" element={<CheckEmail />} />
      <Route path="/auth/reset-password" element={<CreateNewPassword />} />
      <Route path="/auth/password-reset-success" element={<PasswordResetSuccess />} />
      <Route path="/auth/setup-complete" element={<AccountSetupComplete />} />

      {/* ─── Protected App Routes ─── */}
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<LandingRedirect />} />
        <Route path="dashboard" element={<DashboardOverview />} />

        {/* HR Module Routes */}
        <Route path="hr">
          <Route index element={<SectionIndex base="/hr" />} />
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
          <Route index element={<SectionIndex base="/hse" />} />
          <Route path="offshore-travel" element={<OffshoreTravelDocuments />} />
          <Route path="emergency" element={<EmergencyPreparedness />} />
          <Route path="tasks" element={<HSETasks />} />
          <Route path="documents" element={<HSEDocuments />} />
          <Route path="reports" element={<HSEReports />} />
        </Route>

        {/* Technical Module Routes */}
        <Route path="technical">
          <Route index element={<SectionIndex base="/technical" />} />
          <Route path="projects" element={<TechnicalProjects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="engineering-docs" element={<EngineeringDocuments />} />
          <Route path="calibration" element={<CalibrationRecords />} />
          <Route path="resources" element={<ResourceAllocation />} />
          <Route path="tasks" element={<TechnicalTasks />} />
          <Route path="reports" element={<TechnicalReports />} />
        </Route>

        {/* Administration Module Routes */}
        <Route path="administration">
          <Route index element={<SectionIndex base="/administration" />} />
          <Route path="requests" element={<AdministrativeRequests />} />
          <Route path="assets" element={<AssetSupplies />} />
          <Route path="documents" element={<Documents />} />
          <Route path="edms" element={<EDMS />} />
          <Route path="maintenance" element={<FacilityMaintenance />} />
          <Route path="memos" element={<Memos />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="travels" element={<TravelsLogistics />} />
          <Route path="waste" element={<WasteDisposal />} />
        </Route>

        {/* Business Development Module Routes */}
        <Route path="bizdev">
          <Route index element={<SectionIndex base="/bizdev" />} />
          <Route path="pipeline" element={<ClientPipeline />} />
          <Route path="tenders" element={<RFQsTenders />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="crm" element={<CRMContacts />} />
        </Route>

        {/* Procurement Module Routes */}
        <Route path="procurement">
          <Route index element={<SectionIndex base="/procurement" />} />
          <Route path="requests" element={<PurchaseRequests />} />
          <Route path="rfq" element={<RFQManagement />} />
          <Route path="orders" element={<PurchaseOrders />} />
          <Route path="expediting" element={<ExpeditingDelivery />} />
          <Route path="vendors" element={<VendorManagement />} />
          <Route path="inventory" element={<InventoryStore />} />
          <Route path="tasks" element={<ProcurementTasks />} />
          <Route path="documents" element={<ProcurementDocuments />} />
          <Route path="reports" element={<ProcurementReports />} />
        </Route>

        {/* Accounts & Finance Module Routes */}
        <Route path="finance">
          <Route index element={<SectionIndex base="/finance" />} />
          <Route path="ledger" element={<GeneralLedger />} />
          <Route path="budget" element={<BudgetingForecasting />} />
          <Route path="ap-ar" element={<AccountsPayableReceivable />} />
          <Route path="invoicing" element={<Invoicing />} />
          <Route path="contracts-claims" element={<ContractsClaimsManagement />} />
          <Route path="risks-insurance" element={<CommercialRisksInsurance />} />
          <Route path="bank-reconciliation" element={<BankReconciliation />} />
          <Route path="tax" element={<TaxManagement />} />
          <Route path="forms" element={<FinanceForms />} />
          <Route path="tasks" element={<FinanceTasks />} />
          <Route path="reports" element={<FinanceReports />} />
        </Route>

        {/* Quality System (Compliance) Module Routes */}
        <Route path="quality">
          <Route index element={<SectionIndex base="/quality" />} />
          <Route path="audits" element={<AuditManagement />} />
          <Route path="calibration" element={<QualityCalibrationRecords />} />
          <Route path="inspections" element={<MaterialsInspection />} />
          <Route path="tasks" element={<QualityTasks />} />
          <Route path="documents" element={<QMSDocuments />} />
          <Route path="reports" element={<QualityReports />} />
        </Route>

        {/* User Management & Roles */}
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<RolesPermissions />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<NotificationsPage />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
