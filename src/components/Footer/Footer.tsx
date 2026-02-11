import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo">
            <div className="logo-icon">
              <Heart size={18} fill="var(--primary)" color="var(--primary)" />
            </div>
            <span className="logo-text">HearMeOut</span>
          </div>
          <p className="footer-tagline">
            A safe, anonymous space for you to express yourself without judgment.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>PLATFORM</h4>
            <ul>
              <li><Link to="/#how-it-works">How it Works</Link></li>
              <li><Link to="/#safety">Safety Guidelines</Link></li>
              <li><Link to="/#rules">Community Rules</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>RESOURCES</h4>
            <ul>
              <li><Link to="/#support">Mental Health Support</Link></li>
              <li><Link to="/#blog">Blog</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>LEGAL</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/#cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="footer-bottom">
          <p>© 2026 HearMeOut. All rights reserved.</p>
          <div className="social-links">
            <div className="social-circle"></div>
            <div className="social-circle"></div>
            <div className="social-circle"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
