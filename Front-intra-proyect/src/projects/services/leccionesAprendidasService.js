import {axiosInstance} from "@api/axiosInstance"; // Assuming this is the correct path to your configured Axios instance

const API_URL = "/api/lecciones-aprendidas"; // Base URL for lecciones aprendidas

/**
 * Fetches all lecciones aprendidas from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of lecciones.
 */
export const fetchLecciones = async () => {
  try {
    const response = await axiosInstance.get(API_URL);
    return response.data; // The backend sends the array of lecciones directly
  } catch (error) {
    console.error("Error fetching lecciones:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener las lecciones aprendidas.");
  }
};

/**
 * Creates a new lección aprendida.
 * @param {Object} leccionData - The data for the new lección.
 * @returns {Promise<Object>} A promise that resolves to the newly created lección data.
 */
export const createLeccion = async (leccionData) => {
  try {
    // Ensure id_proyecto is an integer if it's coming as a string from a form
    if (leccionData.id_proyecto) {
      leccionData.id_proyecto = parseInt(leccionData.id_proyecto, 10);
    }
    const response = await axiosInstance.post(API_URL, leccionData);
    return response.data; // Backend returns { id_leccion_aprendida, message }
  } catch (error) {
    console.error("Error creating leccion:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear la lección aprendida.");
  }
};

/**
 * Updates an existing lección aprendida.
 * @param {number} id - The ID of the lección to update.
 * @param {Object} leccionData - The updated data for the lección.
 * @returns {Promise<Object>} A promise that resolves to the success message or updated data.
 */
export const updateLeccion = async (id, leccionData) => {
  try {
    // Ensure id_proyecto is an integer if it's coming as a string from a form
    if (leccionData.id_proyecto) {
      leccionData.id_proyecto = parseInt(leccionData.id_proyecto, 10);
    }
    const response = await axiosInstance.put(`${API_URL}/${id}`, leccionData);
    return response.data; // Backend returns { message }
  } catch (error) {
    console.error(`Error updating leccion ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`Error al actualizar la lección aprendida ${id}.`);
  }
};

// Optional: If you need to fetch a single leccion by ID (though not explicitly in the plan for LeccionesAprendidas.jsx yet)
/**
 * Fetches a single lección aprendida by its ID.
 * @param {number} id - The ID of the lección.
 * @returns {Promise<Object>} A promise that resolves to the lección data.
 */
export const fetchLeccionById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching leccion ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`Error al obtener la lección aprendida ${id}.`);
  }
};
