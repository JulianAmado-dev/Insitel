"use client";
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

function Home() {
  const navigate = useNavigate();
  const { id_proyecto } = useParams();
  console.log("ID del proyecto:", id_proyecto);

  const proyecto = {
    nombre_proyecto: "Intranet",
    empresa_asociada: "INSITEL S.A.S.",
    progress: 45, // Porcentaje
    status: "En progreso", // Debería venir de la tabla proyectos
    priority: 3, // Ejemplo (1-5)
    area: "I+D", // O el nombre del área si haces JOIN
  };

  const risks = {
    total: 8,
    cant_riesgos_criticos: 2,
    cant_riesgos_moderados: 3,
    cant_riesgos_leves: 3,
    cant_riesgos_nulos: 1,
    cant_riesgos: 17,
  };

  const formulariosStatus = {
    general: "Completado", // O 'Pendiente', 'En Progreso'
    alcance: "En Progreso",
    presupuesto: "Pendiente",
    riesgos: "Completado",
    verificacion: "Pendiente",
    validacion: "Pendiente",
    controlVersiones: "En Progreso",
  };

  const miembros = [
    {
      id_asignacion_rh: 5, // ID único de esta asignación específica
      id_proyecto: 1, // ID del proyecto al que pertenece
      id_empleado: 1, // ID del empleado (de la tabla empleados)
      nombres: "Julian", // Nombre(s) del empleado (de la tabla empleados)
      apellidos: "Amado", // Apellido(s) del empleado (de la tabla empleados)
      rol_en_proyecto: "Líder Técnico", // Rol específico en este proyecto (de proyecto_equipo)
      responsabilidades:
        "Definición de arquitectura, supervisión técnica del desarrollo backend.", // Responsabilidades en este proyecto (de proyecto_equipo)
      fecha_asignacion: "2024-04-15T10:00:00.000Z", // Fecha/hora de asignación
    },
    {
      id_asignacion_rh: 8,
      id_proyecto: 1,
      id_empleado: 7,
      nombres: "Ana",
      apellidos: "García",
      rol_en_proyecto: "Desarrollador Frontend",
      responsabilidades:
        "Implementación de interfaz de usuario con React, integración con API.",
      fecha_asignacion: "2024-04-16T09:30:00.000Z",
    },
    {
      id_asignacion_rh: 12,
      id_proyecto: 1,
      id_empleado: 4,
      nombres: "Carlos",
      apellidos: "Martinez",
      rol_en_proyecto: "Diseñador UX/UI",
      responsabilidades:
        "Diseño de wireframes, prototipos y mockups. Pruebas de usabilidad.",
      fecha_asignacion: "2024-04-18T11:00:00.000Z",
    },
    {
      id_asignacion_rh: 15,
      id_proyecto: 1,
      id_empleado: null, // Ejemplo de un recurso externo sin ID de empleado
      nombres: "Consultor Externo", // Nombre genérico o real
      apellidos: "S.A.S.", // O vacío
      rol_en_proyecto: "Asesor Experto",
      responsabilidades:
        "Revisión de arquitectura y recomendaciones técnicas puntuales.",
      fecha_asignacion: "2024-04-20T14:00:00.000Z",
    },
  ];

  const formulariosCount = {
    completed: 2,
    total: 6,
  };

  console.log("EEEEEEEEEE", formulariosCount);

  const getStatusClass = (estado) => {
    if (!estado) return "";

    switch (estado.toLowerCase()) {
      case "completado":
        return "status-done";
      case "en progreso":
        return "status-in-progress";
      case "pendiente":
        return "status-pending";
      default:
        return "";
    }
  };

  const getStatusClassForCounter = (completed, total) => {
    switch (completed) {
      case completed === total:
        return "status-done";
      case completed < 3:
        return "status-in-progress";
      case completed >= 3:
        return "status-pending";
      default:
        return "";
    }
  };

  return (
    <div className="home-container">
      <header className="project-header">
        <div className="project-name_div">
          <h1>{proyecto.nombre_proyecto}</h1>
        </div>
        <div className="header-details">
          <span className={`status-badge ${getStatusClass(proyecto.status)}`}>
            {proyecto.status}
          </span>
          <span className="company-name">{proyecto.empresa_asociada}</span>
        </div>
      </header>

      <section className="top-level-cards">
        <div className="top-level-card">
          <div className="card-header">
            <strong>Progreso</strong>
            <Activity className="card-icon" />
          </div>
          <h3>{proyecto.progress}%</h3>
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${proyecto.progress}%` }}
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
                  i < proyecto.priority ? "active" : ""
                }`}
              ></span>
            ))}
          </div>
          <h3>Prioridad {proyecto.priority}/5</h3>
        </div>

        <div className="top-level-card">
          <div className="card-header">
            <strong>Riesgos identificados</strong>
            <AlertOctagon className="card-icon" />
          </div>
          {risks.cant_riesgos === 0 ? (
            <p className="no-risks">No hay riesgos en nuestro proyecto 🎉</p>
          ) : (
            <p className="risks-summary">
              <span className="risk-critical">
                {risks.cant_riesgos_criticos} críticos
              </span>
              ,{" "}
              <span className="risk-moderate">
                {risks.cant_riesgos_moderados} moderados
              </span>
              ,{" "}
              <span className="risk-low">{risks.cant_riesgos_leves} leves</span>{" "}
              y{" "}
              <span className="risk-null">
                {risks.cant_riesgos_nulos} nulos
              </span>
            </p>
          )}
        </div>

        <div
          className={`top-level-card ${getStatusClassForCounter(
            formulariosCount.completed,
            formulariosCount.total
          )}`}
        >
          <div className="card-header">
            <strong>Formularios completados</strong>
            <FileBadge className="card-icon" />
          </div>
          {formulariosCount.completed === 0 ? (
            <div className="no-forms">
              <p className="risk-critical">
                No has completado ningún formulario!
              </p>
              <AlertTriangle className="warning-icon" color="orange" />
            </div>
          ) : (
            <>
              <h3>{`${formulariosCount.completed}/${formulariosCount.total}`}</h3>
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${
                      (formulariosCount.completed / formulariosCount.total) *
                      100
                    }%`,
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
                  formulariosStatus.general
                )}`}
              >
                {formulariosStatus.general}
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
              onClick={() => navigate(`form/general`)}
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
                  formulariosStatus.alcance
                )}`}
              >
                {formulariosStatus.alcance}
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
                  formulariosStatus.presupuesto
                )}`}
              >
                {formulariosStatus.presupuesto}
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
              onClick={() =>
                navigate(`/proyecto/${id_proyecto}/form/presupuesto`)
              }
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
                  formulariosStatus.riesgos
                )}`}
              >
                {formulariosStatus.riesgos}
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
              onClick={() => navigate(`/proyecto/${id_proyecto}/form/riesgos`)}
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
                  formulariosStatus.verificacion
                )}`}
              >
                {formulariosStatus.verificacion}
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
              onClick={() =>
                navigate(`/proyecto/${id_proyecto}/form/verificacion`)
              }
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
                  formulariosStatus.validacion
                )}`}
              >
                {formulariosStatus.validacion}
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
              onClick={() =>
                navigate(`/proyecto/${id_proyecto}/form/validacion`)
              }
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
            {miembros.map((miembro) => (
              <div key={miembro.id_empleado} className="member-line">
                <img src={null} alt="" className="member-foto" />
                <span>
                  {miembro.nombres + " " + miembro.apellidos}
                  <strong> | </strong>
                  <span>{miembro.rol_en_proyecto} </span>
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
      </section>
    </div>
  );
}

export { Home };
