import React from 'react';
import { Link } from 'react-scroll';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="hero" smooth={true} duration={500} style={{cursor: 'pointer'}}>
          MPAI
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="about" smooth={true} duration={500} spy={true} offset={-70} style={{cursor: 'pointer'}}>
                Tjänster
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="topics" smooth={true} duration={500} spy={true} offset={-70} style={{cursor: 'pointer'}}>
                Produkter
              </Link>
            </li>
            <li className="nav-item ms-lg-3">
              <Link className="btn btn-primary" to="register" smooth={true} duration={500} spy={true} offset={-70} style={{cursor: 'pointer'}}>
                Kontakta oss
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
