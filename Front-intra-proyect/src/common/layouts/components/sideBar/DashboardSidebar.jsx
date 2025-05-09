import "./DashboardSidebar.css";
import logo_insitel from "@assets/logo-insitel.png";
import logo_sigar from "@assets/logo-sigar.jpg";
import { useEffect, useState } from "react";
import { ChevronRight, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "@contexts/ThemeProvider/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@api/AxiosInstance";

/* import {useAuth} from'@contexts/AuthContext' */

/* const departments = [
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
]; */

function DashboardSidebar({ isExpanded, setIsExpanded }) {
  const [activeDepartment, setActiveDepartment] = useState(0);
  // Initialize with empty arrays - this is crucial for avoiding the .map() error
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  // Add loading and error states to improve user experience
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // useEffect ensures this only runs after component mounts and prevents infinite re-renders
  useEffect(() => {
    // Define an async function to fetch data
    const obtenerSideBar = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        console.log("Fetching departments data...");

        // Using await instead of Promise chains for cleaner code
        const { data } = await axiosInstance.get(
          "http://localhost:3001/api/getDepartments"
        );

        // Debugging information
        console.log("Data received from API:", data);
        console.log("Areas:", data.areas);
        console.log("AreasItems:", data.areasItems);

        // Validate data structure - this prevents map errors
        if (Array.isArray(data.areas)) {
          setDepartments(data.areas);
        } else {
          console.error(
            "API data structure issue: data.areas is not an array",
            data.areas
          );
          // Fall back to default data if available
          setDepartments([]);
        }

        if (Array.isArray(data.areasItems)) {
          setItems(data.areasItems);
        } else {
          console.error(
            "API data structure issue: data.areasItems is not an array",
            data.areasItems
          );
          setItems([]);
        }
      } catch (error) {
        // Comprehensive error handling
        console.error("Failed to fetch sidebar data:", error);
        setHasError(true);
        // Use fallback data in case of error
        setDepartments([]);
        setItems([]);
      } finally {
        // Always set loading to false when done
        setIsLoading(false);
      }
    };

    // Execute the function
    obtenerSideBar();

    // Empty dependency array means this effect runs once after initial render
  }, []);

  return (
    <div className={`sidebar ${isExpanded ? "sidebar--expanded" : ""}`}>
      {/* Header - Always visible regardless of data loading status */}
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

      {/* Content section with loading/error states */}
      <div className="sidebar__content">
        <div className="sidebar__departments">
          {/* Loading state with user feedback */}
          {isLoading && (
            <div className="sidebar__loading">
              <p>Cargando departamentos...</p>
            </div>
          )}

          {/* Error state with user feedback */}
          {hasError && !isLoading && (
            <div className="sidebar__error">
              <p>Error al cargar los departamentos</p>
              <button onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !hasError && departments.length === 0 && (
            <div className="sidebar__empty">
              <p>No hay departamentos disponibles</p>
            </div>
          )}

          {/* Successfully loaded departments */}
          {!isLoading &&
            departments.length > 0 &&
            departments.map((department) => (
              <div key={department.id_area || `dept-${department.nombre_area}`}>
                <button
                  className="sidebar__project-button"
                  onClick={(event) => {
                    event.preventDefault();
                    if (activeDepartment === department.id_area) {
                      setActiveDepartment(0);
                    } else {
                      setActiveDepartment(department.id_area);
                    }
                  }}
                >
                  {isExpanded && (
                    <div>
                      <span>{department.nombre_area || department.name}</span>
                    </div>
                  )}

                  {/* Add null check to prevent potential errors */}
                  {department.department_logo && (
                    <img
                      src={department.department_logo}
                      alt="icono de departamento"
                      className="department_icon"
                    />
                  )}

                  {isExpanded && (
                    <ChevronRight
                      className={`sidebar__chevron ${
                        activeDepartment === department.id_area
                          ? "sidebar__chevron--rotated"
                          : ""
                      }`}
                    />
                  )}
                </button>

                {/* Department items - only shown when department is active */}
                {activeDepartment === department.id_area && isExpanded && (
                  <>
                    <div className="sidebar__items">
                      {/* Mapped items with safety checks */}
                      {Array.isArray(items) &&
                        items.length > 0 &&
                        items.map((item) => (
                          <>
                            {item.id_area === department.id_area ? (
                              <button
                                key={item.id_area || `item-${Math.random()}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(
                                    `${item.nombre_item_navBar}/${
                                      department.nombre_area || department.name
                                    }`
                                  );
                                }}
                                className="sidebar__subproject-button"
                              >
                                {item.id_area === department.id_area ? (
                                  <span>{item.nombre_item_navBar}</span>
                                ) : (
                                  <></>
                                )}
                              </button>
                            ) : null}
                          </>
                        ))}

                      {/* Static department-specific buttons with null checks */}
                    </div>

                    {/* Create project button */}
                    <button
                      className="create_proyect"
                      onClick={() => {
                        navigate(
                          `projects/${
                            department.nombre_area || department.name
                          }/create`
                        );
                      }}
                    >
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
            navigate("create-employees");
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export { DashboardSidebar };
