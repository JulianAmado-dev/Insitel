// Dentro de decodeToken.jsx
import { jwtDecode } from 'jwt-decode';

function decodeToken(token) {
  try {
    // Usa jwtDecode (camelCase)
    return jwtDecode(token);
  } catch (error) {
    console.error("Error decodificando el token:", error);
    return null; // O maneja el error como prefieras
  }
}

export default decodeToken; // Asumiendo que exportas así