import nodemailer from "nodemailer";
import { config } from "../../../config/config.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: config.emailMailer,
    pass: config.appPassword,
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function resetPassword(correo, link) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"noreply@insitel.com" <${config.emailMailer}>`, // sender address
    to: correo || config.emailMailer, // list of receivers
    subject: "Correo de restablecimiento de contraseña", // Subject line
    html: `<b>Ingresa al siguiente link para restablecer contraseña => ${link}</b>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

export { resetPassword };
