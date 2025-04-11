INSERT INTO intranet_db.empleados (correo,contrasena,rol,area,nombres,apellidos,edad,direccion,ciudad) VALUES ('julian@gmail.com', '$2b$10$SsyR5iGVR4VIqzUr/TMa5u9UCjzx/JadPiB4QFQTl61i1GsSbO.Eu',"super-user",2,"Julian","Amado",21,"cra 109 # b 41 2","Bogotá");
INSERT INTO intranet_db.empleados (correo,contrasena,rol,area,nombres,apellidos,edad,direccion,ciudad) VALUES ('camila@gmail.com', '$2b$10$SsyR5iGVR4VIqzUr/TMa5u9UCjzx/JadPiB4QFQTl61i1GsSbO.Eu',"user",1,"Camila","Sanchez",25,"cra 109 # b 41 2","Bogotá");
INSERT INTO empleados_proyectos(id_empleado, id_proyecto, permisos) VALUES (1,1,"editor");
INSERT INTO empleados_proyectos(id_empleado, id_proyecto, permisos) VALUES (2,1,"editor");

describe proyectos;

SELECT 
    p.id_proyecto,
    p.nombre_proyecto,
    p.status,
    p.priority,
    p.descripcion,
    p.area,
    p.fecha_inicio,
    GROUP_CONCAT(e.nombres
        SEPARATOR ', ') AS nombres_empleados
FROM
    proyectos AS p
        LEFT JOIN
    empleados_proyectos ep ON p.id_proyecto = ep.id_proyecto
        LEFT JOIN
    empleados AS e ON ep.id_empleado = e.id_empleado
GROUP BY p.id_proyecto;

SELECT p.id_proyecto,
            p.nombre_proyecto,
            p.status,p.priority,
            p.summary,p.area,
            p.fecha_inicio,
            GROUP_CONCAT(e.nombres SEPARATOR ', ') AS nombres_empleado 
            FROM proyectos AS p
            LEFT JOIN empleados_proyectos ep ON p.id_proyecto = ep.id_proyecto 
            LEFT JOIN empleados AS e ON ep.id_empleado = e.id_empleado 
            WHERE area = I+D;
