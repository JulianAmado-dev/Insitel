import { useState } from "react";
import "./DashboardModule.css";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { DashboardHeader } from "@layouts/components/header/DashboardHeader.jsx";
import { DashboardSidebar } from "@layouts/components/sideBar/DashboardSidebar.jsx";
import { useAuth } from "@contexts/AuthContext";

function DashboardDeploy() {
  const [isExpanded, setIsExpanded] = useState(false);
  const auth = useAuth();
  const location = useLocation();

  console.log(auth);
  if(auth.loading === true){
    return <div>cargando...</div>
  }
  if (auth.isAuthenticated === false) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace={true} />;
  }
  return (
    <div className="shell">
      <DashboardSidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <div className="mainContent">
        <DashboardHeader />
        <Outlet />
      </div>
    </div>
  );
}
export { DashboardDeploy };
