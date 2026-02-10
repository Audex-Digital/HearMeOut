import React from 'react';
import { Heart } from 'lucide-react';
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
              <li><a href="#how-it-works">How it Works</a></li>
              <li><a href="#safety">Safety Guidelines</a></li>
              <li><a href="#rules">Community Rules</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>RESOURCES</h4>
            <ul>
              <li><a href="#support">Mental Health Support</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>LEGAL</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
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
