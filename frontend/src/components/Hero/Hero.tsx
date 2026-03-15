import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { HeroVisual } from './HeroVisual';

export const Hero: React.FC = () => {
  return (
    <section id="hero">
      <div className="bg-layer">
        <div className="geo-ring" style={{width: '700px', height: '700px', top: '-250px', right: '-180px', borderColor: 'rgba(67,97,238,0.05)', animation: 'rotateSlow 80s linear infinite'}}></div>
        <div className="geo-ring" style={{width: '480px', height: '480px', top: '-120px', right: '-60px', borderColor: 'rgba(67,97,238,0.08)', animation: 'rotateSlow 50s linear infinite reverse'}}></div>
        <div className="geo-blob" style={{width: '500px', height: '500px', top: '-150px', right: '-120px', background: 'rgba(67,97,238,0.04)'}}></div>
        <div className="geo-blob" style={{width: '300px', height: '300px', bottom: '5%', left: '-80px', background: 'rgba(13,148,136,0.05)'}}></div>
        <div className="dot-grid" style={{opacity: '.55'}}></div>
        <div className="col-line" style={{left: '33.33%'}}></div>
        <div className="col-line" style={{left: '66.66%'}}></div>
      </div>
      
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">
              <div className="ey-dot">
                <div className="ey-ring"></div>
              </div>
              <span className="ey-txt">Now with AI-powered adaptive learning</span>
            </div>
            
            <h1 className="hero-title">
              Master any subject.<br/>
              <em>Faster than</em><br/>
              ever before.
            </h1>
            
            <p className="hero-body">
              Quizzly is an intelligent learning platform that adapts to how you think — personalising every quiz to accelerate retention and build lasting knowledge.
            </p>
            
            <div className="hero-acts">
              <Link to="/login" className="btn-primary">
                Start learning free
                <Icon type="arrow" />
              </Link>
              <a href="#about" className="btn-ghost">
                <Icon type="check" />
                See how it works
              </a>
            </div>
            
            <div className="hero-metrics">
              <div>
                <div className="met-val">50<span>K</span></div>
                <div className="met-lbl">Active learners</div>
              </div>
              <div className="met-div"></div>
              <div>
                <div className="met-val">1.2<span>M</span></div>
                <div className="met-lbl">Quizzes completed</div>
              </div>
              <div className="met-div"></div>
              <div>
                <div className="met-val">4.9<span>★</span></div>
                <div className="met-lbl">Average rating</div>
              </div>
            </div>
          </div>
          
          <HeroVisual />
        </div>
      </div>
    </section>
  );
};
