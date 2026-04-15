import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import StudentForm from "./pages/StudentForm";
import Teams from "./pages/Teams";
import TeamForm from "./pages/TeamForm";
import TeamDetail from "./pages/TeamDetail";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import ReportView from "./pages/ReportView";
import ReportNew from "./pages/ReportNew";
import ReportNewPreview from "./pages/ReportNewPreview";
import ReportBatch from "./pages/ReportBatch";
import ChartOverview from "./pages/ChartOverview";
import Templates from "./pages/Templates";
import TemplateCategories from "./pages/TemplateCategories";
import CourseForm from "./pages/CourseForm";
import CourseDetail from "./pages/CourseDetail";
import ActionForm from "./pages/ActionForm";
import Accounts from "./pages/Accounts";
import AddAccount from "./pages/AddAccount";
import AccountDetail from "./pages/AccountDetail";
import AuditLogs from "./pages/AuditLogs";
import RolePermissions from "./pages/RolePermissions";
import Upload from "./pages/Upload";
import Comparison from "./pages/Comparison";
import DataConfig from "./pages/DataConfig";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import PersonalTemplates from "./pages/PersonalTemplates";
import PersonalCourseForm from "./pages/PersonalCourseForm";
import PersonalTemplateCategories from "./pages/PersonalTemplateCategories";
import TrainingRecords from "./pages/TrainingRecords";
import FirstLoginPasswordChange from "./pages/FirstLoginPasswordChange";
import NotFound from "./pages/NotFound";
import { SidebarContext } from "./contexts/SidebarContext";
import { AuthProvider } from "./contexts/AuthContext";
import { TrainingDataProvider } from "./contexts/TrainingDataContext";
import { AccountsProvider } from "./contexts/AccountsContext";
import { StudentsProvider } from "./contexts/StudentsContext";
import { TeamsProvider } from "./contexts/TeamsContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <TrainingDataProvider>
              <AccountsProvider>
                <StudentsProvider>
                  <TeamsProvider>
                    <NotificationsProvider>
                    <SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
                      <Toaster />
                    <Sonner />
                    <BrowserRouter basename={import.meta.env.BASE_URL}>
                      <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/first-login" element={<ProtectedRoute><FirstLoginPasswordChange /></ProtectedRoute>} />
                        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                        <Route path="/students/add" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
                        <Route path="/students/:studentId" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
                        <Route path="/students/:studentId/edit" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
                        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
                        <Route path="/teams/add" element={<ProtectedRoute><TeamForm /></ProtectedRoute>} />
                        <Route path="/teams/:teamId" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
                        <Route path="/teams/:teamId/edit" element={<ProtectedRoute><TeamForm /></ProtectedRoute>} />
                        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                        <Route path="/schedule/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                        <Route path="/training-records" element={<ProtectedRoute><TrainingRecords /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                        <Route path="/reports/new" element={<ProtectedRoute><ReportNew /></ProtectedRoute>} />
                        <Route path="/reports/new/preview" element={<ProtectedRoute><ReportNewPreview /></ProtectedRoute>} />
                        <Route path="/reports/batch" element={<ProtectedRoute><ReportBatch /></ProtectedRoute>} />
                        <Route path="/reports/:reportId" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
                        <Route path="/chart-overview" element={<ProtectedRoute><ChartOverview /></ProtectedRoute>} />
                        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                        <Route path="/templates/categories/:type" element={<ProtectedRoute><TemplateCategories /></ProtectedRoute>} />
                        <Route path="/templates/course/add" element={<ProtectedRoute><CourseForm /></ProtectedRoute>} />
                        <Route path="/templates/course/:courseId" element={<ProtectedRoute><CourseForm /></ProtectedRoute>} />
                        <Route path="/templates/action/add" element={<ProtectedRoute><ActionForm /></ProtectedRoute>} />
                        <Route path="/templates/action/:actionId" element={<ProtectedRoute><ActionForm /></ProtectedRoute>} />
                        <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                        <Route path="/accounts/add" element={<ProtectedRoute><AddAccount /></ProtectedRoute>} />
                        <Route path="/accounts/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
                        <Route path="/accounts/:accountId" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
                        <Route path="/accounts/roles/:roleId" element={<ProtectedRoute><RolePermissions /></ProtectedRoute>} />
                        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                        <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
                        <Route path="/data-config" element={<ProtectedRoute><DataConfig /></ProtectedRoute>} />
                        <Route path="/personal-templates" element={<ProtectedRoute><PersonalTemplates /></ProtectedRoute>} />
                        <Route path="/personal-templates/add" element={<ProtectedRoute><PersonalCourseForm /></ProtectedRoute>} />
                        <Route path="/personal-templates/categories" element={<ProtectedRoute><PersonalTemplateCategories /></ProtectedRoute>} />
                        <Route path="/personal-templates/:courseId" element={<ProtectedRoute><PersonalCourseForm /></ProtectedRoute>} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                    </SidebarContext.Provider>
                    </NotificationsProvider>
                  </TeamsProvider>
                </StudentsProvider>
              </AccountsProvider>
            </TrainingDataProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
