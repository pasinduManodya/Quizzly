import React from 'react';
import { Icon } from '../ui/Icon';

const QuizCard: React.FC = () => (
  <div className="hv-main">
    <div className="hvm-top">
      <span className="hvm-lbl">Question 4 of 10</span>
      <span className="hvm-chip">Biology</span>
    </div>
    <div className="hvm-q">
      Which organelle is responsible for producing ATP through cellular respiration?
    </div>
    <div className="hvm-opts">
      <div className="hvm-opt wrong">
        <span className="hvm-letter">A</span>Nucleus
      </div>
      <div className="hvm-opt correct">
        <span className="hvm-letter">B</span>Mitochondria
        <div className="hvm-tick">
          <Icon type="checkmark" />
        </div>
      </div>
      <div className="hvm-opt wrong">
        <span className="hvm-letter">C</span>Ribosome
      </div>
    </div>
  </div>
);

const ProgressFloat: React.FC = () => (
  <div className="hv-float f1">
    <div className="hf-row">
      <div className="hf-icon" style={{background: 'var(--blue-tint)'}}>
        <svg viewBox="0 0 13 13" style={{stroke: 'var(--blue)'}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 10l3-4 3 2.5L10 4l2 3"/>
        </svg>
      </div>
      <div>
        <div className="hf-title">Weekly Progress</div>
        <div className="hf-sub">74% complete</div>
      </div>
    </div>
    <div className="prog-track">
      <div className="prog-fill"></div>
    </div>
    <div className="prog-labels">
      <span>Mon</span>
      <span>Sun</span>
    </div>
  </div>
);

const ScoreFloat: React.FC = () => (
  <div className="hv-float f2">
    <div className="hf-row">
      <div className="hf-icon" style={{background: 'var(--amber-tint)'}}>
        <svg viewBox="0 0 13 13" style={{stroke: 'var(--amber)'}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 1l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L2 4.5 5.5 4z"/>
        </svg>
      </div>
      <div>
        <div className="hf-title">Accuracy</div>
        <div className="hf-sub">Ranked #3 globally</div>
      </div>
    </div>
    <div className="score-wrap">
      <svg className="score-svg" viewBox="0 0 42 42">
        <circle className="st" cx="21" cy="21" r="17.5"/>
        <circle className="sf" cx="21" cy="21" r="17.5"/>
      </svg>
      <div>
        <div className="score-val">92%</div>
        <div className="score-sub">Accuracy rate</div>
      </div>
    </div>
  </div>
);

const StreakFloat: React.FC = () => (
  <div className="hv-float f3">
    <div className="streak-num">12</div>
    <div className="streak-lbl">Day streak</div>
    <div className="streak-dots">
      <div className="s-dot on"></div>
      <div className="s-dot on"></div>
      <div className="s-dot on"></div>
      <div className="s-dot on"></div>
      <div className="s-dot on"></div>
      <div className="s-dot"></div>
      <div className="s-dot"></div>
    </div>
  </div>
);

export const HeroVisual: React.FC = () => {
  return (
    <div className="hero-visual">
      <QuizCard />
      <ProgressFloat />
      <ScoreFloat />
      <StreakFloat />
    </div>
  );
};
