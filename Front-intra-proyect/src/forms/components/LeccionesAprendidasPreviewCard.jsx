import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'; // Import PropTypes
import { BookOpenText, ChevronRight } from 'lucide-react'; // Using BookOpenText as an example icon
import './LeccionesAprendidasPreviewCard.css'; // We'll create this CSS file next

function LeccionesAprendidasPreviewCard({ lessonsSummary, projectId, projectArea }) {
  const navigate = useNavigate();

  const handleNavigateToFullView = () => {
    // Navigate to the full LeccionesAprendidas view, passing projectId as a query param
    // Adjust the path if your LeccionesAprendidas route is different
    navigate(`/dashboard/${projectArea}/lecciones-aprendidas?proyecto=${projectId}`);
  };

  if (!lessonsSummary) {
    return null; // Or some placeholder if data is not yet available
  }

  const { total_lecciones, recent_lessons = [] } = lessonsSummary;

  return (
    <div className="forms-card lecciones-preview-card" onClick={handleNavigateToFullView}>
      <header className="form-header lecciones"> {/* Added 'lecciones' class for specific styling */}
        <div className="header-div">
          <BookOpenText className="form-icon" />
          <h2>Lecciones Aprendidas</h2>
        </div>
        <p>{total_lecciones} {total_lecciones === 1 ? 'lección registrada' : 'lecciones registradas'}</p>
      </header>
      <div className="form-content lecciones-preview-content">
        {recent_lessons.length > 0 ? (
          <ul className="lessons-summary-list">
            {recent_lessons.slice(0, 3).map((lesson, index) => ( // Show up to 3
              <li key={index} className="lesson-summary-item">
                <strong>{lesson.titulo}</strong>
                <span className={`lesson-type-badge ${lesson.tipo_leccion?.toLowerCase()}`}>
                  {lesson.tipo_leccion}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-lessons-message">No hay lecciones aprendidas para este proyecto aún.</p>
        )}
        {total_lecciones > 3 && (
          <div className="lessons-fade-effect">
            <p>... y más</p>
          </div>
        )}
      </div>
      <footer className="form-footer lecciones-preview-footer">
        <span>Ver todas las lecciones</span>
        <ChevronRight className="list-icon" />
      </footer>
    </div>
  );
}

LeccionesAprendidasPreviewCard.propTypes = {
  lessonsSummary: PropTypes.shape({
    total_lecciones: PropTypes.number,
    recent_lessons: PropTypes.arrayOf(
      PropTypes.shape({
        titulo: PropTypes.string,
        tipo_leccion: PropTypes.string,
        // fecha: PropTypes.string, // Add if you use it directly in preview
      })
    ),
  }),
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  projectArea: PropTypes.string.isRequired,
};

LeccionesAprendidasPreviewCard.defaultProps = {
  lessonsSummary: {
    total_lecciones: 0,
    recent_lessons: [],
  },
};

export default LeccionesAprendidasPreviewCard;
