"use client";

import { useState, useCallback } from "react"; // Removed useContext
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./CreateProjectsv2.css";
import {axiosInstance} from '@api/AxiosInstance';
import { useParams } from "react-router-dom"; // Removed useNavigate
import { useFormStatus } from "@contexts/FormStatusContext"; // Import the custom hook

function CreateProyects() {
  const [progressValue, setProgressValue] = useState("0%");
  const {area} =  useParams();
  // const navigate = useNavigate(); // For redirecting after creation - currently unused
  const { updateFormStatus } = useFormStatus(); // Use the context

  // Esquema de validación con Yup (sin área ni miembros)
  const validationSchema = Yup.object({
    nombre_proyecto: Yup.string()
      .required("El nombre del proyecto es obligatorio")
      .min(3, "El nombre debe tener al menos 3 caracteres"),
    empresa_asociada: Yup.string().required(
      "La empresa asociada es obligatoria"
    ),
    summary: Yup.string()
      .required("La descripción es obligatoria")
      .min(10, "La descripción debe tener al menos 10 caracteres"),
    prioridad: Yup.number()
      .required("La prioridad es obligatoria")
      .min(1, "La prioridad mínima es 1")
      .max(5, "La prioridad máxima es 5"),
  });

  // Función para calcular el progreso del formulario
  const calculateProgress = useCallback((values, errors, touched) => {
    const fields = [
      "nombre_proyecto",
      "empresa_asociada",
      "summary",
      "prioridad",
    ];
    let completedFields = 0;

    fields.forEach((field) => {
      if (touched[field] && !errors[field]) {
        completedFields++;
      }
    });

    const percentage = Math.round((completedFields / fields.length) * 100);
    return `${percentage}%`;
  }, []);

  const crearProyecto = (sendedData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        axiosInstance.post("http://localhost:3001/api/Projects/Create", sendedData)
          .then(({ data }) => {
            console.log("Proyecto creado en la db")
            resolve(data);
          })
          .catch(({ response }) => {
            reject("hola, soy response ", response);
            throw response;
          });
      }, 2000);
    });
  };

  return (
    <div className="insitel-container">
      <div className="content-container">
        <div className="create-project-card">
          <div className="card-header">
            <h2>Crear Nuevo Proyecto</h2>
          </div>

          <Formik
            initialValues={{
              nombre_proyecto: "",
              empresa_asociada: "",
              descripcion: "",
              prioridad: "",
              area: area,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              updateFormStatus('project_creation', 'in-progress');
              console.log("Datos del proyecto:", values);
              try {
                const response = await crearProyecto(values); // Wait for the promise
                alert("Proyecto creado con éxito! ID: " + response.id_proyecto);
                updateFormStatus('project_creation', 'completed');
                resetForm();
                setProgressValue("0%");
                // Optionally navigate to the new project's page or a success page
                // navigate(`/dashboard/${area}/project/${response.id_proyecto}`); 
              } catch (error) {
                console.error("Error al crear proyecto:", error);
                alert("Error al crear el proyecto. Inténtalo de nuevo.");
                updateFormStatus('project_creation', 'error');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              isSubmitting,
              touched,
              errors,
              values,
              handleChange,
              handleBlur,
            }) => {
              // Actualizar el progreso cuando cambian los valores
              const handleFieldChange = (e) => {
                handleChange(e); // Llamar al handleChange original de Formik

                // Usar setTimeout para asegurarnos que se ejecute después de que Formik actualice sus valores
                setTimeout(() => {
                  const newProgress = calculateProgress(
                    values,
                    errors,
                    touched
                  );
                  setProgressValue(newProgress);
                }, 0);
              };

              const handleFieldBlur = (e) => {
                handleBlur(e); // Llamar al handleBlur original de Formik

                // Actualizar el progreso después de que el campo pierda el foco
                setTimeout(() => {
                  const newProgress = calculateProgress(
                    values,
                    errors,
                    touched
                  );
                  setProgressValue(newProgress);
                }, 0);
              };

              return (
                <Form id="create-project" className="create-project-form">
                  <div className="form-grid">
                    <div className="form-column">
                      <div className="form-group">
                        <label htmlFor="nombre_proyecto">
                          Nombre del proyecto
                        </label>
                        <Field
                          name="nombre_proyecto"
                          type="text"
                          id="nombre_proyecto"
                          className={
                            errors.nombre_proyecto && touched.nombre_proyecto
                              ? "input-error"
                              : ""
                          }
                          placeholder="Escribe el nombre del proyecto"
                          onChange={handleFieldChange}
                          onBlur={handleFieldBlur}
                        />
                        <ErrorMessage
                          name="nombre_proyecto"
                          component="div"
                          className="error-message"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="empresa_asociada">
                          Empresa asociada
                        </label>
                        <Field
                          name="empresa_asociada"
                          type="text"
                          id="empresa_asociada"
                          placeholder="Empresa asociada al proyecto"
                          className={
                            errors.empresa_asociada && touched.empresa_asociada
                              ? "input-error"
                              : ""
                          }
                          onChange={handleFieldChange}
                          onBlur={handleFieldBlur}
                        />
                        <ErrorMessage
                          name="empresa_asociada"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>

                    <div className="form-column">
                      <div className="form-group">
                        <label htmlFor="prioridad">Prioridad</label>
                        <Field
                          name="prioridad"
                          as="select"
                          id="prioridad"
                          className={
                            errors.prioridad && touched.prioridad
                              ? "input-error"
                              : ""
                          }
                          onChange={handleFieldChange}
                          onBlur={handleFieldBlur}
                        >
                          <option value="" disabled >
                            Selecciona la prioridad
                          </option>
                          <option value="1">1 - Baja</option>
                          <option value="2">2 - Media-Baja</option>
                          <option value="3">3 - Media</option>
                          <option value="4">4 - Media-Alta</option>
                          <option value="5">5 - Alta</option>
                        </Field>
                        <ErrorMessage
                          name="prioridad"
                          component="div"
                          className="error-message"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="summary">Resumen</label>
                        <Field
                          as="textarea"
                          name="summary"
                          id="summary"
                          className={
                            errors.summary && touched.summary
                              ? "input-error"
                              : ""
                          }
                          placeholder="Describe brevemente el proyecto"
                          rows="3"
                          onChange={handleFieldChange}
                          onBlur={handleFieldBlur}
                        />
                        <ErrorMessage
                          name="summary"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="progress-preview">
                    <label>Progreso de formulario</label>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: progressValue }}
                      ></div>
                      <span>{progressValue}</span>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-submit"
                    >
                      {isSubmitting ? "Creando..." : "Crear Proyecto"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        if (
                          window.confirm(
                            "¿Estás seguro de que deseas cancelar? Se perderán todos los datos ingresados."
                          )
                        ) {
                          window.history.back();
                        }
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export { CreateProyects };
