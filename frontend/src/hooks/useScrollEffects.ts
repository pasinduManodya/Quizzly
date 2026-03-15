import { useEffect } from 'react';

export const useScrollEffects = () => {
  useEffect(() => {
    const initObserver = () => {
      const ro = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              ro.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01, rootMargin: '0px 0px 100px 0px' }
      );

      document.querySelectorAll('.reveal').forEach((el) => ro.observe(el));
      
      return ro;
    };

    const timer = setTimeout(() => {
      initObserver();
    }, 100);

    const ro = initObserver();

    const handleCardTilt = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      card.style.transform = `perspective(900px) rotateX(${dy * -3.5}deg) rotateY(${dx * 3.5}deg) translateY(-5px)`;
    };

    const handleCardLeave = (e: MouseEvent) => {
      (e.currentTarget as HTMLElement).style.transform = '';
    };

    document.querySelectorAll('.bc, .price-card, .hv-float').forEach((card) => {
      card.addEventListener('mousemove', handleCardTilt as EventListener);
      card.addEventListener('mouseleave', handleCardLeave as EventListener);
    });

    const handleSmoothScroll = (e: Event) => {
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (href === '#') return;
      const target = href ? document.querySelector(href) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', handleSmoothScroll);
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    const handleActiveNav = () => {
      let current = '';
      sections.forEach((section) => {
        if (window.scrollY >= (section as HTMLElement).offsetTop - 100) {
          current = section.id;
        }
      });
      
      navLinks.forEach((link) => {
        const match = link.getAttribute('href') === '#' + current;
        (link as HTMLElement).style.color = match ? 'var(--ink)' : '';
        (link as HTMLElement).style.background = match ? 'var(--surface)' : '';
      });
    };

    window.addEventListener('scroll', handleActiveNav, { passive: true });

    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener('scroll', handleActiveNav);
    };
  }, []);
};
