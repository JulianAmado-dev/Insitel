import { useState } from "react";
import "./DashboardHeader.css";
import logo from "@assets/logo-insitel.png";
import { useAuth } from "@contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function DashboardHeader() {
  const [nombreEmpleado, setNombreEmpleado] = useState("Julian");
  const auth = useAuth();
  const navigate = useNavigate();
  setNombreEmpleado;
  return (
    <>
      <header>
        <div className="company_section">
          <img className="company_logo" src={logo} alt="" />
          <span className="company_name">Insitel</span>
        </div>

        <div className="separador"></div>

        <div className="user_section">
          <span className="user_name">{nombreEmpleado}</span>
          <button className="info_cuenta_button">
            <img className="user_foto" src={null} alt="" />
          </button>
          <button
            onClick={async () => {
              await auth.logout();
              navigate("/", { replace: true });
            }}
          >
            ...
          </button>
        </div>
      </header>
    </>
  );
}

export { DashboardHeader };
