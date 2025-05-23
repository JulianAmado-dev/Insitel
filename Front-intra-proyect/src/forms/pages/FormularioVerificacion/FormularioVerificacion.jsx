"use client";

import { useState, useEffect, useCallback, useMemo } from "react"; // React import removed
import { useParams } from "react-router-dom";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import Swal from "sweetalert2";
import { axiosInstance } from "../../../common/api/axiosInstance"; // Ajusta la ruta si es necesario
// import { verificacionValidationSchema } from "../../../common/utils/schemas"; // Se creará luego
import PropTypes from "prop-types";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaClipboardList,
  FaUserCheck,
  // FaFileSignature, // Eliminado porque no se usa en esta versión
  FaQuestionCircle,
} from "react-icons/fa";
import { BackButton } from "@forms/components/BackButton"; // Added import

import "./FormularioVerificacion.css";

// --- Helper Components ---
const Tooltip = ({ text, children }) => (
  <div className="tooltip-verificacion">
    {children}
    <span className="tooltip-text-verificacion">{text}</span>
  </div>
);

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const FormField = ({
  label,
  name,
  type = "text",
  placeholder = "",
  as = "input",
  rows = undefined,
  required = false,
  tooltip = null,
  disabled = false,
  className = "",
  formGroupClassName = "",
  ...props
}) => (
  <div className={`form-group ${formGroupClassName}`}>
    <label htmlFor={name}>
      {label} {required && <span className="required-verificacion">*</span>}
      {tooltip && (
        <Tooltip text={tooltip}>
          <FaQuestionCircle
            size={14}
            style={{ marginLeft: "4px", cursor: "help" }}
          />
        </Tooltip>
      )}
    </label>
    <Field
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      as={as}
      rows={rows}
      disabled={disabled}
      className={`form-input-verificacion ${className} ${
        disabled ? "disabled-field" : ""
      }`}
      {...props}
    />
    <ErrorMessage
      name={name}
      component="div"
      className="error-message-verificacion"
    />
  </div>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  as: PropTypes.string,
  rows: PropTypes.number,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  formGroupClassName: PropTypes.string,
};

const createModeDefaultDataVerificacion = {
  version_verificada: "", // Campo re-añadido
  lista_chequeo: [
    {
      codigo_requisito: "",
      tipo_requisito: "",
      descripcion_requisito: "",
      cumple: false,
      observaciones: "",
      fecha_verificacion: new Date().toISOString().split("T")[0],
      verificado_por_id: "",
    },
  ],
  registros_aprobacion: [
    {
      fecha_aprobacion: new Date().toISOString().split("T")[0],
      version_aprobada: "",
      observaciones: "",
      rol_responsable: "", // Vuelve a rol_responsable
      firma_id: "",
    },
  ],
};

const FormularioVerificacion = () => {
  const { id_proyecto, area } = useParams();
  const [initialData, setInitialData] = useState(
    createModeDefaultDataVerificacion
  );
  const [formRecordId, setFormRecordId] = useState(null);

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

  const obtenerFormularioVerificacion = useCallback(async () => {
    if (!id_proyecto) {
      setInitialData(createModeDefaultDataVerificacion);
      setFormRecordId(null);
      return;
    }
    try {
      const { data } = await axiosInstance.get(
        `/api/Proyectos/${area}/${id_proyecto}/form/verificacion/get`
      );
      if (data && data.formulario_verificacion) {
        setFormRecordId(
          data.formulario_verificacion.id_formulario_verificacion
        );
        const mapDate = (dateStr) =>
          dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

        setInitialData({
          version_verificada:
            data.formulario_verificacion.version_verificada || "",
          lista_chequeo:
            data.lista_chequeo_data?.map((item) => ({
              ...item,
              fecha_verificacion: mapDate(item.fecha_verificacion),
              cumple: Boolean(item.cumple),
            })) || createModeDefaultDataVerificacion.lista_chequeo,
          registros_aprobacion:
            data.registros_aprobacion_data?.map((item) => ({
              ...item,
              fecha_aprobacion: mapDate(item.fecha_aprobacion),
              rol_responsable:
                item.nombre_responsable || item.rol_responsable || "", // Ajustar si el backend devuelve nombre_responsable
            })) || createModeDefaultDataVerificacion.registros_aprobacion,
        });
      } else {
        setInitialData(createModeDefaultDataVerificacion);
        setFormRecordId(null);
      }
    } catch (error) {
      console.error("Error fetching verificacion form data:", error);
      setInitialData(createModeDefaultDataVerificacion);
      setFormRecordId(null);
    }
  }, [id_proyecto, area]);

  useEffect(() => {
    obtenerFormularioVerificacion();
  }, [obtenerFormularioVerificacion]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);

    const payload = {
      version_verificada: values.version_verificada, // Re-añadido al payload
      lista_chequeo: values.lista_chequeo.map((item) => ({
        ...item,
        cumple: Boolean(item.cumple),
      })),
      registros_aprobacion: values.registros_aprobacion.map((item) => ({
        ...item,
        nombre_responsable: item.rol_responsable, // Enviar como nombre_responsable si backend lo espera así
      })),
    };

    const method = formRecordId ? "patch" : "post";
    const endpoint = formRecordId
      ? `/api/Proyectos/${area}/${id_proyecto}/form/verificacion/${formRecordId}/update`
      : `/api/Proyectos/${area}/${id_proyecto}/form/verificacion/fill`;

    try {
      await axiosInstance[method](endpoint, payload);
      Toast.fire({
        icon: "success",
        title: "Formulario de Verificación guardado.",
      });
      obtenerFormularioVerificacion();
    } catch (error) {
      console.error(
        "Error submitting verificacion form:",
        error.response?.data || error.message
      );
      Toast.fire({
        icon: "error",
        title: `Error: ${error.response?.data?.message || error.message}`,
      });
    }
    setSubmitting(false);
  };

  const currentInitialValues = useMemo(() => initialData, [initialData]);

return (
  <div className="project-planning-container">
    <BackButton area={area} id_proyecto={id_proyecto} /> {/* Added BackButton component with props */}
    <header className="form-header">
      <h1>Formulario - VERIFICACIÓN</h1>
        <div className="form-code">SIGAR-2025</div>
      </header>

      <Formik
        key={formRecordId || "new-verificacion-form"}
        initialValues={currentInitialValues}
        // validationSchema={verificacionValidationSchema} // Comentado, ya que el schema completo se añadió después
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}
      >
        {(
          { values, isSubmitting, setFieldValue } // Añadir setFieldValue para el checkbox
        ) => (
          <Form className="verificacion-form">
            <div className="form-section-verificacion">
              <h2>
                <FaClipboardList /> Lista de Chequeo - Cumplimiento de
                Requerimientos
              </h2>
              <FieldArray name="lista_chequeo">
                {({ push, remove }) => (
                  <div className="table-responsive-verificacion">
                    <table className="table-verificacion lista-chequeo-table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Cumple</th>
                          <th>Observaciones</th>
                          <th>Fecha Verif.</th>
                          <th>Verificado Por</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {values.lista_chequeo.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <Field
                                name={`lista_chequeo[${index}].codigo_requisito`}
                                placeholder="Ej: RF-001, RN-002"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`lista_chequeo[${index}].tipo_requisito`}
                                placeholder="Ej: Funcional, No Funcional, Interfaz"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`lista_chequeo[${index}].descripcion_requisito`}
                                placeholder="Descripción detallada del requisito a verificar"
                                as="textarea"
                                rows="2"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td
                              data-label="Cumple"
                              style={{
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <Field
                                name={`lista_chequeo[${index}].cumple`}
                                type="checkbox"
                                className="form-checkbox-verificacion" // Estilo para el checkbox estándar
                                checked={item.cumple === true} // Asegurar que el checked prop sea booleano
                                onChange={(e) => {
                                  setFieldValue(
                                    `lista_chequeo[${index}].cumple`,
                                    e.target.checked
                                  );
                                  // Aquí se podría añadir la lógica para autocompletar 'verificado_por_id' y 'fecha_verificacion'
                                  // if (e.target.checked && user) { // user necesitaría pasarse o accederse vía useAuth() aquí
                                  //   setFieldValue(`lista_chequeo[${index}].verificado_por_id`, user.id_empleado);
                                  //   setFieldValue(`lista_chequeo[${index}].fecha_verificacion`, new Date().toISOString().split("T")[0]);
                                  // }
                                }}
                              />
                              <ErrorMessage
                                name={`lista_chequeo[${index}].cumple`}
                                component="div"
                                className="error-message-verificacion"
                              />
                            </td>
                            <td>
                              <Field
                                name={`lista_chequeo[${index}].observaciones`}
                                placeholder="Observaciones relevantes sobre la verificación del requisito"
                                as="textarea"
                                rows="2"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`lista_chequeo[${index}].fecha_verificacion`}
                                type="date"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`lista_chequeo[${index}].verificado_por_id`}
                                placeholder="ID o Nombre del verificador"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-remove-verificacion"
                                onClick={() => remove(index)}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      type="button"
                      className="btn-add-verificacion"
                      onClick={() =>
                        push(createModeDefaultDataVerificacion.lista_chequeo[0])
                      }
                    >
                      <FaPlus /> Agregar Requisito
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="form-section-verificacion">
              <h2>
                <FaUserCheck /> Registro de Verificación y Aprobación
              </h2>
              <FieldArray name="registros_aprobacion">
                {({ push, remove }) => (
                  <div className="table-responsive-verificacion">
                    <table className="table-verificacion registros-aprobacion-table">
                      <thead>
                        <tr>
                          <th>Fecha Aprob.</th>
                          <th>Versión Aprob.</th>
                          <th>Observaciones</th>
                          <th>Responsable (Rol/Nombre)</th>
                          <th>Firma (ID/Nombre)</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {values.registros_aprobacion.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <Field
                                name={`registros_aprobacion[${index}].fecha_aprobacion`}
                                type="date"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`registros_aprobacion[${index}].version_aprobada`}
                                placeholder="Ej: V1.0 Revisada, Documento Final"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`registros_aprobacion[${index}].observaciones`}
                                placeholder="Comentarios sobre la aprobación o rechazo"
                                as="textarea"
                                rows="2"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`registros_aprobacion[${index}].rol_responsable`}
                                placeholder="Rol o Nombre del responsable"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <Field
                                name={`registros_aprobacion[${index}].firma_id`}
                                placeholder="ID o Nombre de quien firma/aprueba"
                                className="form-input-verificacion table-input"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-remove-verificacion"
                                onClick={() => remove(index)}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      type="button"
                      className="btn-add-verificacion"
                      onClick={() =>
                        push(
                          createModeDefaultDataVerificacion
                            .registros_aprobacion[0]
                        )
                      }
                    >
                      <FaPlus /> Agregar Registro
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="form-actions-verificacion">
              <button
                type="submit"
                className="btn-submit-verificacion"
                disabled={isSubmitting}
              >
                <FaSave />{" "}
                {isSubmitting ? "Guardando..." : "Guardar Verificación"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export { FormularioVerificacion };
