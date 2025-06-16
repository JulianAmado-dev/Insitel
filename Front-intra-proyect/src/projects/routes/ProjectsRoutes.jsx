import { Route, Routes } from "react-router-dom";
import { Projects } from "@projects/pages/ProjectsTable/Projects";
import { CreateProyects } from "../pages/CreateProjects/CreateProjectsv2";
import { FormsRoutes } from "../../forms/routes/FormsRoutes";
import { LeccionesAprendidas } from "@projects/pages/LeccionesAprendidas/LeccionesAprendidas.jsx";
import { FormularioRiesgos } from "../../forms/pages/FormularioRiesgos/FormularioRiesgos";

export const ProjectsRoutes = () => (
  <Routes>
    <Route path="/Home" element={<Projects />} />
    <Route path="/Lecciones-aprendidas" element={<LeccionesAprendidas />} />
    <Route path="/Riesgos" element={<FormularioRiesgos />} />
    <Route path="/Proyectos" element={<Projects />}>
      <Route path=":id_proyecto/*" element={<FormsRoutes />} />
    </Route>
    <Route path="/create/project" element={<CreateProyects />} />
  </Routes>
);
