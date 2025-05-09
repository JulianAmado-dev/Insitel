import { Route, Routes } from "react-router-dom";
import { Home } from "@forms/pages/Home.jsx";
import { FormularioGeneral } from "@forms/pages/FormularioGeneral/FormularioGeneral.jsx";
import { FormularioAlcance } from "@forms/pages/FormularioAlcance/FormularioAlcance.jsx";

const FormsRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/form/general" element={<FormularioGeneral/>} />
    <Route path="/form/alcance" element={<FormularioAlcance />} />
    {/* <Route path="/:id_proyecto/form/presupuesto" element={<PresupuestoForm />} />
    <Route path="/:id_proyecto/form/riesgos" element={<RiesgosForm />} />
    <Route path="/:id_proyecto/form/verificacion" element={<VerificacionForm />} /> */}
  </Routes>
);

export { FormsRoutes };
