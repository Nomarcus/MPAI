import React from 'react';

const ProductCard = ({ icon, title, text, link }) => {
  const cardStyle = {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const cardHoverStyle = (e) => {
    e.currentTarget.style.transform = 'translateY(-10px)';
    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)';
  };

  const cardLeaveStyle = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="col-lg-5 col-md-6 mb-4">
      <div
        className="card h-100 text-white p-3"
        style={cardStyle}
        onMouseEnter={cardHoverStyle}
        onMouseLeave={cardLeaveStyle}
      >
        <div className="card-body text-center">
          <div className="fs-1 mb-3">{icon}</div>
          <h5 className="card-title fw-bold">{title}</h5>
          <p className="card-text text-secondary">{text}</p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm mt-3"
            >
              Besök &rarr;
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const Topics = () => {
  return (
    <section id="topics" className="section section-dark">
      <div className="container">
        <h2 className="section-title">Våra Produkter</h2>
        <div className="row justify-content-center">
          <ProductCard
            icon="📚"
            title="Föräldrahjälpen"
            text="AI-driven läxhjälp för svenska föräldrar. Anpassad efter Lgr22 läroplanen för att ge rätt stöd i skolarbetet."
            link="https://foraldrahjalpen.se/"
          />
          <ProductCard
            icon="🔍"
            title="SEO Insight Pro"
            text="AI-drivet SEO-analysverktyg som hjälper dig optimera din webbplats för bättre synlighet i sökmotorer."
            link="https://seo-insight-pro-indol.vercel.app/"
          />
        </div>
      </div>
    </section>
  );
};

export default Topics;
