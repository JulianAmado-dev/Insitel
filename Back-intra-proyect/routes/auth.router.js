const express = require("express");
const router = express.Router();

router.get("/login", async (req, res, next) => {
  const { email, contrasena } = req.body;
  const values = [email, contrasena];
  /* const hashedPassword = bcrypt.hash(values[1], 10, (err,hash) => {
     if (err) throw err;
     console.log("hash generado:", hash)
   }) */
  try {
    const [result] = await db.execute(
      "SELECT * FROM empleados WHERE correo=?",
      [values[0]]
    );

    if (!result) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    } else {
      user = result[0];
      bcrypt.compare(values[1], user.contrasena, (err, isMatch) => {
        if (isMatch) {
          delete user.contrasena;
          res.status(200).json(user);
        } else {
          res.status(400).json("contraseña incorrecta");
        }
      });
    }
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).send({ error: "Error en la consulta" });
  }
});

module.exports = router;
