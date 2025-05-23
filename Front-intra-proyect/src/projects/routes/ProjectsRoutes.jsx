import { Route, Routes } from "react-router-dom";
import { Projects } from "@projects/pages/ProjectsTable/Projects";
import { CreateProyects } from "../pages/CreateProjects/CreateProjectsv2";
import { FormsRoutes } from "../../forms/routes/FormsRoutes";

export const ProjectsRoutes = () => (
  <Routes>
    <Route path="/Home" element={<Projects />} />
    <Route path="/Proyectos" element={<Projects />}>
      <Route path=":id_proyecto/*" element={<FormsRoutes />} />
    </Route>
    <Route path="/create/project" element={<CreateProyects />} />
  </Routes>
);
