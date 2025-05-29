import React, { useState, useEffect, useMemo } from "react"; // Import React
// import { useParams } from 'react-router-dom'; // Se usará cuando se integre el enrutamiento
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
// import * LeccionesAprendidasModal from './LeccionesAprendidasModal'; // Ejemplo si se crea un componente modal separado
import { Formik, Form, Field, ErrorMessage } from "formik";
import { leccionAprendidaValidationSchema } from "../../../../common/utils/schemas";
import { FiFileText, FiAlertTriangle, FiTarget, FiTool, FiMessageCircle, FiChevronUp, FiChevronDown, FiPlusCircle } from 'react-icons/fi'; // Feather Icons (FiEdit3 removido)
import { FaStar, FaSort } from 'react-icons/fa'; // Font Awesome
import "./LeccionesAprendidas.css";

// --- Datos de Muestra ---
const mockProyectosLista = [
  { id_proyecto: 101, nombre_proyecto: "Desarrollo App Móvil X" },
  { id_proyecto: 102, nombre_proyecto: "Implementación CRM Interno" },
  { id_proyecto: 103, nombre_proyecto: "Migración Servidores Cloud" },
  { id_proyecto: 104, nombre_proyecto: "Plataforma E-learning Corporativa" },
  { id_proyecto: 105, nombre_proyecto: "Optimización SEO Web Principal" },
];

const mockLecciones = [
  {
    id_leccion_aprendida: 1,
    id_proyecto: 101,
    proyecto_nombre: "Desarrollo App Móvil X",
    creado_por_nombre: "Ana Pérez",
    titulo: "Retraso en la entrega del Módulo de Pagos",
    area_categoria: "Desarrollo de Software",
    fecha: "2024-05-15T10:00:00.000Z",
    tipo_leccion: "Amenaza",
    descripcion_situacion:
      "El proveedor externo del API de pagos no cumplió con la fecha de entrega de la documentación final.",
    descripcion_impacto:
      "Se generó un retraso de 2 semanas en la integración del módulo de pagos, afectando el cronograma general.",
    acciones_correctivas:
      "Se estableció un plan de comunicación más riguroso con el proveedor y se identificó un proveedor alternativo para futuras fases.",
    leccion_aprendida_recomendaciones:
      "Validar la capacidad de respuesta y documentación de proveedores externos con mayor antelación. Tener siempre un plan B.",
    reportado_por: "Jefe de Proyecto",
    creado_por_id: 202,
  },
  {
    id_leccion_aprendida: 2,
    id_proyecto: 102,
    proyecto_nombre: "Implementación CRM Interno",
    creado_por_nombre: "Carlos Ruiz",
    titulo: "Adopción exitosa de nueva metodología ágil",
    area_categoria: "Gestión de Proyectos",
    fecha: "2024-06-01T14:30:00.000Z",
    tipo_leccion: "Oportunidad",
    descripcion_situacion:
      "Se implementó Scrum para el equipo de CRM, mejorando la comunicación y la velocidad de entrega.",
    descripcion_impacto:
      "Reducción del tiempo de ciclo en un 15% y mayor satisfacción del equipo.",
    acciones_correctivas: "N/A (fue una mejora)",
    leccion_aprendida_recomendaciones:
      "Capacitar a otros equipos en metodologías ágiles y compartir las herramientas utilizadas.",
    reportado_por: "Líder de Equipo CRM",
    creado_por_id: 205,
  },
  {
    id_leccion_aprendida: 3,
    id_proyecto: 101,
    proyecto_nombre: "Desarrollo App Móvil X",
    creado_por_nombre: "Laura Gómez",
    titulo: "Problemas de rendimiento en pruebas de carga",
    area_categoria: "QA y Pruebas",
    fecha: "2024-07-20T09:00:00.000Z",
    tipo_leccion: "Amenaza",
    descripcion_situacion:
      "Durante las pruebas de carga, la aplicación mostró una degradación significativa del rendimiento con más de 500 usuarios concurrentes.",
    descripcion_impacto:
      "Riesgo de no cumplir con los SLAs de rendimiento y posible insatisfacción del cliente si no se resuelve antes del lanzamiento.",
    acciones_correctivas:
      "Se realizó un perfilamiento exhaustivo del código, se optimizaron consultas a la base de datos y se escaló la infraestructura del servidor de pruebas.",
    leccion_aprendida_recomendaciones:
      "Incorporar pruebas de rendimiento más tempranas en el ciclo de desarrollo. Definir perfiles de carga realistas desde el inicio.",
    reportado_por: "Ingeniera de QA",
    creado_por_id: 208,
  },
];

// Función para generar más datos de muestra
const generateMoreMockData = (baseData, count) => {
  const moreData = [];
  const areas = ["Desarrollo de Software", "Gestión de Proyectos", "QA y Pruebas", "Infraestructura", "Diseño UX/UI"];
  const tiposLeccion = ["Oportunidad", "Amenaza"];
  const reportadoPorNombres = ["Juan Pérez", "Ana García", "Luis Fernández", "Sofía Martínez", "Carlos Rodríguez"];
  const creadoPorNombres = ["Admin Sistema", "Gerente de Área", "Líder Técnico"];

  for (let i = 0; i < count; i++) {
    const baseIndex = i % baseData.length;
    const baseEntry = baseData[baseIndex];
    const newEntry = { ...baseEntry };
    
    newEntry.id_leccion_aprendida = baseData.length + i + 1;
    newEntry.titulo = `${baseEntry.titulo} (Variación ${i + 1})`;
    
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365)); // Fecha aleatoria en el último año
    newEntry.fecha = randomDate.toISOString();
    
    newEntry.area_categoria = areas[Math.floor(Math.random() * areas.length)];
    newEntry.tipo_leccion = tiposLeccion[Math.floor(Math.random() * tiposLeccion.length)];
    newEntry.reportado_por = reportadoPorNombres[Math.floor(Math.random() * reportadoPorNombres.length)];
    newEntry.creado_por_nombre = creadoPorNombres[Math.floor(Math.random() * creadoPorNombres.length)];
    newEntry.id_proyecto = mockProyectosLista[Math.floor(Math.random() * mockProyectosLista.length)].id_proyecto;
    newEntry.proyecto_nombre = mockProyectosLista.find(p => p.id_proyecto === newEntry.id_proyecto)?.nombre_proyecto || "Proyecto Desconocido";
    
    // Descripciones ligeramente variadas
    newEntry.descripcion_situacion = `Situación adaptada para la lección ${newEntry.id_leccion_aprendida}: ${baseEntry.descripcion_situacion.substring(0,150)}`;
    newEntry.descripcion_impacto = `Impacto correspondiente a la lección ${newEntry.id_leccion_aprendida}: ${baseEntry.descripcion_impacto.substring(0,150)}`;
    newEntry.acciones_correctivas = `Acciones para la lección ${newEntry.id_leccion_aprendida}: ${baseEntry.acciones_correctivas.substring(0,150)}`;
    newEntry.leccion_aprendida_recomendaciones = `Recomendaciones de la lección ${newEntry.id_leccion_aprendida}: ${baseEntry.leccion_aprendida_recomendaciones.substring(0,150)}`;

    moreData.push(newEntry);
  }
  return [...baseData, ...moreData];
};

const extendedMockLecciones = generateMoreMockData(mockLecciones, 57); // Para tener 3 + 57 = 60 elementos
// --- Fin Datos de Muestra ---

function LeccionesAprendidas() {
  const [lecciones, setLecciones] = useState([]);
  const [proyectosLista, setProyectosLista] = useState([]);
  const [areaActual] = useState("Todas"); // Cambiado para mostrar todos los mocks inicialmente
  const [showCrearModal, setShowCrearModal] = useState(false);
  const { useCallback } = React; // Import useCallback
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [leccionAEditar, setLeccionAEditar] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  // const { area } = useParams(); // Para obtener el área del route param

  useEffect(() => {
    // Simulación de carga de datos
    // En una implementación real, aquí se harían las llamadas API
    // setAreaActual(area); // Cuando se use useParams
    setLecciones(
      extendedMockLecciones.filter((leccion) => { // Usar extendedMockLecciones
        // Simular filtro por área si es necesario, o la API ya lo haría
        // Por ahora, si area_categoria contiene el areaActual (simulación)
        // En la realidad, la API filtraría por el `area` del route param
        return (
          leccion.area_categoria.includes(areaActual) || areaActual === "Todas"
        ); // Ejemplo de lógica de filtro
      })
    );
    setProyectosLista(mockProyectosLista);
  }, [areaActual]); // Dependencia de areaActual para recargar si cambia

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

  const handleCrearLeccion = (values, { setSubmitting, resetForm }) => {
    console.log("Creando nueva lección:", values);
    // Aquí iría la lógica para añadir a mockLecciones o llamar a la API
    const nuevaLeccion = {
      ...values,
      id_leccion_aprendida: Date.now(), // ID temporal
      proyecto_nombre:
        proyectosLista.find(
          (p) => p.id_proyecto === parseInt(values.id_proyecto)
        )?.nombre_proyecto || "N/A",
      creado_por_nombre: "Usuario Actual (Simulado)", // Simulación
      // creado_por_id se manejaría en backend o se pasaría el del usuario logueado
    };
    setLecciones((prevLecciones) => [nuevaLeccion, ...prevLecciones]);
    resetForm();
    setShowCrearModal(false);
    setSubmitting(false);
  };

  const handleEditarLeccion = (values, { setSubmitting }) => {
    console.log("Editando lección:", values);
    // Aquí iría la lógica para actualizar mockLecciones o llamar a la API
    setLecciones((prevLecciones) =>
      prevLecciones.map((l) =>
        l.id_leccion_aprendida === values.id_leccion_aprendida
          ? {
              ...l,
              ...values,
              proyecto_nombre:
                proyectosLista.find(
                  (p) => p.id_proyecto === parseInt(values.id_proyecto)
                )?.nombre_proyecto || "N/A",
            }
          : l
      )
    );
    setShowEditarModal(false);
    setSubmitting(false);
  };

  const initialValuesCrear = {
    id_proyecto: "",
    titulo: "",
    area_categoria: "",
    fecha: new Date().toISOString().split("T")[0], // Fecha actual por defecto
    descripcion_situacion: "",
    descripcion_impacto: "",
    acciones_correctivas: "",
    leccion_aprendida_recomendaciones: "",
    reportado_por: "",
    tipo_leccion: "Oportunidad", // Valor por defecto
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "titulo",
        header: "Título",
        cell: (info) => (
          <span
            onClick={() => handleOpenEditarModal(info.row.original)}
            style={{
              cursor: "pointer",
              color: "#2980b9",
              textDecoration: "underline",
            }}
            role="button" // Mejora la accesibilidad
            tabIndex={0} // Permite que sea enfocable
            onKeyPress={(e) => {
              if (e.key === "Enter") handleOpenEditarModal(info.row.original);
            }} // Permite activación con teclado
          >
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: "proyecto_nombre",
        header: "Nombre del Proyecto",
      },
      {
        accessorKey: "area_categoria",
        header: "Área/Categoría",
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      {
        accessorKey: "tipo_leccion",
        header: "Tipo de Lección",
      },
      {
        accessorKey: "creado_por_nombre",
        header: "Creado Por",
      },
      {
        accessorKey: "reportado_por",
        header: "Reportado Por",
      },
      // Las descripciones largas podrían ocultarse o mostrarse en un detalle/tooltip
      // Por ahora las omitimos de la vista principal de la tabla para brevedad
      // { accessorKey: 'descripcion_situacion', header: 'Descripción Situación' },
      // { accessorKey: 'descripcion_impacto', header: 'Descripción Impacto' },
      // { accessorKey: 'acciones_correctivas', header: 'Acciones Correctivas' },
      // { accessorKey: 'leccion_aprendida_recomendaciones', header: 'Recomendaciones' },
      // La columna de acciones explícita se elimina ya que el título es clickleable para editar.
      // Si se necesitara un icono de lápiz junto al título, se añadiría en la celda del título.
    ],
    [handleOpenEditarModal]
  );

  const table = useReactTable({
    data: lecciones,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 5, // Mostrar 5 items por página inicialmente
      },
    },
  });

  // Estado para la vista actual (tabla o tarjetas)
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

  return (
    <div className="lecciones-aprendidas-container">
      <div className="titulo-pagina-contenedor">
        <div className="logo-area-header">
          <span className="logo-placeholder-header">DI</span> Dirección IDi
        </div>
        <hr className="linea-separadora-header" />
      </div>
      <div className="pagina-cabecera">
        <h1>
          Registro de Lecciones Aprendidas
          <FaStar style={{ marginLeft: "10px", color: "#f39c12", verticalAlign: 'middle' }} />
        </h1>
        <div className="acciones-cabecera">
          {/* Placeholders para botones de la imagen de referencia */}
          {/* <button className="btn-accion-header">Filtrar</button> */}
          {/* <button className="btn-accion-header">Exportar</button> */}
          <button onClick={handleOpenCrearModal} className="btn-nueva-leccion">
            <FiPlusCircle style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Nueva lección
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
            {/* Estos selectores son solo visuales por ahora, no están conectados a la lógica de filtrado de la tabla aún */}
            <select
              name="filtro_area_categoria_visual"
              className="selector-filtro"
            >
              <option value="">Área/Categoría</option>
              {[
                ...new Set(extendedMockLecciones.map((item) => item.area_categoria)), // Usar extendedMockLecciones
              ].map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select
              name="filtro_tipo_leccion_visual"
              className="selector-filtro"
            >
              <option value="">Tipo de Lección</option>
              <option value="Oportunidad">Oportunidad</option>
              <option value="Amenaza">Amenaza</option>
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

      {/* Renderizado condicional basado en viewMode */}
      {viewMode === "table" && (
        <>
          <div className="tabla-responsive-container">
            <table className="tabla-lecciones">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "sortable-header"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <FiChevronUp style={{ marginLeft: '4px' }} />,
                              desc: <FiChevronDown style={{ marginLeft: '4px' }} />,
                            }[header.column.getIsSorted()] ?? (header.column.getCanSort() ? <FaSort style={{ marginLeft: '4px', opacity: 0.3 }} /> : null)}
                          </div>
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
          </div>

          {lecciones.length === 0 && !globalFilter && (
            <p className="mensaje-no-datos">
              No hay lecciones aprendidas para mostrar para el área:{" "}
              {areaActual}.
            </p>
          )}
          {lecciones.length > 0 &&
            table.getRowModel().rows.length === 0 &&
            globalFilter && (
              <p className="mensaje-no-datos">{`No se encontraron resultados para: "${globalFilter}".`}</p>
            )}
          {/* Este div ya no es necesario aquí, se cierra el fragmento del table view */}
          {/* </div> Cierre de tabla-responsive-container */}

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
        <div className="vista-tarjetas-container">
          {/* Aquí se mapearían las lecciones para renderizar LeccionCard */}
          {lecciones.map((leccion) => (
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
          {lecciones.length === 0 && (
            <p className="mensaje-no-datos">
              No hay lecciones para mostrar en vista de tarjetas.
            </p>
          )}
        </div>
      )}

      {/* Modal de Creación */}
      {showCrearModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Crear Nueva Lección Aprendida</h2>
            <Formik
              initialValues={initialValuesCrear}
              validationSchema={leccionAprendidaValidationSchema}
              onSubmit={handleCrearLeccion}
            >
              {({ isSubmitting, dirty, isValid }) => (
                <Form>
                  <div className="modal-section info-basica">
                    <h3 className="modal-section-title">
                      <FiFileText className="icon-placeholder" />Información Básica
                    </h3>
                    {/* Fila 1: Título (ocupa todo el ancho) */}
                    <div className="form-group">
                      <label htmlFor="titulo_crear">Título:</label>
                      <Field type="text" name="titulo" id="titulo_crear" placeholder="Ingrese un título descriptivo para la lección aprendida" />
                      <ErrorMessage name="titulo" component="div" className="error-message" />
                    </div>
                    
                    <div className="form-group horizontal-group three-cols">
                      <div>
                        <label htmlFor="area_categoria_crear">Área/Categoría:</label>
                        <Field as="select" name="area_categoria" id="area_categoria_crear">
                           <option value="">Seleccionar área</option>
                           {[...new Set(extendedMockLecciones.map(item => item.area_categoria))].sort().map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="area_categoria" component="div" className="error-message" />
                      </div>
                      <div>
                        <label htmlFor="tipo_leccion_crear">Tipo de Lección:</label>
                        <Field as="select" name="tipo_leccion" id="tipo_leccion_crear">
                          <option value="Oportunidad">Oportunidad</option>
                          <option value="Amenaza">Amenaza</option>
                        </Field>
                        <ErrorMessage name="tipo_leccion" component="div" className="error-message" />
                      </div>
                      <div>
                        <label htmlFor="fecha_crear">Fecha:</label>
                        <Field type="date" name="fecha" id="fecha_crear" />
                        <ErrorMessage name="fecha" component="div" className="error-message" />
                      </div>
                    </div>

                    <div className="form-group horizontal-group"> {/* Proyecto y Reportado Por */}
                      <div style={{flexBasis: '60%'}}> {/* Proyecto ocupa más espacio */}
                        <label htmlFor="id_proyecto_crear">Proyecto:</label>
                        <Field as="select" name="id_proyecto" id="id_proyecto_crear">
                          <option value="">Seleccione un proyecto</option>
                          {proyectosLista.map((p) => (<option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre_proyecto}</option>))}
                        </Field>
                        <ErrorMessage name="id_proyecto" component="div" className="error-message" />
                      </div>
                      <div style={{flexBasis: '40%'}}> {/* Reportado por ocupa menos */}
                        <label htmlFor="reportado_por_crear">Reportado Por:</label>
                        <Field type="text" name="reportado_por" id="reportado_por_crear" placeholder="Nombre del reportador" />
                        <ErrorMessage name="reportado_por" component="div" className="error-message" />
                      </div>
                    </div>
                    
                    <div className="form-group"> {/* Creado por en su propia fila ya que es deshabilitado */}
                        <label htmlFor="creado_por_simulado_crear">Creado por:</label>
                        <Field type="text" name="creado_por_simulado" id="creado_por_simulado_crear" value="Usuario Actual (Simulado)" disabled />
                    </div>
                  </div>

                  <div className="modal-section descripcion-situacion">
                    <h3 className="modal-section-title">
                      <FiAlertTriangle className="icon-placeholder" />Descripción de
                      la Situación
                    </h3>
                    <div className="form-group">
                      <Field
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

                  <div className="modal-section impacto-proyecto">
                    <h3 className="modal-section-title">
                      <FiTarget className="icon-placeholder" />Impacto en el
                      Proyecto
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

                  <div className="modal-section acciones-implementadas">
                    <h3 className="modal-section-title">
                      <FiTool className="icon-placeholder" />Acciones
                      Implementadas
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

                  <div className="modal-section leccion-final">
                    <h3 className="modal-section-title">
                      <FiMessageCircle className="icon-placeholder" />Lección
                      Aprendida
                    </h3>
                    <div className="form-group">
                      <Field
                        as="textarea"
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
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditarModal && leccionAEditar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Lección Aprendida: {leccionAEditar.titulo}</h2>
            <Formik
              initialValues={{
                // Pre-poblar con los datos de la lección a editar
                ...leccionAEditar,
                fecha: leccionAEditar.fecha
                  ? new Date(leccionAEditar.fecha).toISOString().split("T")[0]
                  : "", // Formatear fecha para input date
              }}
              validationSchema={leccionAprendidaValidationSchema}
              onSubmit={handleEditarLeccion}
              enableReinitialize // Permite que el formulario se reinicialice si leccionAEditar cambia
            >
              {({ isSubmitting, dirty, isValid }) => (
                <Form>
                  <Field type="hidden" name="id_leccion_aprendida" />
                  <div className="modal-section info-basica">
                    <h3 className="modal-section-title">
                      <FiFileText className="icon-placeholder" />Información Básica
                    </h3>
                    {/* Fila 1: Título (ocupa todo el ancho) */}
                    <div className="form-group">
                      <label htmlFor="titulo_editar">Título:</label>
                      <Field type="text" name="titulo" id="titulo_editar" placeholder="Ingrese un título descriptivo para la lección aprendida" />
                      <ErrorMessage name="titulo" component="div" className="error-message" />
                    </div>

                    <div className="form-group horizontal-group three-cols">
                      <div>
                        <label htmlFor="area_categoria_editar">Área/Categoría:</label>
                        <Field as="select" name="area_categoria" id="area_categoria_editar">
                           <option value="">Seleccionar área</option>
                           {[...new Set(extendedMockLecciones.map(item => item.area_categoria))].sort().map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="area_categoria" component="div" className="error-message" />
                      </div>
                      <div>
                        <label htmlFor="tipo_leccion_editar">Tipo de Lección:</label>
                        <Field as="select" name="tipo_leccion" id="tipo_leccion_editar">
                          <option value="Oportunidad">Oportunidad</option>
                          <option value="Amenaza">Amenaza</option>
                        </Field>
                        <ErrorMessage name="tipo_leccion" component="div" className="error-message" />
                      </div>
                      <div>
                        <label htmlFor="fecha_editar">Fecha:</label>
                        <Field type="date" name="fecha" id="fecha_editar" />
                        <ErrorMessage name="fecha" component="div" className="error-message" />
                      </div>
                    </div>
                    
                    <div className="form-group horizontal-group"> 
                      <div style={{flexBasis: '60%'}}>
                        <label htmlFor="id_proyecto_editar">Proyecto:</label>
                        <Field as="select" name="id_proyecto" id="id_proyecto_editar">
                          <option value="">Seleccione un proyecto</option>
                          {proyectosLista.map((p) => (<option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre_proyecto}</option>))}
                        </Field>
                        <ErrorMessage name="id_proyecto" component="div" className="error-message" />
                      </div>
                       <div style={{flexBasis: '40%'}}>
                        <label htmlFor="reportado_por_editar">Reportado Por:</label>
                        <Field type="text" name="reportado_por" id="reportado_por_editar" placeholder="Nombre del reportador" />
                        <ErrorMessage name="reportado_por" component="div" className="error-message" />
                      </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="creado_por_simulado_editar">Creado por:</label>
                        <Field type="text" name="creado_por_nombre" id="creado_por_simulado_editar" disabled />
                    </div>
                  </div>

                  <div className="modal-section descripcion-situacion">
                    <h3 className="modal-section-title">
                      <FiAlertTriangle className="icon-placeholder" />Descripción de
                      la Situación
                    </h3>
                    <div className="form-group">
                      <Field
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
                      <FiTarget className="icon-placeholder" />Impacto en el
                      Proyecto
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
                      <FiTool className="icon-placeholder" />Acciones
                      Implementadas
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
                      <FiMessageCircle className="icon-placeholder" />Lección
                      Aprendida
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
          </div>
        </div>
      )}
    </div>
  );
}

export { LeccionesAprendidas };
