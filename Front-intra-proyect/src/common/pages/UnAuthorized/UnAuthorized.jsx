"use client"

import { useEffect } from "react"
import { Link } from "react-router-dom"
import "./Unauthorized.css"

const UnauthorizedPage = () => {
  useEffect(() => {
    // Crear partículas de código binario
    const codeBackground = document.querySelector(".code-background")
    if (codeBackground) {
      for (let i = 0; i < 50; i++) {
        const binary = document.createElement("div")
        binary.className = "binary-code"
        binary.textContent = Math.random() > 0.5 ? "1" : "0"
        binary.style.top = `${Math.random() * 100}%`
        binary.style.left = `${Math.random() * 100}%`
        binary.style.animationDuration = `${Math.random() * 10 + 5}s`
        binary.style.animationDelay = `${Math.random() * 5}s`
        binary.style.opacity = Math.random() * 0.7 + 0.3
        binary.style.fontSize = `${Math.random() * 14 + 10}px`
        codeBackground.appendChild(binary)
      }
    }

    // Crear la onda para el vault
    const waveContainer = document.querySelector(".vault-wave-container")
    if (waveContainer) {
      const canvas = document.createElement("canvas")
      canvas.width = waveContainer.offsetWidth
      canvas.height = waveContainer.offsetHeight
      waveContainer.appendChild(canvas)

      const ctx = canvas.getContext("2d")
      const waves = {
        y: canvas.height / 2,
        length: 100,
        amplitude: 20,
        frequency: 0.01,
      }

      let time = 0

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)

        for (let i = 0; i < canvas.width; i++) {
          const x = i
          const y = waves.y + Math.sin(i * waves.frequency + time) * waves.amplitude
          ctx.lineTo(x, y)
        }

        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()
        time += 0.05
        requestAnimationFrame(animate)
      }

      animate()
    }
  }, [])

  return (
    <div className="unauthorized-container">
      <div className="code-background"></div>

      <div className="security-grid">
        <div className="grid-line horizontal-line-1"></div>
        <div className="grid-line horizontal-line-2"></div>
        <div className="grid-line horizontal-line-3"></div>
        <div className="grid-line vertical-line-1"></div>
        <div className="grid-line vertical-line-2"></div>
        <div className="grid-line vertical-line-3"></div>
      </div>

      <div className="security-camera">
        <div className="camera-body">
          <div className="camera-lens">
            <div className="camera-iris"></div>
          </div>
          <div className="camera-light"></div>
        </div>
        <div className="camera-mount"></div>
      </div>

      <div className="security-system">
        <div className="vault-door">
          <div className="vault-logo">
            <svg className="sigar-logo-svg" viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" fill="white">
              {/* Símbolo espiral exacto al original */}
              <g>
                <path
                  d="M40,60 C25,60 15,50 15,35 C15,20 25,10 40,10 C55,10 65,20 65,35 C65,42 60,48 53,50"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="53" cy="50" r="3" fill="white" />
              </g>

              {/* Texto "SIGAR" exacto al original */}
              <g>
                {/* S */}
                <path
                  d="M80,25 C80,20 85,15 92,15 C99,15 104,20 104,25 C104,35 80,35 80,45 C80,50 85,55 92,55 C99,55 104,50 104,45"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* I */}
                <line x1="115" y1="15" x2="115" y2="55" stroke="white" strokeWidth="4" strokeLinecap="round" />

                {/* G */}
                <path
                  d="M140,25 C140,20 135,15 128,15 C121,15 116,20 116,35 C116,50 121,55 128,55 C135,55 140,50 140,45 M140,35 L130,35"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* A */}
                <path
                  d="M150,55 L160,15 L170,55 M153,40 L167,40"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* R */}
                <path
                  d="M180,15 L180,55 M180,15 C180,15 195,15 195,25 C195,35 180,35 180,35 C180,35 190,35 195,55"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>
          <div className="vault-wave-container"></div>
        </div>

        <div className="security-message">
          <div className="security-badge">
            <div className="badge-icon">
              <div className="lock">
                <div className="lock-body"></div>
                <div className="lock-shackle"></div>
              </div>
            </div>
            <div className="badge-text">ACCESO DENEGADO</div>
          </div>

          <h1 className="error-title">No estás autorizado</h1>
          <p className="error-description">
            Lo sentimos, no tienes permisos para acceder a esta área. Esta sección requiere credenciales de seguridad
            adicionales.
          </p>

          <div className="action-buttons">
            <Link to="/auth/login" className="login-button">
              Iniciar Sesión
              <div className="key-icon">
                <div className="key-head"></div>
                <div className="key-shaft"></div>
                <div className="key-teeth"></div>
              </div>
            </Link>

            <Link to="/" className="home-button">
              Volver al Inicio
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="home-icon"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </Link>
          </div>

          <div className="security-scan">
            <div className="scan-line"></div>
          </div>
        </div>
      </div>

      <div className="fingerprint-container">
        <div className="fingerprint">
          <div className="fingerprint-line line-1"></div>
          <div className="fingerprint-line line-2"></div>
          <div className="fingerprint-line line-3"></div>
          <div className="fingerprint-line line-4"></div>
          <div className="fingerprint-line line-5"></div>
          <div className="fingerprint-line line-6"></div>
          <div className="fingerprint-circle circle-1"></div>
          <div className="fingerprint-circle circle-2"></div>
          <div className="scan-result">IDENTIDAD NO VERIFICADA</div>
        </div>
      </div>

      <div className="security-drone">
        <div className="drone-body">
          <div className="drone-camera"></div>
        </div>
        <div className="drone-propeller propeller-1">
          <div className="propeller-blade"></div>
          <div className="propeller-blade"></div>
        </div>
        <div className="drone-propeller propeller-2">
          <div className="propeller-blade"></div>
          <div className="propeller-blade"></div>
        </div>
        <div className="drone-propeller propeller-3">
          <div className="propeller-blade"></div>
          <div className="propeller-blade"></div>
        </div>
        <div className="drone-propeller propeller-4">
          <div className="propeller-blade"></div>
          <div className="propeller-blade"></div>
        </div>
        <div className="drone-light"></div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
