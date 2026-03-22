import React from 'react';

const About = () => {
  const visualElementStyle = {
    minHeight: '250px',
    background: 'linear-gradient(135deg, var(--primary-color), #343a40)',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '5rem',
    fontWeight: 'bold',
  };

  return (
    <section id="about" className="section">
      <div className="container">
        <h2 className="section-title">Våra Tjänster</h2>
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h3>AI-konsulting för företag</h3>
            <p className="text-secondary">
              Vi hjälper företag att identifiera och implementera AI-lösningar som skapar verkligt affärsvärde. Från strategi till produktion — vi finns med hela vägen.
            </p>
            <ul className="list-unstyled text-secondary">
              <li className="mb-2">✦ AI-strategi och rådgivning</li>
              <li className="mb-2">✦ Implementation av AI-modeller och verktyg</li>
              <li className="mb-2">✦ Integration med befintliga system</li>
              <li className="mb-2">✦ Prototyper och proof-of-concept</li>
            </ul>
          </div>
          <div className="col-lg-6">
            <div style={visualElementStyle}>
              MPAI
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
