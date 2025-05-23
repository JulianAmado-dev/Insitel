"use client";

import Swal from "sweetalert2";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import PropTypes from "prop-types"; // Import PropTypes
import { axiosInstance } from "@api/AxiosInstance";

// Importa los esquemas Yup desde el archivo separado
import { alcanceWizardValidation } from "@schemas/schemas.js";

// Importa tus iconos
import {
  FaInfoCircle,
  FaQuestionCircle,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaSave,
  FaExclamationTriangle,
} from "react-icons/fa";
import { IoStatsChartOutline } from "react-icons/io5";
import { GiPathDistance } from "react-icons/gi";
import {
  FaClipboardQuestion,
  FaMasksTheater,
  FaSquareRootVariable,
} from "react-icons/fa6";
import { BiInfoCircle } from "react-icons/bi";
import "./FormularioAlcance.css";
import { isEqual } from "lodash";

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
  description,
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
    <span>{description}</span>
    {children}
    <ErrorMessage name={name} component="div" className="error-message" />
  </div>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const createModeDefaultDataAlcance = {
  problema_necesidad: "",
  entorno_actores: "",
  procedimiento_actual: "",
  comportamiento_esperado: "",
  descripcion_cuantitativa: "",
  limitaciones: "",
  otros_temas_relevantes: "",
};

// --- Componente Principal ---
const FormularioAlcance = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [animateSection, setAnimateSection] = useState(true);
  const [initialData, setInitialData] = useState(createModeDefaultDataAlcance);
  const [formRecordId, setFormRecordId] = useState(null); // Will store id_proyecto for keying if record exists
  const { id_proyecto, area } = useParams();
  const totalSteps = alcanceWizardValidation.length - 1;

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
      console.log(`Fetching Alcance Form data for project ID: ${id_proyecto}, area: ${area}`);
      const { data } = await axiosInstance.get(
        `http://localhost:3001/api/Projects/${area}/${id_proyecto}/form/alcance/get`
      );
      console.log("Fetched Alcance form data (raw API response):", data);

      const alcanceDataArray = data.formulario_alcance;

      if (alcanceDataArray && alcanceDataArray.length > 0 && alcanceDataArray[0]) {
        const alcanceDataFromServer = alcanceDataArray[0];
        console.log("EDIT MODE: Record found for id_proyecto", id_proyecto, "in formulario_alcance. Data:", alcanceDataFromServer);
        
        setFormRecordId(id_proyecto); // Use id_proyecto from URL for Formik key
        
        const processedData = {
          ...createModeDefaultDataAlcance,
          ...alcanceDataFromServer,
        };
        setInitialData(processedData);
        console.log("Set initialData for EDIT mode (Alcance). formRecordId (now id_proyecto):", id_proyecto, "Processed initialData:", processedData);
      } else {
        console.log("CREATE MODE: No existing Alcance form data found for id_proyecto", id_proyecto, ". Setting defaults. data.formulario_alcance:", alcanceDataArray);
        setFormRecordId(null);
        setInitialData(createModeDefaultDataAlcance);
      }
    } catch (error) {
      console.error("Failed to fetch Alcance form data:", error);
      if (error.response && error.response.status === 404) {
        console.log("CREATE MODE (404) (Alcance): Form for id_proyecto", id_proyecto, "does not exist. Setting defaults.");
      } else {
        console.error("CREATE MODE (Error) (Alcance): Unexpected error fetching for id_proyecto", id_proyecto, ". Setting defaults.", error);
      }
      setFormRecordId(null);
      setInitialData(createModeDefaultDataAlcance);
    }
  }, [id_proyecto, area]);

  useEffect(() => {
    obtenerFormulario();
  }, [obtenerFormulario]);

  const guardarSeccion = async (sendedData, sectionIndex) => {
    const camposCambiados = {};
    const camposPorSeccion = {
      0: ["problema_necesidad"],
      1: ["entorno_actores"],
      2: ["procedimiento_actual"],
      3: ["comportamiento_esperado"],
      4: ["descripcion_cuantitativa"],
      5: ["limitaciones"],
      6: ["otros_temas_relevantes"],
    };

    const currentSectionFields = camposPorSeccion[sectionIndex];
    if (!currentSectionFields) {
      console.warn(`No field definition found for Alcance section index: ${sectionIndex}`);
      return;
    }

    currentSectionFields.forEach((campo) => {
      const formValue = sendedData[campo];
      const initialValue = Object.prototype.hasOwnProperty.call(initialData, campo) ? initialData[campo] : undefined;
      if (!isEqual(formValue, initialValue)) {
        camposCambiados[campo] = formValue;
      }
    });

    console.log("Campos cambiados en sección (Alcance)", sectionIndex, "a enviar:", camposCambiados);

    if (Object.keys(camposCambiados).length > 0) {
      setInitialData((prev) => ({ ...prev, ...camposCambiados }));

      if (formRecordId) { // formRecordId is id_proyecto here
        try {
          await axiosInstance.patch(
            `http://localhost:3001/api/Projects/${area}/${id_proyecto}/form/alcance/update`,
            camposCambiados
          );
          Toast.fire({
            icon: "success",
            title: `Sección ${sectionIndex + 1} (Alcance) guardada.`,
          });
        } catch (error) {
          console.error("Error updating Alcance section:", error);
          Toast.fire({
            icon: "error",
            title: "Error al actualizar la sección de Alcance.",
          });
        }
      } else {
        console.log(`Sección ${sectionIndex + 1} (Alcance - nuevo formulario) actualizada localmente.`);
      }
    } else {
      console.log(`No changes to save in Alcance section ${sectionIndex + 1}.`);
      Toast.fire({
        icon: "info",
        title: `No hay cambios para guardar en la sección ${sectionIndex + 1} (Alcance).`,
      });
    }
  };

  const initialValues = useMemo(() => {
    console.log("useMemo (Alcance): Recalculating initialValues based on initialData:", initialData);
    return {
      problema_necesidad: initialData?.problema_necesidad || "",
      entorno_actores: initialData?.entorno_actores || "",
      procedimiento_actual: initialData?.procedimiento_actual || "",
      comportamiento_esperado: initialData?.comportamiento_esperado || "",
      descripcion_cuantitativa: initialData?.descripcion_cuantitativa || "",
      limitaciones: initialData?.limitaciones || "",
      otros_temas_relevantes: initialData?.otros_temas_relevantes || "",
    };
  }, [initialData]);

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
        return "Problema o Necesidad";
      case 1:
        return "Entorno y Actores";
      case 2:
        return "Procedimiento Actual";
      case 3:
        return "Comportamiento Esperado";
      case 4:
        return "Descripción Cuantitativa";
      case 5:
        return "Limitaciones";
      case 6:
        return "Otros temas relevantes para el desarrollo";
      default:
        return "Paso desconocido";
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 0:
        return <FaClipboardQuestion className="section-icon" />;
      case 1:
        return <FaMasksTheater className="section-icon" />;
      case 2:
        return <FaSquareRootVariable className="section-icon" />;
      case 3:
        return <GiPathDistance className="section-icon" />;
      case 4:
        return <IoStatsChartOutline className="section-icon" />;
      case 5:
        return <FaExclamationTriangle className="section-icon" />;
      case 6:
        return <BiInfoCircle className="section-icon" />;
      default:
        return <FaInfoCircle className="section-icon" />;
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    // Ensure the last section's changes are saved locally via initialData
    // This is important because handleSubmit might be called without prior step navigation
    await guardarSeccion(values, currentStep); 

    const isExistingRecord = !!formRecordId; // formRecordId is id_proyecto if editing
    let response;
    
    try {
      if (!isExistingRecord) { 
        const payloadForCreation = { ...values }; 
        console.log("Final payload to POST to /fill (Alcance):", payloadForCreation);
        response = await axiosInstance.post(
          `http://localhost:3001/api/Projects/${area}/${id_proyecto}/form/alcance/fill`,
          payloadForCreation
        );
        Toast.fire({ icon: "success", title: "Formulario de Alcance creado con éxito." });
        await obtenerFormulario(); // Re-fetch to get new record ID and update states
      } else { 
        const changedFields = {};
        Object.keys(values).forEach(key => {
          const initialValue = Object.prototype.hasOwnProperty.call(initialData, key) ? initialData[key] : undefined;
          if (!isEqual(values[key], initialValue)) {
            changedFields[key] = values[key];
          }
        });
        
        if (Object.keys(changedFields).length === 0) {
          Toast.fire({ icon: "info", title: "No hay nuevos cambios para guardar (Alcance)." });
          setSubmitting(false);
          return;
        }
        console.log("Final payload to PATCH to /update (Alcance):", changedFields);
        response = await axiosInstance.patch(
          `http://localhost:3001/api/Projects/${area}/${id_proyecto}/form/alcance/update`,
          changedFields
        );
        Toast.fire({ icon: "success", title: "Formulario de Alcance actualizado con éxito." });
        const responseData = response.data?.formulario_alcance?.[0] || response.data?.data || response.data || {};
        setInitialData(prev => ({ ...prev, ...values, ...responseData })); // Update with current values and response
      }
    } catch (error) {
      console.error("Error submitting final Alcance form:", error);
      const action = isExistingRecord ? "actualizar" : "crear";
      Toast.fire({ icon: "error", title: `Error al ${action} el formulario de alcance.` });
    } finally {
      setSubmitting(false);
    }
  };

  // Navegación del Wizard
  const handleNavigation = async (direction, formikBag) => {
    setShowErrors(false);
    const { validateForm, setTouched, /*  submitForm, */ values } = formikBag;

    // 0. Validar hacia donde quiere ir el usuario

    if (direction === "prev") {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        return window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    // 1. Validar formulario completo (usará el schema del paso actual)
    const errors = await validateForm();

    // 2. Obtener campos *definidos* en el schema del paso actual
    const currentSchemaFields = Object.keys(
      alcanceWizardValidation[currentStep].fields
    );

    // 3. Filtrar errores solo para los campos de este paso
    const stepErrors = {};
    let firstErrorFieldName = null;
    currentSchemaFields.forEach((field) => {
      const fieldError = getNestedValue(errors, field); // Usa tu helper para buscar el error
      if (fieldError) {
        stepErrors[field] = fieldError;
        if (!firstErrorFieldName) firstErrorFieldName = field;
      }
    });

    // 4. Marcar *todos* los campos del paso actual como tocados si hay algún error en el paso
    if (Object.keys(stepErrors).length > 0) {
      const touchedFields = {};
      /* currentSchemaFields.forEach((field) => {
        // Manejo para tocar campos dentro de arrays
      }); */
      await setTouched(touchedFields, true); // Marcar como tocado (true para que se muestren errores)
    }

    // 5. Decidir si avanzar o mostrar errores
    if (Object.keys(stepErrors).length === 0) {
      // Sin errores relevantes para este paso
      if (direction === "next") {
        if (
          currentStep <
          /*esto es la longitud de pasos, es decir, cuantas secciones hay*/
          alcanceWizardValidation.length - 1
        ) {
          await guardarSeccion(values, currentStep);
          setCurrentStep((prev) => prev + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Último paso: El botón submit se encargará de llamar a handleSubmit si todo es válido
          console.log(
            "Validación del último paso OK. Click en Guardar para enviar."
          );
          // No necesitamos llamar a submitForm aquí si el botón es type="submit"
        }
      } else if (direction === "prev") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } else {
      // Hay errores en este paso
      setShowErrors(true); // Mostrar mensaje general
      console.error("Errores de validación en paso:", stepErrors);
      // Intentar hacer focus en el primer campo con error
      if (firstErrorFieldName) {
        const elements = document.getElementsByName(firstErrorFieldName);
        if (elements.length > 0) {
          elements[0].focus({ preventScroll: true });
          elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          document
            .querySelector(".error-summary")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        document
          .querySelector(".error-summary")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handlePreviousStep = (formikBag) => {
    handleNavigation("prev", formikBag);
  };
  const handleNextStepClick = (formikBag) => {
    handleNavigation("next", formikBag);
  };

  // Calcular el progreso del formulario
  const calculateProgress = () => {
    return (currentStep / alcanceWizardValidation.length) * 116.66666;
  };

  // Renderizado del paso actual
  const renderStepContent = (formikProps) => {
    const { values, errors, touched } = formikProps; // Removed isSubmitting

    switch (currentStep) {
      case 0:
        return renderStep1(values, errors, touched);
      case 1:
        return renderStep2(values, errors, touched);
      case 2:
        return renderStep3(values, errors, touched);
      case 3:
        return renderStep4(values, errors, touched, formikProps);
      case 4:
        return renderStep5(values, errors, touched, formikProps);
      case 5:
        return renderStep6(values, errors, touched, formikProps);
      case 6:
        return renderStep7(values, errors, touched, formikProps);
      default:
        return "";
    }
  };
  {
    /*<div>Paso no encontrado</div> */
  }
  // Paso 1: Información general de la solicitud
  const renderStep1 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>
      <div>
        <FormField
          label="Problema o necesidad"
          name="problema_necesidad"
          required={true}
          tooltip="Describa brevemente el(los) problema(s) o la(s) necesidad(es) identificadas"
          description="Describa brevemente el(los) problema(s) o la(s) necesidad(es) identificadas"
        >
          <div className="info-field">
            <Field
              as="textarea"
              id="problema_necesidad"
              name="problema_necesidad"
              placeholder="Describa el Problema o necesidad"
              className={`form-input ${
                touched.problema_necesidad && errors.problema_necesidad
                  ? "input-error"
                  : ""
              }`}
            />
            {/* Manual error display removed, FormField handles it */}
            <FaBuilding className="info-icon" />
          </div>
        </FormField>
      </div>

      {/* Tarjeta de resumen */}
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
  const renderStep2 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>
      <FormField
        label="Entorno y Actores"
        name="entorno_actores"
        required={true}
        tooltip="Describa el entorno y los actores del problema o necesidad, como Usuarios, Espacios, Tiempos de Respuesta, Condiciones Específicas etc."
        description="Describa el entorno y los actores del problema o necesidad, como Usuarios, Espacios, Tiempos de Respuesta, Condiciones Específicas etc."
      >
        <div className="info-field">
          <Field
            as="textarea"
            id="entorno_actores"
            name="entorno_actores"
            placeholder="Describa el entorno o los actores"
            className={`form-input ${
              touched.entorno_actores && errors.entorno_actores
                ? "input-error"
                : ""
            }`}
          />
          {/* Manual error display removed */}
          <FaBuilding className="info-icon" />
        </div>
      </FormField>
    </div>
  );

  // Paso 3: Gestión Documental
  const renderStep3 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>

      <div>
        <FormField
          label="Procedimiento Actual"
          name="procedimiento_actual"
          required={true}
          tooltip="En caso de existir, describa brevemente el procedimiento actual que se ejecuta para la(s) tarea(s) objetivo"
          description="En caso de existir, describa brevemente el procedimiento actual que se ejecuta para la(s) tarea(s) objetivo"
        >
          <div className="info-field">
            <Field
              as="textarea"
              id="procedimiento_actual"
              name="procedimiento_actual"
              placeholder="Describa el procedimiento actual que se llevará a cabo"
              className={`form-input ${
                touched.procedimiento_actual && errors.procedimiento_actual
                  ? "input-error"
                  : ""
              }`}
            />
            {/* Manual error display removed */}
            <FaBuilding className="info-icon" />
          </div>
        </FormField>
      </div>
    </div>
  );

  // Paso 4:
  const renderStep4 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>

      <div>
        <FormField
          label="Comportamiento Esperado"
          name="comportamiento_esperado"
          required={true}
          tooltip="Describa brevemente el comportamiento esperado de la solución en su punto de operación óptimo"
          description="Describa brevemente el comportamiento esperado de la solución en su punto de operación óptimo"
        >
          <div className="info-field">
            <Field
              as="textarea"
              id="comportamiento_esperado"
              name="comportamiento_esperado"
              placeholder="Describa el comportamiento esperado"
              className={`form-input ${
                touched.comportamiento_esperado &&
                errors.comportamiento_esperado
                  ? "input-error"
                  : ""
              }`}
            />
            {/* Manual error display removed */}
            <FaBuilding className="info-icon" />
          </div>
        </FormField>
      </div>
    </div>
  );
  // Paso 5 :
  const renderStep5 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>

      <div>
        <FormField
          label="Descripción Cuantitativa"
          name="descripcion_cuantitativa"
          required={true}
          tooltip="Describa brevemente de manera cuantitativa (estimada) los parámetros de la solución, como Cantidad de elementos, Usuarios, Tiempos de Uso etc."
          description="Describa brevemente de manera cuantitativa (estimada) los parámetros de la solución, como Cantidad de elementos, Usuarios, Tiempos de Uso etc."
        >
          <div className="info-field">
            <Field
              as="textarea"
              id="descripcion_cuantitativa"
              name="descripcion_cuantitativa"
              placeholder="Describa cuantitativamente los parámetros"
              className={`form-input ${
                touched.descripcion_cuantitativa &&
                errors.descripcion_cuantitativa
                  ? "input-error"
                  : ""
              }`}
            />
            {/* Manual error display removed */}
            <FaBuilding className="info-icon" />
          </div>
        </FormField>
      </div>
    </div>
  );

  const renderStep6 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>

      <div>
        <FormField
          label="Limitaciones"
          name="limitaciones"
          required={true}
          tooltip="En caso de existir, describa las restricciones que se deben tener en cuenta para el desarrollo, como condiciones ambientales, alimentación, consumo, tamaño, restricciones físicas/mecánicas, espacio disponible, etc"
          description="En caso de existir, describa las restricciones que se deben tener en cuenta para el desarrollo, como condiciones ambientales, alimentación, consumo, tamaño, restricciones físicas/mecánicas, espacio disponible, etc"
        >
          <div className="info-field">
            <Field
              as="textarea"
              id="limitaciones"
              name="limitaciones"
              placeholder="Describa Brevemente las limitaciones"
              className={`form-input ${
                touched.limitaciones && errors.limitaciones ? "input-error" : ""
              }`}
            />
            {/* Manual error display removed */}
            <FaBuilding className="info-icon" />
          </div>
        </FormField>
      </div>
    </div>
  );

  const renderStep7 = (values, errors, touched) => (
    <div className={`form-section ${animateSection ? "animate" : ""}`}>
      <div className="section-header">
        {getStepIcon(currentStep)}
        <h2>{getStepTitle(currentStep)}</h2>
        {/* Edit button removed */}
      </div>

      <div>
        <FormField
          label="Otros temas relevantes para el desarrollo"
          name="otros_temas_relevantes"
          required={true}
          tooltip="Describa otros aspectos que considere relevantes para el desarrollo, como expectativas del cliente, limitaciones en tiempo, diagrama de contexto, casos de éxito similares, etc."
          description="Describa otros aspectos que considere relevantes para el desarrollo, como expectativas del cliente, limitaciones en tiempo, diagrama de contexto, casos de éxito similares, etc."
        >
          <div className="info-field">
            <Field
              as="textarea"
              id="otros_temas_relevantes"
              name="otros_temas_relevantes"
              placeholder="Describa los otros temas relevantes"
              className={`form-input ${
                touched.otros_temas_relevantes && errors.otros_temas_relevantes
                  ? "input-error"
                  : ""
              }`}
            />
            {/* Manual error display removed */}
            <FaBuilding className="info-icon" />
          </div>
        </FormField>
      </div>
    </div>
  );

  // Renderizado del componente principal
  return (
    <div className="project-planning-container">
      <header className="form-header">
        <h1>Formulario de Alcance</h1>
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
          {Array.from({ length: 7 }).map((_, index) => (
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
        key={formRecordId || 'new-alcance-form-key'} // Force re-mount
        initialValues={initialValues}
        validationSchema={alcanceWizardValidation[currentStep]}
        onSubmit={handleSubmit}
        enableReinitialize // Good practice, though key prop is primary for remount
        validateOnChange={false}
        validateOnBlur={false}
      >
        {(formikProps) => {
          console.log("Formik initialValues in render (Alcance):", formikProps.initialValues);
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
              {renderStepContent(formikProps)}

              {/* Navegación entre pasos */}
              <div className="form-navigation">
                {currentStep > 0 && (
                  <button
                    type="button"
                    className="btn-prev"
                    onClick={() => handlePreviousStep(formikProps)}
                  >
                    <FaChevronLeft className="icon-left" /> Anterior
                  </button>
                )}

                {currentStep < totalSteps && (
                  // Llama a handleNavigation para validar y avanzar
                  <button
                    type="button"
                    onClick={() => handleNextStepClick(formikProps)}
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

export { FormularioAlcance };
