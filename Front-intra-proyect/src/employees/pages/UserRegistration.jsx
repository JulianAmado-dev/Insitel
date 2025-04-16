import { useState } from "react";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { Formik, Form, Field } from "formik";
import { MdOutlineCheckCircleOutline } from "react-icons/md";
/* import { MdOutlineCircle } from "react-icons/md"; */
import "./UserRegistration.css";
import { axiosInstance } from "@api/AxiosInstance";

function UserRegistration() {
  let validationSchema = [
    Yup.object().shape({
      nombres: Yup.string()
        .required("Debes ingresar almenos un nombre ⚠️")
        .max(50, "Máximo 50 caracteres"),
      apellidos: Yup.string()
        .required("Apellido obligatorio ⚠️")
        .max(50, "Máximo 50 caracteres"),
      edad: Yup.number()
        .required("Edad requerida ⚠️")
        .min(18, "Debe ser mayor de edad 👵")
        .max(99, "Edad no válida"),
      direccion: Yup.string().required("Dirección obligatoria ⚠️"),
      ciudad: Yup.string()
        .required("Es obligatorio ingresar tu ciudad ⚠️")
        .max(50, "Máximo 50 caracteres"),
    }),
    Yup.object().shape({
      correo: Yup.string()
        .email("Formato inválido 📧")
        .required("Correo requerido ⚠️"),
      contrasena: Yup.string()
        .required("Contraseña obligatoria 🔒")
        .min(8, "Mínimo 8 caracteres")
        .matches(/^[a-zA-Z0-9]+$/, "Solo letras y números"),
      cargo: Yup.string()
        .required("Cargo requerido 🏢")
        .max(50, "Nombre de cargo muy largo"),
      area: Yup.string().required("Área obligatoria 🏷️"),
      rol: Yup.string().required("Rol requerido 🎭"),
      /* .oneOf(["admin", "user"], "Rol no válido") */
    }),
  ];
  const [registrationStep, setRegistrationStep] = useState(0);
  const [isStepCompleted, setIsStepCompleted] = useState([false, false]);
  const currentValidationSchema = validationSchema[registrationStep];

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

  const registrarEmpleado = (sendedData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        axiosInstance
          .put("http://localhost:3001/api/EmployeeRegistration", sendedData)
          .then(({ data }) => {
            Toast.fire({
              icon: "success",
              title: "Usuario creado",
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
  return (
    <>
      <section className="register_container">
        <div className="titulo_registrar_empleado">
          <h1>{/* {state.action} */} Registro de empleado</h1>
        </div>
        <Formik
          initialValues={{
            correo: "",
            contrasena: "",
            rol: "",
            cargo: "",
            area: "",
            edad: "",
            nombres: "",
            apellidos: "",
            direccion: "",
            ciudad: "",
            foto_empleado: "",
          }}
          validationSchema={currentValidationSchema}
          onSubmit={(values, { setSubmitting, resetForm }) => {
            if (registrationStep === 1) {
              console.log("boom", values);
              setTimeout(() => {
                registrarEmpleado(values)
                  .then(() => {
                    resetForm();
                    setRegistrationStep(0);
                    setIsStepCompleted((prev) => [false, prev[1]]);
                    setSubmitting(false);
                  })
                  .catch(() => {
                    setSubmitting(false);
                  });
              }, 0);
            } else if (registrationStep === 0) {
              setRegistrationStep(2);
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, touched, errors, validateForm }) => (
            <Form id="registration-form" className="registration_form">
              <section className="form_data-type">
                {isStepCompleted[0] === true ? (
                  <MdOutlineCheckCircleOutline size={36} color="green" />
                ) : (
                  <MdOutlineCheckCircleOutline size={36} color="gray" />
                )}
                <span>Datos personales</span>
                {registrationStep === 0 && (
                  <div className="separator" id="separator1"></div>
                )}
                <span>Datos laborales</span>
                {isStepCompleted[1] ? (
                  <MdOutlineCheckCircleOutline size={36} color="green" />
                ) : (
                  <MdOutlineCheckCircleOutline size={36} color="gray" />
                )}
                {registrationStep === 1 && (
                  <div className="separator" id="separator2"></div>
                )}
              </section>
              {registrationStep === 0 && (
                /* {<PersonalData/>} */ <>
                  <h2 className="form_data-type">Datos personales</h2>
                  <section className="data_block">
                    <div className="data_block-column">
                      <div className="data_block-element">
                        <label htmlFor="nombres">Nombres</label>
                        <Field
                          name="nombres"
                          type="text"
                          id="nombres"
                          placeholder="Ingresa tus nombres"
                          className="selected-field"
                        ></Field>
                        {errors.nombres && touched.nombres ? (
                          <div className="input_error_message">
                            {errors.nombres}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="apellidos">Apellidos</label>
                        <Field
                          name="apellidos"
                          type="text"
                          id="apellidos"
                          placeholder="Ingresa tu apellido"
                        />
                        {errors.apellidos && touched.apellidos ? (
                          <div className="input_error_message">
                            {errors.apellidos}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="edad">Edad</label>
                        <Field
                          name="edad"
                          type="number"
                          id="edad"
                          placeholder="Ingresa aquí tu edad"
                        />
                        {errors.edad && touched.edad ? (
                          <div className="input_error_message">
                            {errors.edad}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="data_block-column">
                      <div className="data_block-element">
                        <label htmlFor="direccion">
                          Dirección de residencia
                        </label>
                        <Field
                          name="direccion"
                          type="text"
                          id="direccion"
                          placeholder="Ingresa"
                        />
                        {errors.direccion && touched.direccion ? (
                          <div className="input_error_message">
                            {errors.direccion}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="ciudad">ciudad</label>
                        <Field
                          name="ciudad"
                          type="text"
                          id="ciudad"
                          placeholder="Aquí tu correo"
                        />
                        {errors.ciudad && touched.ciudad ? (
                          <div className="input_error_message">
                            {errors.ciudad}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="foto_empleado">foto del empleado</label>
                        <Field
                          name="foto_empleado"
                          type="file"
                          id="foto_empleado"
                          accept="image/png,jepg"
                        />
                      </div>
                    </div>
                  </section>
                  <button
                    onClick={async () => {
                      const errors = await validateForm(); // Valida campos del paso 1 [[3]]
                      const hasErrors = Object.keys(errors).some((key) =>
                        [
                          "nombres",
                          "apellidos",
                          "edad",
                          "direccion",
                          "ciudad",
                        ].includes(key)
                      );
                      if (!hasErrors) {
                        setIsStepCompleted((prev) => [true, prev[1]]);
                        setRegistrationStep(1);
                      }
                    }}
                    type="button"
                    form="registration-form"
                    className=""
                  >
                    Continuar
                  </button>
                </>
              )}
              {registrationStep === 1 && (
                <>
                  <h2>Datos de empleado</h2>
                  <section className="data_block">
                    <div className="data_block-column">
                      <div className="data_block-element">
                        <label htmlFor="cargo">Cargo</label>
                        <Field
                          name="cargo"
                          type="text"
                          id="cargo"
                          placeholder="Desarollador"
                        />
                        {errors.cargo && touched.cargo ? (
                          <div className="input_error_message">
                            {errors.cargo}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="contrasena">Contraseña</label>
                        <Field
                          name="contrasena"
                          type="text"
                          id="contrasena"
                          placeholder="Ingresa aquí tu contraseña"
                        />
                        {errors.contrasena && touched.contrasena ? (
                          <div className="input_error_message">
                            {errors.contrasena}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="correo">Email corporativo</label>
                        <Field
                          name="correo"
                          type="email"
                          id="correo"
                          placeholder="Ingresa aquí tu correo corporativo"
                        />
                        {errors.correo && touched.correo ? (
                          <div className="input_error_message">
                            {errors.correo}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="data_block-column" id="column2-step2">
                      <div className="data_block-element">
                        <label htmlFor="area">Area</label>
                        <Field
                          name="area"
                          as="select"
                          id="area"
                          placeholder="Aquí tu correo"
                        >
                          <option value="" disabled>
                            Selecciona la area del empleado
                          </option>
                          <option value="I + D">I + D</option>
                          <option value="Operaciones">Operaciones</option>
                        </Field>
                        {errors.area && touched.area ? (
                          <div className="input_error_message">
                            {errors.area}
                          </div>
                        ) : null}
                      </div>
                      <div className="data_block-element">
                        <label htmlFor="rol">Rol</label>
                        <Field name="rol" as="select" id="rol">
                          <option value="" disabled>
                            Selecciona el rol del empleado
                          </option>
                          <option value="Admin">Administrador</option>
                          <option value="Usuario">Usuario</option>
                        </Field>
                        {errors.rol && touched.rol ? (
                          <div className="input_error_message">
                            {errors.rol}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                  <div className="buttons-section">
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        setRegistrationStep(registrationStep - 1);
                      }}
                      className=""
                      type="button"
                    >
                      regresar
                    </button>
                    <button
                      className=""
                      type="submit"
                      form="registration-form"
                      disabled={isSubmitting}
                    >
                      Crear
                    </button>
                  </div>
                </>
              )}
            </Form>
          )}
        </Formik>
      </section>
    </>
  );
}

export { UserRegistration };
