import { useCallback, useMemo, useState } from "react";
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
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { FiFileText, FiInfo, FiX } from "react-icons/fi";

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
// Función para determinar clase según el valor (puedes ajustar rangos)
function severityClass(value) {
  if (value >= 50) return "critical-risk";
  if (value >= 20) return "medium-risk";
  if (value >= 10) return "low-risk";
  return "low-risk"; // Valor por defecto
}
const cards = [
  { title: "Riesgos totales", icon: "👌", value: 3 },
  { title: "Riesgos críticos", icon: "⚠️", value: 1 },
  { title: "Riesgos activos", icon: "🍙", value: 2 },
];

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

  const [riesgos, setRiesgos] = useState([]); // estado para almacenar los riesgos procesados por los filtros especificos
  const [allRiesgos, setAllRiesgos] = useState([]); // estado para almacenar todos los riesgos en el get
  const [proyectosLista, setProyectosLista] = useState([]);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showMaterializacionTablaModal, setShowMaterializacionTablaModal] =
    useState(false);
  const [showMaterializacionModal, setShowMaterializacionModal] =
    useState(false);

  const [showEvaluarRiesgoTablaModal, setShowEvaluarRiesgoTablaModal] =
    useState(false);
  const [showEvaluarRiesgoModal, setShowEvaluarRiesgoModal] = useState(false);

  const [leccionAeditar, setLeccionAEditar] = useState(null);

  const Toast = ToastInstance;

  const { area } = useParams();

  // Estado para la tabla
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const data = useMemo(
    () => [
      {
        ID: "RISK-001",
        description: "Fallo del sistema durante horas pico",
        estado: "Activo",
        proyecto: "Proyecto A",
        fecha_de_identificacion: "2025-05-01",
        tipo: "Técnico",
        categoria: "Operacional",
        probabilidad: 5,
        impacto: 20,
        responsable: "Departamento de IT",
        plan_respuesta: "Activar sistemas de respaldo",
      },
      {
        ID: "RISK-002",
        description: "Incumplimiento regulatorio",
        proyecto: "Proyecto B",
        estado: "Activo",
        fecha_de_identificacion: "2025-04-15",
        tipo: "Cumplimiento",
        categoria: "Legal",
        probabilidad: 4,
        impacto: 20,
        responsable: "Equipo Legal",
        plan_respuesta: "Contratar asesoría legal",
      },
      {
        ID: "RISK-003",
        description: "Interrupción en la cadena de suministro",
        proyecto: "Proyecto C",
        estado: "Mitigado",
        fecha_de_identificacion: "2025-03-10",
        tipo: "Externo",
        categoria: "Operacional",
        probabilidad: 3,
        impacto: 15,
        responsable: "Adquisiciones",
        plan_respuesta: "Activar proveedores alternativos",
      },
      {
        ID: "RISK-004",
        description: "Brecha de datos por ataque de phishing",
        proyecto: "Proyecto D",
        estado: "Activo",
        fecha_de_identificacion: "2025-02-20",
        tipo: "Ciberseguridad",
        categoria: "Seguridad Informática",
        probabilidad: 4,
        impacto: 10,
        responsable: "Equipo de Seguridad",
        plan_respuesta: "Implementar protocolos de encriptación",
      },
      {
        ID: "RISK-005",
        description: "Fluctuación en la demanda del mercado",
        proyecto: "Proyecto E",

        estado: "En Observación",
        fecha_de_identificacion: "2025-01-05",
        tipo: "Mercado",
        categoria: "Estratégico",
        probabilidad: 2,
        impacto: 5,
        responsable: "Marketing",
        plan_respuesta: "Diversificar base de clientes",
      },
      {
        ID: "RISK-006",
        description: "Contaminación ambiental por derrame químico",
        estado: "Activo",
        proyecto: "Proyecto F",

        fecha_de_identificacion: "2025-04-25",
        tipo: "Ambiental",
        categoria: "Operacional",
        probabilidad: 3,
        impacto: 15,
        responsable: "Departamento de Sostenibilidad",
        plan_respuesta: "Implementar protocolos de contención",
      },
      {
        ID: "RISK-007",
        description: "Conflictos laborales por condiciones de trabajo",
        proyecto: "Proyecto G",

        estado: "En Observación",
        fecha_de_identificacion: "2025-03-05",
        tipo: "RRHH",
        categoria: "Legal",
        probabilidad: 2,
        impacto: 10,
        responsable: "Recursos Humanos",
        plan_respuesta: "Negociar mejoras en beneficios",
      },
      {
        ID: "RISK-008",
        description: "Pérdida de financiamiento gubernamental",
        proyecto: "Proyecto H",

        estado: "Mitigado",
        fecha_de_identificacion: "2025-02-10",
        tipo: "Financiero",
        categoria: "Estratégico",
        probabilidad: 1,
        impacto: 20,
        responsable: "Gerencia Financiera",
        plan_respuesta: "Buscar fuentes alternativas de capital",
      },
      {
        ID: "RISK-009",
        description: "Fallo en el sistema eléctrico principal",
        proyecto: "Proyecto I",

        estado: "Activo",
        fecha_de_identificacion: "2025-05-02",
        tipo: "Infraestructura",
        categoria: "Operacional",
        probabilidad: 4,
        impacto: 20,
        responsable: "Mantenimiento",
        plan_respuesta: "Instalar generadores redundantes",
      },
      {
        ID: "RISK-010",
        description: "Robo de propiedad intelectual",
        proyecto: "Proyecto J",

        estado: "Activo",
        fecha_de_identificacion: "2025-04-01",
        tipo: "Ciberseguridad",
        categoria: "Seguridad Informática",
        probabilidad: 3,
        impacto: 20,
        responsable: "Equipo de Seguridad",
        plan_respuesta: "Auditoría de acceso a datos sensibles",
      },
      {
        ID: "RISK-011",
        description: "Desastres naturales (inundaciones, terremotos)",
        estado: "En Observación",
        fecha_de_identificacion: "2025-01-20",
        proyecto: "Proyecto K",

        tipo: "Ambiental",
        categoria: "Operacional",
        probabilidad: 2,
        impacto: 15,
        responsable: "Comités de Emergencia",
        plan_respuesta: "Actualizar planes de evacuación",
      },
      {
        ID: "RISK-012",
        description: "Retraso en entregas por cierre fronterizo",
        estado: "Mitigado",
        proyecto: "Proyecto L",

        fecha_de_identificacion: "2025-03-15",
        tipo: "Externo",
        categoria: "Operacional",
        probabilidad: 3,
        impacto: 10,
        responsable: "Logística",
        plan_respuesta: "Optimizar rutas alternativas",
      },
      {
        ID: "RISK-013",
        description: "Caída del servidor principal",
        proyecto: "Proyecto M",

        estado: "Activo",
        fecha_de_identificacion: "2025-05-10",
        tipo: "Técnico",
        categoria: "Operacional",
        probabilidad: 5,
        impacto: 20,
        responsable: "Departamento de IT",
        plan_respuesta: "Implementar clústeres redundantes",
      },
    ],
    []
  );

  const handleOpenCrearModal = useCallback(() => {
    setShowCrearModal(true);
  }, []);

  const handleCloseCrearModal = useCallback(() => {
    setShowCrearModal(false);
  }, []);

  const handleOpenEditarModal = useCallback(() => {
    setShowEditarModal(true);
  }, []);

  const handleCloseEditarModal = useCallback(() => {
    setShowEditarModal(false);
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "ID",
        header: "ID",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "description",
        header: "Descripción",
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
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "proyecto",
        header: "Proyecto asociado",
        cell: (info) => info.getValue() || "N/A",
      },
      {
        accessorKey: "fecha_de_identificacion",
        header: "Fecha de Identificación",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "categoria",
        header: "Categoría",
        cell: (info) => info.getValue(),
      },
      {
        accessorFn: (row) => row.probabilidad * row.impacto,
        header: "Nivel de Riesgo",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "responsable",
        header: "Responsable",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "plan_respuesta",
        header: "Plan de Respuesta",
        cell: (info) => info.getValue(),
      },
    ],
    [handleOpenEditarModal]
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
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    debugTable: true,
  });

  return (
    <div>
      <header>
        <h1>Gestión de riesgos</h1>
        <p>{area}</p>
        <badge>Sigar - 2025</badge>
      </header>

      <section>
        <card className="card-container">
          {cards.map((card, index) => (
            <>
              <div key={index}>
                <p>{card.title}</p>
                <p>{card.icon}</p>
              </div>
              <p>{card.value}</p>
            </>
          ))}
        </card>

        <table>
          <caption></caption>
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
              <>
                <tr key={index}>
                  <th scope="row">{probability.level}</th>
                  <th scope="row">{probability.label}</th>
                  {impacts.map((impact, index) => (
                    <td
                      key={index}
                      style={{ textAlign: "center" }}
                      className={severityClass(
                        impact.level * probability.level
                      )}
                    >
                      {impact.level * probability.level}
                    </td>
                  ))}
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <input
          type="text"
          value={globalFilter}
          placeholder="Filtra tus riesgos..."
          onChange={(e) => {
            setGlobalFilter(e.target.value);
          }}
        />
        <button onClick={handleOpenCrearModal}>
          <span className="icon">➕</span>
          <span>Agregar riesgo</span>
        </button>
      </section>
      <main>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ??
                      (header.column.getCanSort() ? "↕️" : "null")}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}{" "}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}{" "}
          </button>
          <span>
            Página{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}{" "}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}{" "}
          </button>
        </div>

        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[5, 10, 15, 20].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Mostrar {pageSize}
            </option>
          ))}
        </select>
      </main>

      {showCrearModal === true && (
        <modal className="modal crear-riesgo">
          <button
            onClick={handleCloseCrearModal}
            className="btn-close-modal-v2"
          >
            <FiX />
          </button>
          <header>
            <h2>Nuevo Riesgo identificado</h2>
            <p className="modal-subtitle-v2">
              Complete la información para documentar un nuevo riesgo aprendida
              que beneficie futuros proyectos.
            </p>
          </header>
          <section>
            <div className="modal-info-icon-v2">
              <FiInfo />
            </div>
            <Formik
              initialValues={initialValuesCrear}
              validationSchema={validationSchemaCrear}
              onSubmit={handleCrearRiesgo}
            >
              {({ isSubmitting, dirty, isValid }) => <Form></Form>}
            </Formik>
          </section>
          <footer>
            <button onClick={handleCloseCrearModal}>Cancelar</button>
            <button>Guardar</button>
          </footer>
        </modal>
      )}

      {showEditarModal === true && (
        <modal className="modal editar-riesgo">
          <button
            onClick={handleCloseCrearModal}
            className="btn-close-modal-v2"
          >
            <FiX />
          </button>
          <header>
            <h2>Nuevo Riesgo identificado</h2>
            <p className="modal-subtitle-v2">
              Complete la información para documentar un nuevo riesgo aprendida
              que beneficie futuros proyectos.
            </p>
          </header>
          <section>
            <div className="modal-info-icon-v2">
              <FiInfo />
            </div>
            <Formik
              initialValues={{ ...leccionAeditar }}
              validationSchema={validationSchemaCrear}
              onSubmit={handleEditarRiesgo}
            >
              {({ isSubmitting, dirty, isValid }) => (
                <Form>
                  <h3 className="modal-section-title">
                    <FiFileText className="icon-placeholder" />
                    Información Básica
                    <button>
                      <span className="icon">➕</span>
                      <span>Hacer nueva evaluación de riesgo</span>
                    </button>
                    <button>
                      <span className="icon">➕</span>
                      <span>Generar una nueva materialización de riesgo</span>
                    </button>
                  </h3>
                </Form>
              )}
            </Formik>
          </section>
          <footer>
            <button onClick={handleCloseEditarModal}>Cancelar</button>
            <button>Actualizar</button>
          </footer>
        </modal>
      )}

      {showMaterializacionTablaModal === true && (
        <modal className="modal materializacion-tabla">
          <button
            onClick={handleCloseCrearModal}
            className="btn-close-modal-v2"
          >
            <FiX />
          </button>
          <header>
            <h2>Materialización de Riesgos</h2>
            <p className="modal-subtitle-v2">
              Aquí puedes ver las materializaciones de riesgos asociadas a este
              proyecto.
            </p>
          </header>
          <section>
            <div>
              <h3>Tabla de Materializaciones</h3>
              <button>
                <p>Informar materialización</p>
              </button>
            </div>
            {table}
          </section>
        </modal>
      )}

      {showMaterializacionModal === true && (
        <modal className="modal crear-materializacion">
          <button
            onClick={handleCloseCrearModal}
            className="btn-close-modal-v2"
          >
            <FiX />
          </button>
          <header>
            <h2>Materialización de Riesgo</h2>
            <p className="modal-subtitle-v2">
              Se ha materializado un riesgo, ahora debemos documentarlo
            </p>
          </header>
          <section>
            <div>
              <h3>Información de la Materialización</h3>
              <Formik
                initialValues={initialValuesCrear}
                validationSchema={validationSchemaCrear}
                onSubmit={handleCrearRiesgo}
              >
                {({ isSubmitting, dirty, isValid }) => <Form></Form>}
              </Formik>
            </div>
          </section>
        </modal>
      )}

      {showEvaluarRiesgoModal === true && (
        <modal className="modal evaluacion-tabla">
          <button
            onClick={handleCloseCrearModal}
            className="btn-close-modal-v2"
          >
            <FiX />
          </button>
          <header>
            <h2>Materialización de Riesgo</h2>
            <p className="modal-subtitle-v2">
              Se ha materializado un riesgo, ahora debemos documentarlo
            </p>
          </header>
          <section>
            <div>
              <h3>Información de la Materialización</h3>
              <Formik
                initialValues={initialValuesCrear}
                validationSchema={validationSchemaCrear}
                onSubmit={handleCrearRiesgo}
              >
                {({ isSubmitting, dirty, isValid }) => <Form></Form>}
              </Formik>
            </div>
          </section>
        </modal>
      )}

      {showEvaluarRiesgoTablaModal === true && (
        <modal className="modal crear-evaluacion">
          <button
            onClick={handleCloseCrearModal}
            className="btn-close-modal-v2"
          >
            <FiX />
          </button>
          <header>
            <h2>Materialización de Riesgos</h2>
            <p className="modal-subtitle-v2">
              Aquí puedes ver las materializaciones de riesgos asociadas a este
              proyecto.
            </p>
          </header>
          <section>
            <div>
              <h3>Tabla de Materializaciones</h3>
              <button>
                <p>Informar materialización</p>
              </button>
            </div>
            {table}
          </section>
        </modal>
      )}
    </div>
  );
}

export { FormularioRiesgos };
