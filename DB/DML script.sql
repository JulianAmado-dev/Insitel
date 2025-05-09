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
INSERT INTO `intraNet_DB`.`roles` (`nombre_rol`, `descripcion`) VALUES ('user', 'Tiene la capacidad de ver proyectos'),('admin', 'Tiene la capacidad de ver, crear proyectos y crear usuarios nuevos pero solo en su propia área'),('super-admin', 'Tiene todas las capacidades anteriores en todas las áreas');
INSERT INTO `intraNet_DB`.`areas` (`nombre_area`, `descripcion`) VALUES ('I+D', 'Innovación y desarollo'),
('Operaciones', 'Operaciones operacionales de operatividad operativa'),
('Me lo acabo de inventar', 'este es una prueba para la base de datos y el sidebar');
INSERT INTO `intraNet_DB`.`areas_navegacion` (`id_area`,`nombre_item_navBar`, `descripcion`) VALUES ((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'I+D'),'projects', 'Innovación y desarollo'),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'I+D' LIMIT 1),'Riesgos', 'Operaciones operacionales de operatividad operativa'),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'I+D'),'Lecciones aprendidas', 'este es una prueba para la base de datos y el sidebar'),
((SELECT id_area FROM `intraNet_DB`.`areas` WHERE nombre_area = 'Operaciones'),'SideBarItem para Operaciones', 'este es una prueba para la base de datos y el sidebar');

describe proyectos;