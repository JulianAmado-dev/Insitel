-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `intraNet_DB` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE `intraNet_DB`;

-- Eliminar tablas en orden inverso de dependencia (para poder re-ejecutar el script)
DROP TABLE IF EXISTS `datos_form_proceso_compras`;
DROP TABLE IF EXISTS `datos_form_control_versiones`;
DROP TABLE IF EXISTS `datos_form_general`; -- Asumiendo que estas son las tablas de datos de formularios
-- Añade aquí DROP TABLE para otras tablas de datos de formularios que crees (riesgos, alcance, etc.)
DROP TABLE IF EXISTS `formularios_proyectos`;
DROP TABLE IF EXISTS `empleados_proyectos`;
DROP TABLE IF EXISTS `formularios`;
DROP TABLE IF EXISTS `proyectos`;
DROP TABLE IF EXISTS `empleados`;
DROP TABLE IF EXISTS `areas`;
-- Tabla de Empleados
CREATE TABLE `intraNet_DB`.`empleados` (
  `id_empleado` INT NOT NULL AUTO_INCREMENT,
  `correo` VARCHAR(100) NOT NULL, -- Aumentado tamaño y UNIQUE
  `contrasena` VARCHAR(255) NOT NULL, -- Suficiente para hashes seguros
  `rol` VARCHAR(45) NOT NULL DEFAULT 'user', -- NOT NULL si siempre debe tener rol
  `cargo` VARCHAR(45) NULL,
  `area` VARCHAR(45) NOT NULL,
  `nombres` VARCHAR(100) NOT NULL, -- Aumentado tamaño
  `apellidos` VARCHAR(100) NOT NULL, -- Aumentado tamaño
  `edad` INT NULL, -- Permitir NULL si no es obligatorio
  `direccion` VARCHAR(100) NULL, -- Permitir NULL y aumentar tamaño
  `ciudad` VARCHAR(50) NULL, -- Permitir NULL y ajustar tamaño
  `sede_insitel` VARCHAR(45) NOT NULL DEFAULT 'sede_principal',
  `foto_empleado` VARCHAR(255) NULL, -- Guardar ruta/URL de la imagen, no el BLOB
  `activo` BOOLEAN NOT NULL DEFAULT TRUE, 
  `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empleado`),
  UNIQUE INDEX `correo_UNIQUE` (`correo` ASC) VISIBLE -- Índice único para correo
);

CREATE TABLE `intraNet_DB`.`rol`(
	`id_rol` int not null auto_increment,
    `nombre_rol` varchar(200) not null ,
    `descripcion` TEXT null,
    
    primary key(`id_rol`),
    unique index `nombre_rol_UNIQUE`(`nombre_rol` ASC) VISIBLE
);

CREATE TABLE `intraNet_DB`.`areas`(
	`id_area` int not null auto_increment,
    `nombre_area` varchar(200) not null ,
    `descripcion` TEXT null,
    
    primary key(`id_area`),
    unique index `nombre_area_UNIQUE`(`nombre_area` ASC) VISIBLE
);

INSERT INTO `intraNet_DB`.`areas` (`nombre_area`, `descripcion`) VALUES
  ('I+D', 'Innovación y desarollo'),
  ('Operaciones', 'Operaciones operacionales de operatividad operativa'),
  ('Me lo acabo de inventar', 'este es una prueba para la base de datos y el sidebar');

-- Tabla de Proyectos
CREATE TABLE `intraNet_DB`.`proyectos` (
  `id_proyecto` INT NOT NULL AUTO_INCREMENT,
  `nombre_proyecto` VARCHAR(150) NOT NULL, -- NOT NULL y más largo
  `empresa_asociada` VARCHAR(100) NULL, -- Aumentado tamaño
  `progress` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(45) NOT NULL DEFAULT 'en progreso',
  `priority` INT NULL,
  `summary` TEXT NULL, -- Usar TEXT para descripciones más largas
  `area` VARCHAR(100) NOT NULL,
  `color` VARCHAR(50) NOT NULL DEFAULT '#F97316',
  `fecha_inicio` DATETIME NULL DEFAULT CURRENT_TIMESTAMP, -- Permitir NULL si se define después
  `fecha_fin_estimada` DATETIME NULL, -- Fecha estimada de fin
  `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_proyecto`)
);

-- Tabla de Unión: Empleados <-> Proyectos (Muchos a Muchos)
CREATE TABLE `intraNet_DB`.`empleados_proyectos` (
  `id_proyecto` INT NOT NULL,
  `id_empleado` INT NOT NULL,
  `permisos` VARCHAR(45) NOT NULL DEFAULT 'lector', -- Rol dentro del proyecto
  PRIMARY KEY (`id_proyecto`, `id_empleado`), -- Clave primaria compuesta
  INDEX `fk_ep_empleado_idx` (`id_empleado` ASC) VISIBLE, -- Índice para FK
  CONSTRAINT `fk_ep_proyecto`
    FOREIGN KEY (`id_proyecto`)
    REFERENCES `intraNet_DB`.`proyectos` (`id_proyecto`)
    ON DELETE CASCADE, -- Si se borra el proyecto, se borra la asignación
  CONSTRAINT `fk_ep_empleado`
    FOREIGN KEY (`id_empleado`)
    REFERENCES `intraNet_DB`.`empleados` (`id_empleado`)
    ON DELETE CASCADE -- Si se borra el empleado, se borra la asignación
);

-- Tabla de Tipos de Formulario
CREATE TABLE `intraNet_DB`.`formularios` (
  `id_formulario` INT NOT NULL, -- Sin AUTO_INCREMENT si son IDs fijos
  `nombre_formulario` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id_formulario`),
  UNIQUE INDEX `nombre_formulario_UNIQUE` (`nombre_formulario` ASC) VISIBLE
);

-- Tabla de Unión: Formularios (Tipos) <-> Proyectos (Muchos a Muchos)
-- Indica qué tipos de formularios se aplican a qué proyectos
CREATE TABLE `intraNet_DB`.`formularios_proyectos` (
  `id_formulario` INT NOT NULL,
  `id_proyecto` INT NOT NULL,
  PRIMARY KEY (`id_formulario`, `id_proyecto`), -- Clave primaria compuesta
  INDEX `fk_fp_proyecto_idx` (`id_proyecto` ASC) VISIBLE, -- Índice para FK
  CONSTRAINT `fk_fp_formulario`
    FOREIGN KEY (`id_formulario`)
    REFERENCES `intraNet_DB`.`formularios` (`id_formulario`)
    ON DELETE CASCADE, -- Si se borra el tipo de formulario, se borra la asignación
  CONSTRAINT `fk_fp_proyecto`
    FOREIGN KEY (`id_proyecto`)
    REFERENCES `intraNet_DB`.`proyectos` (`id_proyecto`)
    ON DELETE CASCADE -- Si se borra el proyecto, se borra la asignación
);

-- --- TABLAS DE DATOS PARA CADA FORMULARIO ---

-- Tabla de Datos: Formulario "Control de Versiones"
-- Puede haber múltiples entradas por proyecto
CREATE TABLE `intraNet_DB`.`datos_form_control_versiones` (
    `id_control_version` INT NOT NULL AUTO_INCREMENT,
    `id_proyecto` INT NOT NULL,
    `version_numero` VARCHAR(20) NOT NULL,
    `fecha_actualizacion` DATE NOT NULL,
    `descripcion_cambios` TEXT NULL,
    `responsable_id` INT NULL,
    PRIMARY KEY (`id_control_version`),
    FOREIGN KEY (`id_proyecto`)
        REFERENCES `proyectos` (`id_proyecto`)
        ON DELETE CASCADE,
    FOREIGN KEY (`responsable_id`)
        REFERENCES `empleados` (`id_empleado`)
        ON DELETE SET NULL
);
-- Tabla de Datos: Formulario "General"
-- Asume 1 registro por proyecto (id_proyecto es PK y FK)
CREATE TABLE `intraNet_DB`.`formulario_general` (
    `id_proyecto` INT NOT NULL, -- Clave Foránea y Primaria
    -- Información general de la solicitud
    `area_solicitante` VARCHAR(100) NULL,
    `nombre_solicitante` VARCHAR(150) NULL,
    `telefono_solicitante` VARCHAR(50) NULL, -- VARCHAR para flexibilidad
    `descripcion_solicitud` TEXT NULL,
    `genera_cambio_tipo` ENUM('Estandar', 'Recurrente', 'De emergencia') NULL,
	-- Información general del requerimiento
    `tipo_proyecto` ENUM('Hardware', 'Software') NULL,
	`nivel_software` INT NULL CHECK (`nivel_software` BETWEEN 1 AND 4),
	`nivel_hardware` INT NULL CHECK (`nivel_hardware` BETWEEN 1 AND 4),
    `componentes_hardware` ENUM('PCB','Sistema Embebido') NULL,
    `otro_valor_componentes_hardware` VARCHAR(100) NULL,
	`componentes_software` ENUM('WEB','Escritorio','Servidor','Móvil') NULL,
    `otro_valor_componentes_software` VARCHAR(100) NULL,
    `entregables` TEXT NULL,
    `requisitos_seguimiento_y_medicion` TEXT NULL,
    `criterios_de_aceptacion` TEXT NULL,
    `consecuencias_por_fallar` TEXT NULL,
    `fecha_inicio` DATETIME NULL,
    `fecha_final` DATETIME NULL,
    `tiempo_total` varchar(45) null,
    -- Info Cliente
    `departamento_interno` VARCHAR(200) NULL,
    `cliente_final` VARCHAR(200) NULL,
    -- Gestión Documental
    `ruta_proyecto_desarrollo` VARCHAR(200),
    `ruta_cotizacion` VARCHAR(200),
    -- segunda parte en la sección de gestión documental
    `aplica_documento_ideas_iniciales`BOOLEAN DEFAULT TRUE,
    `aplica_documento_especificaciones` BOOLEAN DEFAULT TRUE,
    `aplica_especificacion_casos_de_uso`BOOLEAN DEFAULT TRUE,
    `aplica_documento_diseño_sistema` BOOLEAN DEFAULT TRUE,
    `aplica_plan_de_pruebas` BOOLEAN DEFAULT TRUE,
    `aplica_manuales` BOOLEAN DEFAULT TRUE,
    `aplica_liberacion_producto` BOOLEAN DEFAULT TRUE,
    -- nombre
    `nombre_o_referencia_documento_ideas_iniciales` VARCHAR(200),
    `nombre_o_referencia_documento_especificaciones` VARCHAR(200),
    `nombre_o_referencia_especificacion_casos_de_uso` VARCHAR(200),
    `nombre_o_referencia_documento_diseño_sistema` VARCHAR(200),
    `nombre_o_referencia_plan_de_pruebas` VARCHAR(200),
    `nombre_o_referencia_manuales` VARCHAR(200),
    `nombre_o_referencia_liberacion_producto` VARCHAR(200),
    -- verificado
    `is_verified_documento_ideas_iniciales` BOOLEAN DEFAULT FALSE,
    `is_verified_documento_especificaciones` BOOLEAN DEFAULT FALSE,
    `is_verified_especificacion_casos_de_uso` BOOLEAN DEFAULT FALSE,
    `is_verified_documento_diseño_sistema` BOOLEAN DEFAULT FALSE,
    `is_verified_plan_de_pruebas` BOOLEAN DEFAULT FALSE,
    `is_verified_manuales`BOOLEAN DEFAULT FALSE,
    `is_verified_liberacion_producto`BOOLEAN DEFAULT FALSE,
    -- Estado actual del proyecto
    `estado` ENUM('En progreso','Pausado','Completado','Cancelado') NOT NULL DEFAULT 'En progreso',
    `porcentaje` INT default 0,
    -- Timestamps
    `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id_proyecto`),
    FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`general_rh` (
    `id_proyecto` INT NOT NULL,
    `id_empleado` INT NOT NULL,
    `id_fila_rh` INT AUTO_INCREMENT NOT NULL,
    `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `nombre_empleado` VARCHAR(100) NOT NULL,
    `rol_en_proyecto` VARCHAR(100) NOT NULL,
    `responsabilidades` TEXT NULL,
    
    PRIMARY KEY (`id_fila_rh`),
    FOREIGN KEY (`id_proyecto`)
        REFERENCES `proyectos` (`id_proyecto`),
    FOREIGN KEY (`id_empleado`)
        REFERENCES `empleados` (`id_empleado`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`general_proceso_compras`(
	`id_fila_form_general_proceso_compras` INT NOT NULL auto_increment,
    `id_proyecto` INT NOT NULL,
	`creado_por_id` INT NOT NULL,
	`proveedor` VARCHAR(200) NULL,
    `descripcion` TEXT NOT NULL,
    `cantidad` INT NOT NULL DEFAULT 1,
    `total_usd` DECIMAL(12, 2) NULL, -- Usar DECIMAL para moneda
    `total_cop` DECIMAL(15, 2) NULL, -- Usar DECIMAL para moneda
    `orden_compra` VARCHAR(50) NULL, -- OC suele ser alfanumérica
    `estado_compra` ENUM('Solicitado','En espera de aprobación','Aprobado','Comprado','En espera de entrega', 'Recibido', 'Cancelado') NOT NULL DEFAULT 'Solicitado',
    `fecha_solicitud` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `fecha_estado` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id_fila_form_general_proceso_compras`),
    FOREIGN KEY (`id_proyecto`)
        REFERENCES `proyectos` (`id_proyecto`),
    FOREIGN KEY (`creado_por_id`)
        REFERENCES `empleados` (`id_empleado`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`formulario_alcance` (
    `descripcion_cuantitativa` TEXT NULL,
    `comportamiento_esperado` TEXT NULL,
    `otros_temas_relevantes` TEXT NULL,
    `procedimiento_actual` TEXT NULL,
    `situacion_problema` TEXT NULL,
    `entorno_y_actores` TEXT NULL,
    `limitaciones` TEXT NULL,
    `id_proyecto` INT NOT NULL,
    PRIMARY KEY (`id_proyecto`),
    FOREIGN KEY (`id_proyecto`)
        REFERENCES `proyectos` (`id_proyecto`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`formulario_presupuesto`(
    `id_formulario_presupuesto` INT NOT NULL AUTO_INCREMENT,
    `version_presupuesto` INT NULL,
    `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `id_proyecto` INT NOT NULL,
    
    PRIMARY KEY (`id_formulario_presupuesto`),
    FOREIGN KEY (`id_proyecto`)
        REFERENCES `proyectos` (`id_proyecto`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`presupuesto_rh` (
    `salario_mensual_parafiscales` DECIMAL(12 , 2 ) NOT NULL,
    `id_formulario_presupuesto` INT NOT NULL,
    `nombre_empleado` VARCHAR(100) NOT NULL,
    `salario_mensual` DECIMAL(12 , 2 ) NOT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `cantidad_dias` INT NOT NULL,
    `creado_por_id` INT NOT NULL,
    `id_fila_rh` INT AUTO_INCREMENT,
    `costo_dia` DECIMAL(12 , 2 ) NOT NULL,
    PRIMARY KEY (`id_fila_rh`),
    FOREIGN KEY (`creado_por_id`)
        REFERENCES `empleados` (`id_empleado`),
    FOREIGN KEY (`id_formulario_presupuesto`)
        REFERENCES `formulario_presupuesto`(`id_formulario_presupuesto`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`presupuesto_suministros` (
    `id_formulario_presupuesto` INT NOT NULL,
    `id_fila_suministros` INT AUTO_INCREMENT,
    `nombre_proveedor` VARCHAR(100) NOT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `valor_unitario` DECIMAL(12 , 2 ) NOT NULL,
    `creado_por_id` INT NOT NULL,
    `nombre_item` VARCHAR(100) NOT NULL,
    `cant_item` INT NOT NULL,
    `unidad` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id_fila_suministros`),
    FOREIGN KEY (`creado_por_id`)
        REFERENCES `empleados` (`id_empleado`),
    FOREIGN KEY (`id_formulario_presupuesto`)
        REFERENCES `formulario_presupuesto` (`id_formulario_presupuesto`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`presupuesto_servicios` (
    `id_formulario_presupuesto` INT NOT NULL,
    `id_fila_servicios` INT AUTO_INCREMENT,
    `nombre_proveedor` VARCHAR(100) NOT NULL,
    `nombre_servicio` VARCHAR(100) NOT NULL,
    `valor_unitario` DECIMAL(12 , 2 ) NOT NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `creado_por_id` INT NOT NULL,
    `cant_item` INT NOT NULL,
    `unidad` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id_fila_servicios`),
    FOREIGN KEY (`creado_por_id`)
        REFERENCES `empleados` (`id_empleado`),
    FOREIGN KEY (`id_formulario_presupuesto`)
        REFERENCES `formulario_presupuesto` (`id_formulario_presupuesto`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`formulario_riesgos`(
  `id_riesgo` INT NOT NULL AUTO_INCREMENT, -- PK propia
  `id_proyecto` INT NOT NULL,             -- FK al proyecto
  `descripcion` TEXT NULL,
  `estado` ENUM('identificado','cercano', 'disparado', 'evitado', 'mitigado', 'aceptado', 'transferido') NULL,
  `fecha_de_identificacion` DATETIME NULL,
  `tipo` ENUM('Negativo','Positivo') NULL,
  `categoria` ENUM('Técnico', 'Diseño', 'Recurso Humano', 'Recurso Fisico', 'Recurso Técnico') NULL,
  `probabilidad` INT NULL CHECK (`probabilidad` BETWEEN 1 AND 5),
  `impacto` INT NULL CHECK (`impacto` BETWEEN 1 AND 5),
  `id_responsable` INT NULL, -- FK a empleados (INT)
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
  FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos`(`id_proyecto`) ON DELETE CASCADE,
  FOREIGN KEY (`id_responsable`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL -- O CASCADE
);

CREATE TABLE `intraNet_DB`.`formulario_verificacion` (
    `id_formulario_verificacion` INT NOT NULL AUTO_INCREMENT,
    `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `id_proyecto` INT NOT NULL,
    PRIMARY KEY (`id_formulario_verificacion`),
    FOREIGN KEY (`id_proyecto`)
        REFERENCES `proyectos` (`id_proyecto`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`lista_cumplimiento_requerimientos` (
    `id_formulario_verificacion` INT NOT NULL,
    `id_fila_cumplimiento_requerimientos` INT AUTO_INCREMENT NOT NULL,
    `codigo` VARCHAR(50) NULL,
    `tipo` VARCHAR(100) NULL,
    `descripcion` TEXT NULL,
    `observaciones` TEXT NULL,
    `fecha_verificacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `creado_por_id` INT NOT NULL,
    PRIMARY KEY (`id_fila_cumplimiento_requerimientos`),
    FOREIGN KEY (`creado_por_id`)
        REFERENCES `empleados` (`id_empleado`),
    FOREIGN KEY (`id_formulario_verificacion`)
        REFERENCES `formulario_verificacion`(`id_formulario_verificacion`)
        ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`registro_verificacion_aprobacion` (
    `id_formulario_verificacion` INT NOT NULL,
    `id_fila_verificacion_aprobacion` INT AUTO_INCREMENT NOT NULL,
    `fecha` DATE NULL,
    `ver` VARCHAR(100) NULL,
    `observaciones` TEXT NULL,
    `responsable` TEXT NULL,
    `firma_id` INT NOT NULL,
    PRIMARY KEY (`id_fila_verificacion_aprobacion`),
    FOREIGN KEY (`firma_id`)
        REFERENCES `empleados` (`id_empleado`),
    FOREIGN KEY (`id_formulario_verificacion`)
        REFERENCES `formulario_verificacion` (`id_formulario_verificacion`)
        ON DELETE CASCADE
);

-- Tabla de Datos: Formulario "Proceso de Compras"
-- Puede haber múltiples items de compra por proyecto


-- ... Crea otras tablas de DATOS aquí para las demás secciones ...
-- Ej: datos_form_recursos_humanos, datos_form_gestion_documental, etc.
-- Cada una con su PK y su FK a id_proyecto.

-- Inserta los tipos de formulario que usarás
-- Asegúrate que los IDs coincidan con los que usarás en tu lógica o FKs si las pones en tablas de datos
-- INSERT INTO `formularios` (`id_formulario`, `nombre_formulario`, `descripcion`) VALUES
-- (1, 'General', 'Formulario inicial con datos generales del proyecto'),
-- (2, 'Control de Versiones', 'Registro de versiones y cambios del proyecto'),
-- (3, 'Proceso de Compras', 'Seguimiento de items comprados para el proyecto');
-- Añade más tipos según necesites...



/*Notas Importantes:

* **Adapta los Tipos de Datos y Tamaños:** Ajusta los `VARCHAR(n)`, `INT`, `TEXT`, `DECIMAL`, etc., según tus necesidades reales.
* **Restricciones `NULL`/`NOT NULL`:** Define qué campos son obligatorios (`NOT NULL`) y cuáles pueden estar vacíos (`NULL`).
* **Valores `DEFAULT`:** Útiles para campos como `status`, `fecha_registro`, etc.
* **`ON DELETE CASCADE`:** Úsalo con cuidado. Significa que si borras un registro padre (ej. un proyecto), todos los registros hijos relacionados (ej. sus datos de formulario, asignaciones de empleados) se borrarán automáticamente. A veces es lo deseado, otras veces prefieres `ON DELETE SET NULL` o `ON DELETE RESTRICT`.
* **Índices:** Añadí índices básicos para las claves foráneas (`INDEX ...`). Puedes necesitar más índices en columnas que uses frecuentemente en cláusulas `WHERE` o `JOIN` para mejorar el rendimiento de las consultas.
* **Inserta Tipos de Formularios:** Descomenta y adapta las líneas `INSERT INTO formularios...` para poblar tu tabla de tipos de formulario con los IDs y nombres que usarás.

Este script te da una base de datos mucho más normalizada y escalable para gestionar los datos de tus diferentes formularios asociados a cada proyecto. ¡Revísalo y ajústalo a tus necesidades específic*/