// Все логика в модуле — без глобальных переменных.

/**
 * Инициализация мобильного меню
 */
const initMobileMenu = () => {
  const toggler = document.querySelector('#mobile-menu-toggle');
  const navbar = document.querySelector('#nf-navbar');
  const mobileCta = document.querySelector('#nf-mobile-cta');

  if (!toggler || !navbar || !mobileCta) return;

  let isOpen = false;
  const bsCollapse = new bootstrap.Collapse(navbar, { toggle: false });

  const updateState = () => {
    if (isOpen) {
      bsCollapse.show();
      mobileCta.style.maxHeight = `${mobileCta.scrollHeight}px`;
    } else {
      bsCollapse.hide();
      mobileCta.style.maxHeight = '0px';
    }
  };

  toggler.addEventListener('click', () => {
    isOpen = !isOpen;
    updateState();
  });

  // При ресайзе на десктоп — закрываем
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      isOpen = false;
      updateState();
    }
  });
};

/**
 * Анимации появления блоков при скролле
 */
const initScrollAnimations = () => {
  const animated = document.querySelectorAll('.nf-animate');
  if (!animated.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('nf-in-view');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  animated.forEach(el => observer.observe(el));
};

/**
 * Год в футере
 */
const initYear = () => {
  const el = document.querySelector('#year');
  if (!el) return;
  el.textContent = String(new Date().getFullYear());
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollAnimations();
  initYear();
});
