import "@styles/App.css";
import { DashboardDeploy } from "@layouts/DashboardLayaout";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthRoutes } from "@auth/routes/AuthRoutes";
import { ProjectsRoutes } from "@projects/routes/ProjectsRoutes";
import { DashboardContent } from "@content/pages/DashboardContent";
import { UserRegistration } from "@employees/pages/UserRegistration";
import { AuthProvider } from "@contexts/AuthContext";
import LandingPage from "./common/pages/LandingPage/pages/LandingPage";
import NotFoundPage from "./common/pages/NotFound/NotFound";
import { PrivateRoute } from "./common/components/PrivateRoute";
import UnauthorizedPage from "./common/pages/UnAuthorized/UnAuthorized";

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/auth/*" element={<AuthRoutes />} />

            <Route path="/dashboard" element={<DashboardDeploy />}>
              <Route path=":area/*" element={<ProjectsRoutes />} />
              <Route path="content/*" element={<DashboardContent />} />
              <Route
                path="create-employees/*"
                element={
                  <PrivateRoute requiredRol="admin">
                    <UserRegistration />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export { App };
