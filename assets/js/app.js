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

/**
 * Унифицированный запрос к backend без query-параметров
 */
const postJson = async (endpoint, payload) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.message || 'Խնդիր առաջացավ, փորձեք կրկին։';
    throw new Error(message);
  }

  return data;
};

/**
 * Отправка контактной формы в backend
 */
const initContactForm = () => {
  const form = document.querySelector('#nf-contact-form');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const submitBtn = form.querySelector('[data-submit]');
  const resetBtn = form.querySelector('[data-reset]');
  const endpoint = form.dataset.endpoint || '/backend/contact';

  const setStatus = (type, message) => {
    if (!status) return;
    status.dataset.state = type;
    status.textContent = message;
  };

  const toggleDisabled = disabled => {
    if (submitBtn) submitBtn.disabled = disabled;
    if (resetBtn) resetBtn.disabled = disabled;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const payload = {
      role: form.role.value,
      fullName: form.fullName.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value,
    };

    setStatus('progress', 'Ուղարկում ենք backend-ին...');
    toggleDisabled(true);

    try {
      const result = await postJson(endpoint, payload);
      setStatus(
        'success',
        `Շնորհակալություն։ Ձեր հղման կոդը ${result.reference}, թիմը կկապվի շուտով։`
      );
      form.reset();
    } catch (error) {
      setStatus('error', error.message);
    } finally {
      toggleDisabled(false);
    }
  });

  form.addEventListener('reset', () => {
    setStatus('idle', '');
  });
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollAnimations();
  initYear();
  initContactForm();
});
