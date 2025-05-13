import "./LoginStage.css";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import email_icon from "@assets/email.png";
import password_icon from "@assets/locked.png";
import opened_eye from "@assets/eye.png";
import closed_eye from "@assets/show.png";
import logo from "@assets/logo-insitel.png";
import { useAuth } from "@contexts/AuthContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useFormikContext } from "formik";

// Componente hijo dentro de Formik

const LoginStage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState();

  const [eyeState, setEyeState] = useState({
    isEye1Active: false,
    isEye2Active: false,
  });
  const [action, setAction] = useState(
    // Iniciar sesión - Enviar correo - Cambiar contraseña
    "Iniciar sesión"
  );

  const ResetFormOnActionChange = ({ action }) => {
    const { resetForm } = useFormikContext();
    const prevActionRef = useRef(action);

    useEffect(() => {
      if (prevActionRef.current !== action) {
        console.log(
          `Action changed from ${prevActionRef.current} to ${action}. Resetting form.`
        );
        resetForm();
        prevActionRef.current = action;
      }
    }, [action, resetForm]); // resetForm sigue siendo una dependencia necesaria aquí

    return null;
  };

  const getValidationSchemaForLogin = (action) => {
    if (action === "Iniciar sesión") {
      return Yup.object({
        correo: Yup.string()
          .email("Formato invalido")
          .required("El correo es requerido"),
        contrasena: Yup.string()
          .required("La contraseña es requerida")
          .min(8, "La contraseña debe de tener más de 8 caracteres")
          .matches(/^[a-zA-Z0-9]+$/, "Solo letras y números"),
      });
    }
    if (action === "Enviar correo") {
      return Yup.object({
        correo: Yup.string()
          .email("Formato invalido")
          .required("El correo es requerido"),
      });
    }
    if (action === "Cambiar contraseña") {
      return Yup.object({
        contrasena: Yup.string()
          .required("La contraseña es requerida")
          .min(8, "La contraseña debe de tener más de 8 caracteres")
          .matches(/^[a-zA-Z0-9]+$/, "Solo letras y números"),
        confirmacion_contrasena: Yup.string()
          .required("La contraseña es requerida")
          .oneOf([Yup.ref("contrasena")], "Las contraseñas no coinciden")
          .min(8, "La contraseña debe de tener más de 8 caracteres")
          .matches(/^[a-zA-Z0-9]+$/, "Solo letras y números"),
      });
    }
  };

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

  const initialValues = useMemo(() => {
    switch (action) {
      case "Enviar correo":
        return { correo: "" };
      case "Iniciar sesión":
        return { correo: "", contrasena: "" };
      case "Cambiar contraseña":
        return { contrasena: "", confirmacion_contrasena: "" };
      default:
        return {};
    }
  }, [action]);

  // eslint-disable-next-line no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const recoveryToken = searchParams.get("token");

    if (recoveryToken) {
      //Llamamos a una api para validar el token
      axios
        .get(`http://localhost:3001/api/validate-token?token=${recoveryToken}`)
        .then((response) => {
          if (!response.data.isValid) {
            Toast.fire({ icon: "error", title: "Token inválido o expirado" });
            navigate("/auth/login"); // Redirige a login si el token no es válido
          }
          console.log(recoveryToken);
          setToken(recoveryToken);
          setAction("Cambiar contraseña");
        })
        .catch((error) => {
          setAction("Iniciar sesión");
          console.error("Error al validar el token:", error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validationSchema = useMemo(() => {
    return getValidationSchemaForLogin(action);
  }, [action]);

  const cambiarContrasena = useCallback(
    (sendedData, recoveryToken) => {
      return new Promise((resolve, reject) => {
        console.log(
          "Attempting to change password with token:",
          recoveryToken,
          "Data:",
          sendedData
        );
        axios
          .post(
            `http://localhost:3001/api/change-password?token=${recoveryToken}`,
            sendedData
          )
          .then(({ data }) => {
            Toast.fire({
              icon: "success",
              title: "Contraseña re-establecida con éxito",
            });

            resolve(data);
          })
          .catch(({ response }) => {
            Toast.fire({
              icon: "warning",
              title: "Petición invalida",
            });
            reject(response);
          })
          .finally(() => {
            setAction("Iniciar sesión");
            setEyeState((prevState) => ({
              ...prevState,
              isEye1Active: false,
              isEye2Active: false,
            }));
          });
      });
    },
    [Toast, setAction]
  );

  const enviarCorreo = useCallback(
    (sendedData) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          axios
            .post("http://localhost:3001/api/sendCode", sendedData)
            .then(({ data }) => {
              Toast.fire({
                icon: "success",
                title: "Correo enviado",
              });
              resolve(data);
              console.log(data);
            })
            .catch(({ response }) => {
              Toast.fire({
                icon: "warning",
                title: "Petición invalida",
              });
              reject(response);
            });
        }, 2000);
      });
    },
    [Toast]
  );

  const validarCredenciales = useCallback(
    async (sendedData) => {
      try {
        const success = await auth.login(sendedData);
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
    },
    [auth, location, navigate]
  );

  const handleSubmit = useCallback(
    // ... tu lógica de submit ...
    async (values, { setSubmitting }) => {
      console.log(action);
      {
        action === "Enviar correo"
          ? await enviarCorreo(values)
          : action === "Iniciar sesión"
          ? await validarCredenciales(values)
          : await cambiarContrasena(values, token);
      }
      setSubmitting(false);
    },
    [action, token, enviarCorreo, validarCredenciales, cambiarContrasena]
  ); // Asegúrate de incluir todas las dependencias estables

  return (
    <>
      <div className="container">
        <div className="background-glow glow-1"></div>
        <div className="background-glow glow-2"></div>
        <div className="background-glow glow-3"></div>
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
              <h1>{action}</h1>
              {action === "Enviar correo" ? (
                <p>
                  Porfavor ingresa tu correo corporativo. Te enviariemos un{" "}
                  <strong>Correo</strong>!{" "}
                </p>
              ) : action === "Iniciar sesión" ? (
                <p>
                  Porfavor ingresa tu correo y contraseña para poder ingresar
                </p>
              ) : (
                <p>Porfavor ingresa una nueva contraseña</p>
              )}
            </div>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, touched, errors }) => (
                <>
                  <ResetFormOnActionChange state={action} />
                  <Form id="formulario-login">
                    {(action === "Iniciar sesión" ||
                      action === "Enviar correo") && (
                      <label htmlFor="correo">
                        <p className="label_p">correo</p>
                        <section
                          className={`login_item ${
                            action === "Enviar correo" ? "onRestore" : ""
                          }`}
                        >
                          <img src={email_icon} alt="" />
                          <Field
                            className={` ${
                              errors.correo && touched.correo
                                ? "input_error"
                                : ""
                            }`}
                            name="correo"
                            type="email"
                            id="correo"
                            placeholder="Aquí tu correo"
                            disabled={isSubmitting}
                          />
                        </section>
                        {errors.correo && touched.correo ? (
                          <div className="input_error_message">
                            {errors.correo}
                          </div>
                        ) : null}
                      </label>
                    )}

                    {(action === "Iniciar sesión" ||
                      action === "Cambiar contraseña") && (
                      <label htmlFor="contrasena">
                        <p className="label_p">Contraseña</p>
                        <section className="login_item">
                          <img src={password_icon} alt="" />
                          <Field
                            className={` ${
                              errors.contrasena && touched.contrasena
                                ? "input_error"
                                : ""
                            }`}
                            type={eyeState.isEye1Active ? "text" : "password"}
                            name="contrasena"
                            id="contrasena"
                            placeholder="Aquí tu contraseña"
                            disabled={isSubmitting}
                          />
                          <button
                            disabled={isSubmitting}
                            className="password_eye"
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setEyeState((prevState) => ({
                                ...prevState,
                                isEye1Active: !prevState.isEye1Active,
                              }));
                            }}
                          >
                            <img
                              src={
                                eyeState.isEye1Active ? closed_eye : opened_eye
                              }
                            />
                          </button>
                        </section>
                        {errors.contrasena && touched.contrasena && (
                          <div className="input_error_message">
                            {errors.contrasena}
                          </div>
                        )}
                      </label>
                    )}
                    {action === "Cambiar contraseña" && (
                      <label htmlFor="confirmacion_contrasena">
                        <p className="label_p">Confirmar contraseña</p>
                        <section className="login_item">
                          <img src={password_icon} alt="" />
                          <Field
                            className={` ${
                              errors.confirmacion_contrasena &&
                              touched.confirmacion_contrasena
                                ? "input_error"
                                : ""
                            }`}
                            type={eyeState.isEye2Active ? "text" : "password"}
                            name="confirmacion_contrasena"
                            id="confirmacion_contrasena"
                            placeholder="Aquí tu contraseña"
                            disabled={isSubmitting}
                          />
                          <button
                            disabled={isSubmitting}
                            className="password_eye"
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setEyeState((prevState) => ({
                                ...prevState,
                                isEye2Active: !prevState.isEye2Active,
                              }));
                            }}
                          >
                            <img
                              src={
                                eyeState.isEye2Active ? closed_eye : opened_eye
                              }
                            />
                          </button>
                        </section>
                        {errors.confirmacion_contrasena &&
                          touched.confirmacion_contrasena && (
                            <div className="input_error_message">
                              {errors.confirmacion_contrasena}
                            </div>
                          )}
                      </label>
                    )}

                    {action === "Iniciar sesión" && (
                      <section className="recordar_password">
                        <p className="recordar_password">
                          Olvidaste la contraseña?
                          <span
                            onClick={() => {
                              setAction("Enviar correo");
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
                      {action === "Iniciar sesión" ? (
                        <button
                          className={`recordar_click ${
                            isSubmitting ? "disabled" : ""
                          }`}
                          form="formulario-login"
                          type="submit"
                        >
                          Ingresar
                        </button>
                      ) : action === "Enviar correo" ? (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setAction("Iniciar sesión");
                            }}
                            className={`recordar_click ${
                              isSubmitting ? "disabled" : ""
                            }`}
                          >
                            Regresar
                          </button>
                          <button
                            form="formulario-login"
                            className={`recordar_click ${
                              isSubmitting ? "disabled" : ""
                            }`}
                            type="submit"
                          >
                            Enviar{" "}
                          </button>
                        </>
                      ) : (
                        <button
                          className={`recordar_click ${
                            isSubmitting ? "disabled" : ""
                          }`}
                          form="formulario-login"
                          type="submit"
                        >
                          Cambiar contraseña
                        </button>
                      )}
                    </section>
                  </Form>
                </>
              )}
            </Formik>
          </section>
        </section>
      </div>
    </>
  );
};

export { LoginStage };
