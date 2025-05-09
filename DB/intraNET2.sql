-- ======================================================================
-- Script para crear la Base de Datos intraNet_DB
-- Versión: 3.0 (Final Revisada)
-- Autor: JulianAmado-dev (formateado por IA)
-- Fecha: 2025-04-21
-- ======================================================================

-- Crear la base de datos si no existe, con codificación recomendada
CREATE DATABASE IF NOT EXISTS `intraNet_DB` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE `intraNet_DB`;

-- ======================================================================
-- Eliminación de Tablas (Orden Inverso de Dependencias)
-- ======================================================================
DROP TABLE IF EXISTS `proyecto_compras`; -- Renombrada desde general_proceso_compras
DROP TABLE IF EXISTS `proyecto_equipo`; -- Renombrada desde general_rh
DROP TABLE IF EXISTS `datos_form_control_versiones`;
DROP TABLE IF EXISTS `formulario_general`;
DROP TABLE IF EXISTS `formulario_alcance`;
DROP TABLE IF EXISTS `presupuesto_servicios`;
DROP TABLE IF EXISTS `presupuesto_suministros`;
DROP TABLE IF EXISTS `presupuesto_rh`;
DROP TABLE IF EXISTS `formulario_presupuesto`;
DROP TABLE IF EXISTS `formulario_riesgos`;
DROP TABLE IF EXISTS `verificacion_cumplimiento_requerimientos`; -- Renombrada
DROP TABLE IF EXISTS `registro_verificacion_aprobacion`;
DROP TABLE IF EXISTS `formulario_verificacion`;
DROP TABLE IF EXISTS `formularios_proyectos`;
DROP TABLE IF EXISTS `empleados_proyectos`;
DROP TABLE IF EXISTS `formularios`;
DROP TABLE IF EXISTS `proyectos`;
DROP TABLE IF EXISTS `areas`; -- Tabla catálogo
DROP TABLE IF EXISTS `roles`; -- Tabla catálogo
DROP TABLE IF EXISTS `empleados`;

-- ======================================================================
-- Tablas Catálogo (Lookup Tables)
-- ======================================================================

-- Tabla de Roles del Sistema
CREATE TABLE `intraNet_DB`.`roles` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre_rol` VARCHAR(50) NOT NULL, -- Más corto es suficiente?
  `descripcion` TEXT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE INDEX `nombre_rol_UNIQUE` (`nombre_rol` ASC) VISIBLE
) ENGINE=InnoDB COMMENT='Catálogo de roles de usuario en el sistema (admin, user, etc.)';

-- Tabla de Áreas de la Empresa
CREATE TABLE `intraNet_DB`.`areas` (
  `id_area` INT NOT NULL AUTO_INCREMENT,
  `nombre_area` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  PRIMARY KEY (`id_area`),
  UNIQUE INDEX `nombre_area_UNIQUE` (`nombre_area` ASC) VISIBLE
) ENGINE=InnoDB COMMENT='Catálogo de áreas funcionales de la empresa (I+D, Operaciones, etc.)';

-- ======================================================================
-- Tablas Principales
-- ======================================================================

-- Tabla de Empleados
CREATE TABLE `intraNet_DB`.`empleados` (
  `id_empleado` INT NOT NULL AUTO_INCREMENT,
  `correo` VARCHAR(100) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL COMMENT 'Guardar SIEMPRE el hash de la contraseña, NUNCA texto plano',
  `rol` VARCHAR(45) NOT NULL DEFAULT 'user', -- FK a la tabla roles
  -- `id_rol` INT NOT NULL DEFAULT '1' INTEGRACION DE LA TABLA CATALOGO A FUTURO
  `cargo` VARCHAR(100) NULL, -- Considerar tabla catálogo 'cargos'
  `area` VARCHAR(45) NOT NULL,
  -- `id_area` INT NOT NULL, FK a la tabla areas INTEGRACION DE LA TABLA CATALOGO A FUTURO
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `edad` INT NULL,
  `direccion` VARCHAR(150) NULL, -- Aumentado
  `ciudad` VARCHAR(50) NULL,
  `sede_insitel` VARCHAR(45) NOT NULL DEFAULT 'sede_principal',
  `foto_empleado` VARCHAR(255) NULL COMMENT 'Ruta o URL a la foto',
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Para desactivación lógica',
  `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empleado`),
  UNIQUE INDEX `correo_UNIQUE` (`correo` ASC) VISIBLE,
  INDEX `fk_empleados_rol_idx` (`id_rol` ASC) VISIBLE,
  INDEX `fk_empleados_area_idx` (`id_area` ASC) VISIBLE,
  CONSTRAINT `fk_empleados_rol`
    FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE, -- No borrar rol si hay empleados
  CONSTRAINT `fk_empleados_area`
    FOREIGN KEY (`id_area`) REFERENCES `areas` (`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE -- No borrar area si hay empleados
) ENGINE=InnoDB COMMENT='Tabla de usuarios/empleados del sistema';

-- Tabla de Proyectos
CREATE TABLE `intraNet_DB`.`proyectos` (
  `id_proyecto` INT NOT NULL AUTO_INCREMENT,
  `nombre_proyecto` VARCHAR(150) NOT NULL,
  `empresa_asociada` VARCHAR(100) NULL,
  `progress` INT NOT NULL DEFAULT 0 COMMENT 'Progreso porcentual (0-100)',
  `status` VARCHAR(45) NOT NULL DEFAULT 'en progreso' COMMENT 'Considerar FK a tabla estados_proyecto',
  `priority` INT NULL COMMENT 'Nivel de prioridad (ej. 1-5)',
  `summary` TEXT NULL COMMENT 'Resumen corto del proyecto',
  `area` VARCHAR(100) NOT NULL,
  -- `id_area` INT NOT NULL, FK a la tabla areas INTEGRACION DE LA TABLA CATALOGO A FUTURO
  `color` VARCHAR(7) NOT NULL DEFAULT '#F97316' COMMENT 'Color hexadecimal para UI',
  `fecha_inicio` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin_estimada` DATETIME NULL,
  `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_proyecto`),
  INDEX `fk_proyectos_area_idx` (`id_area` ASC) VISIBLE,
  CONSTRAINT `fk_proyectos_area`
    FOREIGN KEY (`id_area`) REFERENCES `areas` (`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Tabla principal de proyectos I+D+i';

-- ======================================================================
-- Tablas de Unión (N:M)
-- ======================================================================

-- Tabla de Unión: Empleados <-> Proyectos
CREATE TABLE `intraNet_DB`.`empleados_proyectos` (
  `id_proyecto` INT NOT NULL,
  `id_empleado` INT NOT NULL,
  `permisos` VARCHAR(45) NOT NULL DEFAULT 'lector' COMMENT 'Rol específico dentro del proyecto',
  PRIMARY KEY (`id_proyecto`, `id_empleado`),
  INDEX `fk_ep_empleado_idx` (`id_empleado` ASC) VISIBLE,
  CONSTRAINT `fk_ep_proyecto`
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE,
  CONSTRAINT `fk_ep_empleado`
    FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Asigna empleados a proyectos con permisos específicos';

-- Tabla de Tipos de Formulario (Lookup)
CREATE TABLE `intraNet_DB`.`formularios` (
  `id_formulario` INT NOT NULL COMMENT 'ID fijo predefinido para cada tipo',
  `nombre_formulario` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id_formulario`),
  UNIQUE INDEX `nombre_formulario_UNIQUE` (`nombre_formulario` ASC) VISIBLE
) ENGINE=InnoDB COMMENT='Catálogo de los tipos de formularios disponibles';

-- Tabla de Unión: Formularios (Tipos) <-> Proyectos
CREATE TABLE `intraNet_DB`.`formularios_proyectos` (
  `id_formulario` INT NOT NULL,
  `id_proyecto` INT NOT NULL,
  PRIMARY KEY (`id_formulario`, `id_proyecto`),
  INDEX `fk_fp_proyecto_idx` (`id_proyecto` ASC) VISIBLE,
  CONSTRAINT `fk_fp_formulario`
    FOREIGN KEY (`id_formulario`) REFERENCES `formularios` (`id_formulario`) ON DELETE CASCADE,
  CONSTRAINT `fk_fp_proyecto`
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Indica qué tipos de formularios se aplican a cada proyecto';

-- ======================================================================
-- Tablas de DATOS de Formularios Específicos
-- ======================================================================

-- Tabla de Datos: Formulario "General" (1:1 con Proyecto)
CREATE TABLE `intraNet_DB`.`formulario_general` (
    `id_proyecto` INT NOT NULL,
    -- Info Solicitud
    `area_solicitante` VARCHAR(100) NULL,
    `nombre_solicitante` VARCHAR(150) NULL,
    `telefono_solicitante` VARCHAR(50) NULL,
    `descripcion_solicitud` TEXT NULL,
    `genera_cambio_tipo` ENUM('Estandar', 'Recurrente', 'De emergencia') NULL,
	-- Info Requerimiento
    `tipo_proyecto` ENUM('Hardware', 'Software') NULL, -- Considerar tabla catálogo
	`nivel_hardware` INT NULL CHECK (`nivel_hardware` BETWEEN 1 AND 4),
	`componentes_hardware` ENUM('PCB','Sistema Embebido') NULL,
    `otro_valor_componentes_hardware` VARCHAR(100) NULL,
	`nivel_software` INT NULL CHECK (`nivel_software` BETWEEN 1 AND 4),
	`componentes_software` ENUM('WEB','Escritorio','Servidor','Móvil') NULL,
    `otro_valor_componentes_software` VARCHAR(100) NULL,
    `entregables` TEXT NULL,
    `requisitos_seguimiento_y_medicion` TEXT NULL,
    `criterios_de_aceptacion` TEXT NULL,
    `consecuencias_por_fallar` TEXT NULL,
    `fecha_inicio_planificada` DATETIME NULL, -- Renombrado
    `fecha_final_planificada` DATETIME NULL, -- Renombrado
    `tiempo_total_estimado` VARCHAR(45) NULL, -- Ej: "3 meses", "120 horas"
    -- Info Cliente
    `departamento_interno` VARCHAR(200) NULL,
    `cliente_final` VARCHAR(200) NULL,
    -- Gestión Documental (Checklist y Rutas)
    `ruta_proyecto_desarrollo` VARCHAR(500) NULL,
    `ruta_cotizacion` VARCHAR(500) NULL,
    `aplica_doc_ideas_iniciales` BOOLEAN DEFAULT TRUE,
    `aplica_doc_especificaciones` BOOLEAN DEFAULT TRUE,
    `aplica_doc_casos_uso` BOOLEAN DEFAULT TRUE,
    `aplica_doc_diseno_sistema` BOOLEAN DEFAULT TRUE,
    `aplica_doc_plan_pruebas` BOOLEAN DEFAULT TRUE,
    `aplica_doc_manuales` BOOLEAN DEFAULT TRUE,
    `aplica_doc_liberacion` BOOLEAN DEFAULT TRUE,
    `ref_doc_ideas_iniciales` VARCHAR(200) NULL,
    `ref_doc_especificaciones` VARCHAR(200) NULL,
    `ref_doc_casos_uso` VARCHAR(200) NULL,
    `ref_doc_diseno_sistema` VARCHAR(200) NULL,
    `ref_doc_plan_pruebas` VARCHAR(200) NULL,
    `ref_doc_manuales` VARCHAR(200) NULL,
    `ref_doc_liberacion` VARCHAR(200) NULL,
    `verif_doc_ideas_iniciales` BOOLEAN DEFAULT FALSE,
    `verif_doc_especificaciones` BOOLEAN DEFAULT FALSE,
    `verif_doc_casos_uso` BOOLEAN DEFAULT FALSE,
    `verif_doc_diseno_sistema` BOOLEAN DEFAULT FALSE,
    `verif_doc_plan_pruebas` BOOLEAN DEFAULT FALSE,
    `verif_doc_manuales` BOOLEAN DEFAULT FALSE,
    `verif_doc_liberacion` BOOLEAN DEFAULT FALSE,
    -- Estado Actual (Podría ir en tabla 'proyectos' o una tabla 'proyecto_estado')
    -- `estado` ENUM('En progreso','Pausado','Completado','Cancelado') NOT NULL DEFAULT 'En progreso', -- Ya está en proyectos.status?
    -- `porcentaje` INT DEFAULT 0, -- Ya está en proyectos.progress?
    -- Timestamps
    `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_proyecto`),
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Datos del formulario general (1 por proyecto)';

-- Tabla de Datos: Equipo Asignado al Proyecto (Antes general_rh)
CREATE TABLE `intraNet_DB`.`proyecto_equipo` (
  `id_asignacion_rh` INT NOT NULL AUTO_INCREMENT,
  `id_proyecto` INT NOT NULL,
  `id_empleado` INT NULL, -- NULL si es recurso externo
  `nombre_asignado` VARCHAR(150) NULL, -- Eliminado, obtener de JOIN con empleados si id_empleado no es NULL
  `rol_en_proyecto` VARCHAR(100) NOT NULL,
  `responsabilidades` TEXT NULL,
  `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_asignacion_rh`),
  INDEX `idx_equipo_proyecto` (`id_proyecto`), -- Índice explícito
  INDEX `idx_equipo_empleado` (`id_empleado`), -- Índice explícito
  FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE,
  FOREIGN KEY (`id_empleado`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL -- Si se borra empleado, la asignación queda sin persona
) ENGINE=InnoDB COMMENT='Equipo humano asignado a cada proyecto';

-- Tabla de Datos: Compras del Proyecto (Antes general_proceso_compras)
CREATE TABLE `intraNet_DB`.`proyecto_compras`(
  `id_item_compra` INT NOT NULL AUTO_INCREMENT,
  `id_proyecto` INT NOT NULL,
  `creado_por_id` INT NULL, -- Quién registró la solicitud/compra
  `proveedor` VARCHAR(200) NULL,
  `descripcion` TEXT NOT NULL,
  `cantidad` DECIMAL(10,2) NOT NULL DEFAULT 1.00, -- Permitir decimales para unidades? O INT
  `unidad_medida` VARCHAR(50) NULL, -- Ej: 'unidad', 'kg', 'hora'
  `total_usd` DECIMAL(12, 2) NULL,
  `total_cop` DECIMAL(15, 2) NULL,
  `orden_compra` VARCHAR(50) NULL,
  `estado_compra` ENUM('Solicitado','En espera de aprobación','Aprobado','Comprado','En espera de entrega', 'Recibido', 'Cancelado') NOT NULL DEFAULT 'Solicitado',
  `fecha_solicitud` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_estado` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_item_compra`),
  INDEX `idx_compras_proyecto` (`id_proyecto`),
  INDEX `idx_compras_creador` (`creado_por_id`),
  FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE,
  FOREIGN KEY (`creado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL -- Si se borra el empleado, la compra permanece
) ENGINE=InnoDB COMMENT='Registro de compras asociadas a un proyecto';

-- Tabla de Datos: Formulario "Alcance" (1:1 con Proyecto)
CREATE TABLE `intraNet_DB`.`formulario_alcance` (
    `id_proyecto` INT NOT NULL,
    `descripcion_cuantitativa` TEXT NULL,
    `comportamiento_esperado` TEXT NULL,
    `otros_temas_relevantes` TEXT NULL,
    `procedimiento_actual` TEXT NULL,
    `situacion_problema` TEXT NULL,
    `entorno_y_actores` TEXT NULL,
    `limitaciones` TEXT NULL,
    `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_proyecto`),
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Datos del formulario de alcance (1 por proyecto)';

-- Tabla de Datos: Formulario "Presupuesto" (Principal) (1 Proyecto -> N Presupuestos)
CREATE TABLE `intraNet_DB`.`formulario_presupuesto`(
    `id_formulario_presupuesto` INT NOT NULL AUTO_INCREMENT,
    `id_proyecto` INT NOT NULL,
    `version_presupuesto` INT NOT NULL DEFAULT 1,
    `estado` ENUM('Borrador', 'En Revisión', 'Aprobado', 'Rechazado') NOT NULL DEFAULT 'Borrador',
    `notas_generales` TEXT NULL,
    `creado_por_id` INT NULL,
    `fecha_aprobacion` DATETIME NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Totales calculados (opcional, si decides guardarlos)
    -- `total_rh_calculado` DECIMAL(15, 2) NULL,
    -- `total_suministros_calculado` DECIMAL(15, 2) NULL,
    -- `total_servicios_calculado` DECIMAL(15, 2) NULL,
    -- `total_general_calculado` DECIMAL(15, 2) NULL,
    PRIMARY KEY (`id_formulario_presupuesto`),
    INDEX `idx_presupuesto_proyecto` (`id_proyecto`),
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE,
    FOREIGN KEY (`creado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Cabecera de cada versión del presupuesto de un proyecto';

-- Tabla de Datos: Detalles RH del Presupuesto (N líneas -> 1 Presupuesto)
CREATE TABLE `intraNet_DB`.`presupuesto_rh` (
    `id_fila_rh` INT NOT NULL AUTO_INCREMENT,
    `id_formulario_presupuesto` INT NOT NULL,
    `id_empleado_asignado` INT NULL COMMENT 'FK a empleados si es interno',
    `nombre_recurso` VARCHAR(150) NOT NULL COMMENT 'Nombre del rol o persona',
    `salario_mensual` DECIMAL(15, 2) NULL,
    `salario_mensual_parafiscales` DECIMAL(15, 2) NULL,
    `costo_dia` DECIMAL(15, 2) NULL,
    `cantidad_dias` DECIMAL(10, 2) NOT NULL,
    -- `total_linea` DECIMAL(15, 2) NULL, -- Calcular al vuelo
    `creado_por_id` INT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_fila_rh`),
    INDEX `idx_prh_presupuesto` (`id_formulario_presupuesto`),
    INDEX `idx_prh_empleado` (`id_empleado_asignado`),
    INDEX `idx_prh_creador` (`creado_por_id`),
    FOREIGN KEY (`id_formulario_presupuesto`) REFERENCES `formulario_presupuesto`(`id_formulario_presupuesto`) ON DELETE CASCADE,
    FOREIGN KEY (`id_empleado_asignado`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL,
    FOREIGN KEY (`creado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Líneas de detalle de Recurso Humano para un presupuesto';

-- Tabla de Datos: Detalles Suministros del Presupuesto (N líneas -> 1 Presupuesto)
CREATE TABLE `intraNet_DB`.`presupuesto_suministros` (
    `id_fila_suministros` INT NOT NULL AUTO_INCREMENT,
    `id_formulario_presupuesto` INT NOT NULL,
    `nombre_proveedor` VARCHAR(200) NULL,
    `nombre_item` TEXT NOT NULL,
    `cant_item` DECIMAL(10, 2) NOT NULL,
    `unidad` VARCHAR(50) NOT NULL,
    `valor_unitario` DECIMAL(15, 2) NOT NULL,
    -- `valor_total_linea` DECIMAL(15, 2) NULL, -- Calcular al vuelo
    `creado_por_id` INT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_fila_suministros`),
    INDEX `idx_psum_presupuesto` (`id_formulario_presupuesto`),
    INDEX `idx_psum_creador` (`creado_por_id`),
    FOREIGN KEY (`id_formulario_presupuesto`) REFERENCES `formulario_presupuesto`(`id_formulario_presupuesto`) ON DELETE CASCADE,
    FOREIGN KEY (`creado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Líneas de detalle de Suministros para un presupuesto';

-- Tabla de Datos: Detalles Servicios del Presupuesto (N líneas -> 1 Presupuesto)
CREATE TABLE `intraNet_DB`.`presupuesto_servicios` (
    `id_fila_servicios` INT NOT NULL AUTO_INCREMENT,
    `id_formulario_presupuesto` INT NOT NULL,
    `nombre_proveedor` VARCHAR(200) NULL,
    `nombre_servicio` TEXT NOT NULL,
    `cant_item` DECIMAL(10, 2) NOT NULL,
    `unidad` VARCHAR(50) NOT NULL,
    `valor_unitario` DECIMAL(15, 2) NOT NULL,
    -- `valor_total_linea` DECIMAL(15, 2) NULL, -- Calcular al vuelo
    `creado_por_id` INT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_fila_servicios`),
    INDEX `idx_pser_presupuesto` (`id_formulario_presupuesto`),
    INDEX `idx_pser_creador` (`creado_por_id`),
    FOREIGN KEY (`id_formulario_presupuesto`) REFERENCES `formulario_presupuesto`(`id_formulario_presupuesto`) ON DELETE CASCADE,
    FOREIGN KEY (`creado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Líneas de detalle de Servicios para un presupuesto';

-- Tabla de Datos: Formulario "Riesgos" (1 Proyecto -> N Riesgos)
CREATE TABLE `intraNet_DB`.`formulario_riesgos`(
  `id_riesgo` INT NOT NULL AUTO_INCREMENT,
  `id_proyecto` INT NOT NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('identificado','cercano', 'disparado', 'evitado', 'mitigado', 'aceptado', 'transferido') NULL,
  `fecha_de_identificacion` DATETIME NULL,
  `tipo` ENUM('Negativo','Positivo') NULL,
  `categoria` ENUM('Técnico', 'Diseño', 'Recurso Humano', 'Recurso Fisico', 'Recurso Técnico') NULL,
  `probabilidad` INT NULL CHECK (`probabilidad` BETWEEN 1 AND 5),
  `impacto` INT NULL CHECK (`impacto` BETWEEN 1 AND 5),
  `id_responsable` INT NULL,
  `fecha_probable_materializacion` DATETIME NULL,
  `evento_disparador` VARCHAR(400) NULL,
  `posibles_consecuencias` TEXT NULL,
  `plan_respuesta` ENUM('evitar', 'transferir', 'mitigar', 'aceptar') NULL,
  `descripcion_plan_respuesta` TEXT NULL,
  `fecha_real_materializacion` DATETIME NULL,
  `descripcion_accion_tomada` TEXT NULL,
  `efectividad` INT NULL CHECK (`efectividad` BETWEEN 1 AND 5),
  `notas` TEXT NULL,
  `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_riesgo`),
  INDEX `idx_riesgos_proyecto` (`id_proyecto`),
  INDEX `idx_riesgos_responsable` (`id_responsable`),
  FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE,
  FOREIGN KEY (`id_responsable`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Registro de riesgos identificados para un proyecto';

-- Tabla de Datos: Formulario "Verificación" (Principal) (1 Proyecto -> N Verificaciones)
CREATE TABLE `intraNet_DB`.`formulario_verificacion` (
    `id_formulario_verificacion` INT NOT NULL AUTO_INCREMENT,
    `id_proyecto` INT NOT NULL,
    `version_verificada` VARCHAR(100) NULL COMMENT 'Versión del producto/documento que se verifica',
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `creado_por_id` INT NULL,
    PRIMARY KEY (`id_formulario_verificacion`),
    INDEX `idx_verif_proyecto` (`id_proyecto`),
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE,
    FOREIGN KEY (`creado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Cabecera de cada instancia del formulario de verificación';

-- Tabla de Datos: Detalles Lista Cumplimiento del Formulario Verificación
CREATE TABLE `intraNet_DB`.`verificacion_cumplimiento_requerimientos` (
    `id_fila_cumplimiento` INT NOT NULL AUTO_INCREMENT, -- Renombrado PK
    `id_formulario_verificacion` INT NOT NULL,
    `codigo_requisito` VARCHAR(50) NULL COMMENT 'ID o código del requisito verificado',
    `tipo_requisito` VARCHAR(100) NULL,
    `descripcion_requisito` TEXT NULL,
    `cumple` BOOLEAN NULL COMMENT 'Sí/No cumple',
    `observaciones` TEXT NULL,
    `fecha_verificacion` DATETIME DEFAULT CURRENT_TIMESTAMP, -- Corregido nombre
    `verificado_por_id` INT NOT NULL,
    PRIMARY KEY (`id_fila_cumplimiento`),
    INDEX `idx_cumpl_verif` (`id_formulario_verificacion`),
    INDEX `idx_cumpl_verif_por` (`verificado_por_id`),
    FOREIGN KEY (`id_formulario_verificacion`) REFERENCES `formulario_verificacion`(`id_formulario_verificacion`) ON DELETE CASCADE,
    FOREIGN KEY (`verificado_por_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Detalle de cumplimiento de requisitos para una verificación';

-- Tabla de Datos: Detalles Registro Aprobación del Formulario Verificación
CREATE TABLE `intraNet_DB`.`registro_verificacion_aprobacion` (
    `id_fila_aprobacion` INT NOT NULL AUTO_INCREMENT, -- Renombrado PK
    `id_formulario_verificacion` INT NOT NULL,
    `fecha_aprobacion` DATE NULL, -- Renombrado
    `version_aprobada` VARCHAR(100) NULL, -- Renombrado desde 'ver'
    `observaciones` TEXT NULL,
    `rol_responsable` VARCHAR(150) NULL, -- Rol del que aprueba/verifica
    `firma_id` INT NULL, -- Quién aprueba/firma. Permitir NULL?
    PRIMARY KEY (`id_fila_aprobacion`),
    INDEX `idx_aprob_verif` (`id_formulario_verificacion`),
    INDEX `idx_aprob_firma` (`firma_id`),
    FOREIGN KEY (`id_formulario_verificacion`) REFERENCES `formulario_verificacion`(`id_formulario_verificacion`) ON DELETE CASCADE,
    FOREIGN KEY (`firma_id`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Registro de firmas y aprobaciones para una verificación';

-- ======================================================================
-- INSERTS INICIALES (Catálogos) - EJEMPLO
-- ======================================================================
-- Descomenta y adapta según tus necesidades

-- INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`) VALUES
-- (1, 'admin', 'Administrador con permisos elevados'),
-- (2, 'user', 'Usuario estándar'),
-- (3, 'super-admin', 'Administrador global'); -- Asegúrate que la FK en empleados use el ID correcto por defecto (ej. 2)

-- INSERT INTO `areas` (`id_area`, `nombre_area`, `descripcion`) VALUES
-- (1, 'I+D', 'Innovación y Desarrollo'),
-- (2, 'Operaciones', 'Área de operaciones'),
-- (3, 'Comercial', 'Área comercial y ventas'); -- Asegúrate que las FK en empleados/proyectos usen IDs válidos

-- INSERT INTO `formularios` (`id_formulario`, `nombre_formulario`, `descripcion`) VALUES
-- (1, 'General', 'Formulario inicial con datos generales del proyecto'),
-- (2, 'Alcance', 'Definición detallada del alcance del proyecto'),
-- (3, 'Presupuesto', 'Estimación y control de costos del proyecto'),
-- (4, 'Riesgos', 'Identificación y gestión de riesgos del proyecto'),
-- (5, 'Verificación', 'Seguimiento de cumplimiento y aprobaciones'),
-- (6, 'Control de Versiones', 'Historial de versiones del proyecto');

-- ======================================================================
-- FIN DEL SCRIPT
-- ======================================================================