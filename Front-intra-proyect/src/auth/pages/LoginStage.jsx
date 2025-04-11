import "./LoginStage.css";
import { useState } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import email_icon from "@assets/email.png";
import password_icon from "@assets/locked.png";
import opened_eye from "@assets/eye.png";
import closed_eye from "@assets/show.png";
import logo from "@assets/logo-insitel.png";
import { useAuth } from "@contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const LoginStage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validationSchema = Yup.object({
    correo: Yup.string()
      .email("Formato invalido")
      .required("El correo es requerido"),
    contrasena: Yup.string()
      .required("La contraseña es requerida")
      .min(8, "La contraseña debe de tener más de 8 caracteres")
      .matches(/^[a-zA-Z0-9]+$/, "Solo letras y números"),
  });

  const [state, setState] = useState({
    action: "Iniciar sesión",
    showPassword: false,
  });

  const validarCredenciales = (sendedData) => {
    try {
      const success = auth.login(sendedData);

      if (success) {
        const redirect =
          location.state?.from?.pathname || "/dashboard/content/main";
        navigate(redirect, { replace: true });
      } else {
        console.error("Error al iniciar sesión:");
      }
    } catch (error) {
      console.error(
        "login stage: error inesperado al llamar auth.login();",
        error
      );
    }
  };

  return (
    <>
      <div className="container">
        {/* bloque grande, contiene en su espacio izquierdo branding o alguna frase motivacional, en la derecha, la lógica de login */}
        <section className="branding-section">
          {/* esta es la mitad izquierda de la pantalla login */}
          <h1>Frase inpiradora, es muy inspiradora, demasiado inspiradora</h1>
          <p>
            si, es tan inspiradora que todos los <br></br> proyectos se
            completaran automaticamente
          </p>
        </section>
        <section className="login-section">
          <div className="logo-login">
            <img src={logo} alt="" />
            <p>Insitel</p>
          </div>

          <section className="login_items">
            <div className="titulo-login-section">
              <h1>{state.action}</h1>
              <p>Porfavor ingresa tu correo y contraseña para poder ingresar</p>
            </div>
            <Formik
              initialValues={{ correo: "", contrasena: "" }}
              validationSchema={validationSchema}
              onSubmit={(values, { setSubmitting }) => {
                setTimeout(() => {
                  validarCredenciales(values);
                  setSubmitting(false);
                }, 2000);
              }}
            >
              {({ isSubmitting, touched, errors }) => (
                <Form id="formulario-login">
                  <label htmlFor="correo">
                    <p className="label_p">correo</p>
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
                          errors.correo && touched.correo ? "input_error" : ""
                        }`}
                        name="correo"
                        type="email"
                        id="correo"
                        placeholder="Aquí tu correo"
                        disabled={isSubmitting}
                      />
                    </section>
                    {errors.correo && touched.correo ? (
                      <div className="input_error_message">{errors.correo}</div>
                    ) : null}
                  </label>

                  <label htmlFor="password">
                    <p className="label_p">Contraseña</p>
                    <section className="login_item">
                      <img src={password_icon} alt="" />
                      {state.action == "recuperar contraseña"}
                      <Field
                        className={` ${
                          errors.contrasena && touched.contrasena
                            ? "input_error"
                            : ""
                        }`}
                        type={state.showPassword ? "text" : "password"}
                        name="contrasena"
                        id="password"
                        placeholder="Aquí tu contraseña"
                        disabled={isSubmitting}
                      />
                      <button
                        disabled={isSubmitting}
                        className="password_eye"
                        onClick={(event) => {
                          event.preventDefault();
                          setState({
                            ...state,
                            showPassword: !state.showPassword,
                          });
                        }}
                      >
                        <img
                          src={state.showPassword ? closed_eye : opened_eye}
                        />
                      </button>
                    </section>
                    {errors.contrasena && touched.contrasena && (
                      <div className="input_error_message">
                        {errors.contrasena}
                      </div>
                    )}
                  </label>

                  {state.action === "Iniciar sesión" && (
                    <section className="recordar_password">
                      <p className="recordar_password">
                        Olvidaste la contraseña?
                        <span
                          onClick={() => {
                            setState({
                              ...state,
                              action: "Recuperación de contraseña",
                            });
                          }}
                          className={`recordar_click ${
                            isSubmitting === true ? "disabled" : ""
                          }`}
                        >
                          Haz click Aquí
                        </span>
                      </p>
                    </section>
                  )}

                  <section className="botones_inferiores">
                    {state.action === "Iniciar sesión" ? (
                      <button
                        className={`recordar_click ${
                          isSubmitting ? "disabled" : ""
                        }`}
                        form="formulario-login"
                        type="submit"
                      >
                        Ingresar
                      </button>
                    ) : state.action === "Recuperación de contraseña" ? (
                      <>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setState({
                              ...state,
                              action: "Iniciar sesión",
                              showPassword: false,
                            });
                          }}
                        >
                          Regresar
                        </button>
                        <button onClick={() => {}}>Enviar </button>
                      </>
                    ) : null}
                  </section>
                </Form>
              )}
            </Formik>
          </section>
        </section>
      </div>
    </>
  );
};

export { LoginStage };
