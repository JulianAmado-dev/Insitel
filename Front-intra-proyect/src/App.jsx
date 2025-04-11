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
/* Fundamentos de JavaScript ES6+
Destructuring
Async/Await y Promesas
Módulos (import/export)
Métodos de arrays (map, filter, reduce)

React Core Concepts
Hooks 
Props y State Management : props left
Manejo de formularios controlados/no controlados
Listas y keys 

Autenticación y Seguridad
localStorage/sessionStorage
Protección de rutas privadas

Gestión de Estado Avanzada
Redux (Opcional, pero útil para proyectos grandes)
Librerías como Formik para formularios complejos 

 Estilos y UI
CSS Modules o Styled Components
Librerías UI (Material-UI, Ant Design)
Diseño responsivo 

 Integración con Backend
Consumo de APIs REST
Manejo de archivos (subida/descarga) 

 Arquitectura del Proyecto
Estructura de carpetas (components, pages, services, etc.)
Buenas prácticas de organización de código
Convenciones de nombrado 

 Herramientas Adicionales
Git para control de versiones
Webpack/Babel (Entender cómo funciona Create-React-App)
Testing (Jest, React Testing Library) */

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />}/>
            <Route path="/unauthorized" element={<UnauthorizedPage />}/>
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/auth/*" element={<AuthRoutes />} />

            <Route path="/dashboard" element={<DashboardDeploy />}>
              <Route path="projects/*" element={<ProjectsRoutes />} />
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
