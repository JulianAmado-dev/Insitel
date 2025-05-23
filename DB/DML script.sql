INSERT INTO intranet_db.empleados (correo,contrasena,rol,area,nombres,apellidos,edad,direccion,ciudad) VALUES ('julian@gmail.com', '$2b$10$SsyR5iGVR4VIqzUr/TMa5u9UCjzx/JadPiB4QFQTl61i1GsSbO.Eu',"admin",2,"Julian","Amado",21,"cra 109 # b 41 2","Bogotá");
INSERT INTO intranet_db.empleados (correo,contrasena,rol,area,nombres,apellidos,edad,direccion,ciudad) VALUES ('camila@gmail.com', '$2b$10$SsyR5iGVR4VIqzUr/TMa5u9UCjzx/JadPiB4QFQTl61i1GsSbO.Eu',"user",1,"Camila","Sanchez",25,"cra 109 # b 41 2","Bogotá");
INSERT INTO proyectos (
    area, 
    color, 
    empresa_asociada, 
    fecha_inicio, 
    id_proyecto, 
    nombre_proyecto, 
    priority, 
    progress, 
    status, 
    summary
) VALUES 
(
    'I+D', 
    '#3B82F6', 
    'insitel', 
    '2025-03-27', 
    1, 
    'Prueba de creación de proyectos', 
    3, 
    65, 
    'en progreso', 
    'Desarrollo de metodología de innovación'
),
(
    'I+D', 
    '#10B981', 
    'insitel', 
    '2025-03-27', 
    2, 
    'Desarrollo de nueva tecnología', 
    2, 
    45, 
    'en progreso', 
    'Investigación en sistemas de inteligencia artificial'
),
(
    'I+D', 
    '#EAB308', 
    'insitel', 
    '2025-03-27', 
    3, 
    'Proyecto de innovación', 
    4, 
    30, 
    'pausado', 
    'Exploración de tecnologías emergentes'
),
(
    'I+D', 
    '#F43F5E', 
    'insitel', 
    '2025-03-27', 
    4, 
    'Investigación avanzada', 
    1, 
    80, 
    'completado', 
    'Mejoramiento de procesos de innovación'
),
(
    'I+D', 
    '#8B5CF6', 
    'insitel', 
    '2025-03-27', 
    5, 
    'Prototipo experimental', 
    3, 
    55, 
    'en progreso', 
    'Creación de prototipo de tecnología disruptiva'
),
(
    'I+D', 
    '#22D3EE', 
    'insitel', 
    '2025-03-27', 
    6, 
    'Estudio de viabilidad', 
    2, 
    40, 
    'pausado', 
    'Evaluación de mercado para nuevas soluciones'
),
(
    'I+D', 
    '#F97316', 
    'insitel', 
    '2025-03-27', 
    7, 
    'Laboratorio de pruebas', 
    4, 
    25, 
    'pausado', 
    'Desarrollo de metodologías de testeo'
),
(
    'I+D', 
    '#14B8A6', 
    'insitel', 
    '2025-03-27', 
    8, 
    'Proyecto estratégico', 
    1, 
    90, 
    'completado', 
    'Transformación digital empresarial'
),
(
    'I+D', 
    '#6366F1', 
    'insitel', 
    '2025-03-27', 
    9, 
    'Investigación aplicada', 
    3, 
    60, 
    'pausado', 
    'Desarrollo de soluciones adaptativas'
),
(
    'I+D', 
    '#EC4899', 
    'insitel', 
    '2025-03-27', 
    10, 
    'Proyecto de vanguardia', 
    2, 
    50, 
    'en progreso', 
    'Exploración de tecnologías de futuro'
);
INSERT INTO empleados_proyectos(id_empleado, id_proyecto, permisos) VALUES (1,2,"editor");
INSERT INTO empleados_proyectos(id_empleado, id_proyecto, permisos) VALUES (2,1,"editor");
INSERT INTO `intraNet_DB`.`roles` (`nombre_rol`, `descripcion`) VALUES 
('user', 'Tiene la capacidad de ver proyectos'),
('admin', 'Tiene la capacidad de ver, crear proyectos y crear usuarios nuevos pero solo en su propia área'),
('super-admin', 'Tiene todas las capacidades anteriores en todas las áreas');
INSERT INTO `intraNet_DB`.`areas` (`nombre_area`, `descripcion`, `logo_area`) VALUES 
('I+D', 'Innovación y desarollo', 'logo_sigar'),
('Operaciones', 'Operaciones operacionales de operatividad operativa', 'logo_random'),
('Recursos Humanos', 'este es una prueba para la base de datos y el sidebar', 'logo_insitel');
INSERT INTO `intraNet_DB`.`areas_navegacion` (`id_area`,`nombre_item_navBar`, `ruta` , `descripcion`, `padre`, `is_father`) VALUES 
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'I+D' LIMIT 1),'Proyectos', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'Innovación y desarollo', null, false),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'I+D' LIMIT 1),'Riesgos', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'Operaciones operacionales de operatividad operativa', null, false),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'I+D' LIMIT 1),'Lecciones aprendidas', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'este es una prueba para la base de datos y el sidebar', null, false),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Operaciones' LIMIT 1),'SideBarItem para Operaciones', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'este es una prueba para la base de datos y el sidebar', null, false),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso de humano 1', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'Innovación y desarollo', null, true),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso de humano 2', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'Operaciones operacionales de operatividad operativa', null, true),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso de humano 3', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'este es una prueba para la base de datos y el sidebar', null, true),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso Externo 1', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'este es una prueba para la base de datos y el sidebar',null, false);

SET @padre_recursos_1 = (SELECT id_item_nav FROM `intraNet_DB`.`areas_navegacion` WHERE nombre_item_navBar = 'Recurso de humano 1' LIMIT 1);
SET @padre_recursos_2 = (SELECT id_item_nav FROM `intraNet_DB`.`areas_navegacion` WHERE nombre_item_navBar = 'Recurso de humano 2' LIMIT 1);
SET @padre_recursos_3 = (SELECT id_item_nav FROM `intraNet_DB`.`areas_navegacion` WHERE nombre_item_navBar = 'Recurso de humano 3' LIMIT 1);

INSERT INTO `intraNet_DB`.`areas_navegacion`(`id_area`,`nombre_item_navBar`, `ruta` , `descripcion`, `padre`) VALUES 
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso interno 1', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'Innovación y desarollo',@padre_recursos_1),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso interno 2', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'Operaciones operacionales de operatividad operativa',@padre_recursos_2),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Recursos Humanos' LIMIT 1),'Recurso interno 3', 'http://localhost:5173/dashboard/I+D/Proyectos' , 'este es una prueba para la base de datos y el sidebar',@padre_recursos_3); 
-- Insertar datos en formulario_general
INSERT INTO `intraNet_DB`.`formulario_general` (
    `id_proyecto`, 
    `area_solicitante`, 
    `nombre_solicitante`, 
    `descripcion_solicitud`, 
    `genera_cambio_tipo`,
    `tipo_proyecto`,
    `nivel_hardware`,
    `componentes_hardware`,
    `nivel_software`,
    `componentes_software`,
    `entregables`,
    `requisitos_seguimiento_y_medicion`,
    `criterios_de_aceptacion`,
    `consecuencias_por_fallar`,
    `fecha_inicio_planificada`,
    `fecha_final_planificada`,
    `departamento_interno`,
    `cliente_final`,
    `ruta_proyecto_desarrollo`,
    `ruta_cotizacion`,
    `aplica_doc_ideas_iniciales`,
    `aplica_doc_especificaciones`,
    `aplica_doc_casos_uso`,
    `aplica_doc_diseno_sistema`,
    `aplica_doc_plan_pruebas`,
    `aplica_doc_manuales`,
    `aplica_doc_liberacion`,
    `ref_doc_ideas_iniciales`,
    `ref_doc_especificaciones`,
    `verif_doc_ideas_iniciales`,
    `verif_doc_diseno_sistema`
) VALUES (
    7,
    'IT',
    'Carlos Mendoza',
    'Desarrollo de un nuevo sistema de gestión documental',
    'Estandar',
    'Software',
    3,
    'PCB',
    2,
    'WEB',
    'Aplicación web funcional y documentación técnica',
    'Pruebas unitarias y de integración',
    'Cumplimiento de requisitos funcionales y no funcionales',
    'Retraso en entrega y penalizaciones contractuales',
    DATE_ADD(NOW(), INTERVAL 15 DAY),
    DATE_ADD(NOW(), INTERVAL 6 MONTH),
    'Tecnología',
    'Ministerio de Educación',
    'https://gitlab.example.com/project7 ',
    '/archivos/cotizacion7.pdf',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    'DOC-789',
    'SPEC-1023',
    TRUE,
    FALSE
);

-- Insertar datos en proyecto_equipo
INSERT INTO `intraNet_DB`.`proyecto_equipo` (
    `id_proyecto`, 
    `id_empleado`, 
    `rol_en_proyecto`, 
    `responsabilidades`
) VALUES
    (7, 1, 'Gerente de Proyecto', 'Responsable del cronograma y recursos'),
    (7, 2, 'Desarrollador FullStack', 'Desarrollo frontend y backend'),
    (7, NULL, 'Diseñador UX', 'Diseño de interfaces de usuario');

-- Insertar datos en proyecto_compras
INSERT INTO `intraNet_DB`.`proyecto_compras` (
    `id_proyecto`, 
    `creado_por_id`, 
    `proveedor`, 
    `descripcion`, 
    `cantidad`, 
    `unidad_medida`, 
    `total_usd`, 
    `total_cop`, 
    `orden_compra`, 
    `estado_compra`
) VALUES
    (7, 1, 'TechSupplies SA', 'Servidores cloud para desarrollo', 5, 'unidad', 2500.00, 9375000.00, 'OC-7-001', 'Aprobado'),
    (7, 1, 'Software Solutions Ltd', 'Licencias de software especializado', 10, 'licencia', 1500.00, 5625000.00, 'OC-7-002', 'En espera de aprobación');

-- Insertar datos en formulario_alcance
INSERT INTO `intraNet_DB`.`formulario_alcance` (
    `id_proyecto`,
    `descripcion_cuantitativa`,
    `comportamiento_esperado`,
    `otros_temas_relevantes`,
    `procedimiento_actual`,
    `problema_necesidad`,
    `entorno_actores`,
    `limitaciones`
) VALUES (
    7,
    'Desarrollo de 12 módulos funcionales en 6 meses',
    'Sistema operativo 24/7 con >99.9% de disponibilidad',
    'Integración con sistemas legacy y cumplimiento de GDPR',
    'Actualmente se usan herramientas manuales y hojas de cálculo',
    'Necesidad de automatizar el flujo de trabajo documental',
    'Actores: Gerente de proyecto, equipo de desarrollo, departamento de IT, usuarios finales',
    'Presupuesto máximo de $15,000 USD y plazo de 6 meses'
);

-- Insertar datos en formulario presupuesto INSERT INTO `intraNet_DB`.`formulario_presupuesto` (
INSERT INTO `intraNet_DB`.`formulario_presupuesto` (
    `id_proyecto`, `creado_por_id`, 
    `total_rh_calculado`, `total_suministros_calculado`, `total_servicios_calculado`
) VALUES (
    7, 1, -- Proyecto 7, creado por el empleado 10
    25000.00, 15000.00, 30000.00 -- Totales ficticios
);

-- Insertar en presupuesto_rh (Recursos Humanos)
INSERT INTO `intraNet_DB`.`presupuesto_rh` (
    `id_proyecto`, `id_empleado_asignado`, `nombre_recurso`, 
    `salario_mensual`, `salario_mensual_parafiscales`, 
    `costo_dia`, `cantidad_dias`, `valor_total_linea`, `creado_por_id`
) VALUES
(7, 1, 'Desarrollador Senior', 5000.00, 500.00, 200.00, 10.00, 2000.00, 1),
(7, 2, 'Arquitecto de Software', 6000.00, 600.00, 250.00, 10.00, 2500.00, 1),
(7, NULL, 'Consultor Externo', 0.00, 0.00, 300.00, 15.00, 4500.00, 1);

-- Insertar en presupuesto_suministro (Suministros)
INSERT INTO `intraNet_DB`.`presupuesto_suministro` (
    `id_proyecto`, `nombre_proveedor`, `nombre_item`, 
    `cantidad_suministro`, `unidad_de_medida`, 
    `valor_unitario_suministro`, `valor_total_linea`, `creado_por_id`
) VALUES
(7, 'Proveedor A', 'Laptops', 5.00, 'Unidad', 1000.00, 5000.00, 1),
(7, 'Proveedor B', 'Licencias de Software', 10.00, 'Paquete', 500.00, 5000.00, 1),
(7, 'Proveedor C', 'Materiales de Oficina', 20.00, 'Kilo', 250.00, 5000.00, 1);

-- Insertar en presupuesto_servicio (Servicios)
INSERT INTO `intraNet_DB`.`presupuesto_servicio` (
    `id_proyecto`, `nombre_proveedor`, `nombre_servicio`, 
    `cantidad_servicio`, `unidad_de_medida`, 
    `valor_unitario`, `valor_total_linea`, `creado_por_id`
) VALUES
(7, 'Empresa de Pruebas', 'Pruebas de Penetración', 2.00, 'Servicio', 5000.00, 10000.00, 1),
(7, 'Consultoría XYZ', 'Auditoría de Seguridad', 3.00, 'Visita', 4000.00, 12000.00, 1),
(7, 'Soporte Técnico S.A.', 'Mantenimiento de Servidores', 5.00, 'Hora', 1600.00, 8000.00, 1);
-- Insertar datos en el formulario de verificación 
INSERT INTO `intraNet_DB`.`formulario_verificacion` (
    `id_proyecto`, `creado_por_id`, `version_verificada`
) VALUES (
    7, 1, 'v1.0.0' -- Proyecto 7, creado por el empleado 1, versión ficticia
);

-- Insertar en verificacion_cumplimiento_requerimientos (Requisitos verificados)
-- Suponemos que el id_formulario_verificacion generado es 1 (ajustar según el ID real)
INSERT INTO `intraNet_DB`.`verificacion_cumplimiento_requerimientos` (
    `id_formulario_verificacion`, `codigo_requisito`, `tipo_requisito`, 
    `descripcion_requisito`, `cumple`, `observaciones`, `verificado_por_id`
) VALUES
(1, 'REQ-001', 'Funcional', 'El sistema debe autenticar usuarios correctamente', TRUE, 'Pruebas exitosas', 1),
(1, 'REQ-002', 'No Funcional', 'El sistema debe responder en menos de 2 segundos', FALSE, 'Rendimiento insuficiente en pruebas', 1),
(1, 'REQ-003', 'Seguridad', 'Cifrado de datos sensibles obligatorio', TRUE, 'Implementado con TLS 1.3', 1);

-- Insertar en registro_verificacion_aprobacion (Aprobaciones del formulario)
-- Suponemos que el id_formulario_verificacion generado es 1 (ajustar según el ID real)
INSERT INTO `intraNet_DB`.`registro_verificacion_aprobacion` (
    `id_formulario_verificacion`, `fecha_aprobacion`, `version_aprobada`, 
    `observaciones`, `nombre_responsable`, `firma_id`
) VALUES
(1, '2023-10-20', 'v1.0.0', 'Aprobado con observaciones menores', 'Gerente de Proyecto', 1),
(1, '2023-10-21', 'v1.0.1', 'Correcciones realizadas y verificadas', 'Arquitecto Técnico', 2);