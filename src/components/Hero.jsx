import React from 'react';
import { Link } from 'react-scroll';

const Hero = () => {
  const heroStyle = {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'white',
    background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.9)), radial-gradient(circle, rgba(30,40,60,1) 0%, var(--bg-dark-color) 100%)',
    paddingTop: '70px'
  };

  return (
    <div id="hero" style={heroStyle}>
      <div className="container">
        <h1 className="display-3 fw-bold text-uppercase">AI som driver din verksamhet framåt</h1>
        <p className="lead fs-4 my-4">
          Vi bygger AI-produkter och hjälper företag implementera smarta lösningar.
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to="about" smooth={true} duration={500} offset={-70} className="btn btn-primary btn-lg">
            Våra tjänster
          </Link>
          <Link to="topics" smooth={true} duration={500} offset={-70} className="btn btn-outline-light btn-lg">
            Våra produkter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
