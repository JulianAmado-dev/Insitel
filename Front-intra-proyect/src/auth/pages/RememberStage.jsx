import { Formik, Form, Field } from "formik";
import React from "react";
import email_icon from "../assets/email.png";
import * as Yup from "yup";
import Axios from 'axios'
import Swal from "sweetalert2";

function RememberStage() {

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


  const enviarCorreo = (sendedData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Axios.post("http://localhost:3001/api/sendCode", sendedData)
          .then(({ data }) => {
            Toast.fire({
              icon: "success",
              title: "Ingreso éxitoso",
            });
            setState({
              ...state,
              error: false,
              isValid: true,
              loading: false,
            });
            resolve(data);
          })
          .catch(({ response }) => {
            setState({
              ...state,
              loading: false,
              error: true,
              isValid: false,
            });
            reject(response);
          });
      }, 2000);
    });
  };


  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Formato invalido")
      .required("El correo es requerido")
    });

    const [state, setState] = React.useState({
    action: "Iniciar sesión",
    error: false,
    isValid: false,
    loading: false,
    showPassword: false,
  });


  return (
    <>
      <section className="login_items">
        <div className="titulo-login-section">
          <h1>{state.action}</h1>
          <p>Porfavor ingresa tu email y contraseña para poder ingresar</p>
        </div>
        <Formik
          initialValues={{ email: ""}}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            return enviarCorreo(values).catch((error) => {
              throw error;
            });
          }}
        >
          {({ isSubmitting, touched, errors }) => (
            <Form id="formulario-login">
              <label htmlFor="email">
                <p className="label_p">Email</p>
                <section
                  className={`login_item ${
                    state.action === "Recuperación de contraseña"
                      ? "onRestore"
                      : ""
                  }`}
                >
                  <img src={email_icon} alt="" />
                  <Field
                    className={` ${
                      errors.email && touched.email ? "input_error" : ""
                    }`}
                    name="email"
                    type="email"
                    id="email"
                    placeholder="Aquí tu correo"
                  />
                </section>

                {errors.email && touched.email ? (
                  <div className="input_error_message">{errors.email}</div>
                ) : null}

              </label>
              <section className="botones_inferiores">
                <>
                    <button
                      type="submit"
                      onClick={(event) => {
                        event.preventDefault();
                        setState({
                          ...state,
                          loading: false,
                          error: false,
                          action: "Iniciar sesión",
                          showPassword: false,
                        });
                      }}
                    >
                      Regresar
                    </button>
                    <button onClick={() => {}}>Enviar </button>
                </>
              </section>
            </Form>
          )}
        </Formik>
      </section>
    </>
  );
}

export { RememberStage };
