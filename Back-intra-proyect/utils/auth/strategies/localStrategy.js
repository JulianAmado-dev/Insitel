import boom from "@hapi/boom";
import { Strategy } from "passport-local";
import { config } from "../../../config/config.js";
import bcrypt from "bcrypt";
const db = config.db;


const LocalStrategy = new Strategy(
  { usernameField: "correo", passwordField: "contrasena" },
  async (correo, contrasena, done) => {
    console.log("LocalStrategy ejecutada para:", correo);
    try {
      const [result] = await db.execute(
        "SELECT * FROM empleados WHERE correo=?",
        [correo]
      );
      console.log("Resultado de la consulta:");
      if (!result || result.length === 0) {
        console.log("Correo incorrecto:", correo);
        return done(null, false, boom.unauthorized("Correo incorrecto").output.payload);
      }
      const isMatch = await bcrypt.compare(contrasena, result[0].contrasena);
      console.log("Resultado de la comparación de contraseña:", isMatch);
      if (!isMatch) {
        console.log("Contraseña incorrecta para:", correo);
        return done(null, false, boom.unauthorized("Contraseña incorrecta").output.payload);
      }
      delete result[0].contrasena
      console.log("Autenticación exitosa para:", correo, result[0]);
      done(null, result[0]);
    } catch (error) {
      console.error("Error en LocalStrategy:", error);
      done(error, false);
    }
  }
);

export {LocalStrategy};