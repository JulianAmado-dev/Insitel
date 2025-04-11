import "./DashboardSidebar.css";
import logo_insitel from "@assets/logo-insitel.png";
import logo_sigar from "@assets/logo-sigar.jpg";
import { useState } from "react";
import { ChevronRight, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "@contexts/ThemeProvider/ThemeProvider";
import { useNavigate } from "react-router-dom";
import {useAuth} from'@contexts/AuthContext'

const departments = [
  {
    id: 1,
    name: "I+D",
    priority: 1,
    projects: { id: 1, name: "Proyectos", priority: 1 },
    risks: { id: 1, title: "Riesgos" },
    Learned_lessons: { id: 1, title: "Lecciones aprendidas" },
    department_logo: logo_sigar,
  },
  {
    id: 4,
    name: "Operaciones",
    priority: 4,
    projects: { id: 3, name: "Proyectos", priority: 1 },
    risks: { id: 2, title: "Riesgos" },
    Learned_lessons: { id: 2, title: "Lecciones aprendidas" },
    department_logo: logo_insitel,
  },
];

// eslint-disable-next-line react/prop-types
function DashboardSidebar({ isExpanded, setIsExpanded }) {
  const [activeDepartment, setActiveDepartment] = useState(0);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`sidebar ${isExpanded ? "sidebar--expanded" : ""}`}>
      {/* Header */}
      <div className="sidebar_header">
        {isExpanded && <span className="sidebar_title">Departamento IT</span>}
        <button
          className="sidebar_toggle"
          onClick={(event) => {
            event.preventDefault();
            setActiveDepartment(0);
            setIsExpanded(!isExpanded);
          }}
        >
          <ChevronRight
            className={`sidebar__toggle-icon ${
              isExpanded ? "sidebar__toggle-icon--rotated" : ""
            }`}
          />
        </button>
      </div>
      {/* Content */}
      <div className="sidebar__content">
        <div className="sidebar__departments">
          {departments.map((department) => (
            <div key={department.id}>
              <button
                className="sidebar__project-button"
                onClick={(event) => {
                  event.preventDefault();
                  if (activeDepartment === department.id) {
                    setActiveDepartment(0);
                  } else {
                    setActiveDepartment(department.id);
                  }
                }}
              >
                {isExpanded && (
                  <div>
                    <span>{department.name}</span>
                  </div>
                )}
                <img
                  src={department.department_logo}
                  alt="icono de departamento"
                  className="department_icon"
                />
                {isExpanded && (
                  <>
                    <ChevronRight
                      className={`sidebar__chevron ${
                        activeDepartment === department.id
                          ? "sidebar__chevron--rotated"
                          : ""
                      }`}
                    />
                  </>
                )}
              </button>
              {activeDepartment === department.id && isExpanded && (
                <>
                  <div className="sidebar__subprojects">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`projects/${department.name}`);
                      }}
                      className="sidebar__subproject-button"
                    >
                      <span>{department.projects.name}</span>
                    </button>
                    <button className="sidebar__subproject-button">
                      <span>{department.risks.title}</span>
                    </button>
                    <button className="sidebar__subproject-button">
                      <span>{department.Learned_lessons.title}</span>
                    </button>
                  </div>
                  <button
                    className="create_proyect"
                    onClick={() => {
                      navigate(`projects/${department.name}/create`);
                    }}
                  >
                    <img src={null} alt="" />
                    <p>+ Crear Proyecto</p>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="create_user_button">
          <button></button>
        </div>
      </div>

      {/* footer */}
      <div className="sidebar__footer">
        <button
          className="sidebar__icon-button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <>
              <Moon className="sidebar__icon" />
              {isExpanded && <span>Modo Oscuro</span>}
            </>
          ) : (
            <>
              <Sun className="sidebar__icon" />
              {isExpanded && <span>Modo Claro</span>}
            </>
          )}
        </button>
        <button className="sidebar__icon-button">
          <Settings className="sidebar__icon" />
          {isExpanded && <span>Ajustes</span>}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            navigate('create-employees')
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export { DashboardSidebar };
