"use client";

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NotFound.css";
import { replace } from "formik";

const NotFoundPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Crear estrellas dinámicamente
    const space = document.querySelector(".space-background");
    if (space) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement("div");
        star.className = "star";
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDuration = `${Math.random() * 3 + 1}s`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        space.appendChild(star);
      }
    }
  }, []);

  return (
    <div className="not-found-container">
      <div className="space-background"></div>

      <div className="planet"></div>

      <div className="astronaut-container">
        <div className="astronaut">
          <div className="astronaut-helmet">
            <div className="astronaut-glass"></div>
            <div className="astronaut-face"></div>
          </div>
          <div className="astronaut-body">
            <div className="astronaut-backpack"></div>
            <div className="astronaut-suit">
              <div className="suit-detail detail-1"></div>
              <div className="suit-detail detail-2"></div>
              <div className="suit-detail detail-3"></div>
              <div className="astronaut-arm arm-left"></div>
              <div className="astronaut-arm arm-right"></div>
              <div className="astronaut-leg leg-left"></div>
              <div className="astronaut-leg leg-right"></div>
            </div>
          </div>
        </div>

        <div className="astronaut-rope"></div>

        <div className="error-message">
          <div className="error-code">
            <span className="digit">4</span>
            <span className="digit">0</span>
            <span className="digit">4</span>
          </div>
          <h1 className="error-title">¡Página no encontrada!</h1>
          <p className="error-description">
            Parece que te has perdido en el espacio. La página que buscas no
            existe o ha sido movida a otra galaxia.
          </p>
          <button
            className="home-button"
            onClick={() => {
              navigate("/", { replace: true });
            }}
          >
            Volver a la Tierra
            <div className="rocket">
              <div className="rocket-body"></div>
              <div className="rocket-window"></div>
              <div className="rocket-engine">
                <div className="rocket-flame"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="meteor meteor-1"></div>
      <div className="meteor meteor-2"></div>
      <div className="meteor meteor-3"></div>
      <div className="meteor meteor-4"></div>

      <div className="satellite">
        <div className="satellite-body"></div>
        <div className="satellite-panel panel-left"></div>
        <div className="satellite-panel panel-right"></div>
        <div className="satellite-antenna"></div>
      </div>

      <div className="ufo">
        <div className="ufo-body"></div>
        <div className="ufo-glass"></div>
        <div className="ufo-light light-1"></div>
        <div className="ufo-light light-2"></div>
        <div className="ufo-light light-3"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;
