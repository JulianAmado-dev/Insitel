import { Strategy, ExtractJwt } from "passport-jwt";
import { config } from "../../../config/config.js";
const db = config.db;

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};
const JwtStrategy = new Strategy(options, async (payload, done) => {
  try {
    if (!payload.sub) {
      return done(null, false);
    }
    const [user] = await db.execute(
      // Asegúrate que el nombre de columna sea correcto en tu DB
      "SELECT id_empleado, nombres, rol FROM empleados WHERE id_empleado = ?",
      [payload.sub]
    );
    console.log("la estrategia jwt con su consulta trae estos datos: ", user)
    if (user && user.length === 1) {
      return done(null, user[0]);
    } else {
      return done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
});

export { JwtStrategy };
