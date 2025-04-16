create database intraNet_DB;

use `intranet_db`;

CREATE TABLE `intraNet_DB`.`empleados` (
    `id_empleado` INT NOT NULL AUTO_INCREMENT,
    `correo` VARCHAR(50) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `rol` VARCHAR(45) DEFAULT 'user',
    `cargo` VARCHAR(45) NULL,
    `area` VARCHAR(45) NOT NULL,
    `nombres` VARCHAR(45) NOT NULL,
    `apellidos` VARCHAR(45) NOT NULL,
    `edad` INT NOT NULL,
    `direccion` VARCHAR(45) NOT NULL,
    `ciudad` VARCHAR(45) NOT NULL,
    `sede_insitel` VARCHAR(45) NOT NULL DEFAULT 'sede_principal',
    `foto_empleado` BLOB,
    PRIMARY KEY (`id_empleado`)
);

CREATE TABLE `intraNet_DB`.`proyectos` (
    `id_proyecto` INT NOT NULL AUTO_INCREMENT,
    `nombre_proyecto` VARCHAR(100),
    `empresa_asociada` VARCHAR(50),
    `progress` INT DEFAULT '0',
    `status` VARCHAR(45) DEFAULT 'en progreso',
    `priority` INT,
    `summary` VARCHAR(100),
    `area` VARCHAR(100),
    `color` VARCHAR(50) DEFAULT '#F97316',
    `fecha_inicio` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_proyecto`)
);

CREATE TABLE `intraNet_DB`.`empleados_proyectos` (
    `id_proyecto` INT NOT NULL,
    `id_empleado` INT NOT NULL,
    `permisos` VARCHAR(45) DEFAULT 'lector' NOT NULL,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyectos (id_proyecto),
    FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado)
);
/*CREATE TABLE `intraNet_DB`.`roles` (
	`id_rol` INT NOT NULL,
    `nombre_rol` varchar(45),
    `permisos_del_rol` varchar(100),
    
    primary key (`id_rol`)
);*/

CREATE TABLE `intraNet_DB`.`formularios` (
    `title` VARCHAR(100) DEFAULT 'PLANEACIÖN Y CONTROL DE PROYECTOS I+D+i',
    id_formulario INT NOT NULL,
    nombre_formulario VARCHAR(45),
    PRIMARY KEY (id_formulario)
);

CREATE TABLE `intraNet_DB`.`formularios_proyectos` (
    `id_formulario` INT NOT NULL,
    `id_proyecto` INT NOT NULL,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyectos (id_proyecto),
    FOREIGN KEY (id_formulario)
        REFERENCES formularios (id_formulario)
);

CREATE TABLE `intraNet_DB`.`formulario_general` (
    `id_proyecto` INT NOT NULL,
    `title_Form` VARCHAR(50) DEFAULT 'General',
    `area` VARCHAR(50),
    `nombre` VARCHAR(50),
    `telefono` INT,
    `descripcion_general_de_solicitud` VARCHAR(100),
    `genera_cambio_de_tipo` ENUM('Estandar', 'Recurrente', 'De emergencia'),
    `title_cntrl_vrs` VARCHAR(50) DEFAULT 'Control de Versiones',
    `Ver.` DECIMAL,
    `Fecha_actualizacion` DATE,
    `cntrl_vrs_descripcion` VARCHAR(100),
    `title_info_requerimientos` VARCHAR(50) DEFAULT 'información general del requerimiento',
    `nombre_del_proyecto VARCHAR(50),
    `tipo_proyecto ENUM('Hardware', 'Software'),
    `componentes_hardware ENUM('PCB', 'Sistema Embebido') NULL,
    `otro_valor_componentes_hardware VARCHAR(100),
    `componentes_software ENUM('WEB', 'Escritorio', 'Servidor', 'Móvil') NULL,
    `otro_valor_componentes_software VARCHAR(100),
    `entregables_software_hardware VARCHAR(300),
    `definicion_indicadores_proyecto VARCHAR(300),
    `posibles_consecuencias VARCHAR(300),
    `fecha_inicio DATETIME,
    `fecha_final DATETIME,
    `fecha_total DATETIME,
    `nivel_software INT CHECK (nivel_software BETWEEN 1 AND 4),
    `nivel_hardware INT CHECK (nivel_hardware BETWEEN 1 AND 4),
    `title_info_cliente VARCHAR(50) DEFAULT 'Información del cliente',
    `departamento_interno VARCHAR(200),
    cliente_final VARCHAR(200),
    title_rh VARCHAR(50) DEFAULT 'Recursos humanos',
    rol VARCHAR(200),
    nombre_empleado VARCHAR(200),
    responsabilidades VARCHAR(200),
    title_prcs_compras VARCHAR(50) DEFAULT 'Proceso de Compras',
    proveedor VARCHAR(200),
    descripcion VARCHAR(200),
    cant INT,
    total_usd INT,
    total_cop INT,
    oc INT,
    estado ENUM('En espera de aprobación', 'aprobado', 'Comprado', 'En espera de entrega'),
    title_gestion_documental VARCHAR(50) DEFAULT 'Gestión documental',
    ruta_proyecto_desarrollo VARCHAR(200),
    ruta_cotizacion VARCHAR(200),
    documento_ideas_iniciales INT,
    documento_especificaciones INT,
    especificacion_casos_de_uso INT,
    documento_diseño_sistema INT,
    plan_de_pruebas INT,
    manuales INT,
    liberacion_producto INT,
    title_estado_proyecto VARCHAR(50) DEFAULT 'Estado de proyecto',
    etapa VARCHAR(100),
    porcentaje INT,
    FOREIGN KEY (id_formulario)
        REFERENCES formularios (id_formulario)
)