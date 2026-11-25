import React, { useState } from 'react';

export default function Login() {
  const [message, setMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setMessage('El servicio de autenticación aún no está configurado.');
  }

  return (
    <main className="login-page">
      <section className="brand-panel" aria-label="Worldcar">
        <a className="brand" href="/" aria-label="Worldcar, inicio">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>worldcar<span className="brand-period">.</span></span>
        </a>

        <div className="brand-copy">
          <span className="eyebrow">TU CAMINO, NUESTRA PASIÓN</span>
          <h1>Todo empieza<br />con una nueva ruta.</h1>
          <p>Un espacio para gestionar tu experiencia Worldcar.</p>
        </div>

        <span className="panel-caption">EXPERIENCIAS QUE TE MUEVEN</span>
      </section>

      <section className="form-panel">
        <div className="login-card">
          <div className="mobile-brand brand" aria-label="Worldcar">
            <span className="brand-mark" aria-hidden="true">W</span>
            <span>worldcar<span className="brand-period">.</span></span>
          </div>
          <span className="eyebrow form-eyebrow">BIENVENIDO DE NUEVO</span>
          <h2>Inicia sesión</h2>
          <p className="form-description">Ingresa tus datos para continuar.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              placeholder="nombre@correo.com"
              required
              type="email"
            />

            <label htmlFor="password">Contraseña</label>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              required
              type="password"
            />

            <button type="submit">Iniciar sesión <span aria-hidden="true">→</span></button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>

          <p className="form-footer">¿Necesitas ayuda? <a href="mailto:soporte@worldcar.com">Contacta a soporte</a></p>
        </div>
        <span className="copyright">© {new Date().getFullYear()} Worldcar. Todos los derechos reservados.</span>
      </section>
    </main>
  );
}
