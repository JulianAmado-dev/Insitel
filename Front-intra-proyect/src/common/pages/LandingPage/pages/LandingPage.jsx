"use client";

import { useState } from "react";
import {
  FaRocket,
  FaSpinner,
  FaArrowRight,
  FaClipboardList,
  FaChartLine,
  FaUsers,
} from "react-icons/fa";
import "./LandingPage.css";
import { Link } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const auth = useAuth();

  const handleStartLoading = () => {
    setIsLoading(true);
    setLoadingProgress(0);

    // Simulación de progreso de carga
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          // Redirigir al formulario después de completar la carga
          setTimeout(() => {
            window.location.href = "dashboard/content/main";
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  console.log(auth)

  return (
    <div className="landing-container">
      <div className="landing-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <header className="landing-header">
        <div className="logo">
          <FaRocket className="logo-icon" />
          <span>I+D+i</span>
        </div>
        <nav className="landing-nav">
          {auth.loading ? (
            <div>Cargando...</div>
          ) : auth.isAuthenticated ? (
            <Link to="/dashboard/content/main" className="nav-link">
              Ingresar al sistema
            </Link>
          ) : (
            <Link to="/auth/login" className="nav-link">
              Iniciar sesión
            </Link>
          )}

          <a href="#" className="nav-link">
            Acerca de
          </a>
          <a href="#" className="nav-link">
            Contacto
          </a>
        </nav>
      </header>

      <main className="landing-main">
        <div className="landing-content">
          <h1 className="landing-title">
            Planeación y Control de Proyectos I+D+i
          </h1>
          <p className="landing-description">
            Plataforma integral para la gestión, seguimiento y control de
            proyectos de Investigación, Desarrollo e innovación. Optimice sus
            procesos y mejore la eficiencia de sus proyectos.
          </p>

          <div className="features">
            <div className="feature">
              <FaClipboardList className="feature-icon" />
              <h3>Planificación</h3>
              <p>
                Gestione todos los aspectos de la planificación de proyectos en
                un solo lugar.
              </p>
            </div>
            <div className="feature">
              <FaChartLine className="feature-icon" />
              <p>Seguimiento</p>
              <p>
                Monitoree el progreso y estado de sus proyectos en tiempo real.
              </p>
            </div>
            <div className="feature">
              <FaUsers className="feature-icon" />
              <h3>Colaboración</h3>
              <p>
                Facilite la comunicación y colaboración entre los miembros del
                equipo.
              </p>
            </div>
          </div>

          {!isLoading ? (
            <button
              className="start-button"
              onClick={() => {
                handleStartLoading;
                console.log(auth);
              }}
            >
              Iniciar Sistema <FaArrowRight />
            </button>
          ) : (
            <div className="loading-container">
              <div className="loading-spinner">
                <FaSpinner className="spinner-icon" />
              </div>
              <div className="loading-bar-container">
                <div
                  className="loading-bar"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="loading-text">
                Cargando sistema... {Math.round(loadingProgress)}%
              </p>
            </div>
          )}
        </div>

        <div className="landing-image">
          <img
            src="/placeholder.svg?height=400&width=400"
            alt="Ilustración de gestión de proyectos"
          />
        </div>
      </main>

      <footer className="landing-footer">
        <p>
          &copy; 2025 Sistema de Planeación y Control de Proyectos I+D+i. Todos
          los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
