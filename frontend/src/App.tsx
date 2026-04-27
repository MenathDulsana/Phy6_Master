import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Classes from "./pages/Classes";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import StudentLayout from "./components/StudentLayout";
import Dashboard from "./pages/student/Dashboard";
import StudentClasses from "./pages/student/Classes";
import Schedule from "./pages/student/Schedule";
import SettingsPage from "./pages/student/Settings";
import QuizGame from "./pages/student/QuizGame";
import QuizSelection from "./pages/student/QuizSelection";
import QuizDetails from "./pages/student/QuizDetails";
import TuteRequests from "./pages/student/TuteRequests";
import TeacherDashboard from "./pages/teacher/Dashboard";
import Students from "./pages/teacher/Students";
import ClassManagement from "./pages/teacher/ClassManagement";
import TeacherQuizzes from "./pages/teacher/Quizzes";
import ContentUpload from "./pages/teacher/ContentUpload";
import Timetable from "./pages/teacher/Timetable";
import Announcements from "./pages/teacher/Announcements";
import TeacherLayout from "./components/TeacherLayout";
import NotFound from "./pages/NotFound";
import PaymentPage from "./pages/student/PaymentPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import Chatbot from "./pages/student/Chatbot";
import AccountantLayout from "./components/AccountantLayout";
import PendingPaymentsList from "./pages/accountant/PendingPaymentsList";
import PaymentVerificationDetail from "./pages/accountant/PaymentVerificationDetail";
import PaymentHistory from "./pages/accountant/PaymentHistory";
import MonthlyFinancialReport from "./pages/accountant/MonthlyFinancialReport";
import AccountantDashboard from "./pages/accountant/Dashboard";
import AccountantProfile from "./pages/accountant/AccountantProfile";
import PaymentSuccessPage from "./pages/student/PaymentSuccessPage";
import PaymentCancelPage from "./pages/student/PaymentCancelPage";
import TuteManagerLayout from "./components/TuteManagerLayout";
import TuteDashboard from "./pages/tute/Dashboard";
import IncomingRequests from "./pages/tute/IncomingRequests";
import ActiveRequests from "./pages/tute/ActiveRequests";
import DeliveryRecords from "./pages/tute/DeliveryRecords";
import DeclinedRequests from "./pages/tute/DeclinedRequests";
import TuteProfileSettings from "./pages/tute/ProfileSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,                // data is immediately stale → refetch on every mount
      gcTime: 0,                   // don't keep stale cache entries after unmount
      refetchOnMount: "always",    // always refetch when component mounts (even if data exists)
      refetchOnWindowFocus: true,  // refetch when user tabs back / focuses window
      retry: 2,                    // retry failed requests twice before giving up
    },
  },
});

const App = () => {
  useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="classes" element={<ClassManagement />} />
              <Route path="quizzes" element={<TeacherQuizzes />} />
              <Route path="content" element={<ContentUpload />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="announcements" element={<Announcements />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            <Route path="/student/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/student/payment-cancel" element={<PaymentCancelPage />} />
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="classes" element={<StudentClasses />} />
              <Route path="tute-requests" element={<TuteRequests />} />
              <Route path="classes/:classId/payment" element={<PaymentPage />} />
              <Route path="quizzes" element={<QuizSelection />} />
              <Route path="quizzes/:quizId" element={<QuizDetails />} />
              <Route path="quizzes/:quizId/play" element={<QuizGame />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="chatbot" element={<Chatbot />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/accountant" element={<AccountantLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AccountantDashboard />} />
              <Route path="profile" element={<AccountantProfile />} />
              <Route path="payments" element={<PendingPaymentsList />} />
              <Route path="payments/history" element={<PaymentHistory />} />
              <Route path="payments/:paymentId" element={<PaymentVerificationDetail />} />
              <Route path="reports/monthly" element={<MonthlyFinancialReport />} />
            </Route>
            <Route path="/tute" element={<TuteManagerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TuteDashboard />} />
              <Route path="incoming-requests" element={<IncomingRequests />} />
              <Route path="active-requests" element={<ActiveRequests />} />
              <Route path="declined-requests" element={<DeclinedRequests />} />
              <Route path="delivery-records" element={<DeliveryRecords />} />
              <Route path="profile-settings" element={<TuteProfileSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
