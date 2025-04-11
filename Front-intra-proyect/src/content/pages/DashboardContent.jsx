import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./DashboardContent.css";

const projects = [
  {
    id: 1,
    name: "Acueducto Santana",
    status: "En Progreso",
    sprintData: [
      { sprint: "Sprint 1", completed: 20, total: 30 },
      { sprint: "Sprint 2", completed: 25, total: 30 },
      { sprint: "Sprint 3", completed: 15, total: 30 },
      { sprint: "Sprint 4", completed: 28, total: 30 },
    ],
  },
  {
    id: 2,
    name: "Integraciones metro",
    status: "Completado",
    sprintData: [
      { sprint: "Sprint 1", completed: 30, total: 30 },
      { sprint: "Sprint 2", completed: 28, total: 30 },
      { sprint: "Sprint 3", completed: 30, total: 30 },
      { sprint: "Sprint 4", completed: 30, total: 30 },
    ],
  },
];

export function DashboardContent() {
  return (
    <div className="content">
      <div className="content_grid">
        {projects.map((project) => (
          <div key={project.id} className="content__card">
            <div className="content__card-header">
              <h2 className="content__card-title">{project.name}</h2>
              <div className="content__card-status">
                Estado: {project.status}
              </div>
            </div>
            <div className="content__card-body">
              <div className="content__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={project.sprintData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--primary-color)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--muted-color)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
