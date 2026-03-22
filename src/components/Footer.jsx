import React from 'react';

const Footer = () => {
  const footerStyle = {
    padding: '40px 0',
    backgroundColor: '#0c0c0c'
  };

  return (
    <footer style={footerStyle} className="text-center text-secondary">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} MPAI. Alla rättigheter förbehållna.</p>
        <p>
          <a href="#hero" onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{color: 'var(--secondary-color)', textDecoration: 'none'}}>
            Tillbaka till toppen
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
