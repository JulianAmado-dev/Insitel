"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import Swal from "sweetalert2";
import { axiosInstance } from "@api/AxiosInstance";
import { presupuestoValidationSchema } from "../../../common/utils/schemas";
import PropTypes from "prop-types";

import {
  FaQuestionCircle,
  FaPlus,
  FaTrash,
  FaSave,
  FaUserFriends,
  FaBoxOpen,
  FaConciergeBell,
  FaCalculator,
} from "react-icons/fa";
import { BackButton } from "@forms/components/BackButton"; // Added import

import "./FormularioPresupuesto.css";

// --- Helper Components ---
const Tooltip = ({ text, children }) => (
  <div className="tooltip-presupuesto">
    {children}
    <span className="tooltip-text-presupuesto">{text}</span>
  </div>
);

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

// FormField component remains unchanged

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
      {label} {required && <span className="required-presupuesto">*</span>}
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
      className={`form-input-presupuesto ${className} ${
        disabled ? "disabled-field" : ""
      }`}
      {...props}
    />
    <ErrorMessage
      name={name}
      component="div"
      className="error-message-presupuesto"
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


// Alineado con nombres de BD o mapeo claro
const createModeDefaultDataPresupuesto = {
  // Campos para la tabla formulario_presupuesto (se añadirán en handleSubmit)
  // total_rh_calculado: "0.00",
  // total_suministros_calculado: "0.00",
  // total_servicios_calculado: "0.00",
  recursos_humanos: [
    {
      // id_fila_rh: null, // Para nuevos items
      id_empleado_asignado: null,
      nombre_recurso: "",
      salario_mensual: "",
      cantidad_dias: "",
      // Los siguientes son calculados y enviados con nombres de BD
      // salario_mensual_parafiscales: "0.00", (calculado)
      // costo_dia: "0.00", (calculado)
      // valor_total_linea: "0.00", (calculado)
    },
  ],
  suministros: [
    {
      // id_fila_suministro: null,
      nombre_proveedor: "", // BD: nombre_proveedor
      nombre_item: "",
      cantidad_suministro: "",
      unidad_de_medida: "", // BD: unidad_de_medida
      valor_unitario_suministro: "",
      // valor_total_linea: "0.00", (calculado)
    },
  ],
  servicios: [
    {
      // id_fila_servicio: null,
      nombre_proveedor: "", // BD: nombre_proveedor
      nombre_servicio: "", // BD: nombre_servicio
      cantidad_servicio: "",
      unidad_de_medida: "", // BD: unidad_de_medida
      valor_unitario: "", // BD: valor_unitario
      // valor_total_linea: "0.00", (calculado)
    },
  ],
};

// --- Main Component ---
const FormularioPresupuesto = () => {
  const { id_proyecto, area } = useParams();
  const [initialData, setInitialData] = useState(
    createModeDefaultDataPresupuesto
  );
  const [formRecordId, setFormRecordId] = useState(null);
  const PARAFISCALES_PERCENTAGE = 0.09; // 9%

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

  const mapToFrontendData = (apiData) => {
    // Esta función mapea los datos de la API (nombres de la BD)
    // a la estructura que espera el frontend (Formik initialValues)
    // Esto es importante si los nombres de campo difieren significativamente.
    // Por ahora, los nombres en createModeDefaultDataPresupuesto se han alineado
    // lo más posible, pero este es el lugar para transformaciones más complejas.

    return {
      // Mapear campos de formulario_presupuesto si es necesario
      // ...apiData.formulario_presupuesto,

      recursos_humanos: apiData.recursos_humanos_data?.map(rh => ({
        id_fila_rh: rh.id_fila_rh, // Mantener ID para actualizaciones
        id_empleado_asignado: rh.id_empleado_asignado,
        nombre_recurso: rh.nombre_recurso,
        salario_mensual: rh.salario_mensual,
        cantidad_dias: rh.cantidad_dias,
        // Los campos calculados se regeneran en el frontend para visualización
        // y se reenvían calculados al backend.
      })) || createModeDefaultDataPresupuesto.recursos_humanos,

      suministros: apiData.suministros_data?.map(s => ({
        id_fila_suministro: s.id_fila_suministro,
        nombre_proveedor: s.nombre_proveedor,
        nombre_item: s.nombre_item,
        cantidad_suministro: s.cantidad_suministro,
        unidad_de_medida: s.unidad_de_medida,
        valor_unitario_suministro: s.valor_unitario_suministro,
      })) || createModeDefaultDataPresupuesto.suministros,

      servicios: apiData.servicios_data?.map(serv => ({
        id_fila_servicio: serv.id_fila_servicio,
        nombre_proveedor: serv.nombre_proveedor,
        nombre_servicio: serv.nombre_servicio,
        cantidad_servicio: serv.cantidad_servicio,
        unidad_de_medida: serv.unidad_de_medida,
        valor_unitario: serv.valor_unitario, // BD usa valor_unitario
      })) || createModeDefaultDataPresupuesto.servicios,
    };
  };


  const obtenerFormularioPresupuesto = useCallback(async () => {
    if (!id_proyecto || !area) {
      setInitialData(createModeDefaultDataPresupuesto);
      setFormRecordId(null);
      return;
    }
    try {
      const { data } = await axiosInstance.get(
        `/api/Proyectos/${area}/${id_proyecto}/form/presupuesto/get`
      );

      if (data && data.formulario_presupuesto) {
        setFormRecordId(id_proyecto);
        // Usar la función de mapeo para transformar los datos de la API
        const frontendData = mapToFrontendData(data);
        setInitialData(frontendData);
        console.log("Set initialData for EDIT mode (Presupuesto) after mapping:", frontendData);
      } else {
        setFormRecordId(null);
        setInitialData(createModeDefaultDataPresupuesto);
      }
    } catch (error) {
      console.error("Failed to fetch Presupuesto form data:", error);
      setFormRecordId(null);
      setInitialData(createModeDefaultDataPresupuesto);
    }
  }, [id_proyecto, area]);

  useEffect(() => {
    obtenerFormularioPresupuesto();
  }, [obtenerFormularioPresupuesto]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);

    // Calcular subtotales y totales de línea para el payload
    const recursosHumanosPayload = values.recursos_humanos.map((recurso) => {
      const salarioMensual = parseFloat(recurso.salario_mensual || 0);
      const cantidadDias = parseFloat(recurso.cantidad_dias || 0);
      const salarioConParafiscales = salarioMensual * (1 + PARAFISCALES_PERCENTAGE);
      const costoDia = salarioConParafiscales / 30;
      const valorTotalLinea = costoDia * cantidadDias;
      return {
        id_fila_rh: recurso.id_fila_rh || null, // Enviar ID si existe (para update)
        id_empleado_asignado: recurso.id_empleado_asignado || null,
        nombre_recurso: recurso.nombre_recurso,
        salario_mensual: salarioMensual,
        cantidad_dias: cantidadDias,
        salario_mensual_parafiscales: salarioConParafiscales, // BD field
        costo_dia: costoDia, // BD field
        valor_total_linea: valorTotalLinea, // BD field
      };
    });

    const suministrosPayload = values.suministros.map((suministro) => {
      const cantidad = parseFloat(suministro.cantidad_suministro || 0);
      const valorUnitario = parseFloat(suministro.valor_unitario_suministro || 0);
      const valorTotalLinea = cantidad * valorUnitario;
      return {
        id_fila_suministro: suministro.id_fila_suministro || null,
        nombre_proveedor: suministro.nombre_proveedor,
        nombre_item: suministro.nombre_item,
        cantidad_suministro: cantidad,
        unidad_de_medida: suministro.unidad_de_medida,
        valor_unitario_suministro: valorUnitario,
        valor_total_linea: valorTotalLinea, // BD field
      };
    });

    const serviciosPayload = values.servicios.map((servicio) => {
      const cantidad = parseFloat(servicio.cantidad_servicio || 0);
      const valorUnitario = parseFloat(servicio.valor_unitario || 0); // Frontend usa valor_unitario_servicio, BD valor_unitario
      const valorTotalLinea = cantidad * valorUnitario;
      return {
        id_fila_servicio: servicio.id_fila_servicio || null,
        nombre_proveedor: servicio.nombre_proveedor,
        nombre_servicio: servicio.nombre_servicio,
        cantidad_servicio: cantidad,
        unidad_de_medida: servicio.unidad_de_medida, // Frontend usa unidad_servicio, BD unidad_de_medida
        valor_unitario: valorUnitario, // BD field
        valor_total_linea: valorTotalLinea, // BD field
      };
    });

    const totalRhCalculado = recursosHumanosPayload.reduce((acc, curr) => acc + curr.valor_total_linea, 0);
    const totalSuministrosCalculado = suministrosPayload.reduce((acc, curr) => acc + curr.valor_total_linea, 0);
    const totalServiciosCalculado = serviciosPayload.reduce((acc, curr) => acc + curr.valor_total_linea, 0);

    const payload = {
      // Campos para formulario_presupuesto
      total_rh_calculado: totalRhCalculado,
      total_suministros_calculado: totalSuministrosCalculado,
      total_servicios_calculado: totalServiciosCalculado,
      // Arrays de detalles
      recursos_humanos: recursosHumanosPayload,
      suministros: suministrosPayload,
      servicios: serviciosPayload,
    };

    const isExistingForm = formRecordId;
    const method = isExistingForm ? "patch" : "post";
    const endpoint = isExistingForm
      ? `/api/Proyectos/${area}/${id_proyecto}/form/presupuesto/update`
      : `/api/Proyectos/${area}/${id_proyecto}/form/presupuesto/fill`;

    console.log(`Attempting ${method} to ${endpoint} with payload:`, payload);

    try {
      await axiosInstance[method](endpoint, payload);
      Toast.fire({
        icon: "success",
        title: "Presupuesto guardado exitosamente!",
      });
      await obtenerFormularioPresupuesto(); // Refetch data to get latest state including IDs
    } catch (error) {
      console.error("Error submitting presupuesto:", error.response?.data || error.message);
      Toast.fire({
        icon: "error",
        title: `Error al guardar el presupuesto: ${error.response?.data?.error || error.message}`,
      });
    }
    setSubmitting(false);
  };

  const initialValues = useMemo(() => {
    return initialData;
  }, [initialData]);

return (
  <>
    <div className="project-planning-container">
      <BackButton area={area} id_proyecto={id_proyecto} /> {/* Added BackButton component with props */}
      <header className="form-header">
        <h1>Planificación del Proyecto - Presupuesto</h1>
          <div className="form-code">SIGAR-2025</div>
        </header>
        <Formik
          key={formRecordId || "new-presupuesto-form-key"}
          initialValues={initialValues}
          validationSchema={presupuestoValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize // Important for re-rendering with new initialValues
        >
          {({ values, isSubmitting }) => {
            const formatCurrency = (value, currency = "COP") => { // Default to COP
              return new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency,
              }).format(value || 0);
            };

            const recursosHumanosConCalculos = values.recursos_humanos.map(
              (recurso) => {
                const salarioMensual = parseFloat(recurso.salario_mensual) || 0;
                const cantidadDias = parseFloat(recurso.cantidad_dias) || 0;
                const salario_mensual_parafiscales_calc = salarioMensual * (1 + PARAFISCALES_PERCENTAGE);
                const costo_dia_calc = salario_mensual_parafiscales_calc / 30;
                const total_recurso_calc = costo_dia_calc * cantidadDias;
                return {
                  ...recurso,
                  salario_mensual_parafiscales_calc,
                  costo_dia_calc,
                  total_recurso_calc,
                };
              }
            );

            const suministrosConCalculos = values.suministros.map(
              (suministro) => {
                const cantidad = parseFloat(suministro.cantidad_suministro) || 0;
                const valorUnitario = parseFloat(suministro.valor_unitario_suministro) || 0;
                const valor_total_suministro_calc = cantidad * valorUnitario;
                return {
                  ...suministro,
                  valor_total_suministro_calc,
                };
              }
            );

            const serviciosConCalculos = values.servicios.map((servicio) => {
              const cantidad = parseFloat(servicio.cantidad_servicio) || 0;
              const valorUnitario = parseFloat(servicio.valor_unitario) || 0; // Usar valor_unitario
              const valor_total_servicio_calc = cantidad * valorUnitario;
              return {
                ...servicio,
                valor_total_servicio_calc,
              };
            });

            const subtotalRecursosHumanos = recursosHumanosConCalculos.reduce((acc, curr) => acc + (curr.total_recurso_calc || 0), 0);
            const subtotalSuministros = suministrosConCalculos.reduce((acc, curr) => acc + (curr.valor_total_suministro_calc || 0), 0);
            const subtotalServicios = serviciosConCalculos.reduce((acc, curr) => acc + (curr.valor_total_servicio_calc || 0), 0);
            const granTotal = subtotalRecursosHumanos + subtotalSuministros + subtotalServicios;

            return (
              <Form className="presupuesto-form">
                <div className="form-section-presupuesto">
                  <h2><FaUserFriends /> Recurso Humano</h2>
                  <FieldArray name="recursos_humanos">
                    {({ push, remove }) => (
                      <>
                        <table className="presupuesto-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Salario Mensual</th>
                              <th>Salario + Parafiscales</th>
                              <th>Costo Día</th>
                              <th>Cantidad Días</th>
                              <th>Total</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recursosHumanosConCalculos.map((recurso, index) => (
                                <tr key={index}>
                                  <td>
                                    <Field
                                      name={`recursos_humanos[${index}].nombre_recurso`}
                                      placeholder="Nombre de la persona"
                                      className="form-input-presupuesto table-input"
                                    />
                                    <ErrorMessage name={`recursos_humanos[${index}].nombre_recurso`} component="div" className="error-message-presupuesto" />
                                  </td>
                                  <td>
                                    <Field
                                      name={`recursos_humanos[${index}].salario_mensual`}
                                      type="number"
                                      placeholder="0"
                                      className="form-input-presupuesto table-input"
                                    />
                                    <ErrorMessage name={`recursos_humanos[${index}].salario_mensual`} component="div" className="error-message-presupuesto" />
                                  </td>
                                  <td>
                                    <input type="text" value={formatCurrency(recurso.salario_mensual_parafiscales_calc)} disabled className="form-input-presupuesto table-input disabled-field" />
                                  </td>
                                  <td>
                                    <input type="text" value={formatCurrency(recurso.costo_dia_calc)} disabled className="form-input-presupuesto table-input disabled-field" />
                                  </td>
                                  <td>
                                    <Field
                                      name={`recursos_humanos[${index}].cantidad_dias`}
                                      type="number"
                                      placeholder="0"
                                      className="form-input-presupuesto table-input"
                                    />
                                    <ErrorMessage name={`recursos_humanos[${index}].cantidad_dias`} component="div" className="error-message-presupuesto" />
                                  </td>
                                  <td>
                                    <input type="text" value={formatCurrency(recurso.total_recurso_calc)} disabled className="form-input-presupuesto table-input disabled-field" />
                                  </td>
                                  <td>
                                    <button type="button" className="btn-remove-presupuesto" onClick={() => remove(index)}><FaTrash /></button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="5" style={{ textAlign: "right" }}><strong>Subtotal Recurso Humano:</strong></td>
                              <td><strong>{formatCurrency(subtotalRecursosHumanos)}</strong></td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                        <button type="button" className="btn-add-presupuesto" onClick={() => push(createModeDefaultDataPresupuesto.recursos_humanos[0])}><FaPlus /> Agregar Recurso Humano</button>
                      </>
                    )}
                  </FieldArray>
                </div>

                <div className="form-section-presupuesto">
                  <h2><FaBoxOpen /> Suministros</h2>
                  <FieldArray name="suministros">
                    {({ push, remove }) => (
                      <>
                        <table className="presupuesto-table">
                          <thead>
                            <tr>
                              <th>Proveedor</th>
                              <th>Item</th>
                              <th>Cantidad</th>
                              <th>Unidad de medida</th>
                              <th>Valor Unitario</th>
                              <th>Valor Total</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suministrosConCalculos.map((suministro, index) => (
                              <tr key={index}>
                                <td>
                                  <Field name={`suministros[${index}].nombre_proveedor`} placeholder="Nombre del proveedor" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`suministros[${index}].nombre_proveedor`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`suministros[${index}].nombre_item`} placeholder="Nombre del item" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`suministros[${index}].nombre_item`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`suministros[${index}].cantidad_suministro`} type="number" placeholder="0" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`suministros[${index}].cantidad_suministro`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`suministros[${index}].unidad_de_medida`} placeholder="Unidad, Kg, L, etc." className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`suministros[${index}].unidad_de_medida`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`suministros[${index}].valor_unitario_suministro`} type="number" placeholder="0" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`suministros[${index}].valor_unitario_suministro`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <input type="text" value={formatCurrency(suministro.valor_total_suministro_calc)} disabled className="form-input-presupuesto table-input disabled-field" />
                                </td>
                                <td>
                                  <button type="button" className="btn-remove-presupuesto" onClick={() => remove(index)}><FaTrash /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="5" style={{ textAlign: "right" }}><strong>Subtotal Suministros:</strong></td>
                              <td><strong>{formatCurrency(subtotalSuministros)}</strong></td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                        <button type="button" className="btn-add-presupuesto" onClick={() => push(createModeDefaultDataPresupuesto.suministros[0])}><FaPlus /> Agregar Suministro</button>
                      </>
                    )}
                  </FieldArray>
                </div>

                <div className="form-section-presupuesto">
                  <h2><FaConciergeBell /> Servicios</h2>
                  <FieldArray name="servicios">
                    {({ push, remove }) => (
                      <>
                        <table className="presupuesto-table">
                          <thead>
                            <tr>
                              <th>Proveedor</th>
                              <th>Servicio</th>
                              <th>Cantidad</th>
                              <th>Unidad</th>
                              <th>Valor Unitario</th>
                              <th>Valor Total</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serviciosConCalculos.map((servicio, index) => (
                              <tr key={index}>
                                <td>
                                  <Field name={`servicios[${index}].nombre_proveedor`} placeholder="Nombre del proveedor" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`servicios[${index}].nombre_proveedor`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`servicios[${index}].nombre_servicio`} placeholder="Descripción del servicio" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`servicios[${index}].nombre_servicio`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`servicios[${index}].cantidad_servicio`} type="number" placeholder="0" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`servicios[${index}].cantidad_servicio`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`servicios[${index}].unidad_de_medida`} placeholder="Unidad, Hora, etc." className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`servicios[${index}].unidad_de_medida`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <Field name={`servicios[${index}].valor_unitario`} type="number" placeholder="0" className="form-input-presupuesto table-input" />
                                  <ErrorMessage name={`servicios[${index}].valor_unitario`} component="div" className="error-message-presupuesto" />
                                </td>
                                <td>
                                  <input type="text" value={formatCurrency(servicio.valor_total_servicio_calc)} disabled className="form-input-presupuesto table-input disabled-field" />
                                </td>
                                <td>
                                  <button type="button" className="btn-remove-presupuesto" onClick={() => remove(index)}><FaTrash /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="5" style={{ textAlign: "right" }}><strong>Subtotal Servicios:</strong></td>
                              <td><strong>{formatCurrency(subtotalServicios)}</strong></td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                        <button type="button" className="btn-add-presupuesto" onClick={() => push(createModeDefaultDataPresupuesto.servicios[0])}><FaPlus /> Agregar Servicio</button>
                      </>
                    )}
                  </FieldArray>
                </div>

                <div className="form-section-presupuesto summary-section-presupuesto">
                  <h2><FaCalculator /> Resumen</h2>
                  <table className="summary-table-presupuesto">
                    <tbody>
                      <tr>
                        <td>Subtotal Recurso Humano:</td>
                        <td>{formatCurrency(subtotalRecursosHumanos)}</td>
                      </tr>
                      <tr>
                        <td>Subtotal Suministros:</td>
                        <td>{formatCurrency(subtotalSuministros)}</td>
                      </tr>
                      <tr>
                        <td>Subtotal Servicios:</td>
                        <td>{formatCurrency(subtotalServicios)}</td>
                      </tr>
                      <tr className="grand-total-presupuesto">
                        <td><strong>Total Presupuesto:</strong></td>
                        <td><strong>{formatCurrency(granTotal)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button type="submit" className="btn-submit-presupuesto" disabled={isSubmitting}>
                  <FaSave /> {isSubmitting ? "Guardando..." : "Guardar Presupuesto"}
                </button>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export { FormularioPresupuesto };
