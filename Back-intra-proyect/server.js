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

const db = config.db;
const app = express();

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

app.listen(config.port, () => {
  console.log(`corriendo en puerto ${config.port}`);
});
console.log("hola3 - Server escuchando");

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
      // de no generar loops infinitos), podrías hacerlo aquí:
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

      console.log("hola 4 - Cookie 'accessToken' establecida");
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
    const link = `http://http://localhost:5173/auth/login?token=${recoveryToken}`;
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
    if (!hashedPassword) return; // Detener si el hash falla

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
      const [areas] = await db.execute(
        `SELECT id_area, nombre_area FROM areas`
      );
      const [areasItems] = await db.execute(
        `SELECT nombre_item_navBar, id_area FROM areas_navegacion ORDER BY id_area asc`
      );

      if (!areas) {
        return res
          .status(400)
          .json({ message: "Usuario no encontrado en token" });
      } else {
        console.log("area encontrada para NavBar ", req.user);

        return res.status(200).json({
          status: "success",
          count: areas.length,
          areas: areas,
          areasItems,
        });
      }
      // de no generar loops infinitos), podrías hacerlo aquí:
    } catch (error) {
      console.error("Error en la ruta /api/Projects/:area:", error);
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
    "hola 8 - Cookie 'token' y 'accessToken' eliminada, respuesta enviada"
  );
});

app.post("/api/auth/refresh_token", async (req, res, next) => {
  console.log("Refresh Token Endpoint: Solicitud recibida.");
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      console.log(
        "Refresh token recibida en auth/refresh_token",
        incomingRefreshToken
      );
      return res
        .status(401)
        .json({ message: "No autorizado (falta refresh token)" });
    }
    // Usa el secreto correcto para refresh tokens
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
      // Usa el secreto correcto para access tokens
      const newAccessToken = jwt.sign(newPayload, config.jwtSecret, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      });
      console.log("Refresh Token Endpoint: Emitiendo nuevo access token.");
      // Sintaxis correcta para enviar JSON
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
  "/api/Projects/:area/:id_projects/form/general/fill",
  /* passport.authenticate("jwt", { session: false }), // RECOMENDACIÓN: Habilitar autenticación para seguridad */
  async (req, res, next) => {
    // RECOMENDACIÓN: Considerar usar una conexión individual para manejar transacciones
    // const connection = await db.getConnection(); // Ejemplo si usas un pool como mysql2/promise

    try {
      // await connection.beginTransaction(); // Iniciar transacción

      const { id_projects } = req.params;
      const {
        area_solicitante,
        nombre_solicitante,
        descripcion_solicitud,
        genera_cambio_tipo,
        departamento_interno,
        cliente_final,
        tipo_proyecto, // Puede ser array o string
        nivel_hardware,
        componentes_hardware,
        otro_valor_componentes_hardware,
        nivel_software,
        componentes_software,
        otro_valor_componentes_software,
        entregables,
        requisitos_seguimiento_y_medicion,
        criterios_de_aceptacion,
        consecuencias_por_fallar,
        fecha_inicio_planificada,
        fecha_final_planificada,
        ruta_proyecto_desarrollo,
        ruta_cotizacion,
        aplica_doc_ideas_iniciales,
        aplica_doc_especificaciones,
        aplica_doc_casos_uso,
        aplica_doc_diseno_sistema,
        aplica_doc_plan_pruebas,
        aplica_doc_manuales,
        aplica_doc_liberacion,
        ref_doc_ideas_iniciales,
        ref_doc_especificaciones,
        ref_doc_casos_uso,
        ref_doc_diseno_sistema,
        ref_doc_plan_pruebas,
        ref_doc_manuales,
        ref_doc_liberacion,
        verif_doc_ideas_iniciales,
        verif_doc_especificaciones,
        verif_doc_casos_uso,
        verif_doc_diseno_sistema,
        verif_doc_plan_pruebas,
        verif_doc_manuales,
        verif_doc_liberacion,
        // Asumiendo que creado_por_id para el formulario general viene del usuario autenticado o de otra parte del body
        // creado_por_id_formulario // Ejemplo: req.user.id_empleado si usas Passport
      } = req.body;

      const { equipo } = req.body; // Array de objetos para el equipo del proyecto
      const { compras } = req.body; // Array de objetos para las compras del proyecto

      // --- INSERCIÓN EN formulario_general ---

      // Convertir arrays a cadenas (ej: checkboxes para tipo_proyecto)
      const tipo_proyecto_str = Array.isArray(tipo_proyecto)
        ? tipo_proyecto.join(",")
        : tipo_proyecto;

      const sqlFormularioGeneral = `INSERT INTO formulario_general (
        id_proyecto, area_solicitante, nombre_solicitante, descripcion_solicitud,
        genera_cambio_tipo, tipo_proyecto, nivel_hardware, componentes_hardware,
        otro_valor_componentes_hardware, nivel_software, componentes_software,
        otro_valor_componentes_software, entregables, requisitos_seguimiento_y_medicion,
        criterios_de_aceptacion, consecuencias_por_fallar, fecha_inicio_planificada,
        fecha_final_planificada, departamento_interno, cliente_final, 
        ruta_proyecto_desarrollo, ruta_cotizacion, aplica_doc_ideas_iniciales,
        aplica_doc_especificaciones, aplica_doc_casos_uso, aplica_doc_diseno_sistema,
        aplica_doc_plan_pruebas, aplica_doc_manuales, aplica_doc_liberacion,
        ref_doc_ideas_iniciales, ref_doc_especificaciones, ref_doc_casos_uso,
        ref_doc_diseno_sistema, ref_doc_plan_pruebas, ref_doc_manuales, ref_doc_liberacion,
        verif_doc_ideas_iniciales, verif_doc_especificaciones, verif_doc_casos_uso,
        verif_doc_diseno_sistema, verif_doc_plan_pruebas, verif_doc_manuales, 
        verif_doc_liberacion 
        // , creado_por_id -- Si tienes esta columna en formulario_general
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      // El número de '?' debe coincidir con el número de columnas (43 en tu ejemplo original)

      const valuesFormularioGeneral = [
        id_projects,
        area_solicitante == "" ? null : area_solicitante,
        nombre_solicitante == "" ? null : nombre_solicitante,
        descripcion_solicitud == "" ? null : descripcion_solicitud,
        genera_cambio_tipo == "" ? null : genera_cambio_tipo,
        tipo_proyecto_str == "" ? null : tipo_proyecto_str,
        nivel_hardware == "" ? null : nivel_hardware,
        componentes_hardware == "" ? null : componentes_hardware,
        otro_valor_componentes_hardware == ""
          ? null
          : otro_valor_componentes_hardware,
        nivel_software == "" ? null : nivel_software,
        componentes_software == "" ? null : componentes_software,
        otro_valor_componentes_software == ""
          ? null
          : otro_valor_componentes_software,
        entregables == "" ? null : entregables,
        requisitos_seguimiento_y_medicion == ""
          ? null
          : requisitos_seguimiento_y_medicion,
        criterios_de_aceptacion == "" ? null : criterios_de_aceptacion,
        consecuencias_por_fallar == "" ? null : consecuencias_por_fallar,
        fecha_inicio_planificada == "" || fecha_inicio_planificada === undefined
          ? null
          : fecha_inicio_planificada,
        fecha_final_planificada == "" || fecha_final_planificada === undefined
          ? null
          : fecha_final_planificada,
        departamento_interno == "" ? null : departamento_interno,
        cliente_final == "" ? null : cliente_final,
        ruta_proyecto_desarrollo == "" ? null : ruta_proyecto_desarrollo,
        ruta_cotizacion == "" ? null : ruta_cotizacion,
        aplica_doc_ideas_iniciales, // Estos parecen ser booleanos o valores que no deben ser null si son string vacíos
        aplica_doc_especificaciones,
        aplica_doc_casos_uso,
        aplica_doc_diseno_sistema,
        aplica_doc_plan_pruebas,
        aplica_doc_manuales,
        aplica_doc_liberacion,
        ref_doc_ideas_iniciales == "" ? null : ref_doc_ideas_iniciales,
        ref_doc_especificaciones == "" ? null : ref_doc_especificaciones,
        ref_doc_casos_uso == "" ? null : ref_doc_casos_uso,
        ref_doc_diseno_sistema == "" ? null : ref_doc_diseno_sistema,
        ref_doc_plan_pruebas == "" ? null : ref_doc_plan_pruebas,
        ref_doc_manuales == "" ? null : ref_doc_manuales,
        ref_doc_liberacion == "" ? null : ref_doc_liberacion,
        verif_doc_ideas_iniciales == "" ? null : verif_doc_ideas_iniciales,
        verif_doc_especificaciones == "" ? null : verif_doc_especificaciones,
        verif_doc_casos_uso == "" ? null : verif_doc_casos_uso,
        verif_doc_diseno_sistema == "" ? null : verif_doc_diseno_sistema,
        verif_doc_plan_pruebas == "" ? null : verif_doc_plan_pruebas,
        verif_doc_manuales == "" ? null : verif_doc_manuales,
        verif_doc_liberacion == "" ? null : verif_doc_liberacion,
        // creado_por_id_formulario, // Si lo añades
      ];

      console.log(
        `Formulario General - Columnas: ${
          sqlFormularioGeneral.match(/\?/g).length
        }, Valores: ${valuesFormularioGeneral.length}`
      );

      // RECOMENDACIÓN: Usar connection.execute si estás en una transacción
      const [resultFormulario] = await db.execute(
        sqlFormularioGeneral,
        valuesFormularioGeneral
      );
      // const [resultFormulario] = await connection.execute(sqlFormularioGeneral, valuesFormularioGeneral);

      // --- INSERCIÓN EN proyecto_equipo (Ejemplo, necesita completarse) ---
      /* if (equipo && Array.isArray(equipo) && equipo.length > 0) {
        const sqlEquipo = `INSERT INTO proyecto_equipo (id_proyecto, id_empleado, nombre_asignado, rol_en_proyecto, responsabilidades) VALUES (?, ?, ?, ?, ?);`;
        // NOTA: La columna "nombre asignado" en tu SQL original tiene un espacio. Debería ser "nombre_asignado" o estar entre comillas invertidas si el nombre es así.
        //       Además, la consulta original estaba incompleta (faltaba VALUES y los parámetros).
        console.warn(
          "La lógica de inserción para 'proyecto_equipo' aún necesita ser implementada y verificada."
        );
        for (const miembro of equipo) {
          const equipoValues = [
            id_projects,
            miembro.id_empleado,
            (`SELECT nombres, aprellidos FROM empleados WHERE id_empleado = ?`, miembro.id_empleado).join(" "), // Asegúrate que estos campos vengan en el objeto 'miembro'
            miembro.rol_en_proyecto,
            miembro.responsabilidades
          ];
          await connection.execute(sqlEquipo, equipoValues);
        }
      }

      // --- INSERCIÓN EN compras_proyecto_items ---
      let comprasRegistradasExitosamente = 0;
      if (compras && Array.isArray(compras) && compras.length > 0) {
        const sqlCompra = `
          INSERT INTO compras_proyecto_items (
              id_proyecto, creado_por_id, proveedor, descripcion, cantidad,
              unidad_medida, total_usd, total_cop, orden_compra, estado_compra
              -- fecha_solicitud y fecha_estado tienen DEFAULT en la BD
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        for (const compra of compras) {
          // RECOMENDACIÓN: Validar cada 'compra' aquí antes de intentar insertar.
          // Por ejemplo, verificar que los campos numéricos sean realmente números.
          const cantidad = parseFloat(compra.cantidad);
          const total_usd = parseFloat(compra.total_usd);
          const total_cop = parseFloat(compra.total_cop);

          const compraValues = [
            id_projects, // id_proyecto de la URL
            compra.creado_por_id === undefined ||
            compra.creado_por_id === "" ||
            compra.creado_por_id === null
              ? null
              : parseInt(compra.creado_por_id), // Asume que 'creado_por_id' viene en cada objeto 'compra' y es un ID de empleado.
            compra.proveedor === undefined || compra.proveedor === ""
              ? null
              : compra.proveedor,
            compra.descripcion === undefined || compra.descripcion === ""
              ? null
              : compra.descripcion,
            isNaN(cantidad) ? null : cantidad, // Si no es un número válido, inserta NULL. Considera el DEFAULT 1.00 de tu tabla.
            compra.unidad_medida === undefined || compra.unidad_medida === ""
              ? null
              : compra.unidad_medida,
            isNaN(total_usd) ? null : total_usd,
            isNaN(total_cop) ? null : total_cop,
            compra.orden_compra === undefined || compra.orden_compra === ""
              ? null
              : compra.orden_compra,
            compra.estado_compra || "Solicitado", // Usa el default 'Solicitado' si no se provee o es string vacío.
          ];

          console.log(
            `Compra Item - Columnas: ${
              sqlCompra.match(/\?/g).length
            }, Valores: ${compraValues.length}`
          );

          // RECOMENDACIÓN: Usar connection.execute si estás en una transacción
          const [resultCompra] = await db.execute(sqlCompra, compraValues);
          // const [resultCompra] = await connection.execute(sqlCompra, compraValues);
          if (resultCompra.affectedRows > 0) {
            comprasRegistradasExitosamente++;
          }
        }
        console.log(
          `${comprasRegistradasExitosamente} de ${compras.length} items de compra registrados para el proyecto ${id_projects}`
        );
      } */

      if (resultFormulario.affectedRows > 0) {
        // await connection.commit(); // Confirmar transacción si todo salió bien
        console.log(`Formulario del proyecto ${id_projects} registrado.`);
        // Podrías agregar más detalles al mensaje, como cuántas compras se registraron.
        return res.status(200).json({
          message: "Datos registrados exitosamente",
          id_proyecto: id_projects,
          compras_registradas: comprasRegistradasExitosamente,
        });
      }

      // Si llegamos aquí, el formulario principal no se insertó.
      // await connection.rollback(); // Revertir transacción
      return res.status(400).json({
        error: "No se pudieron registrar los datos del formulario principal",
      });
    } catch (error) {
      // if (connection) await connection.rollback(); // Revertir transacción en caso de error
      console.error("Error en la ruta /api/Projects/.../fill:", error);
      // RECOMENDACIÓN: No exponer detalles internos del error al cliente en producción.
      // Grabar el error en un log más detallado en el servidor.
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    } finally {
      // if (connection) connection.release(); // Liberar la conexión al pool
    }
  }
);



app.post(
  "/api/Projects/:area/:id_projects/form/alcance/fill",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const id_proyecto = req.params.id_projects;

      const {
        problema_necesidad,
        entorno_actores,
        procedimiento_actual,
        comportamiento_esperado,
        descripcion_cuantitativa,
        limitaciones,
        otros_temas_relevantes,
      } = req.body;

      const values = [
        id_proyecto,
        descripcion_cuantitativa,
        comportamiento_esperado,
        otros_temas_relevantes,
        procedimiento_actual,
        problema_necesidad,
        entorno_actores,
        limitaciones,
      ];

      const [result] = await db.execute(
        "INSERT INTO formulario_alcance(id_proyecto, descripcion_cuantitativa, comportamiento_esperado, otros_temas_relevantes, procedimiento_actual, problema_necesidad, entorno_actores, limitaciones) VALUES (?,?,?,?,?,?,?,?)",
        values
      );
      console.log("Resultado de la consulta de ingreso de datos", result);

      if (result && result.affectedRows > 0) {
        // **CORRECCIÓN 4: Corregir/eliminar variable 'correo' indefinida**
        console.log(
          `Datos del formulario de alcance para el proyecto ${id_proyecto} registrados exitosamente.`
        );
        // Envía una respuesta JSON exitosa
        res
          .status(200)
          .json({ message: "Datos del formulario registrados correctamente." });
      } else {
        // Esto podría ocurrir si el id_proyecto no existe en la tabla 'proyectos' (violación de FK)
        // o si por alguna razón la inserción no afectó filas.
        console.warn(
          `No se insertaron filas para el proyecto ${id_proyecto}. Resultado:`,
          result
        );
        // Considera un código de estado diferente si la inserción falló lógicamente
        return res.status(400).json({
          error: "No se pudieron registrar los datos del formulario.",
        });
      }
    } catch (error) {
      console.error("Error en la ruta AAAAAAAAAAAA", error);
      res.status(500).json({ error: "Error en la base de datos" });
      next(error);
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
