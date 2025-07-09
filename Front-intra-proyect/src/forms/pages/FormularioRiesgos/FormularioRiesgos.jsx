import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import "./FormularioRiesgos.css";
import Swal from "sweetalert2";
import { useParams, useSearchParams } from "react-router-dom"; // Re-añadido useSearchParams
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  FiFileText,
  FiInfo,
  FiX,
  FiAlertTriangle,
  FiBarChart2,
  FiUsers,
  FiClipboard,
  FiCalendar,
  FiTag,
  FiMessageSquare,
  FiZap,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiActivity,
  FiBriefcase,
} from "react-icons/fi";
import { axiosInstance } from "../../../common/api/axiosInstance";
import { useAuth } from "../../../common/contexts/AuthContext";

const probabilities = [
  { level: 5, label: "Casi Seguro" },
  { level: 4, label: "Probable" },
  { level: 3, label: "Posible" },
  { level: 2, label: "Poco Probable" },
  { level: 1, label: "Muy Improbable" },
];
const impacts = [
  { level: 1, label: "Insignificante" },
  { level: 2, label: "Menor" },
  { level: 5, label: "Moderado" },
  { level: 10, label: "Mayor" },
  { level: 20, label: "Severo" },
];

function severityClass(value) {
  if (value >= 50) return "critical-risk";
  if (value >= 20) return "medium-risk";
  if (value >= 10) return "low-risk";
  return "low-risk";
}

const ToastInstance = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

function FormularioRiesgos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allRiesgos, setAllRiesgos] = useState([]);
  const [proyectosLista, setProyectosLista] = useState([]);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [riesgoAEditar, setRiesgoAEditar] = useState(null);

  const [showMaterializacionTablaModal, setShowMaterializacionTablaModal] =
    useState(false);
  const [showMaterializacionModal, setShowMaterializacionModal] =
    useState(false);
  const [currentMaterializaciones, setCurrentMaterializaciones] = useState([]);

  const [showEvaluarRiesgoTablaModal, setShowEvaluarRiesgoTablaModal] =
    useState(false);
  const [showEvaluarRiesgoModal, setShowEvaluarRiesgoModal] = useState(false);
  const [currentEvaluaciones, setCurrentEvaluaciones] = useState([]);

  const Toast = ToastInstance;
  const { area } = useParams();
  const [searchParams] = useSearchParams(); // Re-añadido
  const projectIdFromQuery = searchParams.get("proyecto"); // Re-añadido
  const { user } = useAuth();
  const [selectedProyectoIdRiesgos, setSelectedProyectoIdRiesgos] =
    useState(""); // Para el filtro de proyecto

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de todos los riesgos
  const fetchRiesgos = useCallback(async () => {
    console.log(
      "Iniciando fetchRiesgos (cargando todos los riesgos inicialmente)"
    );
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/api/riesgos");
      setAllRiesgos(response.data || []);
    } catch (err) {
      console.error("Error detallado en fetchRiesgos catch:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error al obtener los riesgos."
      );
      Toast.fire({
        icon: "error",
        title:
          err.response?.data?.message ||
          err.message ||
          "Error al obtener riesgos",
      });
      setAllRiesgos([]);
    } finally {
      setLoading(false);
    }
  }, [Toast]);

  const fetchProyectosSimple = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/proyectos/listado-simple");
      setProyectosLista(response.data || []);
    } catch (err) {
      console.error("Error fetching proyectos lista:", err);
      Toast.fire({
        icon: "error",
        title: "Error al cargar lista de proyectos.",
      });
      setProyectosLista([]);
    }
  }, [Toast]);

  useEffect(() => {
    fetchRiesgos();
    fetchProyectosSimple();
    if (projectIdFromQuery) {
      // Si hay un ID de proyecto en la URL, establecerlo como filtro inicial
      setSelectedProyectoIdRiesgos(projectIdFromQuery);
    }
  }, [fetchRiesgos, fetchProyectosSimple, projectIdFromQuery]); // Añadir projectIdFromQuery a las dependencias

  // Riesgos filtrados para mostrar en la tabla
  const filteredRiesgos = useMemo(() => {
    let riesgosFiltrados = allRiesgos;
    if (selectedProyectoIdRiesgos) {
      riesgosFiltrados = riesgosFiltrados.filter(
        (riesgo) =>
          riesgo.id_proyecto === parseInt(selectedProyectoIdRiesgos, 10)
      );
    }
    // Aquí se podría añadir el globalFilter si se quiere que actúe sobre los riesgos ya filtrados por proyecto
    if (globalFilter) {
      const lowerGlobalFilter = globalFilter.toLowerCase();
      riesgosFiltrados = riesgosFiltrados.filter((riesgo) =>
        Object.values(riesgo).some((value) =>
          String(value).toLowerCase().includes(lowerGlobalFilter)
        )
      );
    }
    return riesgosFiltrados;
  }, [allRiesgos, selectedProyectoIdRiesgos, globalFilter]);

  const initialValuesCrear = {
    descripcion: "",
    estado: "identificado",
    id_proyecto: selectedProyectoIdRiesgos || "", // Pre-seleccionar si hay filtro activo, sino vacío
    fecha_de_identificacion: new Date().toISOString().split("T")[0],
    tipo: "Negativo",
    categoria: "Técnico",
    probabilidad: 1,
    impacto: 1,
    justificacion: "",
    id_responsable: user?.id_empleado || "",
    nombre_responsable_sesion: user?.nombres || "Usuario no disponible",
    fecha_probable_materializacion: "",
    evento_disparador: "",
    posibles_consecuencias: "",
    plan_respuesta: "mitigar",
    descripcion_plan_respuesta: "",
  };

  const validationSchemaCrear = Yup.object({
    descripcion: Yup.string().required("La descripción es requerida."),
    estado: Yup.string().required("El estado es requerido."),
    fecha_de_identificacion: Yup.date().required(
      "La fecha de identificación es requerida."
    ),
    tipo: Yup.string().required("El tipo de riesgo es requerido."),
    categoria: Yup.string().required("La categoría es requerida."),
    probabilidad: Yup.number()
      .min(1)
      .max(5)
      .required("La probabilidad para la evaluación inicial es requerida."),
    impacto: Yup.number()
      .min(1)
      .max(20)
      .required("El impacto para la evaluación inicial es requerido."),
    justificacion: Yup.string(),
    id_responsable: Yup.number()
      .nullable()
      .transform((value) =>
        isNaN(value) || value === "" ? null : Number(value)
      ),
    id_proyecto: Yup.number()
      .nullable()
      .transform((value) =>
        isNaN(value) || value === "" ? null : Number(value)
      ),
  });

  const handleCrearRiesgo = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    const payload = {
      ...values,
      id_proyecto: values.id_proyecto === "" ? null : values.id_proyecto,
      id_responsable:
        values.id_responsable === "" ? null : values.id_responsable,
    };
    try {
      await axiosInstance.post(`/api/riesgos`, payload);
      Toast.fire({ icon: "success", title: "Riesgo creado exitosamente!" });
      fetchRiesgos(); // Recargar todos los riesgos
      setShowCrearModal(false);
      resetForm();
    } catch (err) {
      console.error("Error creating riesgo:", err);
      Toast.fire({
        icon: "error",
        title: err.response?.data?.message || "Error al crear el riesgo.",
      });
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const openEditorWithRisk = useCallback((riskData) => {
    const formattedRiskData = {
      ...riskData,
      fecha_de_identificacion: riskData.fecha_de_identificacion
        ? new Date(riskData.fecha_de_identificacion).toISOString().split("T")[0]
        : "",
      fecha_probable_materializacion: riskData.fecha_probable_materializacion
        ? new Date(riskData.fecha_probable_materializacion)
            .toISOString()
            .split("T")[0]
        : "",
      id_responsable:
        riskData.id_responsable != null ? String(riskData.id_responsable) : "",
      id_proyecto:
        riskData.id_proyecto != null ? String(riskData.id_proyecto) : "",
    };
    setRiesgoAEditar(formattedRiskData);
    setShowEditarModal(true);
  }, []);

  const handleEditarRiesgo = async (values, { setSubmitting }) => {
    if (!riesgoAEditar || !riesgoAEditar.id_riesgo) {
      Toast.fire({
        icon: "error",
        title: "No se ha seleccionado un riesgo para editar.",
      });
      setSubmitting(false);
      return;
    }
    setLoading(true);
    const payload = {
      ...values,
      id_proyecto: values.id_proyecto === "" ? null : values.id_proyecto,
      id_responsable:
        values.id_responsable === "" ? null : values.id_responsable,
    };
    try {
      await axiosInstance.put(
        `/api/riesgos/${riesgoAEditar.id_riesgo}`,
        payload
      );
      Toast.fire({
        icon: "success",
        title: "Riesgo actualizado exitosamente!",
      });
      fetchRiesgos(); // Recargar todos los riesgos
      setShowEditarModal(false);
      setRiesgoAEditar(null);
    } catch (err) {
      console.error("Error updating riesgo:", err);
      Toast.fire({
        icon: "error",
        title: err.response?.data?.message || "Error al actualizar el riesgo.",
      });
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const initialValuesEvaluarRiesgo = {
    probabilidad: 1,
    impacto: 1,
    justificacion: "",
    fecha_evaluacion: new Date().toISOString().split("T")[0],
  };
  const validationSchemaEvaluarRiesgo = Yup.object({
    probabilidad: Yup.number()
      .min(1)
      .max(5)
      .required("Probabilidad requerida."),
    impacto: Yup.number().min(1).max(20).required("Impacto requerido."),
    justificacion: Yup.string().required("Justificación requerida."),
    fecha_evaluacion: Yup.date().required("Fecha de evaluación requerida."),
  });

 const fetchEvaluacionesByRiesgo = useCallback(
    async (riesgoId) => {
      if (!riesgoId) {
        setCurrentEvaluaciones([]);
        return;
      }
      try {
        const [evaluacionesResponse, riesgoResponse] = await Promise.all([
          axiosInstance.get(`/api/riesgos/${riesgoId}/evaluaciones`),
          axiosInstance.get(`/api/riesgos/${riesgoId}`),
        ]);

        const evaluaciones = evaluacionesResponse.data || [];
        const riesgo = riesgoResponse.data;

        if (evaluaciones.length === 0 && riesgo && riesgo.fecha_de_identificacion) {
          // If no evaluaciones, create a "dummy" evaluation with the initial risk date
          setCurrentEvaluaciones([{
            fecha_evaluacion: riesgo.fecha_de_identificacion,
            probabilidad: riesgo.probabilidad, // These might be undefined
            impacto: riesgo.impacto,           // if the risk hasn't been evaluated
            justificacion: "Evaluación Inicial",
            nombre_evaluador: riesgo.nombre_responsable,
          }]);
        } else {
          setCurrentEvaluaciones(evaluaciones);
        }
      } catch (err) {
        console.error("Error fetching evaluaciones:", err);
        Toast.fire({ icon: "error", title: "Error al cargar evaluaciones." });
        setCurrentEvaluaciones([]);
      }
    },
    [Toast]
  );

  useEffect(() => {
    if (showEvaluarRiesgoTablaModal && riesgoAEditar?.id_riesgo) {
      fetchEvaluacionesByRiesgo(riesgoAEditar.id_riesgo);
    }
  }, [showEvaluarRiesgoTablaModal, riesgoAEditar, fetchEvaluacionesByRiesgo]);

  const handleCrearEvaluacionRiesgo = async (
    values,
    { setSubmitting, resetForm }
  ) => {
    if (!riesgoAEditar?.id_riesgo) return;
    try {
      await axiosInstance.post(
        `/api/riesgos/${riesgoAEditar.id_riesgo}/evaluaciones`,
        values
      );
      Toast.fire({ icon: "success", title: "Evaluación creada exitosamente!" });
      fetchEvaluacionesByRiesgo(riesgoAEditar.id_riesgo);
      fetchRiesgos(); // Actualiza la tabla principal de riesgos
      setShowEvaluarRiesgoModal(false);
      resetForm();
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: err.response?.data?.message || "Error al crear evaluación.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const evaluacionesColumns = useMemo(
    () => [
      {
       accessorKey: "fecha_evaluacion",
        header: "Fecha",
        cell: (info) => {
          const dateValue = info.getValue();
          const firstEval = currentEvaluaciones[0];
          return dateValue ? new Date(dateValue).toLocaleDateString() : (firstEval ? new Date(firstEval.fecha_evaluacion).toLocaleDateString() : riesgoAEditar?.fecha_de_identificacion ? new Date(riesgoAEditar.fecha_de_identificacion).toLocaleDateString() : 'N/A');
        },
      },
      { accessorKey: "probabilidad", header: "Probabilidad" },
      { accessorKey: "impacto", header: "Impacto" },
      {
        accessorFn: (row) => row.probabilidad * row.impacto,
        header: "Nivel Riesgo",
      },
      { accessorKey: "justificacion", header: "Justificación" },
      { accessorKey: "nombre_evaluador", header: "Evaluado Por" },
    ],
    [currentEvaluaciones, riesgoAEditar?.fecha_de_identificacion]
  );
  const evaluacionesTable = useReactTable({
    data: currentEvaluaciones,
    columns: evaluacionesColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const initialValuesMaterializarRiesgo = {
    fecha_real_materializacion: new Date().toISOString().split("T")[0],
    descripcion_evento_materializado: "",
    descripcion_accion_tomada: "",
    consecuencias_reales_detalladas: "",
    efectividad: 3,
    notas: "",
  };
  const validationSchemaMaterializarRiesgo = Yup.object({
    fecha_real_materializacion: Yup.date().required("Fecha requerida."),
    descripcion_evento_materializado: Yup.string().required(
      "Descripción requerida."
    ),
    descripcion_accion_tomada: Yup.string().required("Acciones requeridas."),
    efectividad: Yup.number().min(1).max(5).required("Efectividad requerida."),
  });

  const fetchMaterializacionesByRiesgo = useCallback(
    async (riesgoId) => {
      if (!riesgoId) {
        setCurrentMaterializaciones([]);
        return;
      }
      try {
        const response = await axiosInstance.get(
          `/api/riesgos/${riesgoId}/materializaciones`
        );
        setCurrentMaterializaciones(response.data || []);
      } catch (err) {
        console.error("Error fetching materializaciones:", err);
        Toast.fire({
          icon: "error",
          title: "Error al cargar materializaciones.",
        });
        setCurrentMaterializaciones([]);
      }
    },
    [Toast]
  );

  useEffect(() => {
    if (showMaterializacionTablaModal && riesgoAEditar?.id_riesgo) {
      fetchMaterializacionesByRiesgo(riesgoAEditar.id_riesgo);
    }
  }, [
    showMaterializacionTablaModal,
    riesgoAEditar,
    fetchMaterializacionesByRiesgo,
  ]);

  const handleCrearMaterializacionRiesgo = async (
    values,
    { setSubmitting, resetForm }
  ) => {
    if (!riesgoAEditar?.id_riesgo) return;
    try {
      await axiosInstance.post(
        `/api/riesgos/${riesgoAEditar.id_riesgo}/materializaciones`,
        values
      );
      Toast.fire({ icon: "success", title: "Materialización creada!" });
      fetchMaterializacionesByRiesgo(riesgoAEditar.id_riesgo);
      setShowMaterializacionModal(false);
      resetForm();
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: err.response?.data?.message || "Error al crear materialización.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const materializacionesColumns = useMemo(
    () => [
      {
        accessorKey: "fecha_real_materializacion",
        header: "Fecha",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      { accessorKey: "descripcion_evento_materializado", header: "Evento" },
      { accessorKey: "descripcion_accion_tomada", header: "Acciones" },
      { accessorKey: "efectividad", header: "Efectividad" },
      { accessorKey: "nombre_registrador", header: "Registrado Por" },
    ],
    []
  );
  const materializacionesTable = useReactTable({
    data: currentMaterializaciones,
    columns: materializacionesColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const data = useMemo(() => filteredRiesgos, [filteredRiesgos]); // Usar filteredRiesgos para la tabla

  const summaryCardsData = useMemo(() => {
    const currentDataToSummarize = selectedProyectoIdRiesgos
      ? filteredRiesgos
      : allRiesgos;
    const total = currentDataToSummarize.length;
    const criticos = currentDataToSummarize.filter(
      (r) => r.probabilidad && r.impacto && r.probabilidad * r.impacto >= 50
    ).length;
    const activos = currentDataToSummarize.filter(
      (r) =>
        r.estado &&
        !["evitado", "mitigado", "transferido"].includes(r.estado.toLowerCase())
    ).length;
    return [
      { title: "Riesgos totales", icon: "👌", value: total },
      { title: "Riesgos críticos", icon: "⚠️", value: criticos },
      { title: "Riesgos activos", icon: "🍙", value: activos },
    ];
  }, [allRiesgos, filteredRiesgos, selectedProyectoIdRiesgos]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id_riesgo",
        header: "ID",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "descripcion",
        header: "Descripción",
        cell: (info) => (
          <span
            onClick={() => openEditorWithRisk(info.row.original)}
            style={{
              cursor: "pointer",
              color: "#2980b9",
              textDecoration: "underline",
            }}
            role="button"
            tabIndex={0}
            onKeyUp={(e) => {
              if (e.key === "Enter") openEditorWithRisk(info.row.original);
            }}
          >
            {info.getValue()}
          </span>
        ),
      },
      { accessorKey: "estado", header: "Estado" },
      {
        accessorKey: "nombre_proyecto",
        header: "Proyecto",
        cell: (info) => info.getValue() || "N/A",
      },
      {
        accessorKey: "fecha_de_identificacion",
        header: "Fecha Identificación",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      { accessorKey: "tipo", header: "Tipo" },
      { accessorKey: "categoria", header: "Categoría" },
      {
        accessorFn: (row) =>
          row.probabilidad && row.impacto ? row.probabilidad * row.impacto : 0,
        header: "Nivel Riesgo",
        cell: (info) => (
          <span className={severityClass(info.getValue())}>
            {info.getValue()}
          </span>
        ),
      },
      { accessorKey: "nombre_responsable", header: "Responsable" },
      { accessorKey: "plan_respuesta", header: "Plan Respuesta" },
    ],
    [openEditorWithRisk]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 5 } },
  });

  if (loading && allRiesgos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px", fontSize: "1.2em" }}>
        Cargando riesgos...
      </div>
    );
  }
  if (error && allRiesgos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <header className="fr-header">
        <div className="fr-header-title-container">
          <h1 className="fr-header-title">Gestión de Riesgos</h1>
          {area && <p className="fr-header-area">Área: {area}</p>}
        </div>
        <span className="fr-header-badge">Sigar - 2025</span>
      </header>

      <section className="fr-summary-section">
        <div className="fr-cards-container">
          {summaryCardsData.map((card, index) => (
            <div className="fr-card" key={index} style={{height: "200px"}}>
              <div className="fr-card-info">
                <span className="fr-card-icon">{card.icon}</span>
                <p className="fr-card-title">{card.title}</p>
              </div>
              <p className="fr-card-value">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="fr-matrix-container">
          <h2 className="fr-matrix-title">Matriz de Evaluación de Riesgos</h2>
          <table className="fr-matrix-table">
            <caption>Probabilidad / Impacto</caption>
            <thead>
              <tr>
                <th rowSpan={2} colSpan={2}>
                  Probabilidad/Impacto
                </th>
                {impacts.map((impact, index) => (
                  <th key={index}>{impact.level}</th>
                ))}
              </tr>
              <tr>
                {impacts.map((impact, index) => (
                  <th key={index}>{impact.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {probabilities.map((probability, index) => (
                <tr key={index}>
                  <th scope="row">{probability.level}</th>
                  <th scope="row">{probability.label}</th>
                  {impacts.map((impact, idx) => (
                    <td
                      key={idx}
                      style={{ textAlign: "center" }}
                      className={severityClass(
                        impact.level * probability.level
                      )}
                    >
                      {impact.level * probability.level}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fr-actions-section">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          placeholder="Buscar en todos los campos..."
          className="fr-search-input"
        />
        <select
          name="filtro_proyecto_riesgos"
          className="fr-project-filter-select" // Asegúrate de que esta clase exista en tu CSS o añade estilos
          value={selectedProyectoIdRiesgos}
          onChange={(e) => setSelectedProyectoIdRiesgos(e.target.value)}
        >
          <option value="">Todos los Proyectos</option>
          {proyectosLista.map((proyecto) => (
            <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
              {proyecto.nombre_proyecto}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCrearModal(true)}
          className="fr-add-button"
        >
          <span className="fr-add-button-icon">➕</span>
          <span>Agregar Riesgo</span>
        </button>
      </section>

      <main className="fr-main-table-section">
        <table className="fr-main-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort() ? "sortable-header" : ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{ asc: " 🔼", desc: " 🔽" }[header.column.getIsSorted()] ??
                      (header.column.getCanSort() ? " ↕️" : "")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  {loading
                    ? "Cargando riesgos..."
                    : globalFilter
                    ? `No se encontraron riesgos para "${globalFilter}"`
                    : selectedProyectoIdRiesgos
                    ? `No hay riesgos para el proyecto seleccionado.`
                    : "No hay riesgos para mostrar."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="fr-pagination-controls">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="fr-pagination-button"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="fr-pagination-button"
          >
            {"<"}
          </button>
          <span className="fr-pagination-info">
            Página{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="fr-pagination-button"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="fr-pagination-button"
          >
            {">>"}
          </button>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="fr-pagination-select"
          >
            {[5, 10, 15, 20].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Mostrar {pageSize}
              </option>
            ))}
          </select>
        </div>
      </main>

      {showCrearModal && (
        <div className="fr-modal-overlay">
          <div className="fr-modal fr-crear-riesgo-modal">
            <button
              onClick={() => setShowCrearModal(false)}
              className="fr-modal-close-button"
            >
              <FiX />
            </button>
            <header>
              <h2>Nuevo Riesgo Identificado</h2>
              <p className="modal-subtitle-v2">
                Complete la información para documentar un nuevo riesgo.
              </p>
            </header>
            <section>
              <div className="modal-info-icon-v2">
                <FiInfo />
              </div>
              <Formik
                initialValues={{
                  ...initialValuesCrear,
                  // id_proyecto ya se maneja en initialValuesCrear con selectedProyectoIdRiesgos
                  id_responsable: user?.id_empleado || "",
                  nombre_responsable_sesion: user?.nombres || "Cargando...",
                }}
                validationSchema={validationSchemaCrear}
                onSubmit={handleCrearRiesgo}
                enableReinitialize
              >
                {({ isSubmitting, dirty, isValid, values }) => (
                  <Form>
                    <div className="form-group">
                      <label htmlFor="descripcion_crear">
                        <FiFileText /> Descripción
                      </label>
                      <Field
                        as="textarea"
                        name="descripcion"
                        id="descripcion_crear"
                      />
                      <ErrorMessage
                        name="descripcion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="fecha_de_identificacion_crear">
                          <FiCalendar /> Fecha Identificación
                        </label>
                        <Field
                          type="date"
                          name="fecha_de_identificacion"
                          id="fecha_de_identificacion_crear"
                        />
                        <ErrorMessage
                          name="fecha_de_identificacion"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="estado_crear">
                          <FiActivity /> Estado
                        </label>
                        <Field as="select" name="estado" id="estado_crear">
                          <option value="identificado">Identificado</option>
                          <option value="cercano">Cercano</option>
                          <option value="disparado">Disparado</option>
                          <option value="evitado">Evitado</option>
                          <option value="mitigado">Mitigado</option>
                          <option value="aceptado">Aceptado</option>
                          <option value="transferido">Transferido</option>
                        </Field>
                        <ErrorMessage
                          name="estado"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="tipo_crear">
                          <FiAlertTriangle /> Tipo
                        </label>
                        <Field as="select" name="tipo" id="tipo_crear">
                          <option value="Negativo">Negativo</option>
                          <option value="Positivo">Positivo</option>
                        </Field>
                        <ErrorMessage
                          name="tipo"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="categoria_crear">
                          <FiTag /> Categoría
                        </label>
                        <Field
                          as="select"
                          name="categoria"
                          id="categoria_crear"
                        >
                          <option value="Técnico">Técnico</option>
                          <option value="Diseño">Diseño</option>
                          <option value="Recurso Humano">Recurso Humano</option>
                          <option value="Recurso Fisíco">Recurso Físico</option>
                          <option value="Recurso Humano">
                            Recurso Técnico
                          </option>
                          <option value="Externo">Externo</option>
                        </Field>
                        <ErrorMessage
                          name="categoria"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="probabilidad_crear">
                          <FiTrendingDown /> Probabilidad
                        </label>
                        <Field
                          as="select"
                          name="probabilidad"
                          id="probabilidad_crear"
                        >
                          {probabilities.map((p) => (
                            <option key={p.level} value={p.level}>
                              {p.level} - {p.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="probabilidad"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="impacto_crear">
                          <FiZap /> Impacto
                        </label>
                        <Field as="select" name="impacto" id="impacto_crear">
                          {impacts.map((i) => (
                            <option key={i.level} value={i.level}>
                              {i.level} - {i.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="impacto"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="justificacion_crear">
                        <FiMessageSquare /> Justificación Evaluación Inicial
                      </label>
                      <Field
                        as="textarea"
                        name="justificacion"
                        id="justificacion_crear"
                        placeholder="Justificación para la probabilidad e impacto iniciales."
                      />
                      <ErrorMessage
                        name="justificacion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="nombre_responsable_sesion_crear">
                        <FiUsers /> Responsable
                      </label>
                      <Field
                        type="text"
                        name="nombre_responsable_sesion"
                        id="nombre_responsable_sesion_crear"
                        disabled={true}
                        placeholder={values.nombre_responsable_sesion}
                        value={
                          values.nombre_responsable_sesion ||
                          "Cargando responsable..."
                        }
                      />
                      <Field type="hidden" name="id_responsable" />
                      <ErrorMessage
                        name="id_responsable"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="id_proyecto_crear">
                        <FiBriefcase /> Proyecto
                      </label>
                      <Field
                        as="select"
                        name="id_proyecto"
                        id="id_proyecto_crear"
                      >
                        <option value="">
                          Seleccione un Proyecto (si aplica)
                        </option>
                        {proyectosLista.map((proyecto) => (
                          <option
                            key={proyecto.id_proyecto}
                            value={proyecto.id_proyecto}
                          >
                            {proyecto.nombre_proyecto}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name="id_proyecto"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <h3 className="modal-section-title">
                      <FiClipboard /> Planificación
                    </h3>
                    <div className="form-group">
                      <label htmlFor="fecha_probable_materializacion_crear">
                        <FiCalendar /> Fecha Probable Materialización
                      </label>
                      <Field
                        type="date"
                        name="fecha_probable_materializacion"
                        id="fecha_probable_materializacion_crear"
                      />
                      <ErrorMessage
                        name="fecha_probable_materializacion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="evento_disparador_crear">
                        <FiActivity /> Evento Disparador
                      </label>
                      <Field
                        as="textarea"
                        name="evento_disparador"
                        id="evento_disparador_crear"
                      />
                      <ErrorMessage
                        name="evento_disparador"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="posibles_consecuencias_crear">
                        <FiAlertTriangle /> Posibles Consecuencias
                      </label>
                      <Field
                        as="textarea"
                        name="posibles_consecuencias"
                        id="posibles_consecuencias_crear"
                      />
                      <ErrorMessage
                        name="posibles_consecuencias"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="plan_respuesta_crear">
                        <FiShield /> Plan Respuesta
                      </label>
                      <Field
                        as="select"
                        name="plan_respuesta"
                        id="plan_respuesta_crear"
                      >
                        <option value="evitar">Evitar</option>
                        <option value="transferir">Transferir</option>
                        <option value="mitigar">Mitigar</option>
                        <option value="aceptar">Aceptar</option>
                      </Field>
                      <ErrorMessage
                        name="plan_respuesta"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="descripcion_plan_respuesta_crear">
                        <FiMessageSquare /> Descripción Plan
                      </label>
                      <Field
                        as="textarea"
                        name="descripcion_plan_respuesta"
                        id="descripcion_plan_respuesta_crear"
                      />
                      <ErrorMessage
                        name="descripcion_plan_respuesta"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <footer style={{ marginTop: "20px" }}>
                      <button
                        type="button"
                        onClick={() => setShowCrearModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !isValid || !dirty}
                      >
                        {isSubmitting ? "Guardando..." : "Guardar Riesgo"}
                      </button>
                    </footer>
                  </Form>
                )}
              </Formik>
            </section>
          </div>
        </div>
      )}

      {showEditarModal && riesgoAEditar && (
        <div className="fr-modal-overlay">
          <div className="fr-modal fr-editar-riesgo-modal">
            <button
              onClick={() => {
                setShowEditarModal(false);
                setRiesgoAEditar(null);
              }}
              className="fr-modal-close-button"
            >
              <FiX />
            </button>
            <header>
              <h2>Editar Riesgo (ID: {riesgoAEditar.id_riesgo})</h2>
              <p className="modal-subtitle-v2">
                Actualice la información del riesgo.
              </p>
            </header>
            <section>
              <div className="modal-info-icon-v2">
                <FiInfo />
              </div>
              <Formik
                initialValues={riesgoAEditar}
                validationSchema={validationSchemaCrear}
                onSubmit={handleEditarRiesgo}
                enableReinitialize
              >
                {({ isSubmitting, dirty, isValid }) => (
                  <Form>
                    <h3 className="modal-section-title">
                      <FiFileText /> Información Básica
                      <button
                        type="button"
                        className="fr-modal-action-button"
                        onClick={() => setShowEvaluarRiesgoTablaModal(true)}
                      >
                        <FiBarChart2 /> Evaluar
                      </button>
                      <button
                        type="button"
                        className="fr-modal-action-button"
                        onClick={() => setShowMaterializacionTablaModal(true)}
                      >
                        <FiTrendingUp /> Materializar
                      </button>
                    </h3>
                    <div className="form-group">
                      <label htmlFor="descripcion_editar">
                        <FiFileText /> Descripción
                      </label>
                      <Field
                        as="textarea"
                        name="descripcion"
                        id="descripcion_editar"
                      />
                      <ErrorMessage
                        name="descripcion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="fecha_de_identificacion_editar">
                          <FiCalendar /> Fecha Identificación
                        </label>
                        <Field
                          type="date"
                          name="fecha_de_identificacion"
                          id="fecha_de_identificacion_editar"
                        />
                        <ErrorMessage
                          name="fecha_de_identificacion"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="estado_editar">
                          <FiActivity /> Estado
                        </label>
                        <Field as="select" name="estado" id="estado_editar">
                          <option value="identificado">Identificado</option>
                          <option value="cercano">Cercano</option>
                          <option value="disparado">Disparado</option>
                          <option value="evitado">Evitado</option>
                          <option value="mitigado">Mitigado</option>
                          <option value="aceptado">Aceptado</option>
                          <option value="transferido">Transferido</option>
                        </Field>
                        <ErrorMessage
                          name="estado"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="tipo_editar">
                          <FiAlertTriangle /> Tipo
                        </label>
                        <Field as="select" name="tipo" id="tipo_editar">
                          <option value="Negativo">Negativo</option>
                          <option value="Positivo">Positivo</option>
                        </Field>
                        <ErrorMessage
                          name="tipo"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="categoria_editar">
                          <FiTag /> Categoría
                        </label>
                        <Field
                          as="select"
                          name="categoria"
                          id="categoria_editar"
                        >
                          <option value="Técnico">Técnico</option>
                          <option value="Diseño">Diseño</option>
                          <option value="Recurso Humano">Recurso Humano</option>
                          <option value="Externo">Externo</option>
                        </Field>
                        <ErrorMessage
                          name="categoria"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="id_responsable_editar">
                        <FiUsers /> Responsable (ID)
                      </label>
                      <Field
                        type="text"
                        name="id_responsable"
                        id="id_responsable_editar"
                        disabled={true}
                      />
                      <ErrorMessage
                        name="id_responsable"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="id_proyecto_editar">
                        <FiBriefcase /> Proyecto
                      </label>
                      <Field
                        as="select"
                        name="id_proyecto"
                        id="id_proyecto_editar"
                      >
                        <option value="">
                          Seleccione un Proyecto (si aplica)
                        </option>
                        {proyectosLista.map((proyecto) => (
                          <option
                            key={proyecto.id_proyecto}
                            value={proyecto.id_proyecto}
                          >
                            {proyecto.nombre_proyecto}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name="id_proyecto"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <h3 className="modal-section-title">
                      <FiClipboard /> Planificación
                    </h3>
                    <div className="form-group">
                      <label htmlFor="fecha_probable_materializacion_editar">
                        <FiCalendar /> Fecha Probable Materialización
                      </label>
                      <Field
                        type="date"
                        name="fecha_probable_materializacion"
                        id="fecha_probable_materializacion_editar"
                      />
                      <ErrorMessage
                        name="fecha_probable_materializacion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="evento_disparador_editar">
                        <FiActivity /> Evento Disparador
                      </label>
                      <Field
                        as="textarea"
                        name="evento_disparador"
                        id="evento_disparador_editar"
                      />
                      <ErrorMessage
                        name="evento_disparador"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="posibles_consecuencias_editar">
                        <FiAlertTriangle /> Posibles Consecuencias
                      </label>
                      <Field
                        as="textarea"
                        name="posibles_consecuencias"
                        id="posibles_consecuencias_editar"
                      />
                      <ErrorMessage
                        name="posibles_consecuencias"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="plan_respuesta_editar">
                        <FiShield /> Plan Respuesta
                      </label>
                      <Field
                        as="select"
                        name="plan_respuesta"
                        id="plan_respuesta_editar"
                      >
                        <option value="evitar">Evitar</option>
                        <option value="transferir">Transferir</option>
                        <option value="mitigar">Mitigar</option>
                        <option value="aceptar">Aceptar</option>
                      </Field>
                      <ErrorMessage
                        name="plan_respuesta"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="descripcion_plan_respuesta_editar">
                        <FiMessageSquare /> Descripción Plan
                      </label>
                      <Field
                        as="textarea"
                        name="descripcion_plan_respuesta"
                        id="descripcion_plan_respuesta_editar"
                      />
                      <ErrorMessage
                        name="descripcion_plan_respuesta"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <footer style={{ marginTop: "20px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditarModal(false);
                          setRiesgoAEditar(null);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !isValid || !dirty}
                      >
                        {isSubmitting ? "Actualizando..." : "Actualizar Riesgo"}
                      </button>
                    </footer>
                  </Form>
                )}
              </Formik>
            </section>
          </div>
        </div>
      )}

      {showMaterializacionTablaModal && riesgoAEditar && (
        <div className="fr-modal-overlay">
          <div
            className="fr-modal fr-materializacion-tabla-modal"
            style={{ zIndex: 1050 }}
          >
            <button
              onClick={() => setShowMaterializacionTablaModal(false)}
              className="fr-modal-close-button"
            >
              <FiX />
            </button>
            <header>
              <h2>
                Historial de Materializaciones: {riesgoAEditar.descripcion}
              </h2>
            </header>
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "15px",
                }}
              >
                <button
                  onClick={() => setShowMaterializacionModal(true)}
                  className="fr-add-button"
                >
                  <span>➕</span> Registrar Materialización
                </button>
              </div>
              <table className="fr-main-table">
                <thead>
                  {materializacionesTable.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th key={h.id}>
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {materializacionesTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentMaterializaciones.length === 0 && (
                <p>No hay materializaciones registradas.</p>
              )}
            </section>
          </div>
        </div>
      )}

      {showMaterializacionModal && riesgoAEditar && (
        <div className="fr-modal-overlay">
          <div
            className="fr-modal fr-crear-materializacion-modal"
            style={{ zIndex: 1060 }}
          >
            <button
              onClick={() => setShowMaterializacionModal(false)}
              className="fr-modal-close-button"
            >
              <FiX />
            </button>
            <header>
              <h2>Registrar Materialización de Riesgo</h2>
            </header>
            <section>
              <Formik
                initialValues={initialValuesMaterializarRiesgo}
                validationSchema={validationSchemaMaterializarRiesgo}
                onSubmit={handleCrearMaterializacionRiesgo}
              >
                {({ isSubmitting, dirty, isValid }) => (
                  <Form>
                    <div className="form-group">
                      <label htmlFor="fecha_real_materializacion_mat">
                        <FiCalendar /> Fecha Real
                      </label>
                      <Field
                        type="date"
                        name="fecha_real_materializacion"
                        id="fecha_real_materializacion_mat"
                      />
                      <ErrorMessage
                        name="fecha_real_materializacion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="descripcion_evento_materializado_mat">
                        <FiAlertTriangle /> Descripción Evento
                      </label>
                      <Field
                        as="textarea"
                        name="descripcion_evento_materializado"
                        id="descripcion_evento_materializado_mat"
                      />
                      <ErrorMessage
                        name="descripcion_evento_materializado"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="descripcion_accion_tomada_mat">
                        <FiShield /> Acciones Tomadas
                      </label>
                      <Field
                        as="textarea"
                        name="descripcion_accion_tomada"
                        id="descripcion_accion_tomada_mat"
                      />
                      <ErrorMessage
                        name="descripcion_accion_tomada"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="consecuencias_reales_detalladas_mat">
                        <FiFileText /> Consecuencias Reales
                      </label>
                      <Field
                        as="textarea"
                        name="consecuencias_reales_detalladas"
                        id="consecuencias_reales_detalladas_mat"
                      />
                      <ErrorMessage
                        name="consecuencias_reales_detalladas"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="efectividad_mat">
                        <FiTrendingUp /> Efectividad (1-5)
                      </label>
                      <Field
                        as="select"
                        name="efectividad"
                        id="efectividad_mat"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </Field>
                      <ErrorMessage
                        name="efectividad"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="notas_mat">
                        <FiMessageSquare /> Notas
                      </label>
                      <Field as="textarea" name="notas" id="notas_mat" />
                      <ErrorMessage
                        name="notas"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <footer style={{ marginTop: "20px" }}>
                      <button
                        type="button"
                        onClick={() => setShowMaterializacionModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !isValid || !dirty}
                      >
                        {isSubmitting ? "Guardando..." : "Guardar"}
                      </button>
                    </footer>
                  </Form>
                )}
              </Formik>
            </section>
          </div>
        </div>
      )}

      {showEvaluarRiesgoModal && riesgoAEditar && (
        <div className="fr-modal-overlay" style={{ zIndex: 1060 }}>
          <div
            className="fr-modal fr-evaluar-riesgo-form-modal"
            style={{ zIndex: 1060 }}
          >
            <button
              onClick={() => setShowEvaluarRiesgoModal(false)}
              className="fr-modal-close-button"
            >
              <FiX />
            </button>
            <header>
              <h2>Registrar Nueva Evaluación de Riesgo</h2>
            </header>
            <section>
              <Formik
                initialValues={initialValuesEvaluarRiesgo}
                validationSchema={validationSchemaEvaluarRiesgo}
                onSubmit={handleCrearEvaluacionRiesgo}
              >
                {({ isSubmitting, dirty, isValid }) => (
                  <Form>
                    <div className="form-group">
                      <label htmlFor="fecha_evaluacion_eval">
                        <FiCalendar /> Fecha Evaluación
                      </label>
                      <Field
                        type="date"
                        name="fecha_evaluacion"
                        id="fecha_evaluacion_eval"
                      />
                      <ErrorMessage
                        name="fecha_evaluacion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "15px",
                      }}
                    >
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="probabilidad_eval">
                          <FiTrendingDown /> Probabilidad
                        </label>
                        <Field
                          as="select"
                          name="probabilidad"
                          id="probabilidad_eval"
                        >
                          {probabilities.map((p) => (
                            <option key={p.level} value={p.level}>
                              {p.level} - {p.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="probabilidad"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="impacto_eval">
                          <FiZap /> Impacto
                        </label>
                        <Field as="select" name="impacto" id="impacto_eval">
                          {impacts.map((i) => (
                            <option key={i.level} value={i.level}>
                              {i.level} - {i.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="impacto"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="justificacion_eval">
                        <FiMessageSquare /> Justificación
                      </label>
                      <Field
                        as="textarea"
                        name="justificacion"
                        id="justificacion_eval"
                      />
                      <ErrorMessage
                        name="justificacion"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <footer style={{ marginTop: "20px" }}>
                      <button
                        type="button"
                        onClick={() => setShowEvaluarRiesgoModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !isValid || !dirty}
                      >
                        {isSubmitting ? "Guardando..." : "Guardar"}
                      </button>
                    </footer>
                  </Form>
                )}
              </Formik>
            </section>
          </div>
        </div>
      )}

      {showEvaluarRiesgoTablaModal && riesgoAEditar && (
        <div className="fr-modal-overlay">
          <div
            className="fr-modal fr-evaluacion-tabla-modal"
            style={{ zIndex: 1050 }}
          >
            <button
              onClick={() => setShowEvaluarRiesgoTablaModal(false)}
              className="fr-modal-close-button"
            >
              <FiX />
            </button>
            <header>
              <h2>Historial de Evaluaciones: {riesgoAEditar.descripcion}</h2>
            </header>
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "15px",
                }}
              >
                <button
                  onClick={() => setShowEvaluarRiesgoModal(true)}
                  className="fr-add-button"
                >
                  <span>➕</span> Nueva Evaluación
                </button>
              </div>
              <table className="fr-main-table">
                <thead>
                  {evaluacionesTable.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th key={h.id}>
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {evaluacionesTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentEvaluaciones.length === 0 && (
                <p>No hay evaluaciones registradas.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export { FormularioRiesgos };
