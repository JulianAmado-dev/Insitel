// src/validationSchemas.js
import * as Yup from "yup";

// --- Sub-Esquema para una fila de Equipo ---
export const equipoValidationSchema = Yup.object().shape({
  id_empleado: Yup.number()
    .nullable()
    .positive("ID inválido")
    .integer("ID inválido"),
  rol_en_proyecto: Yup.string().required("Rol requerido").max(100),
  responsabilidades: Yup.string().nullable().max(5000),
});

// --- Sub-Esquema para una fila de Compras ---
export const compraValidationSchema = Yup.object().shape({
  proveedor: Yup.string().nullable().max(200),
  descripcion: Yup.string()
    .nullable()
    /* .required("Descripción requerida") */
    .max(5000),
  cantidad: Yup.number()
    .nullable()
    .typeError("Número requerido")
    /* .required("Cantidad requerida") */
    .positive("Debe ser positivo")
    .test(
      "is-decimal",
      "Máx 2 decimales",
      (value) => value == null || /^\d+(\.\d{1,2})?$/.test(String(value))
    ), // Mejorado test
  unidad_medida: Yup.string()
    .nullable() /* .required("Unidad requerida") */
    .max(50),
  total_usd: Yup.number()
    .nullable()
    .typeError("Número requerido")
    .positive("Debe ser positivo"),
  total_cop: Yup.number()
    .nullable()
    .typeError("Número requerido")
    .positive("Debe ser positivo"),
  orden_compra: Yup.string().nullable().max(50),
  estado_compra: Yup.string()
    .nullable()
    /* .required("Estado requerido") */
    .oneOf(
      [
        "Solicitado",
        "En espera de aprobación",
        "Aprobado",
        "Comprado",
        "En espera de entrega",
        "Recibido",
        "Cancelado",
      ],
      "Estado inválido"
    ),
});

// --- Array de Esquemas para el Wizard ---
const wizardValidationSchemas = [
  // PASO 1: Info Solicitud y Cliente
  Yup.object().shape({
    area_solicitante: Yup.string().required("Área requerida").max(100),
    nombre_solicitante: Yup.string().required("Nombre requerido").max(150),
    descripcion_solicitud: Yup.string()
      .required("Descripción requerida")
      .min(10, "La Descripción debe de tener almenos 10 caracteres")
      .max(5000),
    genera_cambio_tipo: Yup.string()
      .required("Seleccione tipo")
      .oneOf(
        ["Estandar", "Recurrente", "De emergencia"],
        "Cambio de tipo invalido"
      ),
    departamento_interno: Yup.string().nullable().max(200),
    cliente_final: Yup.string().nullable().max(200),
  }),
  // PASO 2: Info Requerimiento
  Yup.object().shape({
    tipo_proyecto: Yup.array()
      .of(Yup.string(), "los valores deben de ser Strings")
      .min(1, "Se debe seleccionar almenos un tipo de proyecto"),
    nivel_hardware: Yup.number().when("tipo_proyecto", {
      is: "Hardware",
      then: (s) =>
        s
          .typeError("Número")
          .required(
            "Se debe de especificar el nivel de dificultad de la solución"
          )
          .min(1)
          .max(4)
          .integer(),
      otherwise: (s) => s.nullable().strip(),
    }),
    componentes_hardware: Yup.string().when("tipo_proyecto", {
      is: "Hardware",
      then: (s) =>
        s.when("otro_valor_componentes_hardware", {
          is: (v) => !v,
          then: (s) =>
            s
              .required("Seleccione o especifique los componentes")
              .oneOf(
                ["PCB", "Sistema Embebido", "Otro"],
                "Selección invalida de tipo de componente"
              ),
          otherwise: (s) => s.nullable().strip(),
        }),
      otherwise: (s) => s.nullable().strip(),
    }),
    otro_valor_componentes_hardware: Yup.string().when(
      ["tipo_proyecto", "componentes_hardware"],
      {
        is: (t, c) => t === "Hardware" && c === "Otro",
        then: (s) =>
          s
            .required(
              "Describa en el campo de texto los componentes requeridos para la solución"
            )
            .max(500),
        otherwise: (s) => s.nullable().strip(),
      }
    ),
    nivel_software: Yup.number().when("tipo_proyecto", {
      is: "Software",
      then: (s) =>
        s
          .typeError("Debe de ser un número")
          .required(
            "Se debe de especificar el nivel de dificultad de la solución"
          )
          .min(1)
          .max(4)
          .integer(),
      otherwise: (s) => s.nullable().strip(),
    }),
    componentes_software: Yup.string().when("tipo_proyecto", {
      is: "Software",
      then: (s) =>
        s.when("otro_valor_componentes_software", {
          is: (v) => !v,
          then: (s) =>
            s
              .required("Seleccione o especifique")
              .oneOf(
                ["WEB", "Escritorio", "Servidor", "Móvil", "Otro"],
                "Opción para tipo de desarrollo de software invalido"
              ),
          otherwise: (s) => s.nullable().strip(),
        }),
      otherwise: (s) => s.nullable().strip(),
    }),
    otro_valor_componentes_software: Yup.string().when(
      ["tipo_proyecto", "componentes_software"],
      {
        is: (t, c) => t === "Software" && c === "Otro",
        then: (s) =>
          s
            .required(
              "Describa en el campo de texto los componentes requeridos para la solución"
            )
            .max(500),
        otherwise: (s) => s.nullable().strip(),
      }
    ),
    entregables: Yup.string()
      .required("El campo entregables es requerido")
      .min(10, "El campo entregables debe de tener almenos 10 caracteres")
      .max(5000),
    requisitos_seguimiento_y_medicion: Yup.string()
      .required("El campo requisitos de seguimiento... es requerido")
      .min(10, "El campo de requisitos debe de tener almenos 10 caracteres")
      .max(5000),
    criterios_de_aceptacion: Yup.string()
      .required("El campo criterios de aceptación es requerido")
      .min(10, "El campo de criterios debe de tener almenos 10 caracteres")
      .max(5000),
    consecuencias_por_fallar: Yup.string()
      .required("El campo de consecuencias es requerido")
      .min(10, "El campo de consecuencias debe de tener almenos 10 caracteres")
      .max(5000),
    fecha_inicio_planificada: Yup.date()
      .nullable()
      .typeError("Fecha inválida")
      .max(Yup.ref("fecha_final_planificada"), "Inicio > Fin"),
    fecha_final_planificada: Yup.date()
      .nullable()
      .typeError("Fecha inválida")
      .min(Yup.ref("fecha_inicio_planificada"), "Fin < Inicio"),
  }),
  // PASO 3: Gestión Documental
  Yup.object().shape({
    ruta_proyecto_desarrollo: Yup.string().nullable().max(500),
    ruta_cotizacion: Yup.string().nullable().max(500),
    aplica_doc_ideas_iniciales: Yup.boolean(),
    aplica_doc_especificaciones: Yup.boolean(),
    aplica_doc_casos_uso: Yup.boolean(),
    aplica_doc_diseno_sistema: Yup.boolean(),
    aplica_doc_plan_pruebas: Yup.boolean(),
    aplica_doc_manuales: Yup.boolean(),
    aplica_doc_liberacion: Yup.boolean(),
    ref_doc_ideas_iniciales: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_ideas_iniciales", {
        is: true,
        then: (s) => s.required("Ref. requerida para ideas iniciales"),
        otherwise: (s) => s.strip(),
      }),
    ref_doc_especificaciones: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_especificaciones", {
        is: true,
        then: (s) =>
          s.required("Ref. requerida para el documento de especificaciones"),
        otherwise: (s) => s.strip(),
      }),
    ref_doc_casos_uso: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_casos_uso", {
        is: true,
        then: (s) =>
          s.required("Ref. requerida para el documento de casos de uso"),
        otherwise: (s) => s.strip(),
      }),
    ref_doc_diseno_sistema: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_diseno_sistema", {
        is: true,
        then: (s) =>
          s.required("Ref. requerida para el documento de diseño del sistema"),
        otherwise: (s) => s.strip(),
      }),
    ref_doc_plan_pruebas: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_plan_pruebas", {
        is: true,
        then: (s) =>
          s.required("Ref. requerida para el documento de plan de pruebas"),
        otherwise: (s) => s.strip(),
      }),
    ref_doc_manuales: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_manuales", {
        is: true,
        then: (s) => s.required("Ref. requerida para documentos manuales"),
        otherwise: (s) => s.strip(),
      }),
    ref_doc_liberacion: Yup.string()
      .nullable()
      .max(200)
      .when("aplica_doc_liberacion", {
        is: true,
        then: (s) =>
          s.required("Ref. requerida para el documento de liberación"),
        otherwise: (s) => s.strip(),
      }),
    verif_doc_ideas_iniciales: Yup.boolean(),
    verif_doc_especificaciones: Yup.boolean(),
    verif_doc_casos_uso: Yup.boolean(),
    verif_doc_diseno_sistema: Yup.boolean(),
    verif_doc_plan_pruebas: Yup.boolean(),
    verif_doc_manuales: Yup.boolean(),
    verif_doc_liberacion: Yup.boolean(),
  }),
  // PASO 4: Equipo del Proyecto (RH)
  Yup.object().shape({
    equipo: Yup.array()
      .of(equipoValidationSchema)
      .min(1, "Asignar al menos un miembro")
      .required("Equipo requerido"),
  }),
  // PASO 5: Compras Iniciales
  Yup.object().shape({
    compras: Yup.array().of(compraValidationSchema).nullable(),
  }),
];

const alcanceWizardValidation = [
  Yup.object().shape({
    problema_necesidad: Yup.string().required(
      "Describir el problema o necesidad es Necesario"
    ),
  }),
  Yup.object().shape({
    entorno_actores: Yup.string().required(
      "Describir los entornos o actores es Necesario"
    ),
  }),
  Yup.object().shape({
    procedimiento_actual: Yup.string().required(
      "Describir el procedimiento actual es Necesario"
    ),
  }),
  Yup.object().shape({
    comportamiento_esperado: Yup.string().required(
      "Describir El comportamiento Esperado es necesario es Necesario"
    ),
  }),
  Yup.object().shape({
    descripcion_cuantitativa: Yup.string().required(
      "la Descripción cuantitativa es Necesaria"
    ),
  }),
  Yup.object().shape({
    limitaciones: Yup.string().required(
      "Describir las limitaciones es Necesario"
    ),
  }),
  Yup.object().shape({
    otros_temas_relevantes: Yup.string().required(
      "Describir los entornos o actores es Necesario"
    ),
  }),
];

const presupuestoValidationSchema = Yup.object().shape({
  recursos_humanos: Yup.array().of(
    Yup.object().shape({
      nombre_recurso: Yup.string().required("Nombre del recurso es requerido"), // Alineado con BD/Frontend
      salario_mensual: Yup.number()
        .typeError("Salario debe ser un número")
        .min(0, "Salario debe ser positivo")
        .required("Salario mensual es requerido"),
      cantidad_dias: Yup.number()
        .typeError("Cantidad de días debe ser un número")
        .min(0, "Cantidad de días debe ser positiva")
        .required("Cantidad de días es requerida"),
      // Campos calculados como salario_mensual_parafiscales, costo_dia, valor_total_linea
      // no necesitan validación aquí si son puramente calculados y no input del usuario.
      // id_empleado_asignado es opcional y no requiere validación estricta aquí a menos que sea mandatorio.
    })
  ),
  suministros: Yup.array().of(
    Yup.object().shape({
      nombre_proveedor: Yup.string().required("Proveedor es requerido"), // Alineado
      nombre_item: Yup.string().required("Nombre del item es requerido"), // Alineado
      cantidad_suministro: Yup.number()
        .typeError("Cantidad debe ser un número")
        .min(0, "Cantidad debe ser positiva")
        .required("Cantidad es requerida"),
      unidad_de_medida: Yup.string().required("Unidad de medida es requerida"), // Alineado
      valor_unitario_suministro: Yup.number()
        .typeError("Valor unitario debe ser un número")
        .min(0, "Valor unitario debe ser positivo")
        .required("Valor unitario es requerido"),
    })
  ),
  servicios: Yup.array().of(
    Yup.object().shape({
      nombre_proveedor: Yup.string().required("Proveedor es requerido"), // Alineado
      nombre_servicio: Yup.string().required("Nombre del servicio es requerido"), // Alineado
      cantidad_servicio: Yup.number()
        .typeError("Cantidad debe ser un número")
        .min(0, "Cantidad debe ser positiva")
        .required("Cantidad es requerida"),
      unidad_de_medida: Yup.string().required("Unidad de medida es requerida"), // Alineado
      valor_unitario: Yup.number() // Alineado
        .typeError("Valor unitario debe ser un número")
        .min(0, "Valor unitario debe ser positivo")
        .required("Valor unitario es requerido"),
    })
  ),
  // No es necesario validar los subtotales generales (total_rh_calculado, etc.) aquí
  // ya que son calculados en el frontend antes del envío y no son inputs directos del usuario.
});

// Exportar el array principal
export { alcanceWizardValidation };
export { wizardValidationSchemas };
export { presupuestoValidationSchema };

// --- Esquema para Lecciones Aprendidas ---
export const leccionAprendidaValidationSchema = Yup.object().shape({
  titulo: Yup.string()
    .required("El título es requerido.")
    .max(500, "El título no puede exceder los 500 caracteres."),
  area_categoria: Yup.string()
    .nullable()
    .max(200, "El área/categoría no puede exceder los 200 caracteres."),
  fecha: Yup.date()
    .required("La fecha es requerida.")
    .typeError("Por favor, ingrese una fecha válida."),
  descripcion_situacion: Yup.string()
    .required("La descripción de la situación es requerida.")
    .min(10, "La descripción de la situación debe tener al menos 10 caracteres."),
  descripcion_impacto: Yup.string()
    .required("La descripción del impacto es requerida.")
    .min(10, "La descripción del impacto debe tener al menos 10 caracteres."),
  acciones_correctivas: Yup.string()
    .required("Las acciones correctivas/preventivas son requeridas.")
    .min(10, "Las acciones correctivas/preventivas deben tener al menos 10 caracteres."),
  leccion_aprendida_recomendaciones: Yup.string()
    .required("La lección aprendida/recomendaciones son requeridas.")
    .min(10, "La lección aprendida/recomendaciones deben tener al menos 10 caracteres."),
  reportado_por: Yup.string()
    .nullable()
    .max(200, "El campo 'reportado por' no puede exceder los 200 caracteres."),
  tipo_leccion: Yup.string()
    .required("El tipo de lección es requerido.")
    .oneOf(['Oportunidad', 'Amenaza'], "Seleccione un tipo de lección válido."),
  id_proyecto: Yup.number()
    .required("El proyecto es requerido.")
    .positive("ID de proyecto inválido")
    .integer("ID de proyecto inválido"),
});

// --- Esquema para Formulario de Verificación ---
export const verificacionValidationSchema = Yup.object().shape({
  version_verificada: Yup.string().required("La versión verificada es requerida.").max(100, "Máximo 100 caracteres."),
  lista_chequeo: Yup.array().of(
    Yup.object().shape({
      codigo_requisito: Yup.string().nullable().max(50, "Máximo 50 caracteres."),
      tipo_requisito: Yup.string().nullable().max(100, "Máximo 100 caracteres."),
      descripcion_requisito: Yup.string().required("La descripción del requisito es requerida.").min(5, "Mínimo 5 caracteres.").typeError("Descripción inválida"),
      cumple: Yup.boolean().typeError("Debe seleccionar si cumple o no."), // .required("Debe indicar si cumple o no.") // Checkbox no suele necesitar .required()
      observaciones: Yup.string().nullable(),
      fecha_verificacion: Yup.date().required("La fecha de verificación es requerida.").typeError("Fecha inválida."),
      verificado_por_id: Yup.string().nullable().max(150, "Máximo 150 caracteres."), // Asumiendo que podría ser nombre o ID
    })
  ).min(1, "Debe agregar al menos un requisito a la lista de chequeo."),
  registros_aprobacion: Yup.array().of(
    Yup.object().shape({
      fecha_aprobacion: Yup.date().required("La fecha de aprobación es requerida.").typeError("Fecha inválida."),
      version_aprobada: Yup.string().required("La versión aprobada es requerida.").max(100, "Máximo 100 caracteres."),
      observaciones: Yup.string().nullable(),
      rol_responsable: Yup.string().required("El rol del responsable es requerido.").max(150, "Máximo 150 caracteres."),
      firma_id: Yup.string().required("La firma es requerida.").max(150, "Máximo 150 caracteres."), // Asumiendo que podría ser nombre o ID
    })
  ).min(1, "Debe agregar al menos un registro de aprobación."),
});
