/**
 * JindWork — Commercial Studio JavaScript
 * Minimalist, robust, and native:
 * 1. Header scroll elevation
 * 2. Mobile drawer navigation
 * 3. Smooth anchor scrolling
 * 4. Service button selection -> pre-fills comment & scrolls to form
 * 5. Urgency chip selector toggle
 * 6. Form validation, LocalStorage lead persistence, Telegram Bot API dispatch & modal feedback
 */

// Telegram Bot Configuration (для статических сайтов на GitHub Pages)
const TG_CONFIG = {
  token: '8622976410:AAHrwVVuuRXxr3-MaWfmcgb8Ul_CdFUzdvU',
  chatId: '438694551'
};

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileDrawer();
  initSmoothScroll();
  initServicePickers();
  initUrgencySelector();
  initLeadForm();
  initMobileCarousels();
  initFloatingCta();
});

/* ---------------- 1. Header Scroll Elevation ---------------- */
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------------- 2. Mobile Drawer Navigation ---------------- */
function initMobileDrawer() {
  const menuToggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const drawerClose = document.getElementById('drawer-close');
  const navLinks = document.querySelectorAll('.mobile-nav-link, .mobile-drawer .btn');

  if (!menuToggle || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) closeDrawer();
  });

  navLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* ---------------- 3. Smooth Anchor Scrolling ---------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 76;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ---------------- 4. Service Button Selection ---------------- */
function initServicePickers() {
  const serviceButtons = document.querySelectorAll('.select-service-btn');
  const commentTextarea = document.getElementById('project-comment');
  const nameInput = document.getElementById('client-name');

  serviceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const serviceName = btn.getAttribute('data-service-name');
      if (serviceName && commentTextarea) {
        const currentVal = commentTextarea.value.trim();
        // Remove prior selected service prefix if present
        const cleaned = currentVal.replace(/^Выбранная услуга:[^\n]*\n*/i, '').trim();
        const prefix = `Выбранная услуга: ${serviceName}`;
        commentTextarea.value = cleaned ? `${prefix}\n\n${cleaned}` : `${prefix}\n`;
      }

      setTimeout(() => {
        if (nameInput) nameInput.focus();
      }, 400);
    });
  });
}

/* ---------------- 5. Urgency Chip Selector ---------------- */
function initUrgencySelector() {
  const chips = document.querySelectorAll('.urgency-chip');

  chips.forEach(chip => {
    const radio = chip.querySelector('input[type="radio"]');
    if (!radio) return;

    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      radio.checked = true;
    });

    radio.addEventListener('change', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

/* ---------------- 6. Form Validation & Submission ---------------- */
function initLeadForm() {
  const form = document.getElementById('lead-form');
  const nameInput = document.getElementById('client-name');
  const tgInput = document.getElementById('telegram-username');
  const commentInput = document.getElementById('project-comment');
  const nameError = document.getElementById('name-error');
  const tgError = document.getElementById('tg-error');
  const submitBtn = document.getElementById('submit-btn');

  const modal = document.getElementById('success-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalSummary = document.getElementById('modal-summary');
  const modalTgBtn = document.getElementById('modal-tg-btn');

  if (!form) return;

  // Real-time error clearing
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim().length >= 2) {
        nameInput.classList.remove('has-error');
        if (nameError) nameError.classList.remove('show');
      }
    });
  }

  if (tgInput) {
    tgInput.addEventListener('input', () => {
      let val = tgInput.value.trim().replace(/^(?:https?:\/\/)?(?:t\.me\/|@)?/i, '').trim();
      if (val.length >= 2) {
        tgInput.classList.remove('has-error');
        if (tgError) tgError.classList.remove('show');
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let hasErrors = false;

    // Validate Name
    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (nameVal.length < 2) {
      if (nameInput) nameInput.classList.add('has-error');
      if (nameError) nameError.classList.add('show');
      hasErrors = true;
    } else {
      if (nameInput) nameInput.classList.remove('has-error');
      if (nameError) nameError.classList.remove('show');
    }

    // Validate Telegram
    let tgVal = tgInput ? tgInput.value.trim() : '';
    tgVal = tgVal.replace(/^(?:https?:\/\/)?(?:t\.me\/|@)?/i, '').trim();

    if (tgVal.length < 2) {
      if (tgInput) tgInput.classList.add('has-error');
      if (tgError) tgError.classList.add('show');
      hasErrors = true;
    } else {
      if (tgInput) {
        tgInput.value = tgVal;
        tgInput.classList.remove('has-error');
      }
      if (tgError) tgError.classList.remove('show');
    }

    if (hasErrors) {
      const firstInvalid = form.querySelector('.has-error');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Selected urgency
    const selectedRadio = form.querySelector('input[name="urgency"]:checked');
    const urgencyVal = selectedRadio ? selectedRadio.value : 'Стандартно (1-2 недели)';
    const commentVal = commentInput ? commentInput.value.trim() : '';

    // Show button loading spinner
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }

      const leadData = {
        date: new Date().toISOString(),
        fullName: nameVal,
        telegram: `@${tgVal}`,
        urgency: urgencyVal,
        comment: commentVal
      };

      // Persist to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('jindwork_leads') || '[]');
        stored.push(leadData);
        localStorage.setItem('jindwork_leads', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      // Send to Telegram Bot API (direct from static browser)
      sendLeadToTelegramBot(leadData);

      // Prepare Telegram prefilled link
      if (modalTgBtn) {
        const msg = encodeURIComponent(
          `Здравствуйте! Меня зовут ${nameVal} (@${tgVal}). Хочу заказать проект в JindWork.\nСрочность: ${urgencyVal}.${commentVal ? `\nДетали: ${commentVal}` : ''}`
        );
        modalTgBtn.href = `https://t.me/O1rthodoxie333?text=${msg}`;
      }

      // Populate summary
      if (modalSummary) {
        modalSummary.innerHTML = `
          <p><strong>Имя:</strong> ${escapeHtml(nameVal)}</p>
          <p><strong>Telegram:</strong> @${escapeHtml(tgVal)}</p>
          <p><strong>Срочность:</strong> ${escapeHtml(urgencyVal)}</p>
          ${commentVal ? `<p><strong>Комментарий:</strong> ${escapeHtml(commentVal)}</p>` : ''}
        `;
      }

      // Open Modal
      if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      }

      // Reset form
      form.reset();
      const firstChip = form.querySelector('.urgency-chip');
      if (firstChip) {
        document.querySelectorAll('.urgency-chip').forEach(c => c.classList.remove('active'));
        firstChip.classList.add('active');
        const r = firstChip.querySelector('input[type="radio"]');
        if (r) r.checked = true;
      }
    }, 350);
  });

  // Modal close handlers
  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

/* ---------------- 7. Direct Telegram Bot API Dispatch ---------------- */
async function sendLeadToTelegramBot(leadData) {
  if (!TG_CONFIG.token || !TG_CONFIG.chatId) {
    console.info('Telegram Bot: chatId не настроен. Чтобы заявки приходили в бота, укажите ваш chat_id в script.js (TG_CONFIG.chatId)');
    return false;
  }

  const cleanTg = (leadData.telegram || '').replace(/^@/, '');
  const text =
    `<b>Новая заявка с сайта JindWork!</b>\n\n` +
    `<b>Клиент:</b> ${escapeHtml(leadData.fullName)}\n` +
    `<b>Telegram:</b> @${escapeHtml(cleanTg)}\n` +
    `<b>Срочность:</b> ${escapeHtml(leadData.urgency)}\n` +
    `<b>Комментарий:</b> ${escapeHtml(leadData.comment || 'Не указан')}\n` +
    `<b>Дата:</b> ${new Date().toLocaleString('ru-RU')}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_CONFIG.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CONFIG.chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: `💬 Написать клиенту (@${cleanTg})`, url: `https://t.me/${cleanTg}` }
            ]
          ]
        }
      })
    });
    const result = await res.json();
    return result.ok;
  } catch (err) {
    console.error('Ошибка отправки в Telegram бот:', err);
    return false;
  }
}

/* ---------------- 8. Mobile Swipe Carousels & Dots ---------------- */
function initMobileCarousels() {
  setupTrack({
    trackId: 'services-grid',
    tabsContainerId: 'services-tabs',
    dotsContainerId: 'services-dots',
    cardSelector: '.service-card'
  });

  setupTrack({
    trackId: 'values-grid',
    dotsContainerId: 'values-dots',
    cardSelector: '.value-card'
  });

  setupTrack({
    trackId: 'workflow-chain',
    dotsContainerId: 'workflow-dots',
    cardSelector: '.step-card'
  });
}

function setupTrack({ trackId, tabsContainerId, dotsContainerId, cardSelector }) {
  const track = document.getElementById(trackId);
  if (!track) return;

  const cards = track.querySelectorAll(cardSelector);
  const dotsContainer = dotsContainerId ? document.getElementById(dotsContainerId) : null;
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
  const tabsContainer = tabsContainerId ? document.getElementById(tabsContainerId) : null;
  const tabs = tabsContainer ? tabsContainer.querySelectorAll('.svc-tab') : [];

  if (!cards.length) return;

  const scrollToCard = (index) => {
    if (index < 0 || index >= cards.length) return;
    const card = cards[index];
    const trackPaddingLeft = 16;
    const cardLeft = card.offsetLeft - track.offsetLeft;
    track.scrollTo({
      left: cardLeft - trackPaddingLeft,
      behavior: 'smooth'
    });
  };

  // Dots click
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => scrollToCard(idx));
  });

  // Tabs click
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => {
      scrollToCard(idx);
    });
  });

  // On scroll update active index
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let closestIdx = 0;
        let minDiff = Infinity;

        cards.forEach((card, idx) => {
          const cardCenter = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
          const diff = Math.abs(trackCenter - cardCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        // Update dots
        dots.forEach((d, i) => {
          d.classList.toggle('active', i === closestIdx);
        });

        // Update tabs
        tabs.forEach((t, i) => {
          t.classList.toggle('active', i === closestIdx);
        });

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ---------------- 9. Floating Quick-CTA Button ---------------- */
function initFloatingCta() {
  const floatingCta = document.getElementById('mobile-floating-cta');
  const contactSection = document.getElementById('contact');
  if (!floatingCta) return;

  const updateVisibility = () => {
    // Only show on mobile <= 768px
    if (window.innerWidth > 768) {
      floatingCta.classList.remove('visible');
      return;
    }

    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY < 300) {
      floatingCta.classList.remove('visible');
      return;
    }

    if (contactSection) {
      const rect = contactSection.getBoundingClientRect();
      // If contact section is in view, hide floating button
      if (rect.top <= window.innerHeight - 80 && rect.bottom >= 80) {
        floatingCta.classList.remove('visible');
        return;
      }
    }

    floatingCta.classList.add('visible');
  };

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility, { passive: true });
  updateVisibility();
}
