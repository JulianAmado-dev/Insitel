import { Route, Routes } from "react-router-dom";
import { Projects } from "@projects/pages/ProjectsTable/Projects";
import { CreateProyects } from "../pages/CreateProjects/CreateProjectsv2";
import { FormsRoutes } from "../../forms/routes/FormsRoutes";
import { LeccionesAprendidas } from "@projects/pages/LeccionesAprendidas/LeccionesAprendidas.jsx";

export const ProjectsRoutes = () => (
  <Routes>
    <Route path="/Home" element={<Projects />} />
    <Route path="/Lecciones-aprendidas" element={<LeccionesAprendidas />} />
    <Route path="/Proyectos" element={<Projects />}>
      <Route path=":id_proyecto/*" element={<FormsRoutes />} />
    </Route>
    <Route path="/create/project" element={<CreateProyects />} />
  </Routes>
);
