import { useState } from "react";
import "./DashboardHeader.css";
import logo from "@assets/logo-insitel.png"; // Assuming @assets is configured in your build path
import { useAuth } from "@contexts/AuthContext"; // Assuming @contexts is configured
import { useNavigate } from "react-router-dom";

function DashboardHeader() {
  const auth = useAuth();
  const [nombreEmpleado] = useState(auth.user.nombres); // Removed setNombreEmpleado
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    await auth.logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <header>
        <div className="company_section">
          <img className="company_logo" src={logo} alt="Insitel Logo" />
          <span className="company_name">Insitel</span>
        </div>

        <div className="separador"></div>

        <div className="user_section" onClick={toggleDropdown}>
          {/* The button around user_foto can be part of the clickable area or styled as part of the name */}
          <div className="info_cuenta_button_container">
            {" "}
            {/* Wrapped button to prevent nested interactive elements if info_cuenta_button was a button tag */}
            <img className="user_foto" src={null} alt="User" />{" "}
            {/* Assuming user_foto is an img, if it was a button, it should be div or span */}
          </div>
          <span className="user_name">
            {nombreEmpleado} <span className="dropdown-arrow-icon">▼</span>
          </span>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <a href="/profile" className="dropdown-item">
                Profile
              </a>
              <a href="/settings" className="dropdown-item">
                Settings
              </a>
              <button
                onClick={handleLogout}
                className="dropdown-item logout-button"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export { DashboardHeader };
