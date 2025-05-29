import { Route, Routes } from "react-router-dom";
import { Home } from "@forms/pages/Home.jsx";
import { FormularioGeneral } from "@forms/pages/FormularioGeneral/FormularioGeneral.jsx";
import { FormularioAlcance } from "@forms/pages/FormularioAlcance/FormularioAlcance.jsx";
import { FormularioPresupuesto } from "@forms/pages/FormularioPresupuesto/FormularioPresupuesto.jsx";
import { FormularioVerificacion } from "@forms/pages/FormularioVerificacion/FormularioVerificacion.jsx";
import { FormularioValidacion } from "@forms/pages/FormularioValidacion/FormularioValidacion.jsx";
const FormsRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/form/general" element={<FormularioGeneral />} />
    <Route path="/form/alcance" element={<FormularioAlcance />} />
    <Route path="/form/presupuesto" element={<FormularioPresupuesto />} />
    <Route path="/form/verificacion" element={<FormularioVerificacion />} />
    <Route path="/form/validacion" element={<FormularioValidacion />} />
    {/* <Route path="/:id_proyecto/form/riesgos" element={<RiesgosForm />} /> */}
  </Routes>
);

export { FormsRoutes };
