import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

let getAccessTokenFn = () => null;
let refreshTokenFn = async () => false;

export const setupAxiosAuthFunctions = (getAccessToken, refreshToken) => {
  getAccessTokenFn = getAccessToken;
  refreshTokenFn = refreshToken;
};

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessTokenFn();
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
      console.log("Interceptor de petición: Token añadido al header");
    } else {
      console.log("Interceptor de petición: Token no encontrado");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Petición exitosa, simplemente la retornamos
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // 1. Verificar si es un error 401 relevante
    //    Añadimos !originalRequest._retry para evitar bucles si algo sale muy mal.
    //    Y verificamos que no sea el propio endpoint de refresh el que falló con 401.
    if (
      error.response?.status === 401 &&
      originalRequest.url !== "/api/auth/refresh_token" &&
      !originalRequest._retry
    ) {
      console.log(
        "Interceptor (Simple): Error 401 detectado, intentando refresh..."
      );
      originalRequest._retry = true; // Marcamos que vamos a reintentar
      try {
        // 2. Intentar refrescar el token llamando a la función del contexto
        const refreshSuccessful = await refreshTokenFn();
        if (refreshSuccessful) {
          // 3. Refresh exitoso: Reintentar la petición original.
          //    El interceptor de *petición* se encargará de añadir el nuevo token.
          console.log(
            "Interceptor (Simple): Refresh exitoso, reintentando petición original a:",
            originalRequest.url
          );
          return axiosInstance(originalRequest);
        } else {
          // 4. Refresh falló (devuelve false): La sesión es inválida.
          console.error(
            "Interceptor (Simple): refreshTokenFunction devolvió false."
          );
          return Promise.reject(error); // Rechaza la promesa original
        }
      } catch (refreshError) {
        // 5. Error durante la ejecución de refreshTokenFunction.
        console.error(
          "Interceptor (Simple): Error durante la ejecución de refreshTokenFunction:",
          refreshError
        );
        return Promise.reject(refreshError); // Rechaza con el error del refresh
      }
    } // Fin del if (error 401 relevante)

    // 6. Otros Errores: Si no fue un 401 o ya era un reintento,
    //    simplemente rechazamos la promesa para que el error se maneje
    //    en el lugar donde se hizo la llamada original.
    return Promise.reject(error);
  }
);
