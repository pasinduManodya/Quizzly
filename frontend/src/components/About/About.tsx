import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { BentoCard } from './BentoCard';

export const About: React.FC = () => {
  const bentoCards = [
    {
      span: 5,
      delay: 1,
      icon: {
        style: { background: 'var(--blue-tint)' },
        svg: (
          <svg viewBox="0 0 20 20" style={{ stroke: 'var(--blue)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 2a8 8 0 100 16A8 8 0 0010 2zM7 10l2 2 4-4"/>
          </svg>
        )
      },
      title: 'Adaptive Intelligence',
      body: 'Our AI analyses every response to calibrate difficulty in real time — keeping you in the optimal learning zone, always challenged, never overwhelmed.',
      list: [
        'Personalised question sequencing',
        'Dynamic difficulty scaling',
        'Weak area identification'
      ]
    },
    {
      span: 4,
      delay: 2,
      icon: {
        style: { background: 'var(--teal-tint)' },
        svg: (
          <svg viewBox="0 0 20 20" style={{ stroke: 'var(--teal)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3v4M10 13v4M3 10h4M13 10h4M5.2 5.2l2.8 2.8M12 12l2.8 2.8M5.2 14.8L8 12M12 8l2.8-2.8"/>
          </svg>
        )
      },
      title: 'Spaced Repetition',
      body: 'Material resurfaces at scientifically timed intervals, ensuring knowledge moves from short-term recall into long-term memory with minimal study time.'
    },
    {
      span: 3,
      delay: 3,
      dark: true,
      stat: '10K+',
      statSub: 'Curated questions across 50+ subjects, validated by educators worldwide.'
    },
    {
      span: 5,
      delay: 1,
      icon: {
        style: { background: 'rgba(139, 92, 246, 0.1)' },
        svg: (
          <svg viewBox="0 0 20 20" style={{ stroke: 'rgb(139, 92, 246)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h8l4 4v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v4h4M7 10h6M7 13h4"/>
          </svg>
        )
      },
      title: 'PDF Summarization',
      body: 'Upload any PDF and get instant AI-powered summaries in simplified versions — perfect for quick reviews or breaking down complex material into digestible chunks.',
      list: [
        'Smart content extraction',
        'Adjustable summary length',
        'Key points highlighting'
      ]
    },
    {
      span: 7,
      delay: 2,
      icon: {
        style: { background: 'var(--amber-tint)' },
        svg: (
          <svg viewBox="0 0 20 20" style={{ stroke: 'var(--amber)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 14l4-5 3 3 4-6 3 3"/>
          </svg>
        )
      },
      title: 'Progress Analytics',
      body: 'Visual dashboards surface exactly where you are improving and where to focus next. No guesswork — just clear, data-driven insight on every session.',
      bars: [35, 52, 44, 68, 58, 84, 72, 92]
    }
  ];

  return (
    <section id="about">
      <div className="bg-layer">
        <div className="geo-ring" style={{width: '900px', height: '900px', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(67,97,238,0.04)'}}></div>
        <div className="dot-grid" style={{opacity: '.35'}}></div>
      </div>
      
      <div className="container">
        <SectionHeader
          className="about-hd reveal"
          eyebrow="Why Quizzly"
          title='Built for how the brain <em style="font-style:italic;color:var(--blue)">actually</em> learns'
          body="Passive reading fades. Active recall — powered by spaced repetition and intelligent adaptation — is the science behind lasting knowledge."
        />
        
        <div className="bento">
          {bentoCards.map((card, idx) => (
            <BentoCard key={idx} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
};
