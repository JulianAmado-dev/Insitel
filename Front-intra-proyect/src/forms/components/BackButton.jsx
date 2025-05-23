import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './BackButton.css';

const BackButton = ({ area, id_proyecto }) => {
  // Construct the dynamic path. If area or id_proyecto is missing, default to a safe fallback or handle error.
  const path = (area && id_proyecto) ? `/dashboard/${area}/Proyectos/${id_proyecto}/` : '/forms'; // Fallback to /forms if props are missing

  return (
    <Link to={path} className="back-button" aria-label="Volver">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="back-button-icon">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </Link>
  );
};

BackButton.propTypes = {
  area: PropTypes.string,
  id_proyecto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

BackButton.defaultProps = {
  area: '',
  id_proyecto: '',
};

export { BackButton };
