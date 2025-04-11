import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import passport from "passport";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";

const db = config.db;
const app = express();

import "./utils/auth/index.js";
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
); // <--- CORS (Permite todas las peticiones temporalmente)
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "5d";

console.log("hola1 - Inicio del server");

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

console.log("hola1 - Función verifyToken definida");

app.listen(config.port, () => {
  console.log(`corriendo en puerto ${config.port}`);
});
console.log("hola1 - Server escuchando");

async function executeTransaction(operations) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const results = await operations(connection);
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
console.log("hola1 - Función executeTransaction definida");

app.get(
  "/api/auth/me",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Usuario no encontrado en token" });
      }
      res.status(200).json({ user: req.user });
      // Si quisieras devolver un nuevo accessToken en cada verificación (con cuidado
      // de no generar loops infinitos), podrías hacerlo aquí:
      // const payload = { sub: req.user.id_empleado, rol: req.user.rol, nombre: req.user.nombre };
      // const newToken = jwt.sign(payload, config.jwtSecret, jwtConfig);
      // res.status(200).json({ user: req.user, accessToken: newToken });
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

//PETICIÓN PARA LOGIN
app.post(
  "/api/login",
  passport.authenticate("local", { session: false }),
  async (req, res, next) => {
    console.log("hola 2 - Entrando a la ruta /api/login");
    try {
      const user = req.user;
      const userResponse = { ...user };
      delete userResponse.contrasena;
      console.log("hola 3 - Usuario autenticado por Passport:", user);

      const payload = {
        sub: userResponse.id_empleado,
        rol: userResponse.rol,
        nombres: userResponse.nombres,
      };

      const refreshToken = jwt.sign(payload, config.jwtSecret, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
      });
      const accessToken = jwt.sign(payload, config.jwtSecret, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      });

      console.log("hola 4 - Token JWT generado:");
      console.log("hola 5 - Cookie 'refreshToken' establecida");
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "prod", // HTTPS en producción
          sameSite: "lax", // Protección CSRF
          maxAge: 5 * 24 * 60 * 60 * 1000, // 5 días
          path: "/", // Asegúrate de tener la ruta base para la cookie
        })
        .status(200)
        .json({
          message: "inicio de sesión éxitoso",
          accessToken: accessToken,
          user: {
            userId: payload.sub,
            userRol: payload.rol,
            nombre: payload.nombres,
          },
        });
      console.log("hola 6 - Respuesta JSON enviada");
    } catch (error) {
      console.error("Error en la ruta /api/login:", error);
      res.status(500).send({ error: "Error en la autenticación" });
      next(error);
    }
  }
);

app.post("/api/logout", (req, res) => {
  console.log("hola 7 - Entrando a la ruta /api/logout");
  res
    .clearCookie("refreshToken", { path: "/" })
    .status(200)
    .json({ message: "Sesión cerrada" });
  console.log(
    "hola 8 - Cookie 'token' y 'accessToken' eliminada, respuesta enviada"
  );
});

app.post("/api/auth/refresh_token", async (req, res, next) => {
  console.log("Refresh Token Endpoint: Solicitud recibida.");
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    console.log(
      "Refresh Token Endpoint: Cookie 'refreshToken'=",
      incomingRefreshToken
    );

    if (!incomingRefreshToken) {
      return res
        .status(401)
        .json({ message: "No autorizado (falta refresh token)" });
    }

    // Usa el secreto correcto para refresh tokens
    const decodedPayload = jwt.verify(
      incomingRefreshToken,
      config.jwtSecret
    );
    console.log(
      "Refresh Token Endpoint: Refresh token verificado. Payload:",
      decodedPayload
    );

    const newPayload = { sub: decodedPayload.sub, rol: decodedPayload.rol };
    // Usa el secreto correcto para access tokens
    const newAccessToken = jwt.sign(newPayload, config.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    console.log("Refresh Token Endpoint: Emitiendo nuevo access token.");
    // Sintaxis correcta para enviar JSON
    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn("Refresh Token Endpoint: Refresh token expirado.");
      res.clearCookie("refreshToken", { path: "/" });
      return res
        .status(401)
        .json({ message: "No autorizado (refresh token expirado)" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn(
        "Refresh Token Endpoint: Refresh token inválido.",
        error.message
      );
      res.clearCookie("refreshToken", { path: "/" });
      return res
        .status(401)
        .json({ message: "No autorizado (refresh token inválido)" });
    } else {
      console.error("Error en POST /api/auth/refresh_token:", error);
      next(error);
    }
  }
});
//MÉTODO DE REGISTRO DE EMPLEADOS

app.put(
  "/api/EmployeeRegistration",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log("hola 9 - Entrando a la ruta /api/EmployeeRegistration");
    try {
      const {
        apellidos,
        area,
        cargo,
        ciudad,
        contrasena,
        direccion,
        edad,
        correo,
        foto_empleado,
        nombres,
        rol,
      } = req.body;

      const hashedPassword = await bcrypt.hash(contrasena, 10).catch((err) => {
        console.error("Error al hashear la contraseña:", err);
        return res
          .status(500)
          .send({ error: "error al hashear la contraseña" });
      });
      if (!hashedPassword) return; // Detener si el hash falla

      const values = [
        apellidos,
        area,
        cargo,
        ciudad,
        hashedPassword,
        direccion,
        edad,
        correo,
        foto_empleado,
        nombres,
        rol,
      ];

      const [result] = await db.execute(
        "SELECT id_empleado FROM empleados WHERE correo = ?",
        [values[7]]
      );
      console.log(
        "hola 10 - Resultado de la consulta de usuario existente:",
        result
      );

      if (result && result.length > 0) {
        console.log("hola 11 - Usuario ya registrado con correo:", correo);
        return res.status(409).send({ error: "Usuario ya registrado" });
      } else {
        console.log("hola 12 - Registrando nuevo empleado con correo:", correo);
        const [insertResult] = await db.execute(
          "INSERT INTO empleados(apellidos,area,cargo,ciudad,contrasena,direccion,edad,correo,foto_empleado,nombres,rol) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          values
        );
        console.log("hola 13 - Resultado de la inserción:", insertResult);
        res.status(200).send({ message: "empleado registrado" });
      }
    } catch (error) {
      console.error("Error en la ruta /api/EmployeeRegistration:", error);
      res.status(500).send({ error: "Error en la base de datos" });
      next(error);
    }
  }
);

app.get(
  "/api/Projects/:area",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log(
      "hola 14 - Entrando a la ruta /api/Projects/:area con área:",
      req.params.area
    );
    try {
      const area = req.params.area;

      console.log("hola 15 - Área solicitada:", area);

      const [proyectos] = await db.execute(
        `SELECT
        p.id_proyecto,
        p.nombre_proyecto,
        p.empresa_asociada,
        p.progress,
        p.status,
        p.priority,
        p.summary,
        p.area,
        p.fecha_inicio,
        p.color,
        GROUP_CONCAT(DISTINCT e.nombres) AS nombres_empleado
      FROM
        proyectos p
      LEFT JOIN
        empleados_proyectos ep ON p.id_proyecto = ep.id_proyecto
      LEFT JOIN
        empleados e ON ep.id_empleado = e.id_empleado
      WHERE
        p.area = ?
      GROUP BY
        p.id_proyecto,
        p.nombre_proyecto,
        p.empresa_asociada,
        p.progress,
        p.status,
        p.priority,
        p.summary,
        p.area,
        p.fecha_inicio,
        p.color`,
        [area]
      );
      console.log(
        "hola 16 - Resultado de la consulta de proyectos:",
        proyectos
      );

      if (!proyectos || proyectos.length === 0) {
        console.log(
          "hola 17 - No se encontraron proyectos para el área:",
          area
        );
        return res.status(404).json({
          status: "not found",
          message: `no se encontraron proyectos para el área: ${area}`,
          data: [],
        });
      }

      return res.status(200).json({
        status: "success",
        count: proyectos.length,
        data: proyectos,
      });
    } catch (error) {
      console.error("Error en la ruta /api/Projects/:area:", error);
      next(error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener los datos de proyectos",
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/Projects/Create",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log("hola 18 - Entrando a la ruta /api/Projects/Create");
    const { nombre_proyecto, empresa_asociada, summary, prioridad, area } =
      req.body;

    const values = {
      nombre_proyecto,
      empresa_asociada,
      summary,
      prioridad,
      area,
    };
    console.log("hola 19 - Datos para crear proyecto:", values);

    try {
      const result = await executeTransaction(async (connection) => {
        const [proyectoResult] = await connection.query(
          "INSERT INTO proyectos(nombre_proyecto, empresa_asociada, summary, priority, area) VALUES (?, ?, ?, ?, ?)",
          [
            values.nombre_proyecto,
            values.empresa_asociada,
            values.summary,
            values.prioridad,
            values.area,
          ]
        );
        console.log(
          "hola 20 - Resultado de la inserción del proyecto:",
          proyectoResult
        );
        const id_proyecto = proyectoResult.insertId;
        return { id_proyecto };
      });

      res.status(201).send({
        message: "Proyecto creado con éxito",
        id_proyecto: result.id_proyecto,
      });
      console.log("hola 21 - Proyecto creado, respuesta enviada");
    } catch (error) {
      console.error("Error en la ruta /api/Projects/Create:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
      next(error);
    }
  }
);

// Middleware de manejo de errores global (AÑADIR AL FINAL)
app.use((err, req, res, next) => {
  console.error("Error global no manejado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});
