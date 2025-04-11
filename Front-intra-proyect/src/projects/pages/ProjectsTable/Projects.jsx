import { useEffect, useState } from "react";
import "./Projects.css";
import { Search, MoreHorizontal } from "lucide-react";
import Axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function Projects() {
  const [showActions, setShowActions] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [orderedBy, setOrderedBy] = useState("newest");
  const [projectsData, setProjectsData2] = useState([]);
  const slug  = useParams(); //esto debería ser un prop
  const navigate = useNavigate();

  console.log(slug.area)
  const obtenerProyectos = (area) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Axios.get(`http://localhost:3001/api/Projects/${area}`)
          .then(({ data }) => {
            resolve(data);
            setProjectsData2(data.data);
          })
          .catch((error) => {
            reject(error.message);
            throw error.message;
          });
      }, 0);
    });
  };

  useEffect(() => {
    obtenerProyectos(slug.area);
  }, [slug]);

  const searchedItems = projectsData.filter((especificItem) => {
    const lowerProjectName = especificItem.nombre_proyecto.toLowerCase();
    const lowerSearchValue = searchValue.toLowerCase();

    return lowerProjectName.includes(lowerSearchValue);
  });

  const orderedObject = searchedItems.sort((a, b) => {
    if (orderedBy === "newest") {
      return new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
    } else if (orderedBy === "latest") {
      return new Date(a.fecha_inicio) - new Date(b.fecha_inicio);
    } else {
      return b.priority - a.priority;
    }
  });

  console.log(orderedObject);

  const getStatusClass = (estado) => {
    switch (estado.toLowerCase()) {
      case "completado":
        return "status-done";
      case "en progreso":
        return "status-in-progress";
      case "pausado":
        return "status-paused";
      default:
        return "";
    }
  };

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="projects-container">
      <header className="projects-header">
        <h1>Proyectos</h1>
        <button
          className="add-project-btn"
          onClick={(e) => {
            e.preventDefault();
            navigate('./create')
          }}
        >
          + Agregar Proyecto
        </button>
      </header>

      <section className="projects-controls">
        <div className="tab-buttons">
          <button className="tab-btn active">Todos los proyectos</button>
          <button className="tab-btn">Archivados</button>
        </div>

        <div className="sort-search">
          <div className="sort-container">
            <label htmlFor="sortBy">Ordenar por: </label>
            <select
              name="sortBy"
              id="sortBy"
              className="sort-select"
              onChange={(event) => {
                setOrderedBy(event.target.value);
              }}
            >
              <option value="newest">Más reciente</option>
              <option value="latest">Más antiguo</option>
              <option value="priority">Más prioritario</option>
            </select>
          </div>

          <div className="search-container">
            <input
              placeholder="Buscar proyectos"
              className="search-input"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                console.log("el search value es:", searchValue);
              }}
            />
            <button className="search-btn">
              <Search size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="projects-table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th className="column-name">Nombre</th>
              <th className="column-status">Estatus</th>
              <th className="column-summary">Resumen</th>
              <th className="column-sprint">Fecha de Creación</th>
              <th className="column-members">Miembros</th>
              <th className="column-progress">Progreso</th>
              <th className="column-action">Acción</th>
            </tr>
          </thead>
          <tbody>
            {orderedObject.map((project) => (
              <tr key={project.id_proyecto}>
                <td className="project-name">
                  <div
                    className="project-avatar"
                    style={{ backgroundColor: project.color }}
                  >
                    {getInitials(project.nombre_proyecto)}
                  </div>
                  <div className="project-name-text">
                    <div className="name">{project.nombre_proyecto}</div>
                    <div className="company">Empresa {project.id_proyecto}</div>
                  </div>
                </td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(project.status)}`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="project-summary">
                  <div className="summary-title">{project.summary}</div>
                  <div className="summary-subtitle">Detalles adicionales</div>
                </td>
                <td>{project.fecha_inicio.split("T")[0]}</td>
                <td>
                  <div className="members-avatars">
                    {project.nombres_empleado ? (
                      project.nombres_empleado
                        .split(",")
                        .map((miembro, index) => (
                          <div
                            key={index}
                            className="member-avatar"
                            style={{
                              backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                              zIndex:
                                project.nombres_empleado.split(",").length -
                                index,
                            }}
                          >
                            {getInitials(miembro)}
                          </div>
                        ))
                    ) : (
                      <span>Sin miembros</span>
                    )}
                  </div>
                </td>
                <td className="progress-container">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor:
                          project.progreso === 100
                            ? "#4CAF50"
                            : project.progreso > 50
                            ? "#2196F3"
                            : "#FF9800",
                      }}
                    ></div>
                  </div>
                  {project.progress < 100 && (
                    <span className="progress-text">{project.progress}%</span>
                  )}
                  {project.progress === 100 && (
                    <span className="progress-complete">✓</span>
                  )}
                </td>
                <td className="action-column">
                  <div className="action-container">
                    <button
                      className="action-btn"
                      onClick={() => {
                        setShowActions(project.id_proyecto);
                        if (showActions === project.id_proyecto) {
                          setShowActions(0);
                        }
                        console.log(showActions);
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {showActions === project.id_proyecto && (
                      <div className="action-dropdown">
                        <button className="action-item">Archivar</button>
                        <button
                          className="action-item delete"
                          onClick={(event) => {
                            event.preventDefault();
                            console.log(project);
                            /* eliminarProyecto(project.id); */
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orderedObject.length === 0 && (
          <div>No hay proyectos por el momento :p</div>
        )}
      </section>
    </div>
  );
}

export { Projects };
