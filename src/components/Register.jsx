import React from 'react';

const Register = () => {
  return (
    <section id="register" className="section section-dark">
      <div className="container text-center">
        <h2 className="section-title">Redo att komma igång?</h2>
        <p className="lead fs-4 mb-4">
          Vill du veta mer om hur AI kan hjälpa ditt företag? Hör av dig så berättar vi mer.
        </p>
        <a href="mailto:kontakt@mpai.se" className="btn btn-primary btn-lg">
          Kontakta oss
        </a>
        <p className="text-secondary mt-4">
          <small>Eller mejla direkt till <a href="mailto:kontakt@mpai.se" style={{color: 'var(--primary-color)'}}>kontakt@mpai.se</a></small>
        </p>
      </div>
    </section>
  );
};

export default Register;
