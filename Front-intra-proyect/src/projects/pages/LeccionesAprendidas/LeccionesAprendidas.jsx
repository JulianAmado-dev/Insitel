import { useState, useEffect, useMemo, useCallback } from "react"; // Import React Hooks
import { useParams, useSearchParams } from "react-router-dom"; // Added useSearchParams
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import Swal from "sweetalert2";
import { axiosInstance } from "@api/axiosInstance"; // Added for integrated services

// import * LeccionesAprendidasModal from './LeccionesAprendidasModal'; // Ejemplo si se crea un componente modal separado
import { Formik, Form, Field, ErrorMessage } from "formik";
import { leccionAprendidaValidationSchema } from "@schemas/schemas"; // Ruta corregida
import {
  FiFileText,
  FiAlertTriangle,
  FiTarget,
  FiTool,
  FiMessageCircle,
  FiChevronUp,
  FiChevronDown,
  FiPlusCircle,
  FiInfo,
  FiX,
  FiUser,
  FiCalendar,
  FiBriefcase, // For "Tipo de Lección" or "Área/Categoría"
} from "react-icons/fi";
import { Tag, Target, Presentation } from "lucide-react";
import { FaStar, FaSort } from "react-icons/fa";
import "./LeccionesAprendidas.css";
// import { max } from "lodash"; // Removed unused import

// --- API URLs ---
const LECCIONES_API_URL = "/api/lecciones-aprendidas";
const PROYECTOS_API_URL = "/api/proyectos/listado-simple";

// Define Toast instance outside the component to ensure it's stable
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

function LeccionesAprendidas() {
  const [lecciones, setLecciones] = useState([]);
  const [allLecciones, setAllLecciones] = useState([]); // To store all fetched lecciones before filtering
  const [proyectosLista, setProyectosLista] = useState([]); // For project dropdown in modals
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial fetch
  const [error, setError] = useState(null); // Error state for initial fetch
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [leccionAEditar, setLeccionAEditar] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const { area } = useParams(); // Assuming area is passed as a URL parameter

  // Use the stable ToastInstance
  const Toast = ToastInstance;

  // --- In-component API call functions ---
  const fetchLeccionesData = useCallback(async () => {
    try {
      const response = await axiosInstance.get(LECCIONES_API_URL);
      return response.data;
    } catch (err) {
      console.error(
        "Error fetching lecciones:",
        err.response?.data || err.message
      );
      throw (
        err.response?.data ||
        new Error("Error al obtener las lecciones aprendidas.")
      );
    }
  }, []);

  const createLeccionData = useCallback(async (leccionData) => {
    try {
      if (leccionData.id_proyecto) {
        leccionData.id_proyecto = parseInt(leccionData.id_proyecto, 10);
      }
      const response = await axiosInstance.post(LECCIONES_API_URL, leccionData);
      return response.data;
    } catch (err) {
      console.error(
        "Error creating leccion:",
        err.response?.data || err.message
      );
      throw (
        err.response?.data || new Error("Error al crear la lección aprendida.")
      );
    }
  }, []);

  const updateLeccionData = useCallback(async (id, leccionData) => {
    try {
      if (leccionData.id_proyecto) {
        leccionData.id_proyecto = parseInt(leccionData.id_proyecto, 10);
      }
      const response = await axiosInstance.put(
        `${LECCIONES_API_URL}/${id}`,
        leccionData
      );
      return response.data;
    } catch (err) {
      console.error(
        `Error updating leccion ${id}:`,
        err.response?.data || err.message
      );
      throw (
        err.response?.data ||
        new Error(`Error al actualizar la lección aprendida ${id}.`)
      );
    }
  }, []);

  const fetchProyectosListData = useCallback(async () => {
    try {
      const response = await axiosInstance.get(PROYECTOS_API_URL);
      return response.data;
    } catch (err) {
      console.error(
        "Error fetching proyectos list:",
        err.response?.data || err.message
      );
      throw (
        err.response?.data ||
        new Error("Error al obtener la lista de proyectos.")
      );
    }
  }, []);
  // --- End In-component API call functions ---

  // Nuevos estados para filtros
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedProyectoId, setSelectedProyectoId] = useState("");
  const [searchParams] = useSearchParams(); // For reading URL query parameters

  // Estados para paginación de tarjetas
  const [currentPageCards, setCurrentPageCards] = useState(1);
  const [itemsPerPageCards, setItemsPerPageCards] = useState(8);

  // Fetch initial data (lecciones and proyectos for dropdown)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedLecciones, fetchedProyectos] = await Promise.all([
          fetchLeccionesData(),
          fetchProyectosListData(),
        ]);
        setAllLecciones(fetchedLecciones);
        // setLecciones(fetchedLecciones); // Filtering will handle this
        setProyectosLista(fetchedProyectos);

        // Check for projectId from URL and set it for initial filter
        const projectIdFromUrl = searchParams.get("proyecto");
        if (projectIdFromUrl) {
          setSelectedProyectoId(projectIdFromUrl);
        } else {
          setLecciones(fetchedLecciones); // If no project filter, show all (or apply other default filters)
        }
      } catch (err) {
        const errorMessage = err.message || "Error al cargar datos iniciales.";
        setError(errorMessage);
        Toast.fire({
          icon: "error",
          title: `Error al cargar datos: ${errorMessage}`,
        });
        console.error("Error loading initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [fetchLeccionesData, fetchProyectosListData, Toast, searchParams]);

  // Effect for filtering based on selectedArea, selectedTipo, selectedProyectoId, globalFilter
  useEffect(() => {
    let filteredData = [...allLecciones];

    if (selectedArea) {
      filteredData = filteredData.filter(
        (leccion) => leccion.area_categoria === selectedArea
      );
    }

    if (selectedTipo) {
      filteredData = filteredData.filter(
        (leccion) => leccion.tipo_leccion === selectedTipo
      );
    }

    // This filter is now prioritized by the initial load effect if projectId is in URL
    if (selectedProyectoId) {
      const projectId = parseInt(selectedProyectoId, 10);
      filteredData = filteredData.filter(
        (leccion) => leccion.id_proyecto === projectId
      );
    }

    if (globalFilter) {
      const lowerGlobalFilter = globalFilter.toLowerCase();
      filteredData = filteredData.filter((leccion) =>
        Object.values(leccion).some((value) =>
          String(value).toLowerCase().includes(lowerGlobalFilter)
        )
      );
    }

    setLecciones(filteredData);
    setCurrentPageCards(1); // Resetear paginación de tarjetas al filtrar
    // Si la tabla no se resetea automáticamente, se necesitaría: table.setPageIndex(0);
    // This effect should also re-run if allLecciones changes (e.g., after create/update)
  }, [
    selectedArea,
    selectedTipo,
    selectedProyectoId,
    globalFilter,
    allLecciones,
  ]);

  // Cálculos para la paginación de tarjetas
  const indexOfLastItemCard = currentPageCards * itemsPerPageCards;
  const indexOfFirstItemCard = indexOfLastItemCard - itemsPerPageCards;
  const currentLeccionesCards = lecciones.slice(
    indexOfFirstItemCard,
    indexOfLastItemCard
  );
  const totalPagesCards = Math.ceil(lecciones.length / itemsPerPageCards);

  const handleOpenCrearModal = () => {
    setShowCrearModal(true);
  };

  const handleCloseCrearModal = () => {
    setShowCrearModal(false);
  };

  const handleOpenEditarModal = useCallback((leccion) => {
    setLeccionAEditar(leccion);
    setShowEditarModal(true);
  }, []);

  const handleCloseEditarModal = () => {
    setLeccionAEditar(null);
    setShowEditarModal(false);
  };

  const handleCrearLeccion = async (values, { setSubmitting, resetForm }) => {
    setSubmitting(true);
    setError(null);
    try {
      await createLeccionData(values);
      const fetchedLecciones = await fetchLeccionesData();
      // console.log("Fetched Lecciones after create:", fetchedLecciones);
      setAllLecciones(fetchedLecciones);
      resetForm();
      setShowCrearModal(false);
      Toast.fire({
        icon: "success",
        title: "Lección creada exitosamente!",
      });
    } catch (err) {
      console.error("Error creating leccion:", err);
      const errorMessage = err.message || "Error al crear la lección.";
      setError(errorMessage);
      Toast.fire({
        icon: "error",
        title: `Error: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditarLeccion = async (values, { setSubmitting }) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateLeccionData(values.id_leccion_aprendida, values);
      const fetchedLecciones = await fetchLeccionesData();
      setAllLecciones(fetchedLecciones);
      setShowEditarModal(false);
      Toast.fire({
        icon: "success",
        title: "Lección actualizada exitosamente!",
      });
    } catch (err) {
      console.error("Error updating leccion:", err);
      const errorMessage = err.message || "Error al actualizar la lección.";
      setError(errorMessage);
      Toast.fire({
        icon: "error",
        title: `Error: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const initialValuesCrear = {
    id_proyecto: "",
    titulo: "",
    area_categoria: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion_situacion: "",
    descripcion_impacto: "",
    acciones_correctivas: "",
    leccion_aprendida_recomendaciones: "",
    reportado_por: "",
    tipo_leccion: "Oportunidad",
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "titulo",
        header: "Título",
        /* size: 30, */
        cell: (info) => (
          <span
            onClick={() => handleOpenEditarModal(info.row.original)}
            style={{
              cursor: "pointer",
              color: "#2980b9",
              textDecoration: "underline",
            }}
            role="button"
            tabIndex={0}
            onKeyUp={(e) => {
              if (e.key === "Enter") handleOpenEditarModal(info.row.original);
            }}
          >
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: "nombre_proyecto", // Corrected to match the API field name
        header: "Nombre del Proyecto",
        cell: (info) => {
          // info.getValue() will correctly use the accessorKey "nombre_proyecto"
          return info.getValue() || "N/A";
        },
      },
      { accessorKey: "area_categoria", header: "Área/Categoría" },
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      { accessorKey: "tipo_leccion", header: "Tipo de Lección" },
      { accessorKey: "creado_por_nombre", header: "Creado Por" },
      { accessorKey: "reportado_por", header: "Reportado Por" },
    ],
    [handleOpenEditarModal]
  );

  const table = useReactTable({
    data: lecciones,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 5 } },
    enableColumnResizing: true, // Enable column resizing
    columnResizeMode: "onEnd", // Recommended mode
  });

  const [viewMode, setViewMode] = useState("table");

  if (isLoading) {
    return (
      <div className="lecciones-aprendidas-container">
        <p>Cargando lecciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lecciones-aprendidas-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="lecciones-aprendidas-container">
      <div className="titulo-pagina-contenedor">
        <div className="logo-area-header">
          <span className="logo-placeholder-header">DI</span>{" "}
          {`Dirección - ${area}`}
        </div>
        <hr className="linea-separadora-header" />
      </div>
      <div className="pagina-cabecera">
        <h1>
          Registro de Lecciones Aprendidas
          <FaStar
            style={{
              marginLeft: "10px",
              color: "#f39c12",
              verticalAlign: "middle",
            }}
          />
        </h1>
        <div className="acciones-cabecera">
          <button onClick={handleOpenCrearModal} className="btn-nueva-leccion">
            <FiPlusCircle
              style={{
                marginRight: "5px",
                verticalAlign: "middle",
                width: "20px",
                height: "20px",
              }}
            />{" "}
            Nueva lección
          </button>
        </div>
      </div>

      <div className="filtros-y-vistas-container">
        <div className="filtros-principales">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por título, descripción o persona..."
            className="filtro-busqueda-principal"
          />
          <div className="filtros-selectores">
            <select
              name="filtro_area_categoria_visual"
              className="selector-filtro"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="">Área/Categoría</option>
              {[
                ...new Set(
                  allLecciones.map((item) => item.area_categoria) // Use allLecciones for dynamic options
                ),
              ]
                .sort()
                .map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
            </select>
            <select
              name="filtro_tipo_leccion_visual"
              className="selector-filtro"
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
            >
              <option value="">Tipo de Lección</option>
              <option value="Oportunidad">Oportunidad</option>
              <option value="Amenaza">Amenaza</option>
            </select>
            <select
              name="filtro_proyecto_visual"
              className="selector-filtro"
              value={selectedProyectoId}
              onChange={(e) => setSelectedProyectoId(e.target.value)}
            >
              <option value="">Todos los Proyectos</option>
              {proyectosLista.map((proyecto) => (
                <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                  {proyecto.nombre_proyecto}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="controles-vista">
          <button
            onClick={() => setViewMode("table")}
            className={`btn-vista ${viewMode === "table" ? "activo" : ""}`}
          >
            Vista de tabla
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`btn-vista ${viewMode === "card" ? "activo" : ""}`}
          >
            Vista de tarjetas
          </button>
        </div>
      </div>

      {viewMode === "table" && (
        <>
          <div className="tabla-responsive-container">
            <table
              className="tabla-lecciones"
              style={{
                width: table.getTotalSize(),
                borderCollapse: "collapse",
              }}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          width: header.getSize(),
                          position: "relative",
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? "sortable-header"
                                  : "",
                                onClick:
                                  header.column.getToggleSortingHandler(),
                                style: {
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                },
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: (
                                  <FiChevronUp style={{ marginLeft: "4px" }} />
                                ),
                                desc: (
                                  <FiChevronDown
                                    style={{ marginLeft: "4px" }}
                                  />
                                ),
                              }[header.column.getIsSorted()] ??
                                (header.column.getCanSort() ? (
                                  <FaSort
                                    style={{ marginLeft: "4px", opacity: 0.3 }}
                                  />
                                ) : null)}
                            </div>
                            {header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                style={{
                                  userSelect: "none",
                                  touchAction: "none",
                                  position: "absolute",
                                  right: 0,
                                  top: 0,
                                  height: "100%",
                                  width: "3px",
                                }}
                                className={`resizer ${
                                  header.column.getIsResizing()
                                    ? "isResizing"
                                    : ""
                                }`}
                              />
                            )}
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
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
          </div>
          {lecciones.length === 0 && !globalFilter && (
            <p className="mensaje-no-datos">
              No hay lecciones aprendidas para mostrar.
            </p>
          )}
          {lecciones.length > 0 &&
            table.getRowModel().rows.length === 0 &&
            globalFilter && (
              <p className="mensaje-no-datos">{`No se encontraron resultados para: "${globalFilter}".`}</p>
            )}
          <div className="paginacion-controles">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <span>
              Página{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} de{" "}
                {table.getPageCount()}
              </strong>{" "}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </button>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Mostrar {pageSize}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {viewMode === "card" && (
        <>
          <div className="vista-tarjetas-container">
            {currentLeccionesCards.map((leccion) => (
              <div key={leccion.id_leccion_aprendida} className="leccion-card">
                <div className="card-cabecera">
                  <span
                    className={`tag-tipo ${leccion.tipo_leccion?.toLowerCase()}`}
                  >
                    {leccion.tipo_leccion}
                  </span>
                  <span className="tag-area">{leccion.area_categoria}</span>
                </div>
                <h3>{leccion.titulo}</h3>
                <p className="card-proyecto">{leccion.proyecto_nombre}</p>
                <p className="card-descripcion-corta">
                  {leccion.descripcion_situacion.substring(0, 100)}...
                </p>
                <div className="card-footer">
                  <span className="card-reportado">
                    Reportado por: {leccion.reportado_por}
                  </span>
                  <button
                    onClick={() => handleOpenEditarModal(leccion)}
                    className="btn-ver-detalles"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
            {currentLeccionesCards.length === 0 && (
              <p className="mensaje-no-datos">No hay lecciones para mostrar.</p>
            )}
          </div>
          {lecciones.length > itemsPerPageCards && totalPagesCards > 1 && (
            <div className="paginacion-controles">
              <button
                onClick={() => setCurrentPageCards(1)}
                disabled={currentPageCards === 1}
              >
                {"<<"}
              </button>
              <button
                onClick={() =>
                  setCurrentPageCards((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPageCards === 1}
              >
                {"<"}
              </button>
              <span>
                Página{" "}
                <strong>
                  {currentPageCards} de {totalPagesCards}
                </strong>{" "}
              </span>
              <button
                onClick={() =>
                  setCurrentPageCards((prev) =>
                    Math.min(totalPagesCards, prev + 1)
                  )
                }
                disabled={currentPageCards === totalPagesCards}
              >
                {">"}
              </button>
              <button
                onClick={() => setCurrentPageCards(totalPagesCards)}
                disabled={currentPageCards === totalPagesCards}
              >
                {">>"}
              </button>
              <select
                value={itemsPerPageCards}
                onChange={(e) => {
                  setItemsPerPageCards(Number(e.target.value));
                  setCurrentPageCards(1);
                }}
              >
                {[8, 12, 16, 20, 24].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Mostrar {pageSize}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* Modal de Creación */}
      {showCrearModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-v2">
            {" "}
            {/* Added modal-v2 class */}
            <div className="modal-header-v2">
              <div>
                <h2>Nueva Lección Aprendida</h2>
                <p className="modal-subtitle-v2">
                  Complete la información para documentar una nueva lección
                  aprendida que beneficie futuros proyectos.
                </p>
              </div>
              <div className="modal-header-actions-v2">
                {/* Placeholder for "Registro de Conocimiento" if it's a link/button */}
                {/* <button className="btn-link-v2">Registro de Conocimiento</button> */}
                <button
                  onClick={handleCloseCrearModal}
                  className="btn-close-modal-v2"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div className="modal-body-v2">
              <div className="modal-info-icon-v2">
                <FiInfo />
              </div>
              <Formik
                initialValues={initialValuesCrear}
                validationSchema={leccionAprendidaValidationSchema}
                onSubmit={handleCrearLeccion}
              >
                {({ isSubmitting, dirty, isValid }) => (
                  <Form>
                    <div className="modal-section info-basica">
                      <h3 className="modal-section-title">
                        <FiFileText className="icon-placeholder" />
                        Información Básica
                      </h3>
                      <div className="form-group">
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            minWidth: "100%",
                          }}
                        >
                          <label htmlFor="titulo_crear">
                            <Tag /> Título:
                          </label>
                          <Field
                            type="text"
                            name="titulo"
                            id="titulo_crear"
                            placeholder="Ingrese un título descriptivo para la lección aprendida"
                            style={{
                              width: "100%",
                              maxWidth: "100%",
                              minWidth: "100%",
                            }}
                          />
                          <ErrorMessage
                            name="titulo"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </div>
                      {/* Creado por field removed from form as it's handled by backend */}
                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "10px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <label htmlFor="area_categoria_crear">
                            <Target /> Área/Categoría:
                          </label>
                          <Field
                            as="select"
                            name="area_categoria"
                            style={{ maxWidth: 280, width: 280, minWidth: 280 }}
                            id="area_categoria_crear"
                          >
                            <option value="">Seleccionar área</option>
                            {[
                              ...new Set(
                                allLecciones.map((item) => item.area_categoria)
                              ),
                            ]
                              .sort()
                              .map((area) => (
                                <option key={area} value={area}>
                                  {area}
                                </option>
                              ))}
                          </Field>
                          <ErrorMessage
                            name="area_categoria"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        <div>
                          <label htmlFor="tipo_leccion_crear">
                            <Presentation /> Tipo de Lección:
                          </label>
                          <Field
                            as="select"
                            name="tipo_leccion"
                            id="tipo_leccion_crear"
                            style={{ maxWidth: 280, width: 280, minWidth: 280 }}
                          >
                            <option value="">Seleccionar tipo</option>
                            <option value="Oportunidad">Oportunidad</option>
                            <option value="Amenaza">Amenaza</option>
                          </Field>
                          <ErrorMessage
                            name="tipo_leccion"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        <div>
                          <label htmlFor="fecha_crear">
                            <FiCalendar /> Fecha:
                          </label>
                          <Field
                            style={{ maxWidth: 280, width: 280, minWidth: 280 }}
                            type="date"
                            name="fecha"
                            id="fecha_crear"
                            placeholder="dd/mm/aaaa"
                          />
                          <ErrorMessage
                            name="fecha"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </div>
                      <div
                        className="form-group"
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "row",
                          gap: "10px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ width: "50%" }}>
                          <label htmlFor="reportado_por_crear">
                            <FiUser /> Reportado Por:
                          </label>
                          <Field
                            style={{
                              maxWidth: "100%",
                              width: "100%",
                              minWidth: "100%",
                            }}
                            type="text"
                            name="reportado_por"
                            id="reportado_por_crear"
                            placeholder="Nombre del reportador"
                          />
                          <ErrorMessage
                            name="reportado_por"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        <div>
                          <label htmlFor="id_proyecto_crear">
                            <FiBriefcase /> Proyecto:
                          </label>
                          <Field
                            as="select"
                            name="id_proyecto"
                            id="id_proyecto_crear"
                          >
                            <option value="">Seleccione un proyecto</option>
                            {proyectosLista.map((p) => (
                              <option key={p.id_proyecto} value={p.id_proyecto}>
                                {p.nombre_proyecto}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage
                            name="id_proyecto"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </div>
                      <div className="form-group"></div>
                    </div>
                    {/* Las demás secciones mantienen su estructura */}
                    <div
                      className="modal-section descripcion-situacion"
                      style={{ maxWidth: "100%" }}
                    >
                      <h3 className="modal-section-title">
                        <FiAlertTriangle className="icon-placeholder" />
                        Descripción de la Situación
                      </h3>
                      <div className="form-group">
                        <Field
                          style={{ maxWidth: "100%" }}
                          as="textarea"
                          name="descripcion_situacion"
                          id="descripcion_situacion_crear"
                          placeholder="Describa detalladamente la situación que generó esta lección aprendida..."
                        />
                        <ErrorMessage
                          name="descripcion_situacion"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "2%" }}>
                      <div
                        className="modal-section impacto-proyecto"
                        style={{ width: "49%" }}
                      >
                        <h3 className="modal-section-title">
                          <FiTarget className="icon-placeholder" />
                          Impacto en el Proyecto
                        </h3>
                        <div className="form-group">
                          <Field
                            as="textarea"
                            name="descripcion_impacto"
                            id="descripcion_impacto_crear"
                            placeholder="Describa cómo afectó esta situación a los objetivos del proyecto..."
                          />
                          <ErrorMessage
                            name="descripcion_impacto"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </div>
                      <div
                        className="modal-section acciones-implementadas"
                        style={{ width: "49%" }}
                      >
                        <h3 className="modal-section-title">
                          <FiTool className="icon-placeholder" />
                          Acciones Implementadas
                        </h3>
                        <div className="form-group">
                          <Field
                            as="textarea"
                            name="acciones_correctivas"
                            id="acciones_correctivas_crear"
                            placeholder="Describa las medidas tomadas para resolver la situación y prevenir su recurrencia..."
                          />
                          <ErrorMessage
                            name="acciones_correctivas"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="modal-section leccion-final"
                      style={{ maxWidth: "100%" }}
                    >
                      <h3 className="modal-section-title">
                        <FiMessageCircle className="icon-placeholder" />
                        Lección Aprendida
                      </h3>
                      <div className="form-group">
                        <Field
                          as="textarea"
                          style={{ maxWidth: "100%" }}
                          name="leccion_aprendida_recomendaciones"
                          id="leccion_aprendida_recomendaciones_crear"
                          placeholder="Resuma la lección aprendida, recomendaciones para futuros proyectos, mejores prácticas identificadas..."
                        />
                        <ErrorMessage
                          name="leccion_aprendida_recomendaciones"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="modal-buttons">
                      <button
                        type="button"
                        onClick={handleCloseCrearModal}
                        className="btn-cancelar"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !dirty || !isValid}
                        className="btn-guardar"
                      >
                        Guardar
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>{" "}
            {/* Close modal-body-v2 here for Crear Modal */}
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditarModal && leccionAEditar && (
        <div className="modal-overlay">
          <div className="modal-content modal-v2">
            {" "}
            {/* Added modal-v2 class */}
            <div className="modal-header-v2">
              <div>
                <h2>Editar Lección Aprendida: {leccionAEditar.titulo}</h2>
                <p className="modal-subtitle-v2">
                  Actualice la información de la lección aprendida.
                </p>
              </div>
              <div className="modal-header-actions-v2">
                {/* <button className="btn-link-v2">Registro de Conocimiento</button> */}
                <button
                  onClick={handleCloseEditarModal}
                  className="btn-close-modal-v2"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div className="modal-body-v2">
              <div className="modal-info-icon-v2">
                <FiInfo />
              </div>
              <Formik
                initialValues={{
                  ...leccionAEditar,
                  fecha: leccionAEditar.fecha
                    ? new Date(leccionAEditar.fecha).toISOString().split("T")[0]
                    : "",
                }}
                validationSchema={leccionAprendidaValidationSchema}
                onSubmit={handleEditarLeccion}
                enableReinitialize
              >
                {({ isSubmitting, dirty, isValid }) => (
                  <Form>
                    <Field type="hidden" name="id_leccion_aprendida" />
                    <div className="modal-section info-basica">
                      <h3 className="modal-section-title">
                        <FiFileText className="icon-placeholder" />
                        Información Básica
                      </h3>
                      <div className="form-group">
                        <label htmlFor="titulo_editar">
                          <FiFileText /> Título:
                        </label>
                        <Field
                          type="text"
                          name="titulo"
                          id="titulo_editar"
                          placeholder="Ingrese un título descriptivo para la lección aprendida"
                        />
                        <ErrorMessage
                          name="titulo"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="area_categoria_editar">
                          <FiBriefcase /> Área/Categoría:
                        </label>
                        <Field
                          as="select"
                          name="area_categoria"
                          id="area_categoria_editar"
                        >
                          <option value="">Seleccionar área</option>
                          {[
                            ...new Set(
                              allLecciones.map(
                                // Use allLecciones for dynamic options
                                (item) => item.area_categoria
                              )
                            ),
                          ]
                            .sort()
                            .map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                        </Field>
                        <ErrorMessage
                          name="area_categoria"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="tipo_leccion_editar">
                          <FiBriefcase /> Tipo de Lección:
                        </label>
                        <Field
                          as="select"
                          name="tipo_leccion"
                          id="tipo_leccion_editar"
                        >
                          <option value="">Seleccionar tipo</option>
                          <option value="Oportunidad">Oportunidad</option>
                          <option value="Amenaza">Amenaza</option>
                        </Field>
                        <ErrorMessage
                          name="tipo_leccion"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fecha_editar">
                          <FiCalendar /> Fecha:
                        </label>
                        <Field
                          type="date"
                          name="fecha"
                          id="fecha_editar"
                          placeholder="dd/mm/aaaa"
                        />
                        <ErrorMessage
                          name="fecha"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group">
                        {/* Nueva agrupación */}
                        {/* Contenido del primer div (creado_por) */}
                        <label htmlFor="creado_por_simulado_editar">
                          <FiUser /> Creado por:
                        </label>
                        <Field
                          type="text"
                          name="creado_por_nombre" // Este campo es de la data original
                          id="creado_por_simulado_editar"
                          placeholder="Nombre del responsable" // Placeholder
                          disabled // Mantener deshabilitado como en el original
                        />
                        {/* <ErrorMessage name="creado_por_nombre" component="div" className="error-message" /> */}
                      </div>
                      <div className="form-group">
                        {/* Contenido del segundo div (reportado_por) */}
                        <label htmlFor="reportado_por_editar">
                          <FiUser /> Reportado Por:
                        </label>
                        <Field
                          type="text"
                          name="reportado_por"
                          id="reportado_por_editar"
                          placeholder="Nombre del reportador"
                        />
                        <ErrorMessage
                          name="reportado_por"
                          component="div"
                          className="error-message"
                        />
                      </div>
                      <div className="form-group">
                        {" "}
                        {/* Proyecto ahora aquí */}
                        <label htmlFor="id_proyecto_editar">
                          <FiBriefcase /> Proyecto:
                        </label>
                        <Field
                          as="select"
                          name="id_proyecto"
                          id="id_proyecto_editar"
                        >
                          <option value="">Seleccione un proyecto</option>
                          {proyectosLista.map((p) => (
                            <option key={p.id_proyecto} value={p.id_proyecto}>
                              {p.nombre_proyecto}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="id_proyecto"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    {/* Las demás secciones mantienen su estructura pero se adaptarán con CSS */}
                    <div className="modal-section descripcion-situacion">
                      <h3 className="modal-section-title">
                        <FiAlertTriangle className="icon-placeholder" />
                        Descripción de la Situación
                      </h3>
                      <div className="form-group">
                        <Field
                          style={{ maxWidth: "100%" }}
                          as="textarea"
                          name="descripcion_situacion"
                          id="descripcion_situacion_editar"
                          placeholder="Describa detalladamente la situación que generó esta lección aprendida..."
                        />
                        <ErrorMessage
                          name="descripcion_situacion"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="modal-section impacto-proyecto">
                      <h3 className="modal-section-title">
                        <FiTarget className="icon-placeholder" />
                        Impacto en el Proyecto
                      </h3>
                      <div className="form-group">
                        <Field
                          as="textarea"
                          name="descripcion_impacto"
                          id="descripcion_impacto_editar"
                          placeholder="Describa cómo afectó esta situación a los objetivos del proyecto..."
                        />
                        <ErrorMessage
                          name="descripcion_impacto"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="modal-section acciones-implementadas">
                      <h3 className="modal-section-title">
                        <FiTool className="icon-placeholder" />
                        Acciones Implementadas
                      </h3>
                      <div className="form-group">
                        <Field
                          as="textarea"
                          name="acciones_correctivas"
                          id="acciones_correctivas_editar"
                          placeholder="Describa las medidas tomadas para resolver la situación y prevenir su recurrencia..."
                        />
                        <ErrorMessage
                          name="acciones_correctivas"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="modal-section leccion-final">
                      <h3 className="modal-section-title">
                        <FiMessageCircle className="icon-placeholder" />
                        Lección Aprendida
                      </h3>
                      <div className="form-group">
                        <Field
                          as="textarea"
                          name="leccion_aprendida_recomendaciones"
                          id="leccion_aprendida_recomendaciones_editar"
                          placeholder="Resuma la lección aprendida, recomendaciones para futuros proyectos, mejores prácticas identificadas..."
                        />
                        <ErrorMessage
                          name="leccion_aprendida_recomendaciones"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                    <div className="modal-buttons">
                      <button
                        type="button"
                        onClick={handleCloseEditarModal}
                        className="btn-cancelar"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !dirty || !isValid}
                        className="btn-guardar"
                      >
                        Actualizar
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>{" "}
            {/* Close modal-body-v2 here for Editar Modal */}
          </div>
        </div>
      )}
    </div>
  );
}

export { LeccionesAprendidas };
