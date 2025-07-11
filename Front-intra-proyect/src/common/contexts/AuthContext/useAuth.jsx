import { useContext } from "react";
import { AuthContext } from "./AuthContext";

function useAuth() {

  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export{useAuth}