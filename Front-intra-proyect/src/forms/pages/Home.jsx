"use client";
import { useEffect, useState } from "react"; // Removed React import
import {
  ClipboardList,
  BarChart3,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FileVolume2,
  FileSpreadsheet,
  FileWarning,
  FileQuestion,
  Activity,
  Flag,
  AlertOctagon,
  FileBadge,
  Users,
  UserRoundPlus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./Home.css";
import { axiosInstance } from "@api/axiosInstance"; // Assuming this is your configured axios
import LeccionesAprendidasPreviewCard from "../components/LeccionesAprendidasPreviewCard";
import RiesgosPreviewCard from "../components/RiesgosPreviewCard"; // Importar la nueva tarjeta de riesgos

function Home() {
  const navigate = useNavigate();
  const { area: projectArea, id_proyecto } = useParams(); // Capture area from params as well
  
  const [dashboardData, setDashboardData] = useState({
    proyecto: {},
    risks: {},
    formulariosStatus: {},
    formulariosCount: { completed: 0, total: 6 }, // Default total, adjust as needed
    miembros: [],
    lessonsSummary: { total_lecciones: 0, recent_lessons: [] }, // Added for lessons preview
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id_proyecto && projectArea) {
      const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axiosInstance.get(
            `/api/proyectos/${projectArea}/${id_proyecto}/home-details`
          );
          setDashboardData(response.data);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError(
            err.response?.data?.message ||
              "Error al cargar los datos del dashboard."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    } else {
      setLoading(false);
      setError("No se proporcionó ID de proyecto o área.");
    }
  }, [id_proyecto, projectArea]);

  const getStatusClass = (estado) => {
    if (!estado) return "";

    switch (estado?.toLowerCase()) { // Added optional chaining
      case "completado":
        return "status-done";
      case "en progreso": // This status might not come from backend yet
        return "status-in-progress";
      case "pendiente":
        return "status-pending";
      default:
        return "";
    }
  };

  const getStatusClassForCounter = (completed, total) => {
    if (total === 0) return "status-pending"; // Avoid division by zero
    if (completed === total) return "status-done";
    if (completed === 0) return "status-pending"; // Or specific style for 0 completed
    // Example logic, adjust as needed
    const percentage = (completed / total) * 100;
    if (percentage < 50) return "status-in-progress"; // Or 'status-pending' if preferred
    return "status-in-progress"; // Or a more granular status
  };
  
  if (loading) {
    return <div className="home-container"><p>Cargando datos del proyecto...</p></div>;
  }

  if (error) {
    return <div className="home-container"><p className="error-message">{error}</p></div>;
  }

  const { proyecto, risks, formulariosStatus, formulariosCount, miembros, lessonsSummary } = dashboardData;

  return (
    <div className="home-container">
      <header className="project-header">
        <div className="project-name_div">
          <h1>{proyecto?.nombre_proyecto || "Nombre no disponible"}</h1>
        </div>
        <div className="header-details">
          <span className={`status-badge ${getStatusClass(proyecto?.status)}`}>
            {proyecto?.status || "N/A"}
          </span>
          <span className="company-name">{proyecto?.empresa_asociada || "Empresa no disponible"}</span>
        </div>
      </header>

      <section className="top-level-cards">
        <div className="top-level-card">
          <div className="card-header">
            <strong>Progreso</strong>
            <Activity className="card-icon" />
          </div>
          <h3>{proyecto?.progress || 0}%</h3>
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{
                width: `${proyecto?.progress || 0}%`,
                backgroundColor: "var(--color-in-progress)", // Consider dynamic color based on progress
              }}
            ></div>
          </div>
        </div>

        <div className="top-level-card">
          <div className="card-header">
            <strong>Prioridad</strong>
            <Flag className="card-icon" />
          </div>
          <div className="priority-indicator">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`priority-dot ${
                  i < (proyecto?.priority || 0) ? "active" : ""
                }`}
              ></span>
            ))}
          </div>
          <h3>Prioridad {proyecto?.priority || "N/A"}/5</h3>
        </div>

        <div className="top-level-card">
          <div className="card-header">
            <strong>Riesgos identificados</strong>
            <AlertOctagon className="card-icon" />
          </div>
          {(risks?.cant_riesgos || 0) === 0 ? (
            <p className="no-risks">No hay riesgos en nuestro proyecto 🎉</p>
          ) : (
            <p className="risks-summary">
              <span className="risk-critical">
                {risks?.cant_riesgos_criticos || 0} críticos
              </span>
              ,{" "}
              <span className="risk-moderate">
                {risks?.cant_riesgos_moderados || 0} moderados
              </span>
              ,{" "}
              <span className="risk-low">{risks?.cant_riesgos_leves || 0} leves</span>{" "}
              y{" "}
              <span className="risk-null">
                {risks?.cant_riesgos_nulos || 0} nulos
              </span>
            </p>
          )}
        </div>

        <div
          className={`top-level-card ${getStatusClassForCounter(
            formulariosCount?.completed || 0,
            formulariosCount?.total || 6 // Default to 6 if total is not available
          )}`}
        >
          <div className="card-header">
            <strong>Formularios completados</strong>
            <FileBadge className="card-icon" />
          </div>
          {(formulariosCount?.completed || 0) === 0 ? (
            <div className="no-forms">
              <p className="risk-critical">
                No has completado ningún formulario!
              </p>
              <AlertTriangle className="warning-icon" color="orange" />
            </div>
          ) : (
            <>
              <h3>{`${formulariosCount?.completed || 0}/${formulariosCount?.total || 6}`}</h3>
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${
                      ((formulariosCount?.completed || 0) / (formulariosCount?.total || 1)) * // Avoid division by zero
                      100
                    }%`,
                    backgroundColor: "var(--color-in-progress)", // Consider dynamic color
                  }}
                ></div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="forms-cards">
        {/* Formulario General */}
        <div className="forms-card">
          <header className="form-header general">
            <div className="header-div">
              <FileText className="form-icon" />
              <h2>Formulario General</h2>
              <span
                className={`status-badge ${getStatusClass(
                  formulariosStatus?.general
                )}`}
              >
                {formulariosStatus?.general || "Pendiente"}
              </span>
            </div>
            <p>Información básica del proyecto</p>
          </header>
          <div className="form-content">
            <ul>
              <li>
                <ClipboardList className="list-icon" />
                <span>Datos generales del proyecto</span>
              </li>
              <li>
                <CheckCircle2 className="list-icon" />
                <span>Requerimientos y entregables</span>
              </li>
              <li>
                <Clock className="list-icon" />
                <span>Cronograma y documentación</span>
              </li>
            </ul>
          </div>
          <footer className="form-footer">
            <button
              className="form-button"
              onClick={() => navigate(`form/general`)} // Ensure navigate is defined if used
            >
              Acceder
            </button>
          </footer>
        </div>

        {/* Formulario Alcance */}
        <div className="forms-card">
          <header className="form-header alcance">
            <div className="header-div">
              <FileVolume2 className="form-icon" />
              <h2>Alcance</h2>
              <span
                className={`status-badge ${getStatusClass(
                  formulariosStatus?.alcance
                )}`}
              >
                {formulariosStatus?.alcance || "Pendiente"}
              </span>
            </div>
            <p>Delimitación de las características del sistema</p>
          </header>
          <div className="form-content">
            <ul>
              <li>
                <FileText className="list-icon" />
                <span>Definición de situación problema</span>
              </li>
              <li>
                <CheckCircle2 className="list-icon" />
                <span>Requerimientos y entregables</span>
              </li>
              <li>
                <Clock className="list-icon" />
                <span>Cronograma y documentación</span>
              </li>
            </ul>
          </div>
          <footer className="form-footer">
            <button
              className="form-button"
              onClick={() => navigate(`form/alcance`)}
            >
              Acceder
            </button>
          </footer>
        </div>

        {/* Formulario Presupuesto */}
        <div className="forms-card">
          <header className="form-header presupuesto">
            <div className="header-div">
              <FileSpreadsheet className="form-icon" />
              <h2>Presupuesto</h2>
              <span
                className={`status-badge ${getStatusClass(
                  formulariosStatus?.presupuesto
                )}`}
              >
                {formulariosStatus?.presupuesto || "Pendiente"}
              </span>
            </div>
            <p>Control financiero del proyecto</p>
          </header>
          <div className="form-content">
            <ul>
              <li>
                <BarChart3 className="list-icon" />
                <span>Recursos humanos y materiales</span>
              </li>
              <li>
                <CheckCircle2 className="list-icon" />
                <span>Suministros y servicios</span>
              </li>
              <li>
                <Clock className="list-icon" />
                <span>Resumen de costos totales</span>
              </li>
            </ul>
          </div>
          <footer className="form-footer">
            <button
              className="form-button"
              onClick={() => navigate(`form/presupuesto`)}
            >
              Acceder
            </button>
          </footer>
        </div>

        {/* Formulario Gestión de Riesgos */}
        <div className="forms-card riesgos">
          <header className="form-header riesgos">
            <div className="header-div">
              <FileWarning className="form-icon" />
              <h2>Gestión de Riesgos</h2>
              <span
                className={`status-badge ${getStatusClass(
                  formulariosStatus?.riesgos
                )}`}
              >
                {formulariosStatus?.riesgos || "Pendiente"}
              </span>
            </div>
            <p>Identificación y mitigación de riesgos</p>
          </header>
          <div className="form-content">
            <ul>
              <li>
                <AlertTriangle className="list-icon" />
                <span>Matriz de probabilidad e impacto</span>
              </li>
              <li>
                <AlertCircle className="list-icon" />
                <span>Planes de respuesta</span>
              </li>
              <li>
                <CheckCircle2 className="list-icon" />
                <span>Seguimiento y control</span>
              </li>
            </ul>
          </div>
          <footer className="form-footer">
            <button
              className="form-button"
              onClick={() => navigate(`form/riesgos`)}
            >
              Acceder
            </button>
          </footer>
        </div>

        {/* Formulario Verificación */}
        <div className="forms-card verificacion">
          <header className="form-header verificacion">
            <div className="header-div">
              <FileQuestion className="form-icon" />
              <h2>Verificación</h2>
              <span
                className={`status-badge ${getStatusClass(
                  formulariosStatus?.verificacion
                )}`}
              >
                {formulariosStatus?.verificacion || "Pendiente"}
              </span>
            </div>
            <p>Especificación detallada de las necesidades</p>
          </header>
          <div className="form-content">
            <ul>
              <li>
                <FileText className="list-icon" />
                <span>Problemas y necesidades</span>
              </li>
              <li>
                <CheckCircle2 className="list-icon" />
                <span>Entorno y actores</span>
              </li>
              <li>
                <Clock className="list-icon" />
                <span>Limitaciones y comportamiento esperado</span>
              </li>
            </ul>
          </div>
          <footer className="form-footer">
            <button
              className="form-button"
              onClick={() => navigate(`form/verificacion`)}
            >
              Acceder
            </button>
          </footer>
        </div>

        {/* Formulario Validación */}
        <div className="forms-card">
          <header className="form-header validacion">
            <div className="header-div">
              <FileCheck className="form-icon" />
              <h2>Validación</h2>
              <span
                className={`status-badge ${getStatusClass(
                  formulariosStatus?.validacion
                )}`}
              >
                {formulariosStatus?.validacion || "Pendiente"}
              </span>
            </div>
            <p>Confirmación de cumplimiento de requisitos</p>
          </header>
          <div className="form-content">
            <ul>
              <li>
                <FileText className="list-icon" />
                <span>Criterios de aceptación</span>
              </li>
              <li>
                <CheckCircle2 className="list-icon" />
                <span>Pruebas y resultados</span>
              </li>
              <li>
                <Clock className="list-icon" />
                <span>Documentación final</span>
              </li>
            </ul>
          </div>
          <footer className="form-footer">
            <button
              className="form-button"
              onClick={() => navigate(`form/validacion`)}
            >
              Acceder
            </button>
          </footer>
        </div>
        {/* card para miembros, doble de alta que una card de formato */}
        <div className="forms-card members">
          <header className="form-header members">
            <div className="header-div">
              <Users className="form-icon" />
              <h2>Miembros</h2>
            </div>
          </header>
          <div className="form-content members">
            {(miembros || []).map((miembro) => (
              <div key={miembro.id_asignacion_rh || miembro.id_empleado} className="member-line"> {/* Use id_asignacion_rh for unique key */}
                <img src={miembro.foto_empleado || null} alt={`${miembro.nombres} ${miembro.apellidos}`} className="member-foto" />
                <span>
                  {miembro.nombres || "N/A"} {miembro.apellidos || ""}
                  <strong> | </strong>
                  <span>{miembro.rol_en_proyecto || "Rol no asignado"} </span>
                  <div className="member-actions">
                    <button className="action-button" title="Ver detalles">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </button>
                    <button className="action-button" title="Editar">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  </div>
                </span>
              </div>
            ))}
          </div>
          <footer className="form-footer members">
            <div className="member-line">
              <button>
                <UserRoundPlus className="form-icon" />
                <span>Agregar miembro</span>
              </button>
            </div>
          </footer>
        </div>

        {/* Lecciones Aprendidas Preview Card */}
        {lessonsSummary && (
          <LeccionesAprendidasPreviewCard
            lessonsSummary={lessonsSummary}
            projectId={id_proyecto}
            projectArea={projectArea}
          />
        )}

        {/* Riesgos Preview Card */}
        {risks && (
          <RiesgosPreviewCard
            risksSummary={risks}
            projectId={id_proyecto}
            projectArea={projectArea}
          />
        )}
      </section>
    </div>
  );
}

export { Home };
