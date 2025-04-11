import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import PropTypes from "prop-types";
// Ejemplo de ProtectedRoute con verificación de roles (hipotético)
export const PrivateRoute = ({ children, requiredRol }) => {
  const auth = useAuth();
  const location = useLocation();
  console.log(auth)
  if (auth.isAuthenticated === false) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  if (requiredRol && auth.user.userRol !== requiredRol) {
    console.log("permisos no validos para entrar a esta ruta")
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
};
PrivateRoute.propTypes =  {
  children: PropTypes.node.isRequired,
  requiredRol: PropTypes.string
}
