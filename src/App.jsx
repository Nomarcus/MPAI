import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Topics from './components/Topics';
import Register from './components/Register';
import Footer from './components/Footer';

function App() {
  return (
    <div>
      <Navbar />
      <Hero />
      <About />
      <Topics />
      <Register />
      <Footer />
    </div>
  );
}

export default App;