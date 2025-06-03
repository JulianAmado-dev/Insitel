import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import passport from "passport";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import boom from "@hapi/boom";
import "./utils/auth/index.js";
import { resetPassword } from "./utils/auth/nodeMailer/sendEmail.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = config.db;
const app = express();

// --- Multer Configuration as per Guide ---

// Middleware to create carpetas de destino si no existen
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  // La función *destination* define la ruta basada en params
  destination: (req, file, cb) => {
    // Obtener área y proyecto desde la URL (ej: /upload/:area/:id_proyecto)
    const area = req.params.area;
    const project = req.params.id_proyecto; // Using id_proyecto as per frontend
    if (!area || !project) {
      return cb(
        new Error("Area or project ID is missing in URL parameters."),
        ""
      );
    }
    // Carpeta base 'uploads', luego por área/proyecto
    const dest = path.join(__dirname, "uploads", area, project);
    ensureDirExists(dest);
    cb(null, dest); // ruta final de guardado
  },
  // La función *filename* define el nombre de archivo
  filename: (req, file, cb) => {
    // Para mantener nombre original y evitar colisiones, podemos anteponer timestamp
    const timestamp = Date.now();
    // Ejemplo: "1631531200000-mifoto.jpg"
    // Replace spaces in originalname to avoid issues, though multer handles many special chars.
    const safeOriginalName = file.originalname.replace(/\s+/g, "_");
    const finalName = `${timestamp}-${safeOriginalName}`;
    cb(null, finalName);
  },
});

// Filtro de tipos permitidos: solo imágenes y PDF
const fileFilter = (req, file, cb) => {
  // Aceptamos solo tipos JPEG, PNG, GIF o PDF
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Log the rejected file type for easier debugging
    console.log(
      `Rejected file type: ${file.mimetype} for file ${file.originalname}`
    );
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, GIF) y PDF."
      ),
      false
    );
  }
};

// Límite de tamaño (5MB as per guide)
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Crear instancia de Multer con configuración
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_SIZE },
});
// --- End Multer Configuration ---

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Added for simple forms, good practice
app.use(cookieParser());
app.use(passport.initialize());

// Serve static files from the 'uploads' directory
// This makes files in 'uploads/<area>/<id_proyecto>/<filename>'
// accessible via 'http://localhost:PORT/files/<area>/<id_proyecto>/<filename>'
app.use("/files", express.static(path.join(__dirname, "uploads")));

const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "5d";

console.log("hola1 - Inicio del server");

app.listen(config.port, () => {
  console.log(`corriendo en puerto ${config.port}`);
});
console.log("hola3 - Server escuchando");

async function executeTransaction(callback) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const results = await callback(connection);
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
console.log("hola3 - Función executeTransaction definida");

app.get(
  "/api/auth/me",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Usuario no encontrado en token" });
      } else {
        console.log(
          "user encontrado con el end. de auth/me con el user: ",
          req.user
        );
        const payload = {
          sub: req.user.id_empleado,
          rol: req.user.rol,
          nombre: req.user.nombre,
        };

        const newToken = jwt.sign(payload, config.jwtSecret, {
          expiresIn: ACCESS_TOKEN_EXPIRY,
        });

        console.log("user del req.user", req.user);

        res.status(200).json({
          accessToken: newToken,
          user: req.user,
        });
      }
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

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

      console.log("hola 4 - Cookie 'accessToken' establecida");
      console.log("hola 5 - Cookie 'refreshToken' establecida");
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "prod",
          sameSite: "lax",
          maxAge: 5 * 24 * 60 * 60 * 1000,
          path: "/",
        })
        .status(200)
        .json({
          message: "inicio de sesión éxitoso",
          accessToken: accessToken,
          user: {
            userId: payload.sub,
            rol: payload.rol,
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

app.get("/api/validate-token", async (req, res) => {
  try {
    const recoveryToken = req.query.token;
    console.log(recoveryToken, "ASDASDASD");
    const decodedPayload = jwt.verify(recoveryToken, config.jwtSecret);

    const user = await db.execute(
      `SELECT id_empleado, recovery_token FROM empleados WHERE id_empleado = ?`,
      [decodedPayload.sub]
    );

    if (user[0][0].recovery_token !== recoveryToken) {
      throw boom.unauthorized("recoveryToken invalido");
    }

    return res
      .status(200)
      .json({ message: "email was validated", isValid: true });
  } catch (error) {
    return res.status(401).json({ error: error.message, isValid: false });
  }
});

app.post("/api/sendCode", async (req, res) => {
  try {
    const { correo } = req.body;

    const isCorreoValido = await db.execute(
      `SELECT id_empleado FROM empleados WHERE correo = ?`,
      [correo]
    );

    if (!isCorreoValido) {
      throw boom.unauthorized("Correo incorrecto");
    }

    const payload = { sub: isCorreoValido[0][0].id_empleado };
    const recoveryToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: "15min",
    });
    const link = `http://localhost:5173/auth/login?token=${recoveryToken}`; // Corrected link
    const rta = await db.execute(
      `UPDATE empleados SET recovery_token = ? WHERE id_empleado = ?`,
      [recoveryToken, isCorreoValido[0][0].id_empleado]
    );

    await resetPassword(correo, link);
    return res
      .status(200)
      .json({ message: "Mail sent", rta, id_empleado: payload.sub });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});

app.post("/api/change-password", async (req, res) => {
  try {
    const { contrasena } = req.body;
    const { token } = req.query;

    const decodedPayload = jwt.verify(token, config.jwtSecret);

    const user = await db.execute(
      `SELECT id_empleado, recovery_token FROM empleados WHERE id_empleado = ?`,
      [decodedPayload.sub]
    );

    const hashedPassword = await bcrypt.hash(contrasena, 10).catch((err) => {
      console.error("Error al hashear la contraseña:", err);
      return res.status(500).send({ error: "error al hashear la contraseña" });
    });
    if (!hashedPassword) return;

    const rta = await db.execute(
      `UPDATE empleados SET recovery_token = ?, contrasena = ? WHERE id_empleado = ?`,
      [null, hashedPassword, user[0][0].id_empleado]
    );

    res.status(200).json({ message: "Contraseña cambiada" });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get(
  "/api/getDepartments",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const [areas] = await db.execute(`SELECT * FROM areas`);
      const [areasItems] = await db.execute(
        `SELECT * FROM areas_navegacion ORDER BY id_area asc`
      );

      if (!areas) {
        return res
          .status(400)
          .json({ message: "Usuario no encontrado en token" }); // Should be "Areas no encontradas"
      } else {
        console.log("area encontrada para NavBar ", req.user); // req.user might not be relevant here

        return res.status(200).json({
          status: "success",
          count: areas.length,
          areas: areas,
          areasItems,
        });
      }
    } catch (error) {
      console.error("Error en la ruta /api/getDepartments:", error); // Corrected path
      next(error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener los Items del navBar",
        error: error.message,
      });
    }
  }
);

app.post("/api/logout", (req, res) => {
  console.log("hola 7 - Entrando a la ruta /api/logout");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res
    .clearCookie("refreshToken", { path: "/" })
    .status(200)
    .json({ message: "Sesión cerrada" });
  console.log(
    "hola 8 - Cookie 'refreshToken' eliminada, respuesta enviada" // Corrected cookie name
  );
});

app.post("/api/auth/refresh_token", async (req, res, next) => {
  console.log("Refresh Token Endpoint: Solicitud recibida.");
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      console.log(
        "Refresh token no recibida en auth/refresh_token" // Corrected log
      );
      return res
        .status(401)
        .json({ message: "No autorizado (falta refresh token)" });
    }
    const decodedPayload = jwt.verify(incomingRefreshToken, config.jwtSecret);
    console.log(
      "Refresh Token Endpoint: Refresh token verificado. Payload:",
      decodedPayload
    );
    if (!decodedPayload) {
      console.log("la verificación falló o no hay payload");
      res
        .status(403)
        .json({ message: "la verificación del refresh token falló" });
    } else {
      const newPayload = {
        sub: decodedPayload.sub,
        rol: decodedPayload.rol,
        nombres: decodedPayload.nombres,
      };
      const newAccessToken = jwt.sign(newPayload, config.jwtSecret, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      });
      console.log("Refresh Token Endpoint: Emitiendo nuevo access token.");
      return res.status(200).json({
        accessToken: newAccessToken,
        user: {
          userId: decodedPayload.sub,
          rol: decodedPayload.rol,
          nombres: decodedPayload.nombres,
        },
      });
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn("Refresh Token Endpoint: Refresh token expirado.");
      return res
        .clearCookie("refreshToken", { path: "/" })
        .status(401)
        .json({ message: "No autorizado (refresh token expirado)" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn(
        "Refresh Token Endpoint: Refresh token inválido.",
        error.message
      );
      return res
        .clearCookie("refreshToken", { path: "/" })
        .status(401)
        .json({ message: "No autorizado (refresh token inválido)" });
    } else {
      console.error("Error en POST /api/auth/refresh_token:", error);
      next(error);
    }
  }
});

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
      if (!hashedPassword) return;

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
        [values[7]] // correo is at index 7
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

// --- Endpoint para listado simple de proyectos ---
app.get(
  "/api/proyectos/listado-simple", // Eliminado :area de la ruta
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      // const { area } = req.params; // 'area' ya no se usa aquí
      const [proyectos] = await db.execute(
        "SELECT id_proyecto, nombre_proyecto FROM proyectos ORDER BY nombre_proyecto ASC" // Eliminado WHERE area = ?
      );
      res.status(200).json(proyectos);
    } catch (error) {
      console.error("Error en GET /api/proyectos/listado-simple:", error); // Log actualizado
      next(error);
    }
  }
);
// --- Fin Endpoint listado simple de proyectos ---

app.get(
  "/api/Proyectos/:area",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log(
      "hola 14 - Entrando a la ruta /api/Proyectos/:area con área:",
      req.params.area
    );
    try {
      const area = req.params.area;
      console.log("hola 15 - Área solicitada:", area);

      const [proyectos] = await db.execute(
        `SELECT
        p.id_proyecto, p.nombre_proyecto, p.empresa_asociada, p.progress,
        p.status, p.priority, p.summary, p.area, p.fecha_inicio, p.color,
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
        p.id_proyecto`, // Simplified GROUP BY
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
      console.error("Error en la ruta /api/Proyectos/:area:", error);
      next(error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener los datos de proyectos",
        error: error.message,
      });
    }
  }
);

// --- Formulario General Endpoints ---
app.get(
  "/api/Proyectos/:area/:id_proyecto/form/general/get",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const { id_proyecto } = req.params;
      const [formulario_general_rows] = await db.execute(
        // Renamed variable
        `SELECT * FROM formulario_general WHERE id_proyecto = ?`,
        [id_proyecto]
      );

      const [miembros_proyecto] = await db.execute(
        `SELECT id_empleado, rol_en_proyecto, responsabilidades FROM proyecto_equipo WHERE id_proyecto = ?`,
        [id_proyecto]
      );

      const [compras_proyecto] = await db.execute(
        `SELECT * FROM proyecto_compras WHERE id_proyecto = ?`,
        [id_proyecto]
      );

      if (!formulario_general_rows || formulario_general_rows.length === 0) {
        // Check renamed variable
        return res.status(404).json({
          status: "not found",
          message: `Formulario general no encontrado para el proyecto: ${id_proyecto}`,
          data: null, // Return null or empty object for consistency
        });
      }

      return res.status(200).json({
        status: "success",
        formulario_general: formulario_general_rows[0], // Return the object, not array
        miembros_proyecto: miembros_proyecto,
        compras_proyecto: compras_proyecto,
      });
    } catch (error) {
      console.error("Error en GET /form/general/get:", error);
      next(error);
    }
  }
);

app.post(
  "/api/Proyectos/:area/:id_proyecto/form/general/fill",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    // Added next
    const { id_proyecto } = req.params;
    try {
      await executeTransaction(async (connection) => {
        if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
          throw boom.badRequest("ID del proyecto inválido o faltante");
        }
        const { equipo, compras, ...formData } = req.body;

        const fields = Object.keys(formData);
        const placeholders = fields.map(() => "?").join(", ");
        const values = fields.map((field) => formData[field]);

        const sqlFormularioGeneral = `
          INSERT INTO formulario_general (id_proyecto, ${fields.join(", ")}) 
          VALUES (?, ${placeholders});`;

        await connection.execute(sqlFormularioGeneral, [
          id_proyecto,
          ...values,
        ]);

        if (equipo && Array.isArray(equipo) && equipo.length > 0) {
          const sqlEquipo = `
            INSERT INTO proyecto_equipo (
              id_proyecto, id_empleado, nombre_asignado, rol_en_proyecto, responsabilidades
            ) VALUES (?, ?, ?, ?, ?);`;
          for (const miembro of equipo) {
            const [empleadoRows] = await connection.execute(
              "SELECT nombres, apellidos FROM empleados WHERE id_empleado = ?",
              [miembro.id_empleado]
            );
            const nombreCompleto =
              empleadoRows && empleadoRows.length > 0
                ? `${empleadoRows[0].nombres} ${empleadoRows[0].apellidos}`
                : "Nombre no disponible";
            await connection.execute(sqlEquipo, [
              id_proyecto,
              miembro.id_empleado,
              nombreCompleto,
              miembro.rol_en_proyecto,
              miembro.responsabilidades || null,
            ]);
          }
        }

        if (compras && Array.isArray(compras) && compras.length > 0) {
          const sqlCompra = `
            INSERT INTO proyecto_compras (
              id_proyecto, creado_por_id, proveedor, descripcion, cantidad,
              unidad_medida, total_usd, total_cop, orden_compra, estado_compra
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          for (const compra of compras) {
            await connection.execute(sqlCompra, [
              id_proyecto,
              req.user.id_empleado,
              compra.proveedor,
              compra.descripcion,
              compra.cantidad,
              compra.unidad_medida,
              compra.total_usd,
              compra.total_cop,
              compra.orden_compra,
              compra.estado_compra || "Solicitado",
            ]);
          }
        }
        res.status(201).json({
          message: "Formulario general registrado exitosamente.",
          id_proyecto,
        });
      });
    } catch (error) {
      console.error("Error en POST /form/general/fill:", error);
      next(error);
    }
  }
);

app.patch(
  "/api/Proyectos/:area/:id_proyecto/form/general/update",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    // Added next
    const { id_proyecto } = req.params;
    try {
      await executeTransaction(async (connection) => {
        if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
          throw boom.badRequest("ID del proyecto inválido o faltante");
        }
        const { equipo, compras, ...otrosCampos } = req.body;

        if (Object.keys(otrosCampos).length > 0) {
          const updatesFormularioGeneral = Object.keys(otrosCampos)
            .map((campo) => `${campo} = ?`)
            .join(", ");
          const valuesFormularioGeneral = Object.values(otrosCampos);
          const sqlUpdateFormularioGeneral = `
                UPDATE formulario_general SET ${updatesFormularioGeneral} 
                WHERE id_proyecto = ?`;
          await connection.execute(sqlUpdateFormularioGeneral, [
            ...valuesFormularioGeneral,
            id_proyecto,
          ]);
        }

        if (equipo && Array.isArray(equipo)) {
          await connection.execute(
            "DELETE FROM proyecto_equipo WHERE id_proyecto = ?",
            [id_proyecto]
          );
          const sqlEquipoInsert = `
            INSERT INTO proyecto_equipo (id_proyecto, id_empleado, nombre_asignado, rol_en_proyecto, responsabilidades) 
            VALUES (?, ?, ?, ?, ?);`;
          for (const miembro of equipo) {
            const [empleadoRows] = await connection.execute(
              "SELECT nombres, apellidos FROM empleados WHERE id_empleado = ?",
              [miembro.id_empleado]
            );
            const nombreCompleto =
              empleadoRows && empleadoRows.length > 0
                ? `${empleadoRows[0].nombres} ${empleadoRows[0].apellidos}`
                : "Nombre no disponible";
            await connection.execute(sqlEquipoInsert, [
              id_proyecto,
              miembro.id_empleado,
              nombreCompleto,
              miembro.rol_en_proyecto,
              miembro.responsabilidades || null,
            ]);
          }
        }

        if (compras && Array.isArray(compras)) {
          await connection.execute(
            "DELETE FROM proyecto_compras WHERE id_proyecto = ?",
            [id_proyecto]
          );
          const sqlCompraInsert = `
            INSERT INTO proyecto_compras (id_proyecto, creado_por_id, proveedor, descripcion, cantidad, unidad_medida, total_usd, total_cop, orden_compra, estado_compra) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          for (const compra of compras) {
            await connection.execute(sqlCompraInsert, [
              id_proyecto,
              req.user.id_empleado,
              compra.proveedor,
              compra.descripcion,
              compra.cantidad,
              compra.unidad_medida,
              compra.total_usd,
              compra.total_cop,
              compra.orden_compra,
              compra.estado_compra || "Solicitado",
            ]);
          }
        }
        res
          .status(200)
          .json({ message: "Formulario general actualizado exitosamente." });
      });
    } catch (error) {
      console.error("Error en PATCH /form/general/update:", error);
      next(error);
    }
  }
);

// --- Formulario Alcance Endpoints ---
app.get(
  "/api/Proyectos/:area/:id_proyecto/form/alcance/get",
  passport.authenticate("jwt", { session: false }), // Added auth
  async (req, res, next) => {
    try {
      const { id_proyecto } = req.params;
      const [formulario_alcance_rows] = await db.execute(
        // Renamed
        `SELECT * FROM formulario_alcance WHERE id_proyecto = ?`,
        [id_proyecto]
      );
      if (!formulario_alcance_rows || formulario_alcance_rows.length === 0) {
        // Check renamed
        return res.status(404).json({
          status: "not found",
          message: `Formulario de alcance no encontrado para el proyecto: ${id_proyecto}`,
          data: null,
        });
      }
      return res.status(200).json({
        status: "success",
        formulario_alcance: formulario_alcance_rows[0], // Return object
      });
    } catch (error) {
      console.error("Error en GET /form/alcance/get:", error);
      next(error);
    }
  }
);

app.post(
  "/api/Proyectos/:area/:id_proyecto/form/alcance/fill",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    const { ...formData } = req.body;
    try {
      await executeTransaction(async (connection) => {
        if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
          throw boom.badRequest("ID del proyecto inválido o faltante");
        }
        const fields = Object.keys(formData);
        const placeholders = fields.map(() => "?").join(", ");
        const values = fields.map((field) => formData[field]);

        const sql = `INSERT INTO formulario_alcance (id_proyecto, ${fields.join(
          ", "
        )}) VALUES (?, ${placeholders})`;
        await connection.execute(sql, [id_proyecto, ...values]);
        res.status(201).json({
          message: "Formulario de alcance registrado exitosamente.",
          id_proyecto,
        });
      });
    } catch (error) {
      console.error("Error en POST /form/alcance/fill:", error);
      next(error);
    }
  }
);

app.patch(
  "/api/Proyectos/:area/:id_proyecto/form/alcance/update",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    const { ...campos_modificados } = req.body;
    try {
      await executeTransaction(async (connection) => {
        if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
          throw boom.badRequest("ID del proyecto inválido o faltante");
        }
        if (Object.keys(campos_modificados).length === 0) {
          return res
            .status(200)
            .json({ message: "No hay cambios para actualizar" });
        }
        const updates = Object.keys(campos_modificados)
          .map((campo) => `${campo} = ?`)
          .join(", ");
        const values = Object.values(campos_modificados);
        const sqlUpdate = `UPDATE formulario_alcance SET ${updates} WHERE id_proyecto = ?`;
        await connection.execute(sqlUpdate, [...values, id_proyecto]);
        res
          .status(200)
          .json({ message: "Formulario de alcance actualizado exitosamente." });
      });
    } catch (error) {
      console.error("Error en PATCH /form/alcance/update:", error);
      next(error);
    }
  }
);

// --- Formulario Presupuesto Endpoints ---
app.post(
  "/api/Proyectos/:area/:id_proyecto/form/presupuesto/fill",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    const {
      total_rh_calculado,
      total_suministros_calculado,
      total_servicios_calculado,
      recursos_humanos,
      suministros,
      servicios,
    } = req.body;
    const creado_por_id = req.user.id_empleado;
    // const version_presupuesto = 1; // Asumimos versión 1 para nuevos formularios

    try {
      await executeTransaction(async (connection) => {
        if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
          throw boom.badRequest("ID del proyecto inválido o faltante");
        }

        // Insertar en formulario_presupuesto
        const [mainFormResult] = await connection.execute(
          `INSERT INTO formulario_presupuesto (
            id_proyecto, creado_por_id, fecha_creacion, fecha_actualizacion,
            total_rh_calculado, total_suministros_calculado, total_servicios_calculado
          ) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?)`,
          [
            id_proyecto,
            creado_por_id,
            total_rh_calculado,
            total_suministros_calculado,
            total_servicios_calculado,
          ]
        );
        // No necesitamos el ID insertado si la PK es solo id_proyecto (y no version_presupuesto)

        // Insertar recursos_humanos
        if (
          recursos_humanos &&
          Array.isArray(recursos_humanos) &&
          recursos_humanos.length > 0
        ) {
          const sqlRH = `
            INSERT INTO presupuesto_rh (
              id_proyecto, id_empleado_asignado, nombre_recurso, salario_mensual, 
              salario_mensual_parafiscales, costo_dia, cantidad_dias, valor_total_linea, 
              creado_por_id, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`;
          for (const rh of recursos_humanos) {
            await connection.execute(sqlRH, [
              id_proyecto,
              rh.id_empleado_asignado || null,
              rh.nombre_recurso,
              rh.salario_mensual,
              rh.salario_mensual_parafiscales,
              rh.costo_dia,
              rh.cantidad_dias,
              rh.valor_total_linea,
              creado_por_id,
            ]);
          }
        }

        // Insertar suministros
        if (
          suministros &&
          Array.isArray(suministros) &&
          suministros.length > 0
        ) {
          const sqlSuministros = `
            INSERT INTO presupuesto_suministro (
              id_proyecto, nombre_proveedor, nombre_item, cantidad_suministro, 
              unidad_de_medida, valor_unitario_suministro, valor_total_linea, 
              creado_por_id, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`;
          for (const s of suministros) {
            await connection.execute(sqlSuministros, [
              id_proyecto,
              s.nombre_proveedor,
              s.nombre_item,
              s.cantidad_suministro,
              s.unidad_de_medida,
              s.valor_unitario_suministro,
              s.valor_total_linea,
              creado_por_id,
            ]);
          }
        }

        // Insertar servicios
        if (servicios && Array.isArray(servicios) && servicios.length > 0) {
          const sqlServicios = `
            INSERT INTO presupuesto_servicio (
              id_proyecto, nombre_proveedor, nombre_servicio, cantidad_servicio, 
              unidad_de_medida, valor_unitario, valor_total_linea, 
              creado_por_id, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`;
          for (const serv of servicios) {
            await connection.execute(sqlServicios, [
              id_proyecto,
              serv.nombre_proveedor,
              serv.nombre_servicio,
              serv.cantidad_servicio,
              serv.unidad_de_medida,
              serv.valor_unitario,
              serv.valor_total_linea,
              creado_por_id,
            ]);
          }
        }
        res.status(201).json({
          message: "Presupuesto y sus detalles registrados exitosamente.",
          id_proyecto: id_proyecto,
        });
      });
    } catch (error) {
      console.error("Error en POST /form/presupuesto/fill:", error);
      next(error);
    }
  }
);

app.get(
  "/api/Proyectos/:area/:id_proyecto/form/presupuesto/get",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    // const version_presupuesto = 1; // Asumir versión 1 o la única existente

    try {
      console.log(`GET request for presupuesto, id_proyecto: ${id_proyecto}`);

      const [mainPresupuestoRows] = await db.execute(
        "SELECT * FROM formulario_presupuesto WHERE id_proyecto = ?", // AND version_presupuesto = ?
        [id_proyecto /*, version_presupuesto*/]
      );

      if (!mainPresupuestoRows || mainPresupuestoRows.length === 0) {
        return res
          .status(404)
          .json({ message: "Presupuesto no encontrado para este proyecto." });
      }
      const formulario_presupuesto = mainPresupuestoRows[0];

      const [recursos_humanos_data] = await db.execute(
        "SELECT * FROM presupuesto_rh WHERE id_proyecto = ?", // AND version_presupuesto = ?
        [id_proyecto /*, version_presupuesto*/]
      );
      const [suministros_data] = await db.execute(
        "SELECT * FROM presupuesto_suministro WHERE id_proyecto = ?", // AND version_presupuesto = ? // Tabla es presupuesto_suministro
        [id_proyecto /*, version_presupuesto*/]
      );
      const [servicios_data] = await db.execute(
        "SELECT * FROM presupuesto_servicio WHERE id_proyecto = ?", // AND version_presupuesto = ? // Tabla es presupuesto_servicio
        [id_proyecto /*, version_presupuesto*/]
      );

      res.status(200).json({
        formulario_presupuesto,
        recursos_humanos_data,
        suministros_data,
        servicios_data,
      });
    } catch (error) {
      console.error("Error en GET /form/presupuesto/get:", error);
      next(error);
    }
  }
);

app.patch(
  "/api/Proyectos/:area/:id_proyecto/form/presupuesto/update",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    const {
      total_rh_calculado,
      total_suministros_calculado,
      total_servicios_calculado,
      recursos_humanos,
      suministros,
      servicios,
    } = req.body;
    const actualizado_por_id = req.user.id_empleado;
    // const version_presupuesto_to_update = 1; // Asumir versión 1

    try {
      await executeTransaction(async (connection) => {
        const [mainFormRows] = await connection.execute(
          "SELECT id_proyecto FROM formulario_presupuesto WHERE id_proyecto = ?", // AND version_presupuesto = ?
          [id_proyecto /*, version_presupuesto_to_update*/]
        );

        if (!mainFormRows || mainFormRows.length === 0) {
          throw boom.notFound(
            `Formulario de presupuesto no encontrado para este proyecto.`
          );
        }

        await connection.execute(
          `UPDATE formulario_presupuesto SET 
            actualizado_por_id = ?, fecha_actualizacion = CURRENT_TIMESTAMP,
            total_rh_calculado = ?, total_suministros_calculado = ?, total_servicios_calculado = ?
           WHERE id_proyecto = ?`, // AND version_presupuesto = ?
          [
            actualizado_por_id,
            total_rh_calculado,
            total_suministros_calculado,
            total_servicios_calculado,
            id_proyecto /*, version_presupuesto_to_update*/,
          ]
        );

        // Delete existing line items
        await connection.execute(
          "DELETE FROM presupuesto_rh WHERE id_proyecto = ?",
          [id_proyecto /*, version_presupuesto_to_update*/]
        );
        await connection.execute(
          "DELETE FROM presupuesto_suministro WHERE id_proyecto = ?",
          [id_proyecto /*, version_presupuesto_to_update*/]
        ); // Tabla es presupuesto_suministro
        await connection.execute(
          "DELETE FROM presupuesto_servicio WHERE id_proyecto = ?",
          [id_proyecto /*, version_presupuesto_to_update*/]
        ); // Tabla es presupuesto_servicio

        // Insert new line items (similar to /fill endpoint)
        if (
          recursos_humanos &&
          Array.isArray(recursos_humanos) &&
          recursos_humanos.length > 0
        ) {
          const sqlRH = `
            INSERT INTO presupuesto_rh (
              id_proyecto, id_empleado_asignado, nombre_recurso, salario_mensual, 
              salario_mensual_parafiscales, costo_dia, cantidad_dias, valor_total_linea, 
              creado_por_id, fecha_creacion 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`; // Removed version_presupuesto from VALUES if not used
          for (const rh of recursos_humanos) {
            await connection.execute(sqlRH, [
              id_proyecto /*version_presupuesto_to_update,*/,
              rh.id_empleado_asignado || null,
              rh.nombre_recurso,
              rh.salario_mensual,
              rh.salario_mensual_parafiscales,
              rh.costo_dia,
              rh.cantidad_dias,
              rh.valor_total_linea,
              actualizado_por_id,
            ]);
          }
        }

        if (
          suministros &&
          Array.isArray(suministros) &&
          suministros.length > 0
        ) {
          const sqlSuministros = `
            INSERT INTO presupuesto_suministro (
              id_proyecto, nombre_proveedor, nombre_item, cantidad_suministro, unidad_de_medida, 
              valor_unitario_suministro, valor_total_linea, creado_por_id, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`; // Tabla es presupuesto_suministro
          for (const s of suministros) {
            await connection.execute(sqlSuministros, [
              id_proyecto /*version_presupuesto_to_update,*/,
              s.nombre_proveedor,
              s.nombre_item,
              s.cantidad_suministro,
              s.unidad_de_medida,
              s.valor_unitario_suministro,
              s.valor_total_linea,
              actualizado_por_id,
            ]);
          }
        }

        if (servicios && Array.isArray(servicios) && servicios.length > 0) {
          const sqlServicios = `
            INSERT INTO presupuesto_servicio (
              id_proyecto, nombre_proveedor, nombre_servicio, cantidad_servicio, unidad_de_medida, 
              valor_unitario, valor_total_linea, creado_por_id, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`; // Tabla es presupuesto_servicio
          for (const serv of servicios) {
            await connection.execute(sqlServicios, [
              id_proyecto /*version_presupuesto_to_update,*/,
              serv.nombre_proveedor,
              serv.nombre_servicio,
              serv.cantidad_servicio,
              serv.unidad_de_medida,
              serv.valor_unitario,
              serv.valor_total_linea,
              actualizado_por_id,
            ]);
          }
        }
        res
          .status(200)
          .json({ message: "Presupuesto actualizado exitosamente." });
      });
    } catch (error) {
      console.error("Error en PATCH /form/presupuesto/update:", error);
      next(error);
    }
  }
);

app.post(
  "/api/Proyectos/Create",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log("hola 18 - Entrando a la ruta /api/Proyectos/Create");
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
      console.error("Error en la ruta /api/Proyectos/Create:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
      next(error);
    }
  }
);

// --- Formulario Verificacion Endpoints ---
app.post(
  "/api/Proyectos/:area/:id_proyecto/form/verificacion/fill",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    const { version_verificada, lista_chequeo, registros_aprobacion } =
      req.body;
    const creado_por_id = req.user.id_empleado;

    try {
      await executeTransaction(async (connection) => {
        if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
          throw boom.badRequest("ID del proyecto inválido o faltante");
        }

        // 1. Insertar en formulario_verificacion
        const [mainFormResult] = await connection.execute(
          `INSERT INTO formulario_verificacion (id_proyecto, version_verificada, creado_por_id, fecha_creacion, fecha_actualizacion) 
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [id_proyecto, version_verificada, creado_por_id]
        );
        const id_formulario_verificacion = mainFormResult.insertId;

        if (!id_formulario_verificacion) {
          throw boom.internal(
            "No se pudo crear el formulario de verificación principal."
          );
        }

        // 2. Insertar en verificacion_cumplimiento_requerimientos
        if (
          lista_chequeo &&
          Array.isArray(lista_chequeo) &&
          lista_chequeo.length > 0
        ) {
          const sqlRequisitos = `
            INSERT INTO verificacion_cumplimiento_requerimientos (
              id_formulario_verificacion, codigo_requisito, tipo_requisito, descripcion_requisito, 
              cumple, observaciones, fecha_verificacion, verificado_por_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
          for (const item of lista_chequeo) {
            await connection.execute(sqlRequisitos, [
              id_formulario_verificacion,
              item.codigo_requisito || null,
              item.tipo_requisito || null,
              item.descripcion_requisito,
              item.cumple,
              item.observaciones || null,
              item.fecha_verificacion,
              item.verificado_por_id || null,
            ]);
          }
        }

        // 3. Insertar en registro_verificacion_aprobacion
        if (
          registros_aprobacion &&
          Array.isArray(registros_aprobacion) &&
          registros_aprobacion.length > 0
        ) {
          const sqlAprobaciones = `
            INSERT INTO registro_verificacion_aprobacion (
              id_formulario_verificacion, fecha_aprobacion, version_aprobada, 
              observaciones, nombre_responsable, firma_id
            ) VALUES (?, ?, ?, ?, ?, ?);`; // Usar nombre_responsable
          for (const item of registros_aprobacion) {
            await connection.execute(sqlAprobaciones, [
              id_formulario_verificacion,
              item.fecha_aprobacion,
              item.version_aprobada,
              item.observaciones || null,
              item.nombre_responsable, // Usar el campo mapeado desde el frontend (originalmente rol_responsable)
              item.firma_id || null,
            ]);
          }
        }
        res.status(201).json({
          message:
            "Formulario de verificación y sus detalles registrados exitosamente.",
          id_formulario_verificacion: id_formulario_verificacion,
        });
      });
    } catch (error) {
      console.error("Error en POST /form/verificacion/fill:", error);
      next(error);
    }
  }
);

app.get(
  "/api/Proyectos/:area/:id_proyecto/form/verificacion/get",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    // Opcionalmente, podrías aceptar un id_formulario_verificacion específico aquí
    // const { id_formulario_verificacion_especifico } = req.query;
    try {
      const [mainFormRows] = await db.execute(
        `SELECT * FROM formulario_verificacion 
         WHERE id_proyecto = ? 
         ORDER BY fecha_creacion DESC LIMIT 1`,
        [id_proyecto]
      );

      if (!mainFormRows || mainFormRows.length === 0) {
        return res.status(404).json({
          message:
            "Formulario de verificación no encontrado para este proyecto.",
        });
      }
      const formulario_verificacion = mainFormRows[0];
      const id_formulario_verificacion =
        formulario_verificacion.id_formulario_verificacion;

      const [lista_chequeo_data] = await db.execute(
        `SELECT vcr.*, CONCAT(e.nombres, ' ', e.apellidos) AS nombre_verificado_por
         FROM verificacion_cumplimiento_requerimientos vcr
         LEFT JOIN empleados e ON vcr.verificado_por_id = e.id_empleado
         WHERE vcr.id_formulario_verificacion = ?`,
        [id_formulario_verificacion]
      );
      const [registros_aprobacion_data] = await db.execute(
        `SELECT ra.*, CONCAT(e.nombres, ' ', e.apellidos) AS nombre_firmante
         FROM registro_verificacion_aprobacion ra
         LEFT JOIN empleados e ON ra.firma_id = e.id_empleado
         WHERE ra.id_formulario_verificacion = ?`,
        [id_formulario_verificacion]
      );

      res.status(200).json({
        formulario_verificacion,
        lista_chequeo_data,
        registros_aprobacion_data,
      });
    } catch (error) {
      console.error("Error en GET /form/verificacion/get:", error);
      next(error);
    }
  }
);

app.patch(
  "/api/Proyectos/:area/:id_proyecto/form/verificacion/:id_form_verif/update",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto, id_form_verif } = req.params;
    const { version_verificada, lista_chequeo, registros_aprobacion } =
      req.body;
    const actualizado_por_id = req.user.id_empleado;

    try {
      await executeTransaction(async (connection) => {
        // 1. Verificar que el formulario principal exista
        const [formExistRows] = await connection.execute(
          "SELECT id_formulario_verificacion FROM formulario_verificacion WHERE id_formulario_verificacion = ? AND id_proyecto = ?",
          [id_form_verif, id_proyecto]
        );
        if (!formExistRows || formExistRows.length === 0) {
          throw boom.notFound(
            "Formulario de verificación no encontrado para este proyecto y ID."
          );
        }

        // 2. Actualizar formulario_verificacion
        await connection.execute(
          `UPDATE formulario_verificacion 
           SET version_verificada = ?, actualizado_por_id = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
           WHERE id_formulario_verificacion = ?`,
          [version_verificada, actualizado_por_id, id_form_verif]
        );

        // 3. Borrar detalles existentes
        await connection.execute(
          "DELETE FROM verificacion_cumplimiento_requerimientos WHERE id_formulario_verificacion = ?",
          [id_form_verif]
        );
        await connection.execute(
          "DELETE FROM registro_verificacion_aprobacion WHERE id_formulario_verificacion = ?",
          [id_form_verif]
        );

        // 4. Re-insertar detalles (similar a /fill)
        if (
          lista_chequeo &&
          Array.isArray(lista_chequeo) &&
          lista_chequeo.length > 0
        ) {
          const sqlRequisitos = `
            INSERT INTO verificacion_cumplimiento_requerimientos (
              id_formulario_verificacion, codigo_requisito, tipo_requisito, descripcion_requisito, 
              cumple, observaciones, fecha_verificacion, verificado_por_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
          for (const item of lista_chequeo) {
            await connection.execute(sqlRequisitos, [
              id_form_verif,
              item.codigo_requisito || null,
              item.tipo_requisito || null,
              item.descripcion_requisito,
              item.cumple,
              item.observaciones || null,
              item.fecha_verificacion,
              item.verificado_por_id || null,
            ]);
          }
        }

        if (
          registros_aprobacion &&
          Array.isArray(registros_aprobacion) &&
          registros_aprobacion.length > 0
        ) {
          const sqlAprobaciones = `
            INSERT INTO registro_verificacion_aprobacion (
              id_formulario_verificacion, fecha_aprobacion, version_aprobada, 
              observaciones, nombre_responsable, firma_id
            ) VALUES (?, ?, ?, ?, ?, ?);`; // Usar nombre_responsable
          for (const item of registros_aprobacion) {
            await connection.execute(sqlAprobaciones, [
              id_form_verif,
              item.fecha_aprobacion,
              item.version_aprobada,
              item.observaciones || null,
              item.nombre_responsable, // Usar el campo mapeado desde el frontend
              item.firma_id || null,
            ]);
          }
        }
        res.status(200).json({
          message: "Formulario de verificación actualizado exitosamente.",
        });
      });
    } catch (error) {
      console.error("Error en PATCH /form/verificacion/update:", error);
      next(error);
    }
  }
);

// --- Endpoints para Lecciones Aprendidas ---

// GET todas las lecciones aprendidas
app.get(
  "/api/lecciones-aprendidas", // Eliminado :area de la ruta
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log("GET /api/lecciones-aprendidas: User from JWT ->", req.user); // Log user
    try {
      // const { area } = req.params; // 'area' ya no se usa aquí
      const query = `
        SELECT 
          la.id_leccion_aprendida,
          la.id_proyecto,
          la.creado_por_id,
          la.titulo,
          la.area_categoria,
          la.fecha,
          la.descripcion_situacion,
          la.descripcion_impacto,
          la.acciones_correctivas,
          la.leccion_aprendida_recomendaciones,
          la.reportado_por,
          la.tipo_leccion,
          p.nombre_proyecto,
          CONCAT(e.nombres, ' ', e.apellidos) AS creado_por_nombre 
        FROM lecciones_aprendidas la
        LEFT JOIN proyectos p ON la.id_proyecto = p.id_proyecto
        LEFT JOIN empleados e ON la.creado_por_id = e.id_empleado
        ORDER BY la.fecha DESC;
      `;
      console.log("Executing query for /api/lecciones-aprendidas:", query);
      const [lecciones] = await db.execute(query);
      console.log("GET /api/lecciones-aprendidas: Query successful, number of lessons:", lecciones.length);
      res.status(200).json(lecciones);
    } catch (error) {
      console.error("Error in GET /api/lecciones-aprendidas:", error.message, error.stack); // Log sin :area
      next(error);
    }
  }
);

// POST para crear una nueva lección aprendida
app.post(
  "/api/lecciones-aprendidas",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const {
        id_proyecto,
        titulo,
        area_categoria,
        fecha,
        descripcion_situacion,
        descripcion_impacto,
        acciones_correctivas,
        leccion_aprendida_recomendaciones,
        reportado_por,
        tipo_leccion,
      } = req.body;
      const creado_por_id = req.user.id_empleado;

      if (
        !id_proyecto ||
        !titulo ||
        !fecha ||
        !descripcion_situacion ||
        !descripcion_impacto ||
        !acciones_correctivas ||
        !leccion_aprendida_recomendaciones ||
        !tipo_leccion
      ) {
        throw boom.badRequest(
          "Faltan campos requeridos para crear la lección aprendida."
        );
      }

      const [result] = await db.execute(
        `INSERT INTO lecciones_aprendidas (
          id_proyecto, creado_por_id, titulo, area_categoria, fecha, 
          descripcion_situacion, descripcion_impacto, acciones_correctivas, 
          leccion_aprendida_recomendaciones, reportado_por, tipo_leccion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_proyecto,
          creado_por_id,
          titulo,
          area_categoria || null,
          fecha,
          descripcion_situacion,
          descripcion_impacto,
          acciones_correctivas,
          leccion_aprendida_recomendaciones,
          reportado_por || null,
          tipo_leccion,
        ]
      );
      const id_leccion_aprendida = result.insertId;
      res.status(201).json({
        id_leccion_aprendida,
        message: "Lección aprendida creada exitosamente.",
      });
    } catch (error) {
      console.error("Error en POST /api/lecciones-aprendidas:", error);
      next(error);
    }
  }
);

// GET una lección aprendida específica por ID
app.get(
  "/api/lecciones-aprendidas/:id_leccion",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const { id_leccion } = req.params;
      const [leccion] = await db.execute(
        `SELECT 
           la.*, 
           p.nombre_proyecto,
           CONCAT(e.nombres, ' ', e.apellidos) AS nombre_creador
         FROM lecciones_aprendidas la
         LEFT JOIN proyectos p ON la.id_proyecto = p.id_proyecto
         LEFT JOIN empleados e ON la.creado_por_id = e.id_empleado
         WHERE la.id_leccion_aprendida = ?`,
        [id_leccion]
      );
      if (leccion.length === 0) {
        throw boom.notFound("Lección aprendida no encontrada.");
      }
      res.status(200).json(leccion[0]);
    } catch (error) {
      console.error(
        "Error en GET /api/lecciones-aprendidas/:id_leccion:",
        error
      );
      next(error);
    }
  }
);

// PUT para actualizar una lección aprendida
app.put(
  "/api/lecciones-aprendidas/:id_leccion",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const { id_leccion } = req.params;
      const {
        id_proyecto,
        titulo,
        area_categoria,
        fecha,
        descripcion_situacion,
        descripcion_impacto,
        acciones_correctivas,
        leccion_aprendida_recomendaciones,
        reportado_por,
        tipo_leccion,
      } = req.body;
      // const actualizado_por_id = req.user.id_empleado; // Podría usarse si se quiere registrar quién actualizó

      if (
        !id_proyecto ||
        !titulo ||
        !fecha ||
        !descripcion_situacion ||
        !descripcion_impacto ||
        !acciones_correctivas ||
        !leccion_aprendida_recomendaciones ||
        !tipo_leccion
      ) {
        throw boom.badRequest(
          "Faltan campos requeridos para actualizar la lección aprendida."
        );
      }

      const [result] = await db.execute(
        `UPDATE lecciones_aprendidas SET
          id_proyecto = ?, titulo = ?, area_categoria = ?, fecha = ?, 
          descripcion_situacion = ?, descripcion_impacto = ?, acciones_correctivas = ?, 
          leccion_aprendida_recomendaciones = ?, reportado_por = ?, tipo_leccion = ?
        WHERE id_leccion_aprendida = ?`,
        [
          id_proyecto,
          titulo,
          area_categoria || null,
          fecha,
          descripcion_situacion,
          descripcion_impacto,
          acciones_correctivas,
          leccion_aprendida_recomendaciones,
          reportado_por || null,
          tipo_leccion,
          id_leccion,
        ]
      );

      if (result.affectedRows === 0) {
        throw boom.notFound(
          "Lección aprendida no encontrada o sin cambios para actualizar."
        );
      }
      res
        .status(200)
        .json({ message: "Lección aprendida actualizada exitosamente." });
    } catch (error) {
      console.error(
        "Error en PUT /api/lecciones-aprendidas/:id_leccion:",
        error
      );
      next(error);
    }
  }
);

// --- Fin Endpoints Lecciones Aprendidas ---

// --- Endpoint for Home.jsx Project Details ---
app.get(
  "/api/proyectos/:area/:id_proyecto/home-details",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
      return next(boom.badRequest("ID del proyecto inválido o faltante."));
    }

    try {
      const connection = await db.getConnection(); // Get a connection for multiple queries

      try {
        // 1. Project Details
        const [projectRows] = await connection.execute(
          "SELECT id_proyecto, nombre_proyecto, empresa_asociada, progress, status, priority, area FROM proyectos WHERE id_proyecto = ?",
          [id_proyecto]
        );
        if (!projectRows || projectRows.length === 0) {
          return next(boom.notFound("Proyecto no encontrado."));
        }
        const proyecto = projectRows[0];

        // 2. Risk Summary
        const [riskRows] = await connection.execute(
          `SELECT
            COUNT(*) as cant_riesgos,
            SUM(CASE WHEN probabilidad * impacto >= 15 THEN 1 ELSE 0 END) as cant_riesgos_criticos,
            SUM(CASE WHEN probabilidad * impacto >= 8 AND probabilidad * impacto < 15 THEN 1 ELSE 0 END) as cant_riesgos_moderados,
            SUM(CASE WHEN probabilidad * impacto >= 1 AND probabilidad * impacto < 8 THEN 1 ELSE 0 END) as cant_riesgos_leves,
            SUM(CASE WHEN probabilidad IS NULL OR impacto IS NULL OR probabilidad = 0 OR impacto = 0 THEN 1 ELSE 0 END) as cant_riesgos_nulos
          FROM formulario_riesgos
          WHERE id_proyecto = ?`,
          [id_proyecto]
        );
        const risks = riskRows[0] || { cant_riesgos: 0, cant_riesgos_criticos: 0, cant_riesgos_moderados: 0, cant_riesgos_leves: 0, cant_riesgos_nulos: 0 };

        // 3. Form Statuses & Count
        const formStatusQueries = {
          general: "SELECT COUNT(*) as count FROM formulario_general WHERE id_proyecto = ?",
          alcance: "SELECT COUNT(*) as count FROM formulario_alcance WHERE id_proyecto = ?",
          presupuesto: "SELECT COUNT(*) as count FROM formulario_presupuesto WHERE id_proyecto = ?",
          riesgos: "SELECT COUNT(*) as count FROM formulario_riesgos WHERE id_proyecto = ?", // Status based on existence of any risk
          verificacion: "SELECT COUNT(*) as count FROM formulario_verificacion WHERE id_proyecto = ?",
          // 'validacion' and 'controlVersiones' are not in DB schema, will be 'Pendiente'
        };

        const formulariosStatus = {};
        let completedFormsCount = 0;
        const totalFormsToTrack = 6; // general, alcance, presupuesto, riesgos, verificacion, validacion (mock had controlVersiones too)

        for (const formKey in formStatusQueries) {
          const [countRows] = await connection.execute(formStatusQueries[formKey], [id_proyecto]);
          if (countRows[0].count > 0) {
            formulariosStatus[formKey] = "Completado";
            completedFormsCount++;
          } else {
            formulariosStatus[formKey] = "Pendiente";
          }
        }
        // Add forms not in DB as 'Pendiente'
        formulariosStatus.validacion = "Pendiente"; 
        // formulariosStatus.controlVersiones = "Pendiente"; // If tracking this one too

        const formulariosCount = {
          completed: completedFormsCount,
          total: totalFormsToTrack, // Adjust if controlVersiones is also tracked
        };
        
        // 4. Team Members
        const [teamRows] = await connection.execute(
          `SELECT
            pe.id_asignacion_rh, pe.id_proyecto, pe.id_empleado,
            e.nombres, e.apellidos, pe.rol_en_proyecto, pe.responsabilidades, e.foto_empleado
          FROM proyecto_equipo pe
          LEFT JOIN empleados e ON pe.id_empleado = e.id_empleado
          WHERE pe.id_proyecto = ?`,
          [id_proyecto]
        );
        const miembros = teamRows;

        // 5. Lecciones Aprendidas Summary
        const [lessonsCountRows] = await connection.execute(
          "SELECT COUNT(*) as total_lecciones FROM lecciones_aprendidas WHERE id_proyecto = ?",
          [id_proyecto]
        );
        const total_lecciones = lessonsCountRows[0]?.total_lecciones || 0;

        const [recentLessonsRows] = await connection.execute(
          "SELECT titulo, tipo_leccion, fecha FROM lecciones_aprendidas WHERE id_proyecto = ? ORDER BY fecha DESC LIMIT 2",
          [id_proyecto]
        );
        const recent_lessons = recentLessonsRows;

        const lessonsSummary = {
          total_lecciones,
          recent_lessons,
        };

        res.status(200).json({
          proyecto,
          risks,
          formulariosStatus,
          formulariosCount,
          miembros,
          lessonsSummary, // Added lessons summary
        });
      } finally {
        if (connection) connection.release();
      }
    } catch (error) {
      console.error(`Error en GET /api/proyectos/:area/:id_proyecto/home-details:`, error);
      next(error);
    }
  }
);

// --- New File Upload Endpoints as per Guide ---

// Ruta para subir archivo: POST /api/upload/:area/:id_proyecto
// Using 'file' as the field name to match frontend FormularioValidacion.jsx
app.post(
  "/api/upload/:area/:id_proyecto",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  (req, res, next) => {
    // Check if area and id_proyecto were validated by multer's destination function
    if (!req.params.area || !req.params.id_proyecto) {
      // This case should ideally be caught by multer's destination if it returns an error
      return next(
        boom.badRequest("Area or project ID is missing in URL parameters.")
      );
    }

    // Si todo va bien, Multer habrá almacenado el archivo y puesto info en req.file
    if (!req.file) {
      // This might happen if fileFilter rejected the file but didn't throw an error that stops middleware chain,
      // or if no file was sent. Multer errors are usually handled by the error middleware.
      return next(
        boom.badRequest(
          "No se recibió ningún archivo o el tipo de archivo no es permitido."
        )
      );
    }

    // Devolver respuesta de éxito con detalles del archivo
    console.log(
      `File uploaded: ${req.file.filename} to path: ${req.file.destination}`
    );
    res.status(201).json({
      // 201 Created is more appropriate for successful resource creation
      message: "Archivo subido con éxito",
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      // Path for client to access the file via the static route
      path: `/files/${req.params.area}/${req.params.id_proyecto}/${req.file.filename}`,
    });
  }
);

// Ruta para listar archivos en /uploads/:area/:id_proyecto
app.get(
  "/api/files/:area/:id_proyecto",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    const { area, id_proyecto } = req.params;
    if (!area || !id_proyecto) {
      return next(
        boom.badRequest("Area or project ID is missing in URL parameters.")
      );
    }
    const dirPath = path.join(__dirname, "uploads", area, id_proyecto);

    fs.readdir(dirPath, (err, files) => {
      if (err) {
        if (err.code === "ENOENT") {
          // Directory does not exist
          console.log(`Directory not found for listing: ${dirPath}`);
          return res.status(404).json({
            error: "Carpeta no encontrada o sin archivos.",
            files: [],
          });
        }
        console.error(`Error reading directory ${dirPath}:`, err);
        return next(boom.internal("Error al leer la carpeta de archivos."));
      }
      // Devolver array de nombres de archivo existentes
      // Optionally, filter out system files like .DS_Store if necessary
      const filteredFiles = files.filter((file) => !file.startsWith("."));
      res.json({ files: filteredFiles });
    });
  }
);

// --- End New File Upload Endpoints ---

// --- Commenting out Old Formulario Validacion File Upload Endpoints ---
/*
// Endpoint to upload a file for a specific Project's Formulario Validacion
app.post(
  "/api/forms/validacion/:id_proyecto/upload", // Changed param to id_proyecto
  passport.authenticate("jwt", { session: false }),
  upload.single('file'),  // This 'upload' would be the OLD multer instance
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    const id_empleado_uploader = req.user.id_empleado;

    if (!req.file) {
      return next(boom.badRequest('No file uploaded or file type not allowed.'));
    }
    if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
        return next(boom.badRequest('Invalid or missing ID for Project.'));
    }

    try {
      await executeTransaction(async (connection) => {
        const [projectRows] = await connection.execute(
          "SELECT id_proyecto FROM proyectos WHERE id_proyecto = ?",
          [id_proyecto]
        );
        if (!projectRows || projectRows.length === 0) {
          throw boom.notFound("Proyecto no encontrado.");
        }
        let [formValRows] = await connection.execute(
          "SELECT id_proyecto FROM formulario_validacion WHERE id_proyecto = ?",
          [id_proyecto]
        );
        if (!formValRows || formValRows.length === 0) {
          await connection.execute(
            "INSERT INTO formulario_validacion (id_proyecto, creado_por_id, actualizado_por_id) VALUES (?, ?, ?)",
            [id_proyecto, id_empleado_uploader, id_empleado_uploader]
          );
        } else {
           await connection.execute(
            "UPDATE formulario_validacion SET fecha_actualizacion = CURRENT_TIMESTAMP, actualizado_por_id = ? WHERE id_proyecto = ?",
            [id_empleado_uploader, id_proyecto]
          );
        }
        const { originalname, filename: stored_filename, mimetype, size: file_size_bytes } = req.file;
        const file_path_on_server = req.file.path;
        const [result] = await connection.execute(
          `INSERT INTO archivos_formulario_validacion (
            id_formulario_validacion, id_empleado_uploader, original_filename, 
            stored_filename, file_path_on_server, mime_type, file_size_bytes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id_proyecto, 
            id_empleado_uploader,
            originalname,
            stored_filename,
            file_path_on_server,
            mimetype,
            file_size_bytes,
          ]
        );
        res.status(201).json({
          message: "File uploaded and associated with Formulario Validacion successfully!",
          id_archivo: result.insertId,
          id_form_validacion: id_proyecto, 
          original_filename: originalname,
          stored_filename: stored_filename,
          mime_type: mimetype,
          file_size_bytes: file_size_bytes,
        });
      });
    } catch (error) {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (errUnlink) => { // Renamed err to errUnlink
          if (errUnlink) console.error("Error deleting orphaned file after DB error:", errUnlink);
        });
      }
      console.error("Error in file upload for Formulario Validacion:", error);
      next(error);
    }
  }
);

app.get(
  "/api/forms/validacion/:id_proyecto/files", 
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { id_proyecto } = req.params;
    if (!id_proyecto || isNaN(parseInt(id_proyecto))) {
        return next(boom.badRequest('Invalid or missing ID for Project.'));
    }
    try {
      const [formValRows] = await db.execute(
        "SELECT id_proyecto FROM formulario_validacion WHERE id_proyecto = ?",
        [id_proyecto]
      );
      if (!formValRows || formValRows.length === 0) {
        return res.status(200).json([]); 
      }
      const [files] = await db.execute(
        `SELECT id_archivo, id_formulario_validacion, id_empleado_uploader, 
                original_filename, stored_filename, mime_type, file_size_bytes, 
                descripcion_archivo, upload_timestamp 
         FROM archivos_formulario_validacion 
         WHERE id_formulario_validacion = ? AND deleted_timestamp IS NULL`, 
        [id_proyecto]
      );
      res.status(200).json(files);
    } catch (error) {
      console.error("Error fetching files for Formulario Validacion:", error);
      next(error);
    }
  }
);

app.get(
  "/api/files/download/:filename",
  passport.authenticate("jwt", { session: false }), 
  async (req, res, next) => {
    const { filename } = req.params;
    try {
      const [fileRows] = await db.execute(
        "SELECT original_filename, file_path_on_server FROM archivos_formulario_validacion WHERE stored_filename = ? AND deleted_timestamp IS NULL",
        [filename]
      );
      if (!fileRows || fileRows.length === 0) {
        return next(boom.notFound("File not found or access denied."));
      }
      const filePath = fileRows[0].file_path_on_server;
      const originalName = fileRows[0].original_filename;
      if (fs.existsSync(filePath)) {
        res.download(filePath, originalName, (errDownload) => { // Renamed err to errDownload
          if (errDownload) {
            console.error("Error during file download:", errDownload);
            if (!res.headersSent) {
               next(boom.internal('Could not download the file.'));
            }
          }
        });
      } else {
        console.error(`File not found on disk: ${filePath} for stored_filename: ${filename}`);
        return next(boom.notFound("File not found on server disk."));
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      next(error);
    }
  }
);

app.delete(
  "/api/files/:filename",
  passport.authenticate("jwt", { session: false }), 
  async (req, res, next) => {
    const { filename } = req.params;
    // const id_empleado_deleter = req.user.id_empleado; 
    try {
      const [fileRows] = await db.execute(
        "SELECT id_archivo, file_path_on_server, id_empleado_uploader FROM archivos_formulario_validacion WHERE stored_filename = ? AND deleted_timestamp IS NULL",
        [filename]
      );
      if (!fileRows || fileRows.length === 0) {
        return next(boom.notFound("File not found or already deleted."));
      }
      const fileToDelete = fileRows[0];
      if (fs.existsSync(fileToDelete.file_path_on_server)) {
        fs.unlink(fileToDelete.file_path_on_server, async (errUnlink) => { // Renamed err to errUnlink
          if (errUnlink) {
            console.error("Error deleting file from filesystem:", errUnlink);
            return next(boom.internal("Error deleting file from disk."));
          }
          await db.execute("DELETE FROM archivos_formulario_validacion WHERE id_archivo = ?", [fileToDelete.id_archivo]);
          res.status(200).json({ message: "File deleted successfully." });
        });
      } else {
        console.warn(`File not found on disk for deletion: ${fileToDelete.file_path_on_server}, but DB record existed.`);
        await db.execute("DELETE FROM archivos_formulario_validacion WHERE id_archivo = ?", [fileToDelete.id_archivo]);
        res.status(200).json({ message: "File record deleted from database (file not found on disk)." });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      next(error);
    }
  }
);
*/
// --- End Commenting out Old Endpoints ---

app.use((err, req, res, next) => {
  // Handle multer errors specifically for better client feedback
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        boom.badRequest(
          `El archivo es demasiado grande. El tamaño máximo es ${
            MAX_SIZE / 1024 / 1024
          }MB.`
        )
      ); // Use MAX_SIZE
    }
    // For other Multer errors like 'LIMIT_UNEXPECTED_FILE', etc.
    return next(boom.badRequest(err.message || "Error al subir el archivo."));
  } else if (
    err.message.includes("Tipo de archivo no permitido") ||
    err.message.includes("Area or project ID is missing")
  ) {
    // Catch custom errors from fileFilter or destination callback
    return next(boom.badRequest(err.message));
  }

  // Log the full error for server-side debugging, especially if it's not a Boom error
  console.error("Error global no manejado:", err.stack || err.message || err);
  if (boom.isBoom(err)) {
    const { statusCode, payload } = err.output;
    return res.status(statusCode).json(payload);
  }
  // Default to 500 Internal Server Error
  return res.status(500).json({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Ha ocurrido un error inesperado.",
  });
});
