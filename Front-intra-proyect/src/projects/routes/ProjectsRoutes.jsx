import { Route, Routes } from "react-router-dom";
import { Projects } from "@projects/pages/ProjectsTable/Projects";
import { CreateProyects } from "../pages/CreateProjects/CreateProjectsv2";
import { FormsRoutes } from "../../forms/routes/FormsRoutes";

export const ProjectsRoutes = () => (
  <Routes>
    <Route path="/:area" element={<Projects />}>
      <Route path=":id_proyecto/*" element={<FormsRoutes />} />
    </Route>
    <Route path="/:area/create" element={<CreateProyects />} />
  </Routes>
);
