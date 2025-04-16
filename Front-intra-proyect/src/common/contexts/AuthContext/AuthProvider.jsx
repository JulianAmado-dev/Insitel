import Swal from "sweetalert2";
import { AuthContext } from "./AuthContext";
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { axiosInstance, setupAxiosAuthFunctions } from "@api/AxiosInstance";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const login = useCallback(
    async (sendedData) => {
      try {
        const { data } = await axiosInstance.post("/api/login", sendedData);
        console.log(data);
        setIsAuthenticated(true);
        setAccessToken(data.accessToken);
        setUser(data.user);
        Toast.fire({ icon: "success", title: "Ingreso éxitoso" });
        return true;
      } catch (err) {
        setError(err.response?.data?.message || "Error al iniciar sesión");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [Toast]
  );

  const logout = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(false);
    try {
      await axiosInstance.post("/api/logout");
    } catch (error) {
      console.error("error en el logout", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await axiosInstance.post("/api/auth/refresh_token");
      if (data && data.accessToken) {
        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        console.log(
          "access token establecido despues de haberse recibido con el end. refresh_token"
        );
        return newAccessToken;
      } else {
        throw new Error("el Access token no fue recibido del endpoint");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      await logout(); // Logout si el refresh falla
      return null;
    }
  }, [logout]);

  const checkAuthStatus = useCallback(async () => {
    console.log("AuthProvider: Checking auth status on load...");
    setError(null);
    try {
      const { data } = await axiosInstance.get("/api/auth/me"); // Endpoint que devuelve user si está autenticado
      if (data && data.user) {
        console.log("datos traidos con auth/me: ", data);
        setUser(data.user);
        setIsAuthenticated(true);
        // Podrías necesitar actualizar el accessToken aquí si /me lo devuelve
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        console.log(
          "AuthProvider: Session check successful, user authenticated."
        );
      } else {
        throw new Error("No user data received from /api/auth/me");
      }
    } catch (error) {
      console.log(
        "AuthProvider: Session check failed or no active session.",
        error.response?.status
      );
      // Si falla (ej. 401 después de intentar refresh), limpia el estado
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Termina la carga inicial
    }
  }, []);

  useEffect(() => {
    setupAxiosAuthFunctions(() => accessToken, refreshToken, logout);
  }, [accessToken, refreshToken, logout]);

  // Dentro de AuthProvider

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        // Log más claro y llamada a checkAuthStatus
        console.log(
          "%c>>> PAGE SHOW EVENT (persisted: true) - RE-CHECKING AUTH STATUS <<<",
          "color: orange; font-weight: bold;"
        );
        checkAuthStatus();
      } else {
        console.log("Page show event (persisted: false) - Normal load.");
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [checkAuthStatus]);
  // ... resto del AuthProvider ...

  // Dentro de AuthProvider
  useEffect(() => {
    console.log(
      `AuthProvider EFFECT: isAuthenticated cambió a: ${isAuthenticated}`
    );
  }, [isAuthenticated]);

  useEffect(() => {
    console.log(`AuthProvider EFFECT: loading cambió a: ${loading}`);
  }, [loading]);

  useEffect(() => {
    console.log(`AuthProvider EFFECT: user cambió a:`, user);
  }, [user]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const values = {
    user,
    isAuthenticated,
    error,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AuthProvider };
