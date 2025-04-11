"use client";

import { useState } from "react";
import {
  FaRegLightbulb,
  FaClipboardList,
  FaUserTie,
  FaUsers,
  FaShoppingCart,
  FaFolderOpen,
  FaChartLine,
} from "react-icons/fa";
import "./FormularioGeneral.css";

const FormularioGeneral = () => {
  const [activeSection, setActiveSection] = useState(1);
  const [formData, setFormData] = useState({
    // Sección 1
    area: "",
    descripcionGeneral: "",
    tipoCambio: "estandar",

    // Sección 2
    nombreProyecto: "",
    tipoProyecto: "",
    opciones: {
      web: false,
      escritorio: false,
      servidor: false,
      movil: false,
      pcb: false,
      sistemaEmbebido: false,
      hardware: false,
      software: false,
      otro1: "",
      otro2: "",
    },
    nivel: "",
    entregables: "",
    requisitos: "",
    criterios: "",
    consecuencias: "",
    fechaInicio: "",
    fechaFin: "",
    tiempoTotal: "",
    recurrente: false,

    // Sección 3
    departamentoInterno: "",
    clienteFinal: "",
    nombreCliente: "",
    telefonoCliente: "",
    fechaAprobacion: "",

    // Sección 4
    recursosHumanos: [{ nombre: "", responsabilidades: "", verificado: false }],

    // Sección 5
    compras: [
      {
        proveedor: "",
        descripcion: "",
        cantidad: "",
        totalUSD: "",
        totalCOP: "",
        oc: "",
        estado: "",
      },
    ],

    // Sección 6
    rutaProyecto: "",
    rutaCotizacion: "",
    documentos: {
      ideasIniciales: false,
      especificaciones: false,
      casosUso: false,
      disenoSistema: false,
      planPruebas: false,
      manuales: false,
      liberacionProducto: false,
    },

    // Sección 7
    etapa: "",
    porcentaje: 0,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleRecursoHumanoChange = (index, field, value) => {
    const newRecursosHumanos = [...formData.recursosHumanos];
    newRecursosHumanos[index][field] = value;
    setFormData({
      ...formData,
      recursosHumanos: newRecursosHumanos,
    });
  };

  const addRecursoHumano = () => {
    setFormData({
      ...formData,
      recursosHumanos: [
        ...formData.recursosHumanos,
        { nombre: "", responsabilidades: "", verificado: false },
      ],
    });
  };

  const removeRecursoHumano = (index) => {
    const newRecursosHumanos = [...formData.recursosHumanos];
    newRecursosHumanos.splice(index, 1);
    setFormData({
      ...formData,
      recursosHumanos: newRecursosHumanos,
    });
  };

  const handleCompraChange = (index, field, value) => {
    const newCompras = [...formData.compras];
    newCompras[index][field] = value;
    setFormData({
      ...formData,
      compras: newCompras,
    });
  };

  const addCompra = () => {
    setFormData({
      ...formData,
      compras: [
        ...formData.compras,
        {
          proveedor: "",
          descripcion: "",
          cantidad: "",
          totalUSD: "",
          totalCOP: "",
          oc: "",
          estado: "",
        },
      ],
    });
  };

  const removeCompra = (index) => {
    const newCompras = [...formData.compras];
    newCompras.splice(index, 1);
    setFormData({
      ...formData,
      compras: newCompras,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    // Aquí iría la lógica para enviar el formulario
  };

  const nextSection = () => {
    if (activeSection < 7) {
      setActiveSection(activeSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevSection = () => {
    if (activeSection > 1) {
      setActiveSection(activeSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToSection = (section) => {
    setActiveSection(section);
    window.scrollTo(0, 0);
  };

  return (
    <div className="project-planning-container">
      <div className="form-header">
        <h1>Planeación y Control de Proyectos I+D+i</h1>
        <div className="form-code">Código: F.INV.046-3</div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${(activeSection / 7) * 100}%` }}
          ></div>
        </div>
        <div className="progress-steps">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div
              key={step}
              className={`progress-step ${
                activeSection >= step ? "active" : ""
              } ${activeSection === step ? "current" : ""}`}
              onClick={() => goToSection(step)}
            >
              {step === 1 && <FaRegLightbulb />}
              {step === 2 && <FaClipboardList />}
              {step === 3 && <FaUserTie />}
              {step === 4 && <FaUsers />}
              {step === 5 && <FaShoppingCart />}
              {step === 6 && <FaFolderOpen />}
              {step === 7 && <FaChartLine />}
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="project-planning-form">
        {/* Sección 1: Información general de la solicitud */}
        {activeSection === 1 && (
          <div className="form-section">
            <div className="section-header">
              <FaRegLightbulb className="section-icon" />
              <h2>1. Información general de la solicitud</h2>
            </div>

            <div className="form-group">
              <label htmlFor="area">Área</label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Ingrese el área"
              />
            </div>

            <div className="form-group">
              <label htmlFor="descripcionGeneral">
                Descripción General de la solicitud
              </label>
              <textarea
                id="descripcionGeneral"
                name="descripcionGeneral"
                value={formData.descripcionGeneral}
                onChange={handleChange}
                placeholder="Describa la solicitud"
                rows="4"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Genera cambio de tipo:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="tipoCambio"
                    value="estandar"
                    checked={formData.tipoCambio === "estandar"}
                    onChange={handleChange}
                  />
                  <span className="radio-custom"></span>
                  Estándar
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="tipoCambio"
                    value="emergencia"
                    checked={formData.tipoCambio === "emergencia"}
                    onChange={handleChange}
                  />
                  <span className="radio-custom"></span>
                  De emergencia
                </label>
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" onClick={nextSection} className="btn-next">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 2: Información general del Requerimiento */}
        {activeSection === 2 && (
          <div className="form-section">
            <div className="section-header">
              <FaClipboardList className="section-icon" />
              <h2>2. Información general del Requerimiento</h2>
            </div>

            <div className="form-group">
              <label htmlFor="nombreProyecto">Nombre de Proyecto</label>
              <input
                type="text"
                id="nombreProyecto"
                name="nombreProyecto"
                value={formData.nombreProyecto}
                onChange={handleChange}
                placeholder="Ingrese el nombre del proyecto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipoProyecto">Tipo de Proyecto</label>
              <input
                type="text"
                id="tipoProyecto"
                name="tipoProyecto"
                value={formData.tipoProyecto}
                onChange={handleChange}
                placeholder="Ingrese el tipo de proyecto"
              />
            </div>

            <div className="form-group">
              <label>Seleccionar las opciones que apliquen</label>
              <div className="checkbox-grid">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.web"
                    checked={formData.opciones.web}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Web
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.escritorio"
                    checked={formData.opciones.escritorio}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Escritorio
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.servidor"
                    checked={formData.opciones.servidor}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Servidor
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.movil"
                    checked={formData.opciones.movil}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Móvil
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.pcb"
                    checked={formData.opciones.pcb}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  PCB
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.sistemaEmbebido"
                    checked={formData.opciones.sistemaEmbebido}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Sistema Embebido
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.hardware"
                    checked={formData.opciones.hardware}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Hardware
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opciones.software"
                    checked={formData.opciones.software}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Software
                </label>
              </div>
              <div className="other-options">
                <div className="form-group">
                  <label htmlFor="otro1">Otro:</label>
                  <input
                    type="text"
                    id="otro1"
                    name="opciones.otro1"
                    value={formData.opciones.otro1}
                    onChange={handleChange}
                    placeholder="Especifique"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="otro2">Otro:</label>
                  <input
                    type="text"
                    id="otro2"
                    name="opciones.otro2"
                    value={formData.opciones.otro2}
                    onChange={handleChange}
                    placeholder="Especifique"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Nivel</label>
              <div className="level-selector">
                <div
                  className={`level-option ${
                    formData.nivel === "1" ? "selected" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, nivel: "1" })}
                >
                  1
                </div>
                <div
                  className={`level-option ${
                    formData.nivel === "2" ? "selected" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, nivel: "2" })}
                >
                  2
                </div>
                <div
                  className={`level-option ${
                    formData.nivel === "3" ? "selected" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, nivel: "3" })}
                >
                  3
                </div>
                <div
                  className={`level-option ${
                    formData.nivel === "4" ? "selected" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, nivel: "4" })}
                >
                  4
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="entregables">Entregables</label>
              <textarea
                id="entregables"
                name="entregables"
                value={formData.entregables}
                onChange={handleChange}
                placeholder="Producto Hardware, Producto Software y/o Documentación"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="requisitos">
                Requisitos de Seguimiento y Medición
              </label>
              <textarea
                id="requisitos"
                name="requisitos"
                value={formData.requisitos}
                onChange={handleChange}
                placeholder="Definición de indicadores para el proyecto"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="criterios">Criterios de Aceptación</label>
              <textarea
                id="criterios"
                name="criterios"
                value={formData.criterios}
                onChange={handleChange}
                placeholder="Definición de criterios de aceptación para la liberación del proyecto"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="consecuencias">
                Posibles consecuencias al Fallar
              </label>
              <textarea
                id="consecuencias"
                name="consecuencias"
                value={formData.consecuencias}
                onChange={handleChange}
                placeholder="Definición de posibles consecuencias al fallar en el desarrollo del producto (pólizas, clausulas, acuerdos con cliente)"
                rows="3"
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fechaInicio">Fecha Inicio</label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fechaFin">Fecha Fin</label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tiempoTotal">Tiempo Total</label>
                <input
                  type="text"
                  id="tiempoTotal"
                  name="tiempoTotal"
                  value={formData.tiempoTotal}
                  onChange={handleChange}
                  placeholder="Ej: 3 meses"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="recurrente"
                  checked={formData.recurrente}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                Recurrente
              </label>
            </div>

            <div className="form-navigation">
              <button type="button" onClick={prevSection} className="btn-prev">
                Anterior
              </button>
              <button type="button" onClick={nextSection} className="btn-next">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 3: Información del Cliente */}
        {activeSection === 3 && (
          <div className="form-section">
            <div className="section-header">
              <FaUserTie className="section-icon" />
              <h2>3. Información del Cliente</h2>
            </div>

            <div className="form-group">
              <label htmlFor="departamentoInterno">Departamento Interno</label>
              <input
                type="text"
                id="departamentoInterno"
                name="departamentoInterno"
                value={formData.departamentoInterno}
                onChange={handleChange}
                placeholder="Ingrese el departamento interno"
              />
            </div>

            <div className="form-group">
              <label htmlFor="clienteFinal">Cliente Final (Externo)</label>
              <input
                type="text"
                id="clienteFinal"
                name="clienteFinal"
                value={formData.clienteFinal}
                onChange={handleChange}
                placeholder="Ingrese el cliente final"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombreCliente">Nombre</label>
                <input
                  type="text"
                  id="nombreCliente"
                  name="nombreCliente"
                  value={formData.nombreCliente}
                  onChange={handleChange}
                  placeholder="Nombre del contacto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefonoCliente">Teléfono</label>
                <input
                  type="text"
                  id="telefonoCliente"
                  name="telefonoCliente"
                  value={formData.telefonoCliente}
                  onChange={handleChange}
                  placeholder="Teléfono del contacto"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fechaAprobacion">Fecha de Aprobación</label>
              <input
                type="date"
                id="fechaAprobacion"
                name="fechaAprobacion"
                value={formData.fechaAprobacion}
                onChange={handleChange}
              />
            </div>

            <div className="form-navigation">
              <button type="button" onClick={prevSection} className="btn-prev">
                Anterior
              </button>
              <button type="button" onClick={nextSection} className="btn-next">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 4: Recursos Humanos */}
        {activeSection === 4 && (
          <div className="form-section">
            <div className="section-header">
              <FaUsers className="section-icon" />
              <h2>4. Recursos Humanos</h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Responsabilidades</th>
                    <th>Verificado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.recursosHumanos.map((recurso, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          value={recurso.nombre}
                          onChange={(e) =>
                            handleRecursoHumanoChange(
                              index,
                              "nombre",
                              e.target.value
                            )
                          }
                          placeholder="Nombre"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={recurso.responsabilidades}
                          onChange={(e) =>
                            handleRecursoHumanoChange(
                              index,
                              "responsabilidades",
                              e.target.value
                            )
                          }
                          placeholder="Responsabilidades"
                        />
                      </td>
                      <td className="center-cell">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={recurso.verificado}
                            onChange={(e) =>
                              handleRecursoHumanoChange(
                                index,
                                "verificado",
                                e.target.checked
                              )
                            }
                          />
                          <span className="checkbox-custom"></span>
                        </label>
                      </td>
                      <td className="center-cell">
                        {formData.recursosHumanos.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeRecursoHumano(index)}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn-add"
              onClick={addRecursoHumano}
            >
              + Agregar Recurso Humano
            </button>

            <div className="form-navigation">
              <button type="button" onClick={prevSection} className="btn-prev">
                Anterior
              </button>
              <button type="button" onClick={nextSection} className="btn-next">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 5: Proceso de Compras */}
        {activeSection === 5 && (
          <div className="form-section">
            <div className="section-header">
              <FaShoppingCart className="section-icon" />
              <h2>5. Proceso de Compras</h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Total USD</th>
                    <th>Total COP</th>
                    <th>OC</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.compras.map((compra, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          value={compra.proveedor}
                          onChange={(e) =>
                            handleCompraChange(
                              index,
                              "proveedor",
                              e.target.value
                            )
                          }
                          placeholder="Proveedor"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={compra.descripcion}
                          onChange={(e) =>
                            handleCompraChange(
                              index,
                              "descripcion",
                              e.target.value
                            )
                          }
                          placeholder="Descripción"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={compra.cantidad}
                          onChange={(e) =>
                            handleCompraChange(
                              index,
                              "cantidad",
                              e.target.value
                            )
                          }
                          placeholder="Cant."
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={compra.totalUSD}
                          onChange={(e) =>
                            handleCompraChange(
                              index,
                              "totalUSD",
                              e.target.value
                            )
                          }
                          placeholder="USD"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={compra.totalCOP}
                          onChange={(e) =>
                            handleCompraChange(
                              index,
                              "totalCOP",
                              e.target.value
                            )
                          }
                          placeholder="COP"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={compra.oc}
                          onChange={(e) =>
                            handleCompraChange(index, "oc", e.target.value)
                          }
                          placeholder="OC"
                        />
                      </td>
                      <td>
                        <select
                          value={compra.estado}
                          onChange={(e) =>
                            handleCompraChange(index, "estado", e.target.value)
                          }
                        >
                          <option value="">Seleccionar</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="rechazado">Rechazado</option>
                          <option value="completado">Completado</option>
                        </select>
                      </td>
                      <td className="center-cell">
                        {formData.compras.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeCompra(index)}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn-add" onClick={addCompra}>
              + Agregar Compra
            </button>

            <div className="form-navigation">
              <button type="button" onClick={prevSection} className="btn-prev">
                Anterior
              </button>
              <button type="button" onClick={nextSection} className="btn-next">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 6: Gestión Documental */}
        {activeSection === 6 && (
          <div className="form-section">
            <div className="section-header">
              <FaFolderOpen className="section-icon" />
              <h2>6. Gestión Documental</h2>
            </div>

            <div className="form-group">
              <label htmlFor="rutaProyecto">Ruta Proyecto de Desarrollo</label>
              <input
                type="text"
                id="rutaProyecto"
                name="rutaProyecto"
                value={formData.rutaProyecto}
                onChange={handleChange}
                placeholder="Ingrese la ruta del proyecto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rutaCotizacion">Ruta Cotización</label>
              <input
                type="text"
                id="rutaCotizacion"
                name="rutaCotizacion"
                value={formData.rutaCotizacion}
                onChange={handleChange}
                placeholder="Ingrese la ruta de la cotización"
              />
            </div>

            <div className="form-group">
              <label>Documentos Aplicables</label>
              <div className="document-checklist">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.ideasIniciales"
                    checked={formData.documentos.ideasIniciales}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Documento de Ideas Iniciales
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.especificaciones"
                    checked={formData.documentos.especificaciones}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Documento de Especificaciones
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.casosUso"
                    checked={formData.documentos.casosUso}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Especificación de Casos de Uso
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.disenoSistema"
                    checked={formData.documentos.disenoSistema}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Documento de Diseño del Sistema
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.planPruebas"
                    checked={formData.documentos.planPruebas}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Plan de Pruebas
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.manuales"
                    checked={formData.documentos.manuales}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Manuales
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="documentos.liberacionProducto"
                    checked={formData.documentos.liberacionProducto}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  Liberación de Producto
                </label>
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" onClick={prevSection} className="btn-prev">
                Anterior
              </button>
              <button type="button" onClick={nextSection} className="btn-next">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Sección 7: Estado actual del Proyecto */}
        {activeSection === 7 && (
          <div className="form-section">
            <div className="section-header">
              <FaChartLine className="section-icon" />
              <h2>7. Estado actual del Proyecto</h2>
            </div>

            <div className="form-group">
              <label htmlFor="etapa">Etapa</label>
              <select
                id="etapa"
                name="etapa"
                value={formData.etapa}
                onChange={handleChange}
              >
                <option value="">Seleccionar etapa</option>
                <option value="planificacion">Planificación</option>
                <option value="analisis">Análisis</option>
                <option value="diseno">Diseño</option>
                <option value="desarrollo">Desarrollo</option>
                <option value="pruebas">Pruebas</option>
                <option value="implementacion">Implementación</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="porcentaje">
                Porcentaje de avance: {formData.porcentaje}%
              </label>
              <input
                type="range"
                id="porcentaje"
                name="porcentaje"
                min="0"
                max="100"
                value={formData.porcentaje}
                onChange={handleChange}
                className="progress-slider"
              />
              <div className="progress-indicator">
                <div
                  className="progress-bar"
                  style={{ width: `${formData.porcentaje}%` }}
                ></div>
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" onClick={prevSection} className="btn-prev">
                Anterior
              </button>
              <button type="submit" className="btn-submit">
                Guardar Proyecto
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export { FormularioGeneral };
