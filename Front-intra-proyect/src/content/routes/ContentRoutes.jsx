import { Routes, Route } from "react-router-dom";
import { DashboardContent } from "@content/pages/DashboardContent";

export const ContentRoutes = () => {
  <Routes>
    <Route path="/main" element={<DashboardContent />} />
  </Routes>;
};
