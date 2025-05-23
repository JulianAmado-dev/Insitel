import "./DashboardSidebar.css";
import logo_insitel from "@assets/logo-insitel.png";
import logo_sigar from "@assets/logo-sigar.jpg";
import insitelDefault from "@assets/logo-insitel-default-nofondo.png";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Moon, Settings, Sun, UserPlus } from "lucide-react"; // Added Menu and UserPlus
import { useTheme } from "@contexts/ThemeProvider/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@api/AxiosInstance";
import { useAuth } from "@contexts/AuthContext";
import PropTypes from "prop-types";

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
  const [activeDepartmentItem, setActiveDepartmentItem] = useState(0);
  // Initialize with empty arrays - this is crucial for avoiding the .map() error
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  // Add loading and error states to improve user experience
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const logosMap = {
    logo_sigar: logo_sigar,
    logo_insitel: logo_insitel,
  };

  const getLogoForArea = (logoName) => {
    if (!logoName) return insitelDefault;
    return logosMap[logoName] || insitelDefault;
  };

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
          <Menu // Changed from ChevronRight
            className={`sidebar__toggle-icon ${
              isExpanded ? "sidebar__toggle-icon--rotated" : ""
            }`}
          />
        </button>
      </div>

      {/* Content section with loading/error states */}
      <div className="sidebar__content">
        <div>
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
              <div
                key={department.id_area || `dept-${department.nombre_area}`}
                className="sidebar__area-content"
              >
                {" "}
                <div className="sidebar__area-button">
                  {isExpanded && (
                    <div>
                      <span>{department.nombre_area || department.name}</span>
                    </div>
                  )}

                  <button
                    className="sidebar__project-button"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(`${department.nombre_area}/Home`);
                    }}
                  >
                    {/* Add null check to prevent potential errors */}
                    {department.logo_area && (
                      <img
                        src={getLogoForArea(department.logo_area)}
                        alt="icono de departamento"
                        className="department_icon"
                      />
                    )}
                  </button>
                  {isExpanded && (
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
                      {/* Add null check to prevent potential errors */}
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
                  )}
                </div>
                {/* Department items - only shown when department is active */}
                {activeDepartment === department.id_area && isExpanded && (
                  <>
                    <div className="sidebar__items">
                      {/* Mapped items with safety checks */}
                      {Array.isArray(items) &&
                        items.length > 0 &&
                        items.map((item) => (
                          <>
                            {item.id_area === department.id_area &&
                              item.is_father === 1 && (
                                <>
                                  <div className="sidebar__area-button">
                                    {isExpanded && (
                                      <>
                                        <div>
                                          <span>
                                            {item.nombre_item_navBar || null}
                                          </span>
                                        </div>
                                        <button
                                          className="sidebar__project-button"
                                          onClick={(event) => {
                                            event.preventDefault();
                                            if (
                                              activeDepartmentItem ===
                                              item.id_item_nav
                                            ) {
                                              setActiveDepartmentItem(0);
                                            } else {
                                              setActiveDepartmentItem(
                                                item.id_item_nav
                                              );
                                            }
                                          }}
                                        >
                                          <ChevronRight
                                            className={`sidebar__chevron ${
                                              activeDepartmentItem ===
                                              item.id_item_nav
                                                ? "sidebar__chevron--rotated"
                                                : ""
                                            }`}
                                          />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  {item.id_item_nav ===
                                    activeDepartmentItem && (
                                    <>
                                      {items.map((subItem) => (
                                        <>
                                          {subItem.padre ===
                                          activeDepartmentItem ? (
                                            <>
                                              <button
                                                key={
                                                  item.id_item_nav ||
                                                  `item-${Math.random()}`
                                                }
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  navigate(
                                                    `${department.nombre_area.replace(
                                                      / /g,
                                                      "-"
                                                    )}/${item.nombre_item_navBar.replace(
                                                      / /g,
                                                      "-"
                                                    )}/${subItem.nombre_item_navBar.replace(
                                                      / /g,
                                                      "-"
                                                    )}`
                                                  );
                                                }}
                                                className="sidebar__subproject-button"
                                              >
                                                <span>
                                                  {subItem.nombre_item_navBar}
                                                </span>
                                              </button>
                                            </>
                                          ) : null}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </>
                              )}
                            {item.id_area === department.id_area &&
                              item.is_father === 0 && (
                                <button
                                  key={
                                    item.id_item_nav || `item-${Math.random()}`
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(
                                      `${department.nombre_area.replace(
                                        / /g,
                                        "-"
                                      )}/${item.nombre_item_navBar.replace(
                                        / /g,
                                        "-"
                                      )}`
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
                              )}
                          </>
                        ))}
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>

        {auth.rol === "admin" && (
          <div className="create_user_button">
            <button></button>
          </div>
        )}
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
          className="sidebar__add-user-button" // Added class for styling
          onClick={(e) => {
            e.preventDefault();
            navigate("create-employees");
          }}
        >
          <UserPlus className="sidebar__icon" /> {/* Replaced + with UserPlus icon */}
          {isExpanded && <span>Crear Usuario</span>}
        </button>
      </div>
    </div>
  );
}

DashboardSidebar.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  setIsExpanded: PropTypes.func.isRequired,
};

export { DashboardSidebar };
