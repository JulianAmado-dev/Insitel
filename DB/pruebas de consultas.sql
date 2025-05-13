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
(SELECT nombres, apellidos FROM intranet_db.empleados WHERE id_empleado = 1)