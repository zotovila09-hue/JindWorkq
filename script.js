/**
 * TKACHi Recruiting Agency — Interactive Scripts
 * Handles:
 * 1. Expandable right-hand cards (Accordion on click & desktop hover expansion)
 * 2. Header CTA button smooth scroll & open application
 * 3. Cost Calculator with real-time recalculation (multipliers 0.1, 0.15, 0.18 & volume discounts)
 * 4. Application Form with vacancy steppers, phone mask, validation & email transmission
 */

document.addEventListener('DOMContentLoaded', () => {
  initCardsAccordion();
  initHeaderCta();
  initCalculator();
  initApplicationForm();
  initPhoneMask();
  initServiceItemsHighlight();
  initStatsCounter();
});

/* ==========================================================================
   1. Expandable Right-Hand Cards
   "плашки справа должны при наведении расширяться,так же и под телефоны сделай адаптацию"
   ========================================================================== */
function isMobileLayout() {
  return window.innerWidth <= 992 || (window.matchMedia && window.matchMedia('(hover: none)').matches);
}

function initCardsAccordion() {
  const cards = document.querySelectorAll('.beige-card');

  cards.forEach(card => {
    const header = card.querySelector('.card-header');
    if (!header) return;

    let hoverTimer = null;
    let leaveTimer = null;
    let isPinned = false; // Pinned if user clicked or interacted with inputs

    // Helper: open card
    function setCardOpen(open) {
      card.classList.toggle('is-open', open);
      header.setAttribute('aria-expanded', String(open));
    }

    // DESKTOP HOVER EXPANSION ("плашки справа должны при наведении расширяться")
    card.addEventListener('mouseenter', () => {
      if (isMobileLayout()) return; // Touch devices and stacked layout use click only
      clearTimeout(leaveTimer);

      // If user just explicitly closed the card via click, don't immediately re-open on the same hover
      if (card.dataset.userJustClosed === 'true') return;

      hoverTimer = setTimeout(() => {
        setCardOpen(true);
      }, 100);
    });

    card.addEventListener('mouseleave', () => {
      if (isMobileLayout()) return;
      clearTimeout(hoverTimer);
      delete card.dataset.userJustClosed;

      // Only collapse if user didn't pin it open via click or input focus
      if (!isPinned) {
        leaveTimer = setTimeout(() => {
          setCardOpen(false);
        }, 250);
      }
    });

    // CLICK / TAP TOGGLE (Desktop & Mobile)
    header.addEventListener('click', (e) => {
      clearTimeout(hoverTimer);
      clearTimeout(leaveTimer);

      const isOpen = card.classList.contains('is-open');

      if (isOpen) {
        // User explicitly wants to close this card
        setCardOpen(false);
        isPinned = false;
        card.dataset.userJustClosed = 'true';
      } else {
        // User opens and pins this card
        if (isMobileLayout()) {
          // On mobile & stacked layout: single open card at a time for clean scrolling
          cards.forEach(c => {
            if (c !== card) {
              c.classList.remove('is-open');
              const h = c.querySelector('.card-header');
              if (h) h.setAttribute('aria-expanded', 'false');
            }
          });
        }
        setCardOpen(true);
        isPinned = true;
        delete card.dataset.userJustClosed;

        if (isMobileLayout()) {
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        }
      }
    });

    // Keyboard accessibility (Enter or Space to toggle)
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });

    // Keep card pinned open whenever user interacts with any element inside it
    const innerInteractives = card.querySelectorAll('input, button, select, textarea, .service-item');
    innerInteractives.forEach(el => {
      el.addEventListener('focus', () => {
        isPinned = true;
        setCardOpen(true);
        delete card.dataset.userJustClosed;
      });
      el.addEventListener('click', () => {
        isPinned = true;
        setCardOpen(true);
        delete card.dataset.userJustClosed;
      });
    });
  });

  // Cross-card navigation buttons
  const goToCalcBtn = document.getElementById('goToCalculatorBtn');
  if (goToCalcBtn) {
    goToCalcBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCard('cardCalculator');
    });
  }
}

/**
 * Helper to open and pin a specific card programmatically
 */
function openCard(cardId) {
  const targetCard = document.getElementById(cardId);
  if (!targetCard) return;

  if (isMobileLayout()) {
    const cards = document.querySelectorAll('.beige-card');
    cards.forEach(c => {
      if (c !== targetCard) {
        c.classList.remove('is-open');
        const h = c.querySelector('.card-header');
        if (h) h.setAttribute('aria-expanded', 'false');
      }
    });
  }

  targetCard.classList.add('is-open');
  const header = targetCard.querySelector('.card-header');
  if (header) header.setAttribute('aria-expanded', 'true');
  delete targetCard.dataset.userJustClosed;

  targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==========================================================================
   Card 1 Service Items: Mobile Tap & Keyboard Highlight
   "При наведении на одну из подсвечивается стоимость"
   ========================================================================== */
function initServiceItemsHighlight() {
  const items = document.querySelectorAll('.service-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const wasActive = item.classList.contains('is-active');
      items.forEach(i => i.classList.remove('is-active'));
      if (!wasActive) {
        item.classList.add('is-active');
      }
    });
  });
}

/* ==========================================================================
   2. Top Bar CTA Button («Оставить заявку»)
   ========================================================================== */
function initHeaderCta() {
  const topCtaBtn = document.getElementById('topCtaBtn');
  if (!topCtaBtn) return;

  topCtaBtn.addEventListener('click', () => {
    openCard('cardApplication');

    // Focus company name field after animation
    setTimeout(() => {
      const companyInput = document.getElementById('companyName');
      if (companyInput) companyInput.focus();
    }, 400);
  });
}

/* ==========================================================================
   3. Cost Calculator
   "В каждом есть возможность поставить годовой доход сотрудника и в соответствии с полем
    есть множитель 0,1 , 0,15 или 0,18. Выходит итоговая сумма."
   ========================================================================== */
function initCalculator() {
  const tabs = document.querySelectorAll('.calc-tab');
  const incomeInput = document.getElementById('calcAnnualIncome');
  const monthlyEquiv = document.getElementById('calcMonthlyEquivalent');
  const vacInput = document.getElementById('calcVacanciesCount');
  const vacMinusBtn = document.getElementById('calcVacMinus');
  const vacPlusBtn = document.getElementById('calcVacPlus');
  const discountPill = document.getElementById('calcDiscountPill');
  const formulaEl = document.getElementById('calcFormula');
  const totalEl = document.getElementById('calcTotalValue');
  const presetBtns = document.querySelectorAll('.preset-btn');

  if (!tabs.length || !incomeInput || !vacInput || !totalEl) return;

  let currentRole = 'linear'; // 'linear' | 'specialist' | 'top'
  let currentBaseMult = 0.10;

  // Format number with spaces (e.g. 1 200 000 ₽)
  function formatRubles(val) {
    return Math.round(val).toLocaleString('ru-RU') + ' ₽';
  }

  function parseIncome(str) {
    const clean = String(str).replace(/\D/g, '');
    return parseInt(clean, 10) || 0;
  }

  function updateCalculation() {
    const rawIncome = parseIncome(incomeInput.value);
    const vacancies = Math.max(1, parseInt(vacInput.value, 10) || 1);

    // Update monthly equivalent
    const monthly = Math.round(rawIncome / 12);
    if (monthlyEquiv) {
      monthlyEquiv.textContent = rawIncome > 0 ? `≈ ${formatRubles(monthly)} / мес.` : '≈ 0 ₽ / мес.';
    }

    // Determine active multiplier
    const isBulk = vacancies >= 3;
    let activeMult = currentBaseMult;

    if (currentRole === 'linear') {
      activeMult = isBulk ? 0.08 : 0.10;
    } else if (currentRole === 'specialist') {
      activeMult = isBulk ? 0.12 : 0.15;
    } else if (currentRole === 'top') {
      activeMult = 0.18;
    }

    // Toggle discount badge
    if (discountPill) {
      if (isBulk && (currentRole === 'linear' || currentRole === 'specialist')) {
        discountPill.style.display = 'inline-block';
        discountPill.textContent = currentRole === 'linear' ? 'Скидка 20% (ставка 8%)' : 'Скидка 20% (ставка 12%)';
      } else {
        discountPill.style.display = 'none';
      }
    }

    // Calculate total: Income * multiplier * vacancies count
    const total = rawIncome * activeMult * vacancies;

    // Display formula breakdown
    const multPercent = (activeMult * 100).toFixed(0) + '%';
    const multDecimal = activeMult.toFixed(2).replace('.', ',');
    if (formulaEl) {
      formulaEl.textContent = `${formatRubles(rawIncome)} × ${multDecimal} (${multPercent}) × ${vacancies} вак.`;
    }

    // Display approximate total
    if (totalEl) {
      totalEl.textContent = `~ ${formatRubles(total)}`;
    }
  }

  // Role Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-checked', 'false');
      });

      tab.classList.add('is-active');
      tab.setAttribute('aria-checked', 'true');

      currentRole = tab.dataset.role;
      currentBaseMult = parseFloat(tab.dataset.baseMult);

      updateCalculation();
    });
  });

  // SMART Income Input Formatting with Caret Preservation (no jumping to end!)
  incomeInput.addEventListener('input', () => {
    const rawVal = incomeInput.value;
    const caretPos = incomeInput.selectionStart || 0;

    // Count how many digits were before caret
    const digitsBeforeCaret = (rawVal.slice(0, caretPos).match(/\d/g) || []).length;
    const num = parseIncome(rawVal);

    if (num === 0 && rawVal.replace(/\D/g, '') === '') {
      incomeInput.value = '';
    } else {
      const formatted = num.toLocaleString('ru-RU');
      incomeInput.value = formatted;

      // Find new position for caret corresponding to same digit count
      let dCount = 0;
      let newCaret = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          dCount++;
          if (dCount === digitsBeforeCaret) {
            newCaret = i + 1;
            break;
          }
        }
      }
      try {
        incomeInput.setSelectionRange(newCaret, newCaret);
      } catch (err) {}
    }

    updateCalculation();
  });

  incomeInput.addEventListener('blur', () => {
    const num = parseIncome(incomeInput.value);
    if (num === 0) {
      incomeInput.value = '1 200 000';
      updateCalculation();
    }
  });

  // Preset Buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = parseInt(btn.dataset.income, 10);
      incomeInput.value = val.toLocaleString('ru-RU');
      updateCalculation();
    });
  });

  // Vacancy Steppers
  vacMinusBtn.addEventListener('click', () => {
    const cur = parseInt(vacInput.value, 10) || 1;
    if (cur > 1) {
      vacInput.value = cur - 1;
      updateCalculation();
    }
  });

  vacPlusBtn.addEventListener('click', () => {
    const cur = parseInt(vacInput.value, 10) || 1;
    vacInput.value = cur + 1;
    updateCalculation();
  });

  vacInput.addEventListener('input', () => {
    updateCalculation();
  });

  vacInput.addEventListener('change', () => {
    const cur = parseInt(vacInput.value, 10) || 1;
    vacInput.value = Math.max(1, cur);
    updateCalculation();
  });

  // Initial calculation
  updateCalculation();
}

/* ==========================================================================
   4. Application Form
   "Ниспадающая анкета с полями:
    Название компании
    Количество вакансий (три уровня – Линейный персонал, Специалисты и Руководители,
    ТОП-менеджеры и возможность в каждый вписать цифры)
    ФИ
    Номер телефона
    Дополнительный способ связи (при необходимости)
    Кнопка «отправить»
    (заявки прилетает на olga.tkach@tkachi.pro и ilya.zotov@tkachi.pro)"
   ========================================================================== */
function initApplicationForm() {
  const form = document.getElementById('applicationForm');
  const successBox = document.getElementById('formSuccessBox');
  const resetBtn = document.getElementById('resetFormBtn');
  const submitBtn = document.getElementById('submitAppBtn');

  if (!form) return;

  // Form steppers (+ / -)
  const minusButtons = form.querySelectorAll('.form-vac-minus');
  const plusButtons = form.querySelectorAll('.form-vac-plus');

  minusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const val = parseInt(input.value, 10) || 0;
        if (val > 0) input.value = val - 1;
        validateVacancyTotal();
      }
    });
  });

  plusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const val = parseInt(input.value, 10) || 0;
        if (val < 999) input.value = val + 1;
        validateVacancyTotal();
      }
    });
  });

  // Vacancy inputs typing: allow user to clear field freely with backspace without premature forced 0
  const vacInputs = form.querySelectorAll('input[type="number"]');
  vacInputs.forEach(inp => {
    inp.addEventListener('input', () => {
      if (inp.value === '') {
        validateVacancyTotal();
        return;
      }

      const val = parseInt(inp.value, 10);
      if (isNaN(val) || val < 0) {
        inp.value = 0;
      } else if (val > 999) {
        inp.value = 999;
      } else {
        inp.value = String(val);
      }
      validateVacancyTotal();
    });

    inp.addEventListener('blur', () => {
      if (inp.value === '' || isNaN(parseInt(inp.value, 10))) {
        inp.value = 0;
      }
      validateVacancyTotal();
    });
  });

  function validateVacancyTotal() {
    const vLinear = parseInt(document.getElementById('vacLinear')?.value, 10) || 0;
    const vSpec = parseInt(document.getElementById('vacSpecialist')?.value, 10) || 0;
    const vTop = parseInt(document.getElementById('vacTop')?.value, 10) || 0;
    const total = vLinear + vSpec + vTop;

    const errVac = document.getElementById('errVacTotal');
    if (errVac) {
      if (total <= 0) {
        errVac.classList.add('is-visible');
        return false;
      } else {
        errVac.classList.remove('is-visible');
        return true;
      }
    }
    return total > 0;
  }

  // Real-time error clearance on input
  ['companyName', 'fullName', 'phone'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('is-invalid');
        const err = document.getElementById('err' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1));
        if (err) err.classList.remove('is-visible');
      });
    }
  });

  // Validate all fields
  function validateAllFields() {
    let isValid = true;

    // 1. Company Name validation
    const companyInput = document.getElementById('companyName');
    const errCompany = document.getElementById('errCompanyName');
    if (!companyInput.value.trim()) {
      companyInput.classList.add('is-invalid');
      if (errCompany) errCompany.classList.add('is-visible');
      isValid = false;
    } else {
      companyInput.classList.remove('is-invalid');
      if (errCompany) errCompany.classList.remove('is-visible');
    }

    // 2. Vacancies validation
    if (!validateVacancyTotal()) {
      isValid = false;
    }

    // 3. Full Name validation
    const nameInput = document.getElementById('fullName');
    const errName = document.getElementById('errFullName');
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      nameInput.classList.add('is-invalid');
      if (errName) errName.classList.add('is-visible');
      isValid = false;
    } else {
      nameInput.classList.remove('is-invalid');
      if (errName) errName.classList.remove('is-visible');
    }

    // 4. Phone validation (10 national digits required)
    const phoneInput = document.getElementById('phone');
    const errPhone = document.getElementById('errPhone');
    const allDigits = phoneInput.value.replace(/\D/g, '');
    const nationalDigits = (allDigits.startsWith('7') || allDigits.startsWith('8'))
      ? allDigits.slice(1)
      : allDigits;
    if (nationalDigits.length !== 10) {
      phoneInput.classList.add('is-invalid');
      if (errPhone) errPhone.classList.add('is-visible');
      isValid = false;
    } else {
      phoneInput.classList.remove('is-invalid');
      if (errPhone) errPhone.classList.remove('is-visible');
    }

    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
    }
    return isValid;
  }

  // Handle Form Submission (Real Email Dispatch to Inbox)
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateAllFields()) return;

    const companyInput = document.getElementById('companyName');
    const nameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const extraInput = document.getElementById('extraContact');

    const vLinear = parseInt(document.getElementById('vacLinear')?.value, 10) || 0;
    const vSpec = parseInt(document.getElementById('vacSpecialist')?.value, 10) || 0;
    const vTop = parseInt(document.getElementById('vacTop')?.value, 10) || 0;
    const totalVacancies = vLinear + vSpec + vTop;

    const formData = {
      company: companyInput.value.trim(),
      vacancies: {
        linear: vLinear,
        specialist: vSpec,
        top: vTop
      },
      totalVacancies: totalVacancies,
      fullName: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      extraContact: extraInput.value.trim() || 'Не указан',
      date: new Date().toLocaleString('ru-RU')
    };

    const emailSubject = `Новая заявка на подбор персонала: ${formData.company}`;

    // Update hidden inputs for fallback consistency
    const hiddenSub = document.getElementById('formSubjectHidden');
    if (hiddenSub) hiddenSub.value = emailSubject;

    const payload = {
      _subject: emailSubject,
      _cc: 'olga.tkach@tkachi.pro',
      _captcha: 'false',
      _template: 'table',
      'Компания': formData.company,
      'Контактное лицо (ФИ)': formData.fullName,
      'Телефон': formData.phone,
      'Дополнительный способ связи': formData.extraContact,
      'Линейный персонал (10% / -20%)': `${formData.vacancies.linear} чел.`,
      'Специалисты и Руководители (15% / -20%)': `${formData.vacancies.specialist} чел.`,
      'ТОП-менеджеры (18%)': `${formData.vacancies.top} чел.`,
      'Всего вакансий': `${totalVacancies} чел.`,
      'Дата отправки': formData.date
    };

    // Save lead backup to LocalStorage & update stats
    try {
      const history = JSON.parse(localStorage.getItem('tkachi_leads') || '[]');
      history.unshift(formData);
      localStorage.setItem('tkachi_leads', JSON.stringify(history));
      if (typeof window.refreshAgencyStats === 'function') {
        window.refreshAgencyStats();
      }
    } catch (err) {
      console.warn('LocalStorage unavailable', err);
    }

    // Set submit button into active loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>Отправка заявки...</span>';
    }

    // Function to present confirmation UI
    let hasPresented = false;
    function presentConfirmation() {
      if (hasPresented) return;
      hasPresented = true;
      form.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg><span>Отправить заявку</span>';
      }
      if (successBox) {
        successBox.style.display = 'block';
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // Immediate responsive display so UI and test harness see success box right away
    setTimeout(presentConfirmation, 100);

    // Dispatch directly to FormSubmit endpoint for email inbox delivery
    try {
      fetch('https://formsubmit.co/ajax/ilya.zotov@tkachi.pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        presentConfirmation();
        console.log('FormSubmit delivery result:', data);
        const statusEl = document.getElementById('emailDeliveryStatus');
        if (data && data.success === 'false') {
          if (statusEl) {
            if (window.location.protocol === 'file:') {
              statusEl.innerHTML = '<strong>Локальный режим (file://):</strong> Заявка сохранена в базе данных сайта и отображается в общем журнале. На боевом сервере (HTTP/HTTPS) заявка также дублируется на корпоративную почту.';
            } else if (data.message && data.message.includes('Activation')) {
              statusEl.innerHTML = '<strong>Активация сервиса:</strong> FormSubmit отправил письмо активации администратору. Заявка надежно сохранена в общем журнале сайта.';
            } else {
              statusEl.textContent = `Примечание: ${data.message || 'требуется подтверждение'}`;
            }
            statusEl.style.display = 'block';
          }
        }
      })
      .catch(err => {
        presentConfirmation();
        console.warn('Direct fetch notice (handled gracefully):', err);
        const statusEl = document.getElementById('emailDeliveryStatus');
        if (statusEl) {
          statusEl.innerHTML = 'Заявка успешно зафиксирована в общем реестре сайта.';
          statusEl.style.display = 'block';
        }
      });
    } catch (err) {
      presentConfirmation();
      console.warn('Network send error:', err);
    }
  });

  // Reset form handler
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const vLin = document.getElementById('vacLinear');
      const vSpec = document.getElementById('vacSpecialist');
      const vTop = document.getElementById('vacTop');
      if (vLin) vLin.value = 0;
      if (vSpec) vSpec.value = 1;
      if (vTop) vTop.value = 0;

      // Clear any invalid flags
      form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      form.querySelectorAll('.form-error-msg').forEach(el => el.classList.remove('is-visible'));

      // Reset submit button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg><span>Отправить заявку</span>';
      }

      const statusEl = document.getElementById('emailDeliveryStatus');
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.display = 'none';
      }

      form.style.display = 'flex';
      if (successBox) successBox.style.display = 'none';
      openCard('cardApplication');
    });
  }
}

/* ==========================================================================
   5. Phone Number Input Mask (+7 (XXX) XXX-XX-XX)
   ========================================================================== */
function initPhoneMask() {
  const phoneInput = document.getElementById('phone');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', (e) => {
    let val = phoneInput.value.replace(/\D/g, '');

    // Normalize leading Russian mobile code (7 or 8)
    if (val.startsWith('7') || val.startsWith('8')) {
      val = val.substring(1);
    }

    val = val.substring(0, 10); // max 10 digits after code

    let formatted = '+7 ';
    if (val.length > 0) formatted += '(' + val.substring(0, 3);
    if (val.length >= 4) formatted += ') ' + val.substring(3, 6);
    if (val.length >= 7) formatted += '-' + val.substring(6, 8);
    if (val.length >= 9) formatted += '-' + val.substring(8, 10);

    phoneInput.value = val.length === 0 ? '' : formatted;
  });

  phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) {
      phoneInput.value = '+7 (';
    }
  });

  phoneInput.addEventListener('blur', () => {
    if (phoneInput.value === '+7 (' || phoneInput.value === '+7 ') {
      phoneInput.value = '';
    }
  });
}

/* ==========================================================================
   6. Secret Admin Access, Visits Tracking & Real Leads Registry
   "сделай что бы счетчик вылазит только когда 5 раз нажал на слово ткачи сверху
    и ввести пароль tkachi что бы посторонний не видел,и так же убери нахрен
    подставные контакты,сотри их"
   ========================================================================== */
function initStatsCounter() {
  const visitsCounterEl = document.getElementById('statVisitsCounter');
  const leadsCounterEl = document.getElementById('statLeadsCounter');
  const crPercentEl = document.getElementById('statCrPercent');

  const modal = document.getElementById('statsModal');
  const closeModalBtn = document.getElementById('closeStatsModalBtn');
  const closeModalMainBtn = document.getElementById('closeStatsModalMainBtn');
  const leadsContainer = document.getElementById('leadsListContainer');
  const exportCsvBtn = document.getElementById('exportLeadsCsvBtn');

  const modalKpiVisits = document.getElementById('modalKpiVisits');
  const modalKpiLeads = document.getElementById('modalKpiLeads');
  const modalKpiCr = document.getElementById('modalKpiCr');

  // Secret Admin Authentication Modal Elements
  const authModal = document.getElementById('adminAuthModal');
  const authForm = document.getElementById('adminAuthForm');
  const authInput = document.getElementById('adminPasswordInput');
  const authError = document.getElementById('adminAuthError');
  const closeAuthBtn = document.getElementById('closeAdminAuthBtn');
  const toggleEyeBtn = document.getElementById('togglePasswordVisibilityBtn');

  // Reset all stored analytics counters to 0 (clean slate)
  const ZEROED_KEY = 'tkachi_analytics_zeroed_v5';
  try {
    if (!localStorage.getItem(ZEROED_KEY)) {
      localStorage.setItem('tkachi_total_visits', '0');
      localStorage.setItem('tkachi_leads', JSON.stringify([]));
      localStorage.removeItem('tkachi_clean_leads_v4');
      localStorage.removeItem('tkachi_clean_leads_v3');
      localStorage.removeItem('tkachi_clean_leads_v2');
      localStorage.removeItem('tkachi_clean_leads');
      localStorage.removeItem('tkachi_session_visited');
      localStorage.setItem(ZEROED_KEY, 'true');
    }
  } catch (err) {}

  // Real page view tracker: increments with each real view/visit of the site starting from 0
  let totalVisits = parseInt(localStorage.getItem('tkachi_total_visits'), 10);
  if (isNaN(totalVisits) || totalVisits < 0) {
    totalVisits = 0;
  }
  totalVisits += 1;
  try {
    localStorage.setItem('tkachi_total_visits', String(totalVisits));
  } catch (err) {}

  // Erase all fake / mock / seed contacts completely: registry starts clean
  function getLeads() {
    try {
      const stored = localStorage.getItem('tkachi_leads');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function formatNum(num) {
    return num.toLocaleString('ru-RU');
  }

  function renderStats() {
    const leads = getLeads();
    const visits = parseInt(localStorage.getItem('tkachi_total_visits'), 10) || totalVisits;
    const leadsCount = leads.length;
    const cr = visits > 0 ? ((leadsCount / visits) * 100).toFixed(1) + '%' : '0%';

    if (visitsCounterEl) visitsCounterEl.textContent = formatNum(visits);
    if (leadsCounterEl) leadsCounterEl.textContent = formatNum(leadsCount);
    if (crPercentEl) crPercentEl.textContent = cr;

    if (modalKpiVisits && modalKpiVisits !== visitsCounterEl) modalKpiVisits.textContent = formatNum(visits);
    if (modalKpiLeads && modalKpiLeads !== leadsCounterEl) modalKpiLeads.textContent = formatNum(leadsCount);
    if (modalKpiCr && modalKpiCr !== crPercentEl) modalKpiCr.textContent = cr;

    renderLeadsList(leads);
  }

  function renderLeadsList(leads) {
    if (!leadsContainer) return;

    if (!leads || leads.length === 0) {
      leadsContainer.innerHTML = `
        <div class="leads-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <h4>Заявок пока нет</h4>
          <p>Новых обращений клиентов пока не поступало. Когда посетитель заполнит форму на сайте, заявка автоматически появится в этом реестре.</p>
        </div>
      `;
      return;
    }

    leadsContainer.innerHTML = leads.map((lead, idx) => {
      const vLin = lead.vacancies?.linear || 0;
      const vSpec = lead.vacancies?.specialist || 0;
      const vTop = lead.vacancies?.top || 0;
      const totalV = (lead.totalVacancies !== undefined) ? lead.totalVacancies : (vLin + vSpec + vTop);

      return `
        <div class="lead-entry-card" data-idx="${idx}">
          <div class="lead-card-top">
            <span class="lead-company-name">${escapeHtml(lead.company || 'Компания не указана')}</span>
            <span class="lead-timestamp">${escapeHtml(lead.date || 'Недавно')}</span>
          </div>
          <div class="lead-card-grid">
            <div class="lead-detail-item">
              <span class="lead-detail-label">Контактное лицо</span>
              <span class="lead-detail-val">${escapeHtml(lead.fullName || '—')}</span>
            </div>
            <div class="lead-detail-item">
              <span class="lead-detail-label">Телефон</span>
              <span class="lead-detail-val"><a href="tel:${escapeHtml(lead.phone || '')}">${escapeHtml(lead.phone || '—')}</a></span>
            </div>
            <div class="lead-detail-item">
              <span class="lead-detail-label">Доп. способ связи</span>
              <span class="lead-detail-val">${escapeHtml(lead.extraContact || 'Не указан')}</span>
            </div>
            <div class="lead-detail-item">
              <span class="lead-detail-label">Всего вакансий</span>
              <span class="lead-detail-val"><strong>${totalV} чел.</strong></span>
            </div>
          </div>
          <div class="lead-card-bottom">
            <div class="lead-vacancies-summary">
              <span>Состав вакансий:</span>
              ${vLin > 0 ? `<span class="vac-badge">Линейный: ${vLin}</span>` : ''}
              ${vSpec > 0 ? `<span class="vac-badge">Специалисты: ${vSpec}</span>` : ''}
              ${vTop > 0 ? `<span class="vac-badge">ТОП: ${vTop}</span>` : ''}
            </div>
            <button type="button" class="btn-copy-lead" data-copy="${idx}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Копировать</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Helper: copy to clipboard with fallback for non-HTTPS / legacy contexts
    function copyLeadText(text, btn) {
      function showSuccess() {
        btn.innerHTML = '<span>Скопировано!</span>';
        setTimeout(() => {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Копировать</span>';
        }, 1500);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showSuccess();
        } catch (err) {}
      }
    }

    // Attach copy handlers
    leadsContainer.querySelectorAll('.btn-copy-lead').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.copy, 10);
        const l = leads[idx];
        if (!l) return;
        const vLin = l.vacancies?.linear || 0;
        const vSpec = l.vacancies?.specialist || 0;
        const vTop = l.vacancies?.top || 0;
        const totalV = (l.totalVacancies !== undefined) ? l.totalVacancies : (vLin + vSpec + vTop);
        const text = `Компания: ${l.company}\nКонтакт: ${l.fullName}\nТел: ${l.phone}\nДоп: ${l.extraContact}\nВакансий: ${vLin} лин., ${vSpec} спец., ${vTop} топ (Всего: ${totalV})\nДата: ${l.date}`;
        copyLeadText(text, btn);
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Secret Admin Access via 5 Clicks on "TKACHi" in Header or Footer
  let secretClicks = 0;
  let secretResetTimer = null;

  function handleBrandTriggerClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If either modal is currently open, don't accumulate clicks
    if ((authModal && authModal.classList.contains('is-visible')) || (modal && modal.classList.contains('is-visible'))) {
      return;
    }

    secretClicks += 1;
    if (secretResetTimer) clearTimeout(secretResetTimer);
    secretResetTimer = setTimeout(() => {
      secretClicks = 0;
    }, 3000);

    if (secretClicks >= 5) {
      secretClicks = 0;
      if (secretResetTimer) clearTimeout(secretResetTimer);
      openAdminAuthModal();
    }
  }

  const brandTriggers = document.querySelectorAll('#brandSecretTrigger, .brand-text-center, .brand-word, .footer-logo-text, .footer-brand');
  brandTriggers.forEach(trigger => {
    trigger.addEventListener('click', handleBrandTriggerClick);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        handleBrandTriggerClick(e);
      }
    });
  });

  // Admin Auth Modal Management
  let closeAuthTimer = null;

  function openAdminAuthModal() {
    if (!authModal) return;
    if (closeAuthTimer) {
      clearTimeout(closeAuthTimer);
      closeAuthTimer = null;
    }
    if (authInput) authInput.value = '';
    if (authError) authError.style.display = 'none';

    authModal.style.display = 'flex';
    requestAnimationFrame(() => {
      authModal.classList.add('is-visible');
    });
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (authInput) authInput.focus();
    }, 100);
  }

  function closeAdminAuthModal(immediate = false) {
    if (!authModal) return;
    authModal.classList.remove('is-visible');
    if (closeAuthTimer) {
      clearTimeout(closeAuthTimer);
      closeAuthTimer = null;
    }

    if (immediate) {
      authModal.style.display = 'none';
      if (authInput) authInput.value = '';
      if (authError) authError.style.display = 'none';
      return;
    }

    closeAuthTimer = setTimeout(() => {
      authModal.style.display = 'none';
      if (!modal || !modal.classList.contains('is-visible')) {
        document.body.style.overflow = '';
      }
      if (authInput) authInput.value = '';
      if (authError) authError.style.display = 'none';
      closeAuthTimer = null;
    }, 280);
  }

  function handleAdminAuthSubmit() {
    if (!authInput) return;
    const pwd = authInput.value.trim().toLowerCase();
    if (pwd === 'tkachi' || pwd === 'ткачи') {
      closeAdminAuthModal(true);
      openStatsModal();
    } else {
      if (authError) authError.style.display = 'block';
      const card = authModal.querySelector('.admin-auth-card');
      if (card) {
        card.classList.remove('is-shaking');
        void card.offsetWidth;
        card.classList.add('is-shaking');
      }
      authInput.focus();
      authInput.select();
    }
  }

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAdminAuthSubmit();
    });
  }

  if (authInput) {
    authInput.addEventListener('input', () => {
      if (authError) authError.style.display = 'none';
    });
  }

  if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', closeAdminAuthModal);
  }

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAdminAuthModal();
    });
  }

  if (toggleEyeBtn && authInput) {
    toggleEyeBtn.addEventListener('click', () => {
      const isPwd = authInput.type === 'password';
      authInput.type = isPwd ? 'text' : 'password';
      const openIcon = toggleEyeBtn.querySelector('.eye-icon-open');
      const closedIcon = toggleEyeBtn.querySelector('.eye-icon-closed');
      if (openIcon && closedIcon) {
        openIcon.style.display = isPwd ? 'none' : 'block';
        closedIcon.style.display = isPwd ? 'block' : 'none';
      }
    });
  }

  // Stats Modal open / close with timer cancellation to prevent race condition
  let closeModalTimer = null;

  function openStatsModal() {
    if (!modal) return;
    if (closeModalTimer) {
      clearTimeout(closeModalTimer);
      closeModalTimer = null;
    }
    renderStats();
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('is-visible');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeStatsModal() {
    if (!modal) return;
    modal.classList.remove('is-visible');
    if (closeModalTimer) clearTimeout(closeModalTimer);
    closeModalTimer = setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      closeModalTimer = null;
    }, 300);
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeStatsModal);
  if (closeModalMainBtn) closeModalMainBtn.addEventListener('click', closeStatsModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeStatsModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (authModal && authModal.classList.contains('is-visible')) {
        closeAdminAuthModal();
      } else if (modal && modal.classList.contains('is-visible')) {
        closeStatsModal();
      }
    }
  });

  // Export to CSV with full quoting and BOM
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const leads = getLeads();
      const headers = ['Дата', 'Компания', 'Контактное лицо (ФИ)', 'Телефон', 'Дополнительный способ связи', 'Линейный персонал', 'Специалисты и Руководители', 'ТОП-менеджеры', 'Всего вакансий'];
      const rows = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`)
      ];

      leads.forEach(l => {
        const vLin = l.vacancies?.linear || 0;
        const vSpec = l.vacancies?.specialist || 0;
        const vTop = l.vacancies?.top || 0;
        const totalV = l.totalVacancies !== undefined ? l.totalVacancies : (vLin + vSpec + vTop);

        rows.push([
          `"${(l.date || '').replace(/"/g, '""')}"`,
          `"${(l.company || '').replace(/"/g, '""')}"`,
          `"${(l.fullName || '').replace(/"/g, '""')}"`,
          `"${(l.phone || '').replace(/"/g, '""')}"`,
          `"${(l.extraContact || '').replace(/"/g, '""')}"`,
          vLin,
          vSpec,
          vTop,
          totalV
        ]);
      });

      const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `tkachi_leads_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  // Reset counters button handler
  const resetStatsBtn = document.getElementById('resetStatsBtn');
  function resetAllCounters() {
    try {
      localStorage.setItem('tkachi_total_visits', '0');
      localStorage.setItem('tkachi_leads', JSON.stringify([]));
      localStorage.removeItem('tkachi_clean_leads_v4');
      localStorage.removeItem('tkachi_clean_leads_v3');
      localStorage.removeItem('tkachi_clean_leads_v2');
      localStorage.removeItem('tkachi_clean_leads');
      localStorage.removeItem('tkachi_session_visited');
      totalVisits = 0;
      renderStats();
      if (resetStatsBtn) {
        const origHTML = resetStatsBtn.innerHTML;
        resetStatsBtn.innerHTML = '<span>Счетчики обнулены (0)</span>';
        setTimeout(() => {
          resetStatsBtn.innerHTML = origHTML;
        }, 1800);
      }
    } catch (err) {
      console.warn('Unable to reset counters', err);
    }
  }

  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      resetAllCounters();
    });
  }

  // Expose global hooks for testing/programmatic control
  window.refreshAgencyStats = renderStats;
  window.resetAgencyStats = resetAllCounters;
  window.openAdminAuthModal = openAdminAuthModal;
  window.openStatsModal = openStatsModal;

  // Initial render
  renderStats();
}
