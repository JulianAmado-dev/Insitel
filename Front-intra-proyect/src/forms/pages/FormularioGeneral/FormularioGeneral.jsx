"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { axiosInstance } from "@api/AxiosInstance";

import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  intervalToDuration,
  formatDuration,
  parseISO,
  isValid,
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

import "./FormularioGeneral.css";
import { number } from "yup";

// Componente de Tooltip personalizado
const Tooltip = ({ text, children }) => (
  <div className="tooltip">
    {children}
    <span className="tooltip-text">{text}</span>
  </div>
);

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

// --- Componente Principal ---
const FormularioGeneral = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [animateSection, setAnimateSection] = useState(true);
  const { id_proyecto } = useParams();
  const { area } = useParams();

  const totalSteps = wizardValidationSchemas.length;
  const today = new Date();
  /* const navigate = useNavigate(); */

  const initialValues = {
    // Paso 1
    area_solicitante: "",
    nombre_solicitante: "",
    descripcion_solicitud: "",
    genera_cambio_tipo: "Estandar",
    departamento_interno: "",
    cliente_final: "",
    // Paso 2
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
    //tiempo total debería ser un calculo
    // Paso 3
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
    // Paso 4
    equipo: [{ id_empleado: null, rol_en_proyecto: "", responsabilidades: "" }],
    // Paso 5
    compras: [
      {
        proveedor: "",
        descripcion: "",
        cantidad: 137,
        unidad_medida: "",
        total_usd: null,
        total_cop: null,
        orden_compra: "",
        estado_compra: "",
      },
    ],
  };

  // Ajustar a medianoche para evitar problemas con la hora al comparar solo fechas
  today.setHours(0, 0, 0, 0);
  const nowLocalISO = new Date(Date.now() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const formatDateDifference = useCallback(
    (fecha_inicio_ingreso, fecha_final_ingreso) => {
      if (!fecha_inicio_ingreso || !fecha_final_ingreso) {
        return ["(seleccione ambas fechas)"];
      }

      const fecha_inicio = parseISO(fecha_inicio_ingreso);
      const fecha_final = parseISO(fecha_final_ingreso);

      if (!isValid(fecha_inicio) || !isValid(fecha_final)) {
        return ["Fechas invalidas"];
      }

      if (!isValid(fecha_inicio) || !isValid(fecha_final)) {
        return ["(Fechas inválidas)"];
      }

      if (fecha_final < fecha_inicio) {
        return ["(Fecha fin anterior a fecha inicio)"];
      }

      let diferenciaArray = [];

      const anos = differenceInYears(fecha_final, fecha_inicio);
      const meses = differenceInMonths(fecha_final, fecha_inicio);
      const semanas = differenceInWeeks(fecha_final, fecha_inicio);
      const dias = differenceInDays(fecha_final, fecha_inicio);

      // Esta lógica sigue siendo incorrecta para descomposición, pero evita NaN
      if (anos !== 0) {
        diferenciaArray.push(`${anos} año${anos > 1 ? "s" : ""}`);
      } else "";
      if (meses !== 0) {
        diferenciaArray.push(`${meses} mes${meses > 1 ? "es" : ""}`);
      } else "";
      if (semanas !== 0) {
        diferenciaArray.push(`${semanas} semana${semanas > 1 ? "s" : ""}`);
      } else "";
      if (dias >= 0) {
        diferenciaArray.push(`${dias} día${dias !== 1 ? "s" : ""}`);
      }

      console.log("soy response", diferenciaArray);
      return diferenciaArray;
    },
    []
  );

  const formatIntervalDuration = useCallback((fecha_inicio, fecha_final) => {
    if (!fecha_inicio || !fecha_final) {
      return "ingrese fechas validas";
    }

    const startDate = parseISO(fecha_inicio);
    const endDate = parseISO(fecha_final);

    // Validar fechas ANTES de calcular
    if (!isValid(startDate) || !isValid(endDate)) {
      return "(Ingrese fechas válidas 134)";
    }

    if (endDate < startDate) {
      return "(Fecha fin < Fecha inicio)";
    }

    const duration = intervalToDuration({
      start: startDate,
      end: endDate,
    });

    const years = duration.years;
    const months = duration.months;
    console.log("aqui la duracion");
    const weeks = duration.days / 7;
    const remainingDays = duration.days % 7;

    const tiempoFormateado = [];

    if (years !== 0 && years) {
      tiempoFormateado.push(`${years} año${years > 1 ? "s" : ""}`);
    } else "";
    if (months !== 0 && months) {
      tiempoFormateado.push(`${months} mes${months > 1 ? "es" : ""}`);
    } else "";
    if (Math.floor(weeks) !== 0 && weeks) {
      tiempoFormateado.push(
        `${Math.floor(weeks)} semana${Math.floor(weeks) > 1 ? "s" : ""}`
      );
    } else "";
    if (remainingDays >= 0 && remainingDays) {
      tiempoFormateado.push(
        `${remainingDays} día${remainingDays !== 1 ? "s" : ""}`
      );
    }

    console.log("holahola", tiempoFormateado);
    return tiempoFormateado.join(", ");
  }, []);

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

  const registrarDatos = (sendedData, area, id_proyecto) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        axiosInstance
          .post(
            `http://localhost:3001/api/Projects/${area}/${id_proyecto}/form/general/fill`,
            sendedData
          )
          .then(({ data }) => {
            Toast.fire({
              icon: "success",
              title: "Datos enviados",
            });
            resolve(data);
          })
          .catch(({ response }) => {
            console.log("hola, soy response", response);
            Toast.fire({
              icon: "warning",
              timer: 5000,
              title: response.data.error,
            });
            reject(response);
            throw response;
          });
      }, 2000);
    });
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
    console.log(
      "Enviando formulario completo:",
      JSON.stringify(values, null, 2)
    );
    registrarDatos(values, area, id_proyecto);
    setSubmitting(false);
    // Aquí iría la lógica para enviar los datos al servidor
    setTimeout(() => {
      // Simulación
      alert("Formulario Enviado (Simulación)");
      setSubmitting(false);
      // Opcional: resetForm();
    }, 1500);
  };

  // Función para validar el paso actual

  // Navegación del Wizard
  const handleNavigation = async (direction, formikBag) => {
    setShowErrors(false);
    const { validateForm, setTouched, submitForm, values } = formikBag;

    // 0. Validar hacia donde quiere ir el usuario

    if (direction === "prev") {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    // 1. Validar formulario completo (usará el schema del paso actual)
    const errors = await validateForm();

    // 2. Obtener campos *definidos* en el schema del paso actual
    const currentSchemaFields = Object.keys(
      wizardValidationSchemas[currentStep].fields
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
      currentSchemaFields.forEach((field) => {
        // Manejo para tocar campos dentro de arrays
        if ((field === "equipo" || field === "compras") && values[field]) {
          values[field].forEach((_, index) => {
            const subSchemaKeys = Object.keys(initialValues[field][0]);
            subSchemaKeys.forEach((subField) => {
              touchedFields[`${field}[${index}].${subField}`] = true;
            });
          });
        } else {
          touchedFields[field] = true;
        }
      });
      await setTouched(touchedFields, true); // Marcar como tocado (true para que se muestren errores)
    }

    // 5. Decidir si avanzar o mostrar errores
    if (Object.keys(stepErrors).length === 0) {
      // Sin errores relevantes para este paso
      if (direction === "next") {
        if (
          currentStep <
          6 /*esto es la longitud de pasos, es decir, cuantas secciones hay*/ -
            1
        ) {
          setCurrentStep((prev) => prev + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          /* handleSubmit(values); */
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
        } else if (
          firstErrorFieldName === "equipo" ||
          firstErrorFieldName === "compras"
        ) {
          // Lógica de focus para arrays (puede necesitar ajustes)
          const firstArrayErrorIndex = errors[firstErrorFieldName]?.findIndex(
            (item) => !!item
          );
          if (
            firstArrayErrorIndex !== -1 &&
            firstArrayErrorIndex !== undefined
          ) {
            const firstSubFieldError = Object.keys(
              errors[firstErrorFieldName][firstArrayErrorIndex] || {}
            )[0];
            if (firstSubFieldError) {
              const fieldToFocus = document.querySelector(
                `[name="${firstErrorFieldName}[${firstArrayErrorIndex}].${firstSubFieldError}"]`
              );
              fieldToFocus?.focus({ preventScroll: true });
              fieldToFocus?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            } else {
              // Si no hay sub-error, enfocar el resumen
              document
                .querySelector(".error-summary")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
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
    return (currentStep / wizardValidationSchemas.length) * 125;
  };

  // Renderizado del paso actual
  const renderStepContent = (formikProps, additionalProps) => {
    const { values, errors, touched, isSubmitting } = formikProps;

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
            <Field type="radio" name="genera_cambio_tipo" value="Estandar" />
            <span className="radio-custom"></span> Estándar
          </label>
          <label className="radio-label">
            <Field type="radio" name="genera_cambio_tipo" value="Recurrente" />
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
            <Field type="checkbox" name="tipo_proyecto" value="Hardware" />
            <span className="radio-custom"></span> Hardware
          </label>
          <label className="radio-label">
            <Field type="checkbox" name="tipo_proyecto" value="Software" />
            <span className="radio-custom"></span> Software
          </label>
        </div>
      </FormField>

      {/* Campos Condicionales Hardware */}
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
                className={`form-input ${
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
      {/* Campos Condicionales Software */}
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
          label="Ruta Proyecto Desarrollo (URL)"
          name="ruta_proyecto_desarrollo"
          tooltip="Enlace al repositorio o ubicación del proyecto"
        >
          <div className="info-field">
            <Field
              type="url"
              id="ruta_proyecto_desarrollo"
              name="ruta_proyecto_desarrollo"
              placeholder="http://..."
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
          label="Ruta Cotización (URL)"
          name="ruta_cotizacion"
          tooltip="Enlace al documento de cotización"
        >
          <div className="info-field">
            <Field
              type="url"
              id="ruta_cotizacion"
              name="ruta_cotizacion"
              placeholder="http://..."
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
                  <Field type="checkbox" name="aplica_doc_casos_uso" />
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
                className={`form-textarea ${
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
          {Array.from({ length: 5 }).map((_, index) => (
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
        initialValues={initialValues}
        validationSchema={wizardValidationSchemas[currentStep]}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {(formikProps) => {
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
