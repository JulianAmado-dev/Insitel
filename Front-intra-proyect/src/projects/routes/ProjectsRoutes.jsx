import { Route, Routes } from "react-router-dom";
import { Projects } from "@projects/pages/ProjectsTable/Projects";
import { CreateProyects } from "../pages/CreateProjects/CreateProjectsv2";

export const ProjectsRoutes = () => (
  <Routes>
    <Route path="/:area" element={<Projects />} />
    <Route path="/:area/create" element={<CreateProyects />} />
  </Routes>
);
