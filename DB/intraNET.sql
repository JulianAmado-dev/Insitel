create database intraNet_DB;

use `intranet_db`;

CREATE TABLE `intraNet_DB`.`empleados` (
    `id_empleado` INT NOT NULL AUTO_INCREMENT,
    `correo` VARCHAR(50) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `rol` varchar(45) default'user',
	`cargo` VARCHAR(45) NULL,
	`area` VARCHAR(45) NOT NULL,
	`nombres` VARCHAR(45) NOT NULL,
    `apellidos` VARCHAR(45) NOT NULL,
    `edad` INT NOT NULL,
	`direccion` varchar(45) not null,
    `ciudad` varchar(45) not null,
    `sede_insitel` varchar(45) not null default'sede_principal',
    `foto_empleado` blob,
    PRIMARY KEY (`id_empleado`)
);

CREATE TABLE `intraNet_DB`.`roles` (
	`id_rol` INT NOT NULL,
    `nombre_rol` varchar(45),
    `permisos_del_rol` varchar(100),
    
    primary key (`id_rol`)
);


CREATE TABLE `intraNet_DB`.`proyectos` (
	`id_proyecto` INT NOT NULL AUTO_INCREMENT,
    `nombre_proyecto` varchar(100),
    `empresa_asociada` varchar(50),
    `progress` int default '0',
    `status` varchar(45) default 'en progreso',
    `priority` int,
    `summary` varchar(100),
    `area` varchar(100),
    `color` varchar(50) default '#F97316',
    `fecha_inicio` datetime default current_timestamp,
    `actualizado_en` datetime default current_timestamp,
    
    primary key (`id_proyecto`)
);

CREATE TABLE `intraNet_DB`.`sprint_data`(
	`id_sprint_data` int primary key auto_increment,
    `id_proyecto` INT unique,
    `sprint` int,
    `completed` int,
    `total` int,
	`backlog` varchar(1000),
    `epica` int,
    `epica_title` varchar(50),

	foreign key (id_proyecto) references proyectos(id_proyecto)
    ON DELETE CASCADE
);

CREATE TABLE `intraNet_DB`.`formularios` (
	`id_formulario` INT NOT NULL,
	`nombre_formulario` varchar(45),
    `cod_formulario` varchar(20),
    `descripcion_formulario` varchar(100),
    `fecha_de_aprobación` date,
    
    primary key (`id_formulario`)
);

CREATE TABLE `intraNet_DB`.`formularios_proyectos` (
	`id_formulario` INT NOT NULL,
    `id_proyecto` INT NOT NULL,

	foreign key (id_proyecto) references proyectos(id_proyecto),
    foreign key (id_formulario) references formularios(id_formulario)
);


CREATE TABLE `intraNet_DB`.`empleados_proyectos` (
	`id_proyecto` INT NOT NULL,
    `id_empleado` INT NOT NULL,
    `permisos` varchar(45) default 'lector' not null,

	foreign key (id_proyecto) references proyectos(id_proyecto),
    foreign key (id_empleado) references empleados(id_empleado)
);

CREATE table `intraNet_DB`.`informacion_general_de_solicitud` (
	`id_formulario` int NOT NULL,
	`title` varchar (50),
	`area` varchar(50),
    `nombre` varchar(50),
    `telefono` int,
    `descripcion_general_de_solicitud` varchar(100),
    `genera_cambio_de_tipo`ENUM ('Estandar','Recurrente','De emergencia'),

	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE TABLE `intraNet_DB`.`control_de_versiones` (
	`id_formulario` int NOT NULL,
	`title` varchar (50),
    `Ver.` decimal, 
    `Fecha_actualizacion` date,
    `descripcion` varchar (100),
	
	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE table `intraNet_DB`.`informacion_general_del_requerimiento` (
	`id_formulario` int NOT NULL,
	`title` varchar (50),
	`nombre_del_proyecto` varchar(50),
    `tipo_proyecto` ENUM('Hardware', 'Software'),
    `componentes_hardware` ENUM('PCB','Sistema Embebido') Null,
    `otro_valor_componentes_hardware` varchar(100),
	`componentes_software` ENUM('WEB','Escritorio','Servidor','Móvil') Null,
    `otro_valor_componentes_software` varchar(100),
    `entregables_software_hardware` varchar(300),
    `definicion_indicadores_proyecto` varchar(300),
    `posibles_consecuencias` varchar(300),
    `fecha_inicio` datetime,
    `fecha_final` datetime,
    `fecha_total` datetime,

	`nivel_software` int CHECK(nivel_software between 1 and 4),
    `nivel_hardware` int CHECK(nivel_hardware between 1 and 4),
	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE TABLE `intraNet_DB`.`informacion_cliente` (
	`id_formulario` int NOT NULL,
    `title` varchar (50),
	`departamento_interno` varchar (200),
    `cliente_final` varchar(200),
	
	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE TABLE `intraNet_DB`.`recursos_humanos` (
	`id_formulario` int NOT NULL,
    `title` varchar (50),
	`rol` varchar (200),
    `nombre_empleado.` varchar(200),
	`responsabilidades` varchar(200),
    
	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE TABLE `intraNet_DB`.`proceso_compras` (
	`id_formulario` int NOT NULL,
    `title` varchar (50),
	`proveedor` varchar (200),
    `descripcion` varchar(200),
	`cant` INT,
    `total_usd` INT,
    `total_cop` INT,
    `oc` INT,
    `estado` ENUM('En espera de aprobación','aprobado','Comprado','En espera de entrega'),
    
	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE TABLE `intraNet_DB`.`gestion_documental` (
	`id_formulario` int NOT NULL,
    `title` varchar (50),
	`ruta_proyecto_desarrollo` varchar (200),
    `ruta_cotizacion` varchar(200),
    
	`documento_ideas_iniciales` INT,
    `documento_especificaciones` INT,
    `especificacion_casos_de_uso` INT,
	`documento_diseño_sistema` INT,
    `plan_de_pruebas` INT,
    `manuales` INT,
    `liberacion_producto` INT,

    
	foreign key (id_formulario) references formularios(id_formulario)
);

CREATE TABLE `intraNet_DB`.`estado_proyecto` (
	`id_formulario` int NOT NULL,
    `title` varchar (50),
	`etapa` varchar (100),
    `porcentaje` INT,
    
	foreign key (id_formulario) references formularios(id_formulario)
);