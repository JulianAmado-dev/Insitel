"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { axiosInstance } from "@api/AxiosInstance";
import isEqual from "lodash/isEqual"; // Re-added isEqual
import PropTypes from "prop-types";
import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  intervalToDuration,
  parseISO,
  isValid,
  format,
} from "date-fns";
// Importa los esquemas Yup desde el archivo separado
import { wizardValidationSchemas } from "@schemas/schemas.js";

// Importa tus iconos
import {
  FaRegLightbulb,
  FaClipboardList,
  FaUsers,
  FaShoppingCart,
  FaFolderOpen,
  FaInfoCircle,
  FaQuestionCircle,
  FaCalendarAlt,
  FaFileAlt,
  FaLink,
  FaBuilding,
  FaUserTie,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaTrash,
  FaSave,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BackButton } from "@forms/components/BackButton"; // Added import

import "./FormularioGeneral.css";

// Componente de Tooltip personalizado
const Tooltip = ({ text, children }) => (
  <div className="tooltip">
    {children}
    <span className="tooltip-text">{text}</span>
  </div>
);

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

// Componente de campo con etiqueta e información adicional
const FormField = ({
  label,
  name,
  required = false,
  tooltip = null,
  children,
  className = "",
}) => (
  <div className={`form-group ${className}`}>
    <label htmlFor={name}>
      {label} {required && <span className="required">*</span>}
      {tooltip && (
        <Tooltip text={tooltip}>
          <FaQuestionCircle size={14} />
        </Tooltip>
      )}
    </label>
    {children}
    <ErrorMessage name={name} component="div" className="error-message" />
  </div>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};


// Define default structure for initialData (especially for create mode)
// Moved outside the component to be a stable reference
const createModeDefaultData = {
  area_solicitante: "",
  nombre_solicitante: "",
  descripcion_solicitud: "",
  genera_cambio_tipo: "Estandar",
  departamento_interno: "",
  cliente_final: "",
  tipo_proyecto: [],
  nivel_hardware: "",
  componentes_hardware: "",
  otro_valor_componentes_hardware: "",
  nivel_software: "",
  componentes_software: "",
  otro_valor_componentes_software: "",
  entregables: "",
  requisitos_seguimiento_y_medicion: "",
  criterios_de_aceptacion: "",
  consecuencias_por_fallar: "",
  fecha_inicio_planificada: "",
  fecha_final_planificada: "",
  ruta_proyecto_desarrollo: "",
  ruta_cotizacion: "",
  aplica_doc_ideas_iniciales: true,
  aplica_doc_especificaciones: true,
  aplica_doc_casos_uso: true,
  aplica_doc_diseno_sistema: true,
  aplica_doc_plan_pruebas: true,
  aplica_doc_manuales: true,
  aplica_doc_liberacion: true,
  ref_doc_ideas_iniciales: "",
  ref_doc_especificaciones: "",
  ref_doc_casos_uso: "",
  ref_doc_diseno_sistema: "",
  ref_doc_plan_pruebas: "",
  ref_doc_manuales: "",
  ref_doc_liberacion: "",
  verif_doc_ideas_iniciales: false,
  verif_doc_especificaciones: false,
  verif_doc_casos_uso: false,
  verif_doc_diseno_sistema: false,
  verif_doc_plan_pruebas: false,
  verif_doc_manuales: false,
  verif_doc_liberacion: false,
  equipo: [{ id_empleado: null, rol_en_proyecto: "", responsabilidades: "" }],
  compras: [{ proveedor: "", descripcion: "", cantidad: 0, unidad_medida: "", total_usd: null, total_cop: null, orden_compra: "", estado_compra: "" }],
};

// Array of boolean checkbox field names
const booleanCheckboxFields = [
  "aplica_doc_ideas_iniciales", "verif_doc_ideas_iniciales",
  "aplica_doc_especificaciones", "verif_doc_especificaciones",
  "aplica_doc_casos_uso", "verif_doc_casos_uso",
  "aplica_doc_diseno_sistema", "verif_doc_diseno_sistema",
  "aplica_doc_plan_pruebas", "verif_doc_plan_pruebas",
  "aplica_doc_manuales", "verif_doc_manuales",
  "aplica_doc_liberacion", "verif_doc_liberacion",
];

// Helper function to process boolean fields for payload before sending to backend
const formatBooleanFieldsForPayload = (payloadObject) => {
  booleanCheckboxFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(payloadObject, field)) {
      let value = payloadObject[field];
      // If value is somehow an array (e.g., ['0'] or [false]), take the first element
      if (Array.isArray(value) && value.length > 0) {
        value = value[0];
      }
      // Convert true, 'true', '1', 1 to 1, otherwise 0
      payloadObject[field] = (value === true || value === 'true' || value === '1' || value === 1) ? 1 : 0;
    }
  });
};

// --- Componente Principal ---
const FormularioGeneral = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [animateSection, setAnimateSection] = useState(true);
  // Initialize initialData with the default structure
  const [initialData, setInitialData] = useState(createModeDefaultData);
  const [formRecordId, setFormRecordId] = useState(null); // Stores the PK of the form_general record

  const { id_proyecto } = useParams();
  const { area } = useParams();

  const totalSteps = wizardValidationSchemas.length -1; // Adjusted for 0-based indexing
  const today = new Date();

  const Toast = Swal.mixin({
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

  const obtenerFormulario = useCallback(async () => {
    try {
      console.log(`Fetching General Form data for project ID: ${id_proyecto}, area: ${area}`);
      const { data } = await axiosInstance.get(
        `http://localhost:3001/api/Proyectos/${area}/${id_proyecto}/form/general/get`
      );
      console.log("Fetched general form data (raw API response):", data);

      const generalDataObject = data.formulario_general; // API returns an object
      const teamData = data.miembros_proyecto || [];
      const buysData = data.compras_proyecto || [];

      // Determine edit/create mode based on whether a record for id_proyecto was found
      // Corrected condition to check if generalDataObject is a valid object
      if (generalDataObject && typeof generalDataObject === 'object' && generalDataObject !== null && Object.keys(generalDataObject).length > 0 && generalDataObject.id_proyecto !== undefined) {
        const generalDataFromServer = generalDataObject; // Use the object directly
        console.log("EDIT MODE: Record found for id_proyecto", id_proyecto, ". Data:", generalDataFromServer);
        
        setFormRecordId(id_proyecto); // Use id_proyecto from URL params for Formik key
        
        const fecha_inicio_formateada = generalDataFromServer?.fecha_inicio_planificada
          ? format(parseISO(generalDataFromServer.fecha_inicio_planificada), "yyyy-MM-dd'T'HH:mm")
          : "";
        const fecha_final_formateada = generalDataFromServer?.fecha_final_planificada
          ? format(parseISO(generalDataFromServer.fecha_final_planificada), "yyyy-MM-dd'T'HH:mm")
          : "";
        
        const processedData = {
          ...createModeDefaultData, 
          ...generalDataFromServer, 
          fecha_inicio_planificada: fecha_inicio_formateada,
          fecha_final_planificada: fecha_final_formateada,
          tipo_proyecto: generalDataFromServer?.tipo_proyecto 
            ? generalDataFromServer.tipo_proyecto.split(",") 
            : createModeDefaultData.tipo_proyecto,
          equipo: teamData.length > 0 ? teamData : createModeDefaultData.equipo,
          compras: buysData.length > 0 ? buysData : createModeDefaultData.compras,
        };
        // Ensure boolean fields from server (0/1) are converted to true/false for initialData
        booleanCheckboxFields.forEach(field => {
          if (Object.prototype.hasOwnProperty.call(processedData, field)) {
            processedData[field] = !!processedData[field]; // Converts 0 to false, 1 to true
          }
        });
        setInitialData(processedData);
        console.log("Set initialData for EDIT mode. formRecordId (now id_proyecto):", id_proyecto, "Processed initialData (booleans ensured):", processedData);

      } else {
        console.log("CREATE MODE: No valid existing general form data found for id_proyecto", id_proyecto, ". Setting defaults. Received data.formulario_general:", generalDataObject);
        setFormRecordId(null); // No specific record ID, so null for Formik key (create context)
        setInitialData(createModeDefaultData);
      }
    } catch (error) {
      console.error("Failed to fetch general form data:", error);
      if (error.response && error.response.status === 404) {
        console.log("CREATE MODE (404): Form for id_proyecto", id_proyecto, "does not exist. Setting defaults.");
      } else {
        console.error("CREATE MODE (Error): Unexpected error fetching for id_proyecto", id_proyecto, ". Setting defaults.", error);
      }
      setFormRecordId(null);
      setInitialData(createModeDefaultData);
    }
  }, [id_proyecto, area]);

  useEffect(() => {
    obtenerFormulario();
  }, [obtenerFormulario]);
  
  // Memoize initialValues to ensure stable reference unless initialData changes
  const initialValues = useMemo(() => {
    console.log("useMemo: Recalculating initialValues for Formik based on initialData:", initialData);
    return {
      area_solicitante: initialData?.area_solicitante || "",
      nombre_solicitante: initialData?.nombre_solicitante || "",
      descripcion_solicitud: initialData?.descripcion_solicitud || "",
      genera_cambio_tipo: initialData?.genera_cambio_tipo || "Estandar",
      departamento_interno: initialData?.departamento_interno || "",
      cliente_final: initialData?.cliente_final || "",
      tipo_proyecto: initialData?.tipo_proyecto || [],
      nivel_hardware: initialData?.nivel_hardware || "",
      componentes_hardware: initialData?.componentes_hardware || "",
      otro_valor_componentes_hardware: initialData?.otro_valor_componentes_hardware || "",
      nivel_software: initialData?.nivel_software || "",
      componentes_software: initialData?.componentes_software || "",
      otro_valor_componentes_software: initialData?.otro_valor_componentes_software || "",
      entregables: initialData?.entregables || "",
      requisitos_seguimiento_y_medicion: initialData?.requisitos_seguimiento_y_medicion || "",
      criterios_de_aceptacion: initialData?.criterios_de_aceptacion || "",
      consecuencias_por_fallar: initialData?.consecuencias_por_fallar || "",
      fecha_inicio_planificada: initialData?.fecha_inicio_planificada || "",
      fecha_final_planificada: initialData?.fecha_final_planificada || "",
      ruta_proyecto_desarrollo: initialData?.ruta_proyecto_desarrollo || "",
      ruta_cotizacion: initialData?.ruta_cotizacion || "",
      aplica_doc_ideas_iniciales: initialData?.aplica_doc_ideas_iniciales === undefined ? true : initialData.aplica_doc_ideas_iniciales,
      aplica_doc_especificaciones: initialData?.aplica_doc_especificaciones === undefined ? true : initialData.aplica_doc_especificaciones,
      aplica_doc_casos_uso: initialData?.aplica_doc_casos_uso === undefined ? true : initialData.aplica_doc_casos_uso,
      aplica_doc_diseno_sistema: initialData?.aplica_doc_diseno_sistema === undefined ? true : initialData.aplica_doc_diseno_sistema,
      aplica_doc_plan_pruebas: initialData?.aplica_doc_plan_pruebas === undefined ? true : initialData.aplica_doc_plan_pruebas,
      aplica_doc_manuales: initialData?.aplica_doc_manuales === undefined ? true : initialData.aplica_doc_manuales,
      aplica_doc_liberacion: initialData?.aplica_doc_liberacion === undefined ? true : initialData.aplica_doc_liberacion,
      ref_doc_ideas_iniciales: initialData?.ref_doc_ideas_iniciales || "",
      ref_doc_especificaciones: initialData?.ref_doc_especificaciones || "",
      ref_doc_casos_uso: initialData?.ref_doc_casos_uso || "",
      ref_doc_diseno_sistema: initialData?.ref_doc_diseno_sistema || "",
      ref_doc_plan_pruebas: initialData?.ref_doc_plan_pruebas || "",
      ref_doc_manuales: initialData?.ref_doc_manuales || "",
      ref_doc_liberacion: initialData?.ref_doc_liberacion || "",
      verif_doc_ideas_iniciales: initialData?.verif_doc_ideas_iniciales || false,
      verif_doc_especificaciones: initialData?.verif_doc_especificaciones || false,
      verif_doc_casos_uso: initialData?.verif_doc_casos_uso || false,
      verif_doc_diseno_sistema: initialData?.verif_doc_diseno_sistema || false,
      verif_doc_plan_pruebas: initialData?.verif_doc_plan_pruebas || false,
      verif_doc_manuales: initialData?.verif_doc_manuales || false,
      verif_doc_liberacion: initialData?.verif_doc_liberacion || false,
      equipo: initialData?.equipo && initialData.equipo.length > 0 ? initialData.equipo : [{ id_empleado: null, rol_en_proyecto: "", responsabilidades: "" }],
      compras: initialData?.compras && initialData.compras.length > 0 ? initialData.compras : [{ proveedor: "", descripcion: "", cantidad: 0, unidad_medida: "", total_usd: null, total_cop: null, orden_compra: "", estado_compra: "" }],
    };
  }, [initialData]);
  
  // Paso 1
  // area_solicitante: initialData?.area_solicitante || "",
    // nombre_solicitante: initialData?.nombre_solicitante || "", // ... rest of the fields
  // };

  // Ajustar a medianoche para evitar problemas con la hora al comparar solo fechas
  today.setHours(0, 0, 0, 0);
  const nowLocalISO = new Date(Date.now() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const formatDateDifference = useCallback( // Keep useCallback if dependencies are stable or empty
    (fecha_inicio_ingreso, fecha_final_ingreso) => {
      if (!fecha_inicio_ingreso || !fecha_final_ingreso) {
        return ["(seleccione ambas fechas)"];
      }

      const fecha_inicio = parseISO(fecha_inicio_ingreso);
      const fecha_final = parseISO(fecha_final_ingreso);

      if (!isValid(fecha_inicio) || !isValid(fecha_final)) {
        return ["Fechas invalidas"];
      }

      if (fecha_final < fecha_inicio) {
        return ["(Fecha fin anterior a fecha inicio)"];
      }

      let diferenciaArray = [];
      const anos = differenceInYears(fecha_final, fecha_inicio);
      const meses = differenceInMonths(fecha_final, fecha_inicio);
      const semanas = differenceInWeeks(fecha_final, fecha_inicio);
      const dias = differenceInDays(fecha_final, fecha_inicio);

      if (anos > 0) diferenciaArray.push(`${anos} año${anos > 1 ? "s" : ""}`);
      if (meses > 0) diferenciaArray.push(`${meses} mes${meses > 1 ? "es" : ""}`);
      if (semanas > 0) diferenciaArray.push(`${semanas} semana${semanas > 1 ? "s" : ""}`);
      if (dias >= 0) diferenciaArray.push(`${dias} día${dias !== 1 ? "s" : ""}`);
      
      return diferenciaArray.length > 0 ? diferenciaArray : ["(Fechas iguales o inválidas para diferencia)"];
    },
    []
  );

  const formatIntervalDuration = useCallback((fecha_inicio, fecha_final) => {
    if (!fecha_inicio || !fecha_final) {
      return "Ingrese fechas válidas";
    }
    const startDate = parseISO(fecha_inicio);
    const endDate = parseISO(fecha_final);

    if (!isValid(startDate) || !isValid(endDate)) {
      return "(Ingrese fechas válidas)";
    }
    if (endDate < startDate) {
      return "(Fecha fin < Fecha inicio)";
    }

    const duration = intervalToDuration({ start: startDate, end: endDate });
    const { years, months, days } = duration;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    const tiempoFormateado = [];
    if (years > 0) tiempoFormateado.push(`${years} año${years > 1 ? "s" : ""}`);
    if (months > 0) tiempoFormateado.push(`${months} mes${months > 1 ? "es" : ""}`);
    if (weeks > 0) tiempoFormateado.push(`${weeks} semana${weeks > 1 ? "s" : ""}`);
    if (remainingDays > 0) tiempoFormateado.push(`${remainingDays} día${remainingDays !== 1 ? "s" : ""}`);
    
    return tiempoFormateado.length > 0 ? tiempoFormateado.join(", ") : "Misma fecha";
  }, []);

  // registrarDatos will be replaced by guardarSeccion and modified handleSubmit

  const camposPorSeccion = {
    0: [ // Información de la solicitud
      "area_solicitante", "nombre_solicitante", "descripcion_solicitud",
      "genera_cambio_tipo", "departamento_interno", "cliente_final",
    ],
    1: [ // Información del Requerimiento
      "tipo_proyecto", "nivel_hardware", "componentes_hardware", "otro_valor_componentes_hardware",
      "nivel_software", "componentes_software", "otro_valor_componentes_software",
      "entregables", "requisitos_seguimiento_y_medicion", "criterios_de_aceptacion",
      "consecuencias_por_fallar", "fecha_inicio_planificada", "fecha_final_planificada",
    ],
    2: [ // Gestión Documental
      "ruta_proyecto_desarrollo", "ruta_cotizacion",
      "aplica_doc_ideas_iniciales", "ref_doc_ideas_iniciales", "verif_doc_ideas_iniciales",
      "aplica_doc_especificaciones", "ref_doc_especificaciones", "verif_doc_especificaciones",
      "aplica_doc_casos_uso", "ref_doc_casos_uso", "verif_doc_casos_uso",
      "aplica_doc_diseno_sistema", "ref_doc_diseno_sistema", "verif_doc_diseno_sistema",
      "aplica_doc_plan_pruebas", "ref_doc_plan_pruebas", "verif_doc_plan_pruebas",
      "aplica_doc_manuales", "ref_doc_manuales", "verif_doc_manuales",
      "aplica_doc_liberacion", "ref_doc_liberacion", "verif_doc_liberacion",
    ],
    3: ["equipo"], // Equipo del Proyecto (array)
    4: ["compras"], // Proceso de Compras (array)
  };

  const guardarSeccion = async (sendedData, seccionIndex) => {
    const camposDeSeccionActual = camposPorSeccion[seccionIndex];
    if (!camposDeSeccionActual) {
      console.warn(`No field definition found for section index: ${seccionIndex}`);
      return;
    }

    const camposCambiados = {};
    camposDeSeccionActual.forEach((campo) => {
      const formValue = sendedData[campo];
      // Use Object.prototype.hasOwnProperty.call for safer check
      const initialValue = Object.prototype.hasOwnProperty.call(initialData, campo) ? initialData[campo] : undefined;

      if (!isEqual(formValue, initialValue)) {
        camposCambiados[campo] = formValue;
      }
    });
    
    const payload = { ...camposCambiados };
    // Refined date formatting with validation
    if (Object.prototype.hasOwnProperty.call(payload, "fecha_inicio_planificada")) {
        const dateVal = payload.fecha_inicio_planificada;
        if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
            payload.fecha_inicio_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
        } else if (!dateVal) {
            payload.fecha_inicio_planificada = null;
        }
        // If dateVal is not a string or not valid, it remains as is or could be explicitly nulled
    }
    if (Object.prototype.hasOwnProperty.call(payload, "fecha_final_planificada")) {
        const dateVal = payload.fecha_final_planificada;
        if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
            payload.fecha_final_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
        } else if (!dateVal) {
            payload.fecha_final_planificada = null;
        }
    }
    if (Object.prototype.hasOwnProperty.call(payload, "tipo_proyecto") && Array.isArray(payload.tipo_proyecto)) {
        payload.tipo_proyecto = payload.tipo_proyecto.join(',');
    }
    
    formatBooleanFieldsForPayload(payload); // Format booleans to 0/1

    console.log("Campos cambiados en sección", seccionIndex, "a enviar (booleans formatted):", payload);

    if (Object.keys(payload).length > 0) {
      // Update initialData locally with the changes from the current section
      const updatedInitialDataFieldsFromForm = {};
      Object.keys(camposCambiados).forEach(key => {
          updatedInitialDataFieldsFromForm[key] = sendedData[key];
      });
      setInitialData((prev) => ({ ...prev, ...updatedInitialDataFieldsFromForm }));

      // Only attempt to PATCH if it's an existing form record
      if (formRecordId) {
        try {
          await axiosInstance.patch(
            `http://localhost:3001/api/Proyectos/${area}/${id_proyecto}/form/general/update`,
            payload // Send the processed payload
          );
          Toast.fire({
            icon: "success",
            title: `Sección ${seccionIndex + 1} guardada en el servidor.`,
          });
        } catch (error) {
          console.error("Error updating section:", error);
          Toast.fire({
            icon: "error",
            title: "Error al actualizar la sección en el servidor.",
          });
        }
      } else {
        // For a new form, changes are staged locally.
        console.log(`Sección ${seccionIndex + 1} (nuevo formulario) actualizada localmente. Se guardará al finalizar.`);
        // Optionally, inform user that changes are local until final save
        // Toast.fire({
        //   icon: "info",
        //   title: `Cambios en sección ${seccionIndex + 1} preparados.`,
        // });
      }
    } else {
      console.log(`No changes to save in section ${seccionIndex + 1}.`);
      Toast.fire({
        icon: "info",
        title: `No hay cambios para guardar en la sección ${seccionIndex + 1}.`,
      });
    }
  };

  // Efecto para animar la transición entre pasos
  useEffect(() => {
    setAnimateSection(false);
    const timer = setTimeout(() => {
      setAnimateSection(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Helper para obtener valores anidados (errores/touched)
  const getNestedValue = (obj, path) => {
    if (!path || !obj) return undefined;
    const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return result;
  };

  // Funciones para títulos e iconos
  const getStepTitle = (step) => {
    switch (step) {
      case 0:
        return "Información de la solicitud";
      case 1:
        return "Información del Requerimiento";
      case 2:
        return "Gestión Documental";
      case 3:
        return "Equipo del Proyecto";
      case 4:
        return "Proceso de Compras";
      default:
        return "Paso desconocido";
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 0:
        return <FaRegLightbulb className="section-icon" />;
      case 1:
        return <FaClipboardList className="section-icon" />;
      case 2:
        return <FaFolderOpen className="section-icon" />;
      case 3:
        return <FaUsers className="section-icon" />;
      case 4:
        return <FaShoppingCart className="section-icon" />;
      default:
        return <FaInfoCircle className="section-icon" />;
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (values, { setSubmitting }) => {
    console.log("Attempting final submission for FormularioGeneral...");
    setSubmitting(true);
    // First, ensure the current (last) section's changes are saved
    await guardarSeccion(values, currentStep);

    // Then, determine all changes across the entire form compared to the *original* initialData
    // (or decide if guardarSeccion on the last step is sufficient)
    // For simplicity matching FormularioAlcance, the final submit often just re-saves the last section
    // or confirms. If a full diff against original load is needed, that's more complex.
    // Here, we'll assume guardarSeccion on the last step is the primary save action for it.

    // Collect all fields that have changed compared to the most up-to-date initialData
    // This initialData would have been updated by guardarSeccion if intermediate steps were saved.
    const changedFieldsPayload = {};
    Object.keys(values).forEach(key => {
      const formValue = values[key];
      const initialValue = Object.prototype.hasOwnProperty.call(initialData, key) ? initialData[key] : undefined;
      if (!isEqual(formValue, initialValue)) {
        changedFieldsPayload[key] = formValue;
      }
    });

    // Format specific fields for the backend
    const finalPayload = { ...changedFieldsPayload }; // Start with changed fields

    // If it's a new form (no initialData.id), we might need to send the full payload
    // or ensure the backend can infer missing fields or handle partial data for creation via PATCH.
    // For simplicity and to revert to original-like behavior, we'll prepare a potentially full payload
    // if no ID exists, or stick to changedFields if an ID exists.
    // However, the original logic sent all `changedFieldsPayload` to PATCH.

    if (Object.prototype.hasOwnProperty.call(finalPayload, "fecha_inicio_planificada")) {
        const dateVal = finalPayload.fecha_inicio_planificada;
        if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
            finalPayload.fecha_inicio_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
        } else if (!dateVal) {
            finalPayload.fecha_inicio_planificada = null;
        }
    }
    if (Object.prototype.hasOwnProperty.call(finalPayload, "fecha_final_planificada")) {
        const dateVal = finalPayload.fecha_final_planificada;
        if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
            finalPayload.fecha_final_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
        } else if (!dateVal) {
            finalPayload.fecha_final_planificada = null;
        }
    }
    if (Object.prototype.hasOwnProperty.call(finalPayload, "tipo_proyecto") && Array.isArray(finalPayload.tipo_proyecto)) {
      finalPayload.tipo_proyecto = finalPayload.tipo_proyecto.join(',');
    }
    formatBooleanFieldsForPayload(finalPayload); // Format booleans to 0/1

    // If there are no changes and it's an existing form, inform the user.
    if (initialData?.id && Object.keys(finalPayload).length === 0) { // initialData.id might not be the right check if formRecordId is id_proyecto
      Toast.fire({
        icon: "info",
        title: "No hay nuevos cambios para guardar en el formulario general.",
      });
      setSubmitting(false);
      return;
    }
    
    // If it's a new form (no id) but there are no "changes" (because initialData was empty),
    // then finalPayload would be empty. In this case, we should send all of `values` (formatted).
    let payloadToSend = finalPayload;
    if (!initialData?.id && Object.keys(finalPayload).length === 0) {
        // This is a new form, and no "changes" were detected against an empty initialData.
        // We need to send all form values, formatted.
        const allValuesFormatted = { ...values };
        if (Object.prototype.hasOwnProperty.call(allValuesFormatted, "fecha_inicio_planificada")) {
            const dateVal = allValuesFormatted.fecha_inicio_planificada;
            if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
                allValuesFormatted.fecha_inicio_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
            } else if (!dateVal) {
                allValuesFormatted.fecha_inicio_planificada = null;
            }
        }
        if (Object.prototype.hasOwnProperty.call(allValuesFormatted, "fecha_final_planificada")) {
            const dateVal = allValuesFormatted.fecha_final_planificada;
            if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
                allValuesFormatted.fecha_final_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
            } else if (!dateVal) {
                allValuesFormatted.fecha_final_planificada = null;
            }
        }
        if (Object.prototype.hasOwnProperty.call(allValuesFormatted, "tipo_proyecto") && Array.isArray(allValuesFormatted.tipo_proyecto)) {
          allValuesFormatted.tipo_proyecto = allValuesFormatted.tipo_proyecto.join(',');
        }
        formatBooleanFieldsForPayload(allValuesFormatted); // Format booleans to 0/1
        payloadToSend = allValuesFormatted;
    } else {
       // finalPayload is already formatted if this block is skipped
       // payloadToSend = finalPayload; // This line is redundant if finalPayload is already assigned to payloadToSend
    }


    const isExistingRecord = !!formRecordId; // True if formRecordId (which is id_proyecto) is not null
    let response;

    try {
      if (!isExistingRecord) { // Create new form record
        const createPayload = { ...values }; // Send all form values
        // Format fields for creation as needed by the backend /fill endpoint
        if (Object.prototype.hasOwnProperty.call(createPayload, "fecha_inicio_planificada")) {
            const dateVal = createPayload.fecha_inicio_planificada;
            if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
                createPayload.fecha_inicio_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
            } else if (!dateVal) createPayload.fecha_inicio_planificada = null;
        }
        if (Object.prototype.hasOwnProperty.call(createPayload, "fecha_final_planificada")) {
            const dateVal = createPayload.fecha_final_planificada;
            if (dateVal && typeof dateVal === 'string' && isValid(parseISO(dateVal))) {
                createPayload.fecha_final_planificada = format(parseISO(dateVal), "yyyy-MM-dd HH:mm:ss");
            } else if (!dateVal) createPayload.fecha_final_planificada = null;
        }
        if (Object.prototype.hasOwnProperty.call(createPayload, "tipo_proyecto") && Array.isArray(createPayload.tipo_proyecto)) {
          createPayload.tipo_proyecto = createPayload.tipo_proyecto.join(',');
        }
        createPayload.equipo = createPayload.equipo || [];
        createPayload.compras = createPayload.compras || [];
        formatBooleanFieldsForPayload(createPayload); // Format booleans to 0/1

        console.log("Final payload to POST to /fill (General) (booleans formatted):", createPayload);
        response = await axiosInstance.post(
          `http://localhost:3001/api/Proyectos/${area}/${id_proyecto}/form/general/fill`,
          createPayload
        );
        Toast.fire({ icon: "success", title: "Formulario General creado con éxito." });
        // After successful creation, re-fetch to get the new record's ID and update state
        await obtenerFormulario(); 
      } else { // Update existing form record
        // payloadToSend was calculated earlier with changed fields
        if (Object.keys(payloadToSend).length === 0) {
          Toast.fire({ icon: "info", title: "No hay nuevos cambios para guardar." });
          setSubmitting(false);
          return;
        }
        console.log("Final payload to PATCH to /update (General):", payloadToSend);
        response = await axiosInstance.patch(
          `http://localhost:3001/api/Proyectos/${area}/${id_proyecto}/form/general/update`,
          payloadToSend // payloadToSend is already formatted
        );
        Toast.fire({ icon: "success", title: "Formulario General actualizado con éxito." });
        // After successful update, update initialData with the current form values
        // and any specific data returned by the PATCH response (though often PATCH returns 204 or minimal data)
        const responseData = response.data?.formulario_general?.[0] || response.data?.data || response.data || {};
        const updatedData = { ...initialData, ...values, ...responseData };
         // Re-format dates from server response if necessary
        if (updatedData.fecha_inicio_planificada && typeof updatedData.fecha_inicio_planificada === 'string') {
            updatedData.fecha_inicio_planificada = format(parseISO(updatedData.fecha_inicio_planificada), "yyyy-MM-dd'T'HH:mm");
        }
        if (updatedData.fecha_final_planificada && typeof updatedData.fecha_final_planificada === 'string') {
            updatedData.fecha_final_planificada = format(parseISO(updatedData.fecha_final_planificada), "yyyy-MM-dd'T'HH:mm");
        }
        if (updatedData.tipo_proyecto && typeof updatedData.tipo_proyecto === 'string') {
            updatedData.tipo_proyecto = updatedData.tipo_proyecto.split(',');
        }
        setInitialData(updatedData);
      }
    } catch (error) {
      console.error("Error submitting final form (General):", error);
      const action = isExistingRecord ? "actualizar" : "crear";
      Toast.fire({ icon: "error", title: `Error al ${action} el formulario general.` });
    } finally {
      setSubmitting(false);
    }
  };

  // Navegación del Wizard
  const handleNavigation = async (direction, formikBag) => {
    setShowErrors(false);
    const { validateForm, setTouched, values } = formikBag; // Removed submitForm

    if (direction === "prev") {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const errors = await validateForm();
    const currentSchemaFields = Object.keys(wizardValidationSchemas[currentStep].fields);
    const stepErrors = {};
    let firstErrorFieldName = null;

    currentSchemaFields.forEach((field) => {
      const fieldError = getNestedValue(errors, field);
      if (fieldError) {
        stepErrors[field] = fieldError;
        if (!firstErrorFieldName) firstErrorFieldName = field;
      }
    });

    if (Object.keys(stepErrors).length > 0) {
      const touchedFields = {};
      currentSchemaFields.forEach((field) => {
        if ((field === "equipo" || field === "compras") && values[field]) {
          values[field].forEach((_, index) => {
            const subSchemaKeys = Object.keys(initialValues[field][0] || {}); // Ensure initialValues[field][0] exists
            subSchemaKeys.forEach((subField) => {
              touchedFields[`${field}[${index}].${subField}`] = true;
            });
          });
        } else {
          touchedFields[field] = true;
        }
      });
      await setTouched(touchedFields, true);
      setShowErrors(true);
      console.error("Errores de validación en paso:", stepErrors);
      // Focus logic (simplified for brevity, can be expanded)
      if (firstErrorFieldName) {
        const elements = document.getElementsByName(firstErrorFieldName);
        if (elements.length > 0) {
          elements[0].focus({ preventScroll: true });
          elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
           document.querySelector(".error-summary")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        document.querySelector(".error-summary")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      await guardarSeccion(values, currentStep); 
      if (direction === "next" && currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (direction === "next" && currentStep === totalSteps) {
        console.log("Validación del último paso OK. Click en Guardar para enviar.");
        // Final submit is handled by the submit button
      }
    }
  };

  const handlePreviousStep = (formikBag) => {
    handleNavigation("prev", formikBag);
  };
  const handleNextStepClick = (formikBag) => {
    handleNavigation("next", formikBag);
  };

  const calculateProgress = () => {
    // Ensure wizardValidationSchemas.length is not 0 to avoid division by zero
    return wizardValidationSchemas.length > 0 ? (currentStep / (wizardValidationSchemas.length -1)) * 100 : 0;
  };
  

  // Renderizado del paso actual
  const renderStepContent = (formikProps, additionalProps) => {
    const { values, errors, touched } = formikProps; // Removed isSubmitting

    switch (currentStep) {
      case 0:
        return renderStep1(values, errors, touched);
      case 1:
        return renderStep2(values, errors, touched, additionalProps);
      case 2:
        return renderStep3(values, errors, touched);
      case 3:
        return renderStep4(values, errors, touched, formikProps);
      case 4:
        return renderStep5(values, errors, touched, formikProps);
      default:
        return <div>Paso no encontrado</div>; // Default case
    }
  };

  // Paso 1: Información general de la solicitud
  const renderStep1 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
      </div>
      <div className="form-grid">
        <FormField
          label="Área Solicitante"
          name="area_solicitante"
          required={true}
          tooltip="Departamento o área que realiza la solicitud del proyecto"
        >
          <div className="info-field">
            <Field
              type="text"
              id="area_solicitante"
              name="area_solicitante"
              placeholder="Ingrese el área"
              className={`form-input ${
                touched.area_solicitante && errors.area_solicitante
                  ? "input-error"
                  : ""
              }`}
            />
            <FaBuilding className="info-icon" />
          </div>
        </FormField>

        <FormField
          label="Nombre Solicitante"
          name="nombre_solicitante"
          required={true}
          tooltip="Persona responsable de la solicitud"
        >
          <div className="info-field">
            <Field
              type="text"
              id="nombre_solicitante"
              name="nombre_solicitante"
              placeholder="Ingrese el nombre"
              className={`form-input ${
                touched.nombre_solicitante && errors.nombre_solicitante
                  ? "input-error"
                  : ""
              }`}
            />
            <FaUserTie className="info-icon" />
          </div>
        </FormField>
      </div>

      <FormField
        label="Descripción General Solicitud"
        name="descripcion_solicitud"
        required={true}
        tooltip="Describa brevemente el propósito y alcance de la solicitud"
      >
        <Field
          as="textarea"
          id="descripcion_solicitud"
          name="descripcion_solicitud"
          placeholder="Describa la solicitud"
          rows="4"
          className={`form-textarea ${
            touched.descripcion_solicitud && errors.descripcion_solicitud
              ? "input-error"
              : ""
          }`}
        />
      </FormField>

      <FormField
        label="Genera cambio de tipo"
        name="genera_cambio_tipo"
        required={true}
        tooltip="Seleccione el tipo de cambio que genera esta solicitud"
      >
        <div
          role="group"
          aria-labelledby="genera_cambio_tipo-group"
          className="radio-group"
        >
          <label className="radio-label">
            <Field
              type="radio"
              name="genera_cambio_tipo"
              value="Estandar"
            />
            <span className="radio-custom"></span> Estándar
          </label>
          <label className="radio-label">
            <Field
              type="radio"
              name="genera_cambio_tipo"
              value="Recurrente"
            />
            <span className="radio-custom"></span> Recurrente
          </label>
          <label className="radio-label">
            <Field
              type="radio"
              name="genera_cambio_tipo"
              value="De emergencia"
            />
            <span className="radio-custom"></span> De emergencia
          </label>
        </div>
      </FormField>

      <div className="section-divider">
        <h3>Información del Cliente</h3>
      </div>

      <div className="form-grid">
        <FormField
          label="Departamento Interno"
          name="departamento_interno"
          tooltip="Si el proyecto es para un departamento interno, especifíquelo aquí"
        >
          <Field
            type="text"
            id="departamento_interno"
            name="departamento_interno"
            placeholder="Opcional"
            className="form-input"
          />
        </FormField>

        <FormField
          label="Cliente Final (Externo)"
          name="cliente_final"
          tooltip="Si el proyecto es para un cliente externo, especifíquelo aquí"
        >
          <Field
            type="text"
            id="cliente_final"
            name="cliente_final"
            placeholder="Opcional"
            className="form-input"
          />
        </FormField>
      </div>

      {values.area_solicitante && values.nombre_solicitante && (
        <div className="summary-card">
          <h4>Resumen de la Solicitud</h4>
          <p>
            <strong>{values.nombre_solicitante}</strong> del área{" "}
            <strong>{values.area_solicitante}</strong> solicita un proyecto de
            tipo <strong>{values.genera_cambio_tipo}</strong>
            {values.cliente_final && (
              <span>
                {" "}
                para el cliente <strong>{values.cliente_final}</strong>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );

  // Paso 2: Información general del Requerimiento
  const renderStep2 = (values, errors, touched, additionalProps = {}) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
      </div>
      <FormField
        label="Tipo de Proyecto"
        name="tipo_proyecto"
        required={true}
        tooltip="Seleccione si el proyecto es de hardware o software, o aplica de igual medida para las dos áreas"
      >
        <div
          role="group"
          aria-labelledby="tipo_proyecto-group"
          className="radio-group"
        >
          <label className="radio-label">
            <Field
              type="checkbox"
              name="tipo_proyecto"
              value="Hardware"
            />
            <span className="radio-custom"></span> Hardware
          </label>
          <label className="radio-label">
            <Field
              type="checkbox"
              name="tipo_proyecto"
              value="Software"
            />
            <span className="radio-custom"></span> Software
          </label>
        </div>
      </FormField>

      {values.tipo_proyecto.includes("Hardware") && (
        <div className="conditional-section">
          <div className="section-divider">
            <h3>Detalles de Hardware</h3>
          </div>
          <div className="form-grid">
            <FormField
              label="Nivel de complejidad (1-4)"
              name="nivel_hardware"
              required={true}
              tooltip="Nivel de complejidad del hardware (1: Bajo, 4: Alto)"
            >
              <Field
                type="number"
                id="nivel_hardware"
                name="nivel_hardware"
                min="1"
                max="4"
                className={`form-input ${
                  touched.nivel_hardware && errors.nivel_hardware
                    ? "input-error"
                    : ""
                }`}
              />
            </FormField>

            <FormField
              label="Componentes"
              name="componentes_hardware"
              required={true}
              tooltip="Seleccione el tipo principal de componente de hardware"
            >
              <Field
                as="select"
                name="componentes_hardware"
                className={`form-select ${
                  touched.componentes_hardware && errors.componentes_hardware
                    ? "input-error"
                    : ""
                }`}
              >
                <option value="">Seleccione...</option>
                <option value="PCB">PCB</option>
                <option value="Sistema Embebido">Sistema Embebido</option>
                <option value="Otro">Otro (especificar)</option>
              </Field>
            </FormField>
          </div>

          {values.componentes_hardware === "Otro" && (
            <FormField
              label="Especifique Componente"
              name="otro_valor_componentes_hardware"
              required={true}
            >
              <Field
                type="text"
                id="otro_valor_componentes_hardware"
                name="otro_valor_componentes_hardware"
                className={`form-input text-uppercase ${
                  touched.otro_valor_componentes_hardware &&
                  errors.otro_valor_componentes_hardware
                    ? "input-error"
                    : ""
                }`}
              />
            </FormField>
          )}
        </div>
      )}
      {values.tipo_proyecto.includes("Software") && (
        <div className="conditional-section">
          <div className="section-divider">
            <h3>Detalles de Software</h3>
          </div>
          <div className="form-grid">
            <FormField
              label="Nivel de complejidad (1-4)"
              name="nivel_software"
              required={true}
              tooltip="Nivel de complejidad del software (1: Bajo, 4: Alto)"
            >
              <Field
                type="number"
                id="nivel_software"
                name="nivel_software"
                min="1"
                max="4"
                className={`form-input ${
                  touched.nivel_software && errors.nivel_software
                    ? "input-error"
                    : ""
                }`}
              />
            </FormField>

            <FormField
              label="Componentes"
              name="componentes_software"
              required={true}
              tooltip="Seleccione el tipo principal de componente de software"
            >
              <Field
                as="select"
                name="componentes_software"
                className={`form-select ${
                  touched.componentes_software && errors.componentes_software
                    ? "input-error"
                    : ""
                }`}
              >
                <option value="">Seleccione...</option>
                <option value="WEB">WEB</option>
                <option value="Escritorio">Escritorio</option>
                <option value="Servidor">Servidor</option>
                <option value="Móvil">Móvil</option>
                <option value="Otro">Otro (especificar)</option>
              </Field>
            </FormField>
          </div>

          {values.componentes_software === "Otro" && (
            <FormField
              label="Especifique Componente"
              name="otro_valor_componentes_software"
              required={true}
            >
              <Field
                type="text"
                id="otro_valor_componentes_software"
                name="otro_valor_componentes_software"
                className={`form-input ${
                  touched.otro_valor_componentes_software &&
                  errors.otro_valor_componentes_software
                    ? "input-error"
                    : ""
                }`}
              />
            </FormField>
          )}
        </div>
      )}
      <div className="section-divider">
        <h3>Información Adicional</h3>
      </div>

      <div className="form-grid">
        <FormField
          label="Entregables"
          name="entregables"
          required={true}
          tooltip="Describa los productos o servicios que se entregarán al finalizar el proyecto"
        >
          <Field
            as="textarea"
            id="entregables"
            name="entregables"
            rows="3"
            placeholder="Producto Hardware, Software y/o Documentación"
            className={`form-textarea ${
              touched.entregables && errors.entregables ? "input-error" : ""
            }`}
          />
        </FormField>
        <FormField
          label="Requisitos Seguimiento y Medición"
          name="requisitos_seguimiento_y_medicion"
          required={true}
          tooltip="Especifique los indicadores y métricas para evaluar el progreso del proyecto"
        >
          <Field
            as="textarea"
            id="requisitos_seguimiento_y_medicion"
            name="requisitos_seguimiento_y_medicion"
            rows="3"
            placeholder="Definición de indicadores"
            className={`form-textarea ${
              touched.requisitos_seguimiento_y_medicion &&
              errors.requisitos_seguimiento_y_medicion
                ? "input-error"
                : ""
            }`}
          />
        </FormField>
        <FormField
          label="Criterios de Aceptación"
          name="criterios_de_aceptacion"
          required={true}
          tooltip="Defina los criterios que determinarán si el proyecto se ha completado satisfactoriamente"
        >
          <Field
            as="textarea"
            id="criterios_de_aceptacion"
            name="criterios_de_aceptacion"
            rows="3"
            placeholder="Criterios para liberación"
            className={`form-textarea ${
              touched.criterios_de_aceptacion && errors.criterios_de_aceptacion
                ? "input-error"
                : ""
            }`}
          />
        </FormField>
        <FormField
          label="Consecuencias por Fallar"
          name="consecuencias_por_fallar"
          required={true}
          tooltip="Describa las implicaciones o penalizaciones en caso de no cumplir con los objetivos"
        >
          <Field
            as="textarea"
            id="consecuencias_por_fallar"
            name="consecuencias_por_fallar"
            rows="3"
            placeholder="Pólizas, cláusulas, etc."
            className={`form-textarea ${
              touched.consecuencias_por_fallar &&
              errors.consecuencias_por_fallar
                ? "input-error"
                : ""
            }`}
          />
        </FormField>
      </div>

      <div className="form-grid">
        <FormField
          label="Fecha Inicio Planificada"
          name="fecha_inicio_planificada"
          tooltip="Fecha estimada de inicio del proyecto"
        >
          <div className="info-field">
            <Field
              type="datetime-local"
              id="fecha_inicio_planificada"
              name="fecha_inicio_planificada"
              min={nowLocalISO}
              className={`form-input ${
                touched.fecha_inicio_planificada &&
                errors.fecha_inicio_planificada
                  ? "input-error"
                  : ""
              }`}
            />
            <FaCalendarAlt className="info-icon" />
          </div>
        </FormField>

        <FormField
          label="Fecha Fin Planificada"
          name="fecha_final_planificada"
          tooltip="Fecha estimada de finalización del proyecto"
        >
          <div className="info-field">
            <Field
              type="datetime-local"
              id="fecha_final_planificada"
              name="fecha_final_planificada"
              min={nowLocalISO}
              className={`form-input ${
                touched.fecha_final_planificada &&
                errors.fecha_final_planificada
                  ? "input-error"
                  : ""
              }`}
            />
            <FaCalendarAlt className="info-icon" />
          </div>
        </FormField>

        {values.fecha_inicio_planificada && values.fecha_final_planificada && (
          <>
            <div className="form-group">
              <h4>Tiempo total estimado:</h4>
              <div>{additionalProps.dateFormatIntervalDuration}</div>
            </div>

            <div className="form-group">
              <h4>Eso significa que tenemos </h4>
              <ul>
                <li>
                  <div>{additionalProps.dateFormatDifferenceArray[0]}</div>
                </li>
                <span>O</span>
                <li>
                  <div>{additionalProps.dateFormatDifferenceArray[1]}</div>
                </li>
                <span>O</span>
                <li>
                  <div>{additionalProps.dateFormatDifferenceArray[2]}</div>
                </li>
              </ul>
              <h4>Hasta terminar el proyecto </h4>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Paso 3: Gestión Documental
  const renderStep3 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
      </div>

      <div className="form-grid">
        <FormField
          label="Ruta Proyecto Desarrollo (URL o Ruta)"
          name="ruta_proyecto_desarrollo"
          tooltip="Enlace al repositorio o ubicación del proyecto"
        >
          <div className="info-field">
            <Field
              type="url"
              id="ruta_proyecto_desarrollo"
              name="ruta_proyecto_desarrollo"
              placeholder="http://... o /..."
              className={`form-input ${
                touched.ruta_proyecto_desarrollo &&
                errors.ruta_proyecto_desarrollo
                  ? "input-error"
                  : ""
              }`}
            />
            <FaLink className="info-icon" />
          </div>
        </FormField>

        <FormField
          label="Ruta Cotización (URL o Ruta)"
          name="ruta_cotizacion"
          tooltip="Enlace al documento de cotización"
        >
          <div className="info-field">
            <Field
              type="url"
              id="ruta_cotizacion"
              name="ruta_cotizacion"
              placeholder="http://... o /..."
              className={`form-input ${
                touched.ruta_cotizacion && errors.ruta_cotizacion
                  ? "input-error"
                  : ""
              }`}
            />
            <FaLink className="info-icon" />
          </div>
        </FormField>
      </div>

      <div className="section-divider">
        <h3>Documentación del Proyecto</h3>
      </div>

      <div className="document-checklist">
        <table className="document-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Aplica</th>
              <th>Nombre/Referencia</th>
              <th>Verificado</th>
            </tr>
          </thead>
          <tbody>
            {/* Fila Ideas Iniciales */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Ideas Iniciales
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field type="checkbox" name="aplica_doc_ideas_iniciales" />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_ideas_iniciales"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_ideas_iniciales &&
                    errors.ref_doc_ideas_iniciales
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_ideas_iniciales}
                />
                <ErrorMessage
                  name="ref_doc_ideas_iniciales"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_ideas_iniciales"
                    disabled={!values.aplica_doc_ideas_iniciales}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>

            {/* Fila Especificaciones */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Especificaciones
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field type="checkbox" name="aplica_doc_especificaciones" />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_especificaciones"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_especificaciones &&
                    errors.ref_doc_especificaciones
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_especificaciones}
                />
                <ErrorMessage
                  name="ref_doc_especificaciones"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_especificaciones"
                    disabled={!values.aplica_doc_especificaciones}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>

            {/* Fila Casos de Uso */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Casos de Uso
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="aplica_doc_casos_uso"
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_casos_uso"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_casos_uso && errors.ref_doc_casos_uso
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_casos_uso}
                />
                <ErrorMessage
                  name="ref_doc_casos_uso"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_casos_uso"
                    disabled={!values.aplica_doc_casos_uso}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>

            {/* Fila Diseño del Sistema */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Diseño del Sistema
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field type="checkbox" name="aplica_doc_diseno_sistema" />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_diseno_sistema"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_diseno_sistema &&
                    errors.ref_doc_diseno_sistema
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_diseno_sistema}
                />
                <ErrorMessage
                  name="ref_doc_diseno_sistema"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_diseno_sistema"
                    disabled={!values.aplica_doc_diseno_sistema}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>

            {/* Fila Plan de Pruebas */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Plan de Pruebas
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field type="checkbox" name="aplica_doc_plan_pruebas" />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_plan_pruebas"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_plan_pruebas && errors.ref_doc_plan_pruebas
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_plan_pruebas}
                />
                <ErrorMessage
                  name="ref_doc_plan_pruebas"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_plan_pruebas"
                    disabled={!values.aplica_doc_plan_pruebas}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>

            {/* Fila Manuales */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Manuales
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field type="checkbox" name="aplica_doc_manuales" />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_manuales"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_manuales && errors.ref_doc_manuales
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_manuales}
                />
                <ErrorMessage
                  name="ref_doc_manuales"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_manuales"
                    disabled={!values.aplica_doc_manuales}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>

            {/* Fila Liberación */}
            <tr>
              <td>
                <div className="document-name">
                  <FaFileAlt className="document-icon" /> Liberación
                </div>
              </td>
              <td>
                <label className="checkbox-container">
                  <Field type="checkbox" name="aplica_doc_liberacion" />
                  <span className="checkmark"></span>
                </label>
              </td>
              <td>
                <Field
                  type="text"
                  name="ref_doc_liberacion"
                  placeholder="Referencia"
                  className={`form-input small ${
                    touched.ref_doc_liberacion && errors.ref_doc_liberacion
                      ? "input-error"
                      : ""
                  }`}
                  disabled={!values.aplica_doc_liberacion}
                />
                <ErrorMessage
                  name="ref_doc_liberacion"
                  component="div"
                  className="error-message"
                />
              </td>
              <td>
                <label className="checkbox-container">
                  <Field
                    type="checkbox"
                    name="verif_doc_liberacion"
                    disabled={!values.aplica_doc_liberacion}
                  />
                  <span className="checkmark"></span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Paso 4: Equipo del Proyecto
  const renderStep4 = (values, errors, touched, formikProps) => {
    const { setFieldValue } = formikProps;

    const addTeamMember = () => {
      const newTeamMember = {
        id_empleado: null,
        rol_en_proyecto: "",
        responsabilidades: "",
      };
      setFieldValue("equipo", [...values.equipo, newTeamMember]);
    };

    const removeTeamMember = (index) => {
      if (values.equipo.length > 1) {
        const newTeam = [...values.equipo];
        newTeam.splice(index, 1);
        setFieldValue("equipo", newTeam);
      }
    };

    return (
      <div className={`form-section ${animateSection ? "animate" : ""}`}>
        <div className="section-header">
          {getStepIcon(currentStep)}
          <h2>{getStepTitle(currentStep)}</h2>
        </div>

        <div className="field-required-note">
          <span className="required">*</span> Campos obligatorios
        </div>

        {values.equipo.map((_, index) => (
          <div key={index} className="team-member-container">
            <div className="section-divider">
              <h3>Miembro del Equipo #{index + 1}</h3>
            </div>

            <div className="form-grid">
              <FormField
                label="ID Empleado"
                name={`equipo[${index}].id_empleado`}
                required={true}
                tooltip="Identificador único del empleado"
              >
                <Field
                  type="text"
                  name={`equipo[${index}].id_empleado`}
                  placeholder="ID del empleado"
                  className={`form-input ${
                    getNestedValue(touched, `equipo[${index}].id_empleado`) &&
                    getNestedValue(errors, `equipo[${index}].id_empleado`)
                      ? "input-error"
                      : ""
                  }`}
                />
              </FormField>

              <FormField
                label="Rol en el Proyecto"
                name={`equipo[${index}].rol_en_proyecto`}
                required={true}
                tooltip="Función que desempeñará en el proyecto"
              >
                <Field
                  as="select"
                  name={`equipo[${index}].rol_en_proyecto`}
                  className={`form-select ${
                    getNestedValue(
                      touched,
                      `equipo[${index}].rol_en_proyecto`
                    ) &&
                    getNestedValue(errors, `equipo[${index}].rol_en_proyecto`)
                      ? "input-error"
                      : ""
                  }`}
                >
                  <option value="">Seleccione un rol...</option>
                  <option value="Gerente de Proyecto">
                    Gerente de Proyecto
                  </option>
                  <option value="Desarrollador">Desarrollador</option>
                  <option value="Diseñador">Diseñador</option>
                  <option value="Tester">Tester</option>
                  <option value="Analista">Analista</option>
                  <option value="Documentador">Documentador</option>
                  <option value="Otro">Otro</option>
                </Field>
              </FormField>
            </div>

            <FormField
              label="Responsabilidades"
              name={`equipo[${index}].responsabilidades`}
              required={true}
              tooltip="Describa las responsabilidades específicas de este miembro del equipo"
            >
              <Field
                as="textarea"
                name={`equipo[${index}].responsabilidades`}
                placeholder="Describa las responsabilidades..."
                className={`form-textarea  ${
                  getNestedValue(
                    touched,
                    `equipo[${index}].responsabilidades`
                  ) &&
                  getNestedValue(errors, `equipo[${index}].responsabilidades`)
                    ? "input-error"
                    : ""
                }`}
              />
            </FormField>

            {values.equipo.length > 1 && (
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeTeamMember(index)}
              >
                <FaTrash className="icon-left" /> Eliminar Miembro
              </button>
            )}
          </div>
        ))}

        <button type="button" className="btn-add" onClick={addTeamMember}>
          <FaPlus className="icon-left" /> Agregar Miembro del Equipo
        </button>
      </div>
    );
  };

  // Paso 5: Proceso de Compras
  const renderStep5 = (values, errors, touched, formikProps) => {
    const { setFieldValue } = formikProps;

    const addPurchase = () => {
      const newPurchase = {
        proveedor: "",
        descripcion: "",
        cantidad: 1,
        unidad_medida: "",
        total_usd: null,
        total_cop: null,
        orden_compra: "",
        estado_compra: "Solicitado",
      };
      setFieldValue("compras", [...values.compras, newPurchase]);
    };

    const removePurchase = (index) => {
      if (values.compras.length > 1) {
        const newPurchases = [...values.compras];
        newPurchases.splice(index, 1);
        setFieldValue("compras", newPurchases);
      }
    };

    return (
      <div className={`form-section ${animateSection ? "animate" : ""}`}>
        <div className="section-header">
          {getStepIcon(currentStep)}
          <h2>{getStepTitle(currentStep)}</h2>
        </div>

        <div className="field-required-note">
          <span className="required">*</span> Campos obligatorios
        </div>

        {values.compras.map((_, index) => (
          <div key={index} className="purchase-container">
            <div className="section-divider">
              <h3>Compra #{index + 1}</h3>
            </div>

            <div className="form-grid">
              <FormField
                label="Proveedor"
                name={`compras[${index}].proveedor`}
                required={true}
                tooltip="Nombre del proveedor o empresa"
              >
                <Field
                  type="text"
                  name={`compras[${index}].proveedor`}
                  placeholder="Nombre del proveedor"
                  className={`form-input ${
                    getNestedValue(touched, `compras[${index}].proveedor`) &&
                    getNestedValue(errors, `compras[${index}].proveedor`)
                      ? "input-error"
                      : ""
                  }`}
                />
              </FormField>

              <FormField
                label="Descripción"
                name={`compras[${index}].descripcion`}
                required={true}
                tooltip="Descripción del producto o servicio a adquirir"
              >
                <Field
                  type="text"
                  name={`compras[${index}].descripcion`}
                  placeholder="Descripción del producto/servicio"
                  className={`form-input ${
                    getNestedValue(touched, `compras[${index}].descripcion`) &&
                    getNestedValue(errors, `compras[${index}].descripcion`)
                      ? "input-error"
                      : ""
                  }`}
                />
              </FormField>
            </div>

            <div className="form-grid">
              <FormField
                label="Cantidad"
                name={`compras[${index}].cantidad`}
                required={true}
              >
                <Field
                  type="number"
                  name={`compras[${index}].cantidad`}
                  min="1"
                  className={`form-input ${
                    getNestedValue(touched, `compras[${index}].cantidad`) &&
                    getNestedValue(errors, `compras[${index}].cantidad`)
                      ? "input-error"
                      : ""
                  }`}
                />
              </FormField>

              <FormField
                label="Unidad de Medida"
                name={`compras[${index}].unidad_medida`}
                required={true}
              >
                <Field
                  type="text"
                  name={`compras[${index}].unidad_medida`}
                  placeholder="Ej: Unidades, Kg, Horas"
                  className={`form-input ${
                    getNestedValue(
                      touched,
                      `compras[${index}].unidad_medida`
                    ) &&
                    getNestedValue(errors, `compras[${index}].unidad_medida`)
                      ? "input-error"
                      : ""
                  }`}
                />
              </FormField>
            </div>

            <div className="form-grid">
              <FormField
                label="Total USD"
                name={`compras[${index}].total_usd`}
                tooltip="Valor total en dólares estadounidenses"
              >
                <Field
                  type="number"
                  name={`compras[${index}].total_usd`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="form-input"
                />
              </FormField>

              <FormField
                label="Total COP"
                name={`compras[${index}].total_cop`}
                tooltip="Valor total en pesos colombianos"
              >
                <Field
                  type="number"
                  name={`compras[${index}].total_cop`}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="form-input"
                />
              </FormField>
            </div>

            <div className="form-grid">
              <FormField
                label="Orden de Compra"
                name={`compras[${index}].orden_compra`}
                tooltip="Número o referencia de la orden de compra"
              >
                <Field
                  type="text"
                  name={`compras[${index}].orden_compra`}
                  placeholder="Número de orden"
                  className="form-input"
                />
              </FormField>

              <FormField
                label="Estado"
                name={`compras[${index}].estado_compra`}
                required={true}
              >
                <Field
                  as="select"
                  name={`compras[${index}].estado_compra`}
                  className={`form-select ${
                    getNestedValue(
                      touched,
                      `compras[${index}].estado_compra`
                    ) &&
                    getNestedValue(errors, `compras[${index}].estado_compra`)
                      ? "input-error"
                      : ""
                  }`}
                >
                  <option value="Solicitado">Solicitado</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Recibido">Recibido</option>
                  <option value="Cancelado">Cancelado</option>
                </Field>
              </FormField>
            </div>

            {values.compras.length > 1 && (
              <button
                type="button"
                className="btn-remove"
                onClick={() => removePurchase(index)}
              >
                <FaTrash className="icon-left" /> Eliminar Compra
              </button>
            )}
          </div>
        ))}

        <button type="button" className="btn-add" onClick={addPurchase}>
          <FaPlus className="icon-left" /> Agregar Compra
        </button>
      </div>
    );
  };

// Renderizado del componente principal
return (
  <div className="project-planning-container">
    <BackButton area={area} id_proyecto={id_proyecto} /> {/* Added BackButton component with props */}
    <header className="form-header">
      <h1>Formulario de Planeación de Proyectos</h1>
        <div className="form-code">SIGAR-2025</div>
      </header>

      <div className="progress-container_form">
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>

        <div className="progress-steps">
          {Array.from({ length: wizardValidationSchemas.length }).map((_, index) => (
            <div
              key={index}
              className={`progress-step ${
                index <= currentStep ? "active" : ""
              } ${index === currentStep ? "current" : ""}`}
            >
              <div className="step-icon">{getStepIcon(index)}</div>
              <div className="step-number">{getStepTitle(index)}</div>
            </div>
          ))}
        </div>
      </div>

      <Formik
        key={formRecordId || 'new-form-key'} // Force re-mount when formRecordId changes
        initialValues={initialValues}
        validationSchema={wizardValidationSchemas[currentStep]}
        onSubmit={handleSubmit}
        enableReinitialize // Still good practice, though key might make it redundant for this specific case
        validateOnChange={false} 
        validateOnBlur={false}  
      >
        {(formikProps) => {
          console.log("Formik initialValues in render:", formikProps.initialValues); // Log what Formik sees
          const dateFormatDifferenceArray =
            formikProps.values.fecha_inicio_planificada &&
            formikProps.values.fecha_final_planificada
              ? formatDateDifference(
                  formikProps.values.fecha_inicio_planificada,
                  formikProps.values.fecha_final_planificada
                )
              : "(seleccione ambas fechas)";

          const dateFormatIntervalDuration =
            formikProps.values.fecha_inicio_planificada &&
            formikProps.values.fecha_final_planificada
              ? formatIntervalDuration(
                  formikProps.values.fecha_inicio_planificada,
                  formikProps.values.fecha_final_planificada
                )
              : "";

          return (
            <Form className="project-planning-form">
              {/* Mostrar resumen de errores si hay errores y se ha intentado avanzar */}
              {showErrors && Object.keys(formikProps.errors).length > 0 && (
                <div className="error-summary">
                  <FaExclamationTriangle className="error-icon" />
                  <div className="error-summary-content">
                    <div className="error-summary-title">
                      Por favor corrija los siguientes errores:
                    </div>
                    <ul className="error-summary-list">
                      {Object.entries(formikProps.errors).map(
                        ([key, value]) => (
                          <li key={key}>
                            {typeof value === "string"
                              ? value
                              : "Error en campo anidado"}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Contenido del paso actual */}
              {renderStepContent(formikProps, {
                dateFormatDifferenceArray,
                dateFormatIntervalDuration,
              })}

              {/* Navegación entre pasos */}
              <div className="form-navigation">
                {currentStep > 0 && (
                  <button
                    type="button"
                    className="btn-prev"
                    onClick={
                      () =>
                        handlePreviousStep(
                          formikProps
                        ) /* handleNavigation("prev", formikProps) */
                    }
                  >
                    <FaChevronLeft className="icon-left" /> Anterior
                  </button>
                )}

                {currentStep < totalSteps && (
                  // Llama a handleNavigation para validar y avanzar
                  <button
                    type="button"
                    onClick={
                      () =>
                        handleNextStepClick(
                          formikProps
                        ) /* handleNavigation("next", formikProps) */
                    }
                    className="btn-next"
                  >
                    Siguiente <FaChevronRight className="icon-right" />
                  </button>
                )}
                {currentStep === totalSteps && (
                  // Botón final es type="submit"
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={formikProps.isSubmitting}
                  >
                    {formikProps.isSubmitting ? (
                      "Guardando..."
                    ) : (
                      <>
                        {" "}
                        <FaSave className="icon-left" /> Guardar Proyecto{" "}
                      </>
                    )}
                  </button>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export { FormularioGeneral };
