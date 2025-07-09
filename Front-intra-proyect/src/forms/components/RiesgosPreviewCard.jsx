import { AlertOctagon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'; // Importar PropTypes
import './RiesgosPreviewCard.css'; // Crearemos este archivo CSS después

const RiesgosPreviewCard = ({ risksSummary, projectId, projectArea }) => { // Re-añadido projectId
  const navigate = useNavigate();

  const handleNavigateToRiesgos = () => {
    // Navegar a la vista de riesgos, pasando projectId como query param
    navigate(`/dashboard/${projectArea}/riesgos?proyecto=${projectId}`);
  };

  const totalRiesgos = risksSummary?.cant_riesgos || 0;
  const criticos = risksSummary?.cant_riesgos_criticos || 0;
  const moderados = risksSummary?.cant_riesgos_moderados || 0;
  const leves = risksSummary?.cant_riesgos_leves || 0;
  // const nulos = risksSummary?.cant_riesgos_nulos || 0; // Podríamos mostrarlo si hay espacio

  return (
    <div className="riesgos-preview-card forms-card">
      <header className="form-header riesgos">
        <div className="header-div">
          <AlertOctagon className="form-icon" />
          <h2>Resumen de Riesgos</h2>
        </div>
        <p>Visualización rápida de los riesgos del proyecto.</p>
      </header>
      <div className="form-content">
        {totalRiesgos > 0 ? (
          <>
            <p className="total-riesgos">
              <strong>Total Riesgos:</strong> {totalRiesgos}
            </p>
            <ul className="riesgos-summary-list">
              {criticos > 0 && (
                <li>
                  <span className="risk-critical-dot"></span>
                  {criticos} Crítico{criticos > 1 ? 's' : ''}
                </li>
              )}
              {moderados > 0 && (
                <li>
                  <span className="risk-moderate-dot"></span>
                  {moderados} Moderado{moderados > 1 ? 's' : ''}
                </li>
              )}
              {leves > 0 && (
                <li>
                  <span className="risk-low-dot"></span>
                  {leves} Leve{leves > 1 ? 's' : ''}
                </li>
              )}
              {/* Podríamos añadir los nulos si es relevante */}
            </ul>
          </>
        ) : (
          <p className="no-riesgos-message">
            ¡Excelente! No se han identificado riesgos para este proyecto.
          </p>
        )}
      </div>
      <footer className="form-footer">
        <button className="form-button" onClick={handleNavigateToRiesgos}>
          Ver Detalles de Riesgos
          <ChevronRight size={18} style={{ marginLeft: '5px' }} />
        </button>
      </footer>
    </div>
  );
};

RiesgosPreviewCard.propTypes = {
  risksSummary: PropTypes.shape({
    cant_riesgos: PropTypes.number,
    cant_riesgos_criticos: PropTypes.number,
    cant_riesgos_moderados: PropTypes.number,
    cant_riesgos_leves: PropTypes.number,
    cant_riesgos_nulos: PropTypes.number,
  }),
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Re-añadido propType para projectId
  projectArea: PropTypes.string.isRequired,
};

RiesgosPreviewCard.defaultProps = {
  risksSummary: {
    cant_riesgos: 0,
    cant_riesgos_criticos: 0,
    cant_riesgos_moderados: 0,
    cant_riesgos_leves: 0,
    cant_riesgos_nulos: 0,
  },
};

export default RiesgosPreviewCard;
