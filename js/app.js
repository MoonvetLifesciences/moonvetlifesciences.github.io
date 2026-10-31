/**
 * Moonvet Lifesciences LLP - Main Application Script
 * Product Filtering, Search, Multilingual Poster Viewer & Contact Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  // Languages config
  const LANG_NAMES = {
    en: 'English',
    gu: 'ગુજરાતી (Gujarati)',
    hi: 'हिन्दी (Hindi)',
    mr: 'मराठी (Marathi)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)'
  };

  // Animal Labels config
  const ANIMAL_LABELS = {
    cattle: 'Cattle & Dairy',
    buffalo: 'Buffaloes',
    sheep: 'Sheep & Goats',
    poultry: 'Poultry',
    dogs: 'Dogs & Cats'
  };

  // State
  let currentCategory = 'all';
  let currentAnimal = 'all';
  let searchQuery = '';
  let activeProduct = null;
  let activeLang = 'en';

  // DOM Elements
  const productsContainer = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const categoryPillsContainer = document.getElementById('category-pills');
  const animalPills = document.querySelectorAll('.animal-pill');
  const visibleCountEl = document.getElementById('visible-count');
  const totalCountEl = document.getElementById('total-count');

  // Modal Elements
  const modalBackdrop = document.getElementById('product-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalTagline = document.getElementById('modal-tagline');
  const modalBadgeCat = document.getElementById('modal-badge-cat');
  const modalBadgeForm = document.getElementById('modal-badge-form');
  const modalPosterImg = document.getElementById('modal-poster-img');
  const modalLangGrid = document.getElementById('modal-lang-grid');
  const modalComposition = document.getElementById('modal-composition');
  const modalIndications = document.getElementById('modal-indications');
  const modalBenefits = document.getElementById('modal-benefits');
  const modalDosage = document.getElementById('modal-dosage');
  const modalPresentation = document.getElementById('modal-presentation');
  const modalAnimals = document.getElementById('modal-animals');
  const modalWaLink = document.getElementById('modal-wa-link');
  const modalDownloadPoster = document.getElementById('modal-download-poster');
  const modalViewFullscreen = document.getElementById('modal-view-fullscreen');

  // Check data
  if (typeof MOONVET_PRODUCTS === 'undefined' || !Array.isArray(MOONVET_PRODUCTS)) {
    console.error('MOONVET_PRODUCTS data not found');
    return;
  }

  // Initialize Counts
  if (totalCountEl) totalCountEl.textContent = MOONVET_PRODUCTS.length;

  // Render Category Pills with Dynamic Counts
  function initCategoryPills() {
    if (!categoryPillsContainer) return;

    const THERAPEUTIC_CATEGORIES = [
      'Antibiotics & Anti-Infectives',
      'Calcium & Milk Enhancers',
      'Deworming & Antiparasitic',
      'Digestive & Liver Health',
      'Pain, Fever & Inflammation',
      'Pet Care (Dogs & Cats)',
      'Reproduction & Udder Health',
      'Topical & Skin Care',
      'Vitamins & Feed Supplements'
    ];

    // Get categories with counts based on multi-category membership
    const catCounts = {};
    THERAPEUTIC_CATEGORIES.forEach(cat => {
      catCounts[cat] = MOONVET_PRODUCTS.filter(p => {
        const cats = p.categories || [p.category];
        return cats.includes(cat);
      }).length;
    });

    let pillsHtml = `
      <button class="filter-pill active" data-category="all">
        All Products <span class="pill-count">${MOONVET_PRODUCTS.length}</span>
      </button>
    `;

    THERAPEUTIC_CATEGORIES.forEach(cat => {
      pillsHtml += `
        <button class="filter-pill" data-category="${cat}">
          ${cat} <span class="pill-count">${catCounts[cat] || 0}</span>
        </button>
      `;
    });

    categoryPillsContainer.innerHTML = pillsHtml;

    // Add listeners
    categoryPillsContainer.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryPillsContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderProducts();
      });
    });
  }

  // Animal Filter Listeners
  animalPills.forEach(pill => {
    pill.addEventListener('click', () => {
      animalPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentAnimal = pill.dataset.animal;
      renderProducts();
    });
  });

  // Search Input Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      }
      renderProducts();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderProducts();
    });
  }

  // Filter & Render Products
  function renderProducts() {
    if (!productsContainer) return;

    const filtered = MOONVET_PRODUCTS.filter(prod => {
      // Category match (supports multi-category products)
      if (currentCategory !== 'all') {
        const prodCats = prod.categories || [prod.category];
        if (!prodCats.includes(currentCategory)) {
          return false;
        }
      }

      // Animal match
      if (currentAnimal !== 'all') {
        if (!prod.animals || !prod.animals.includes(currentAnimal)) {
          return false;
        }
      }

      // Search match
      if (searchQuery) {
        const query = searchQuery;
        const inName = prod.name.toLowerCase().includes(query);
        const inTagline = prod.tagline.toLowerCase().includes(query);
        const inComposition = prod.composition.toLowerCase().includes(query);
        const inIndications = prod.indications.toLowerCase().includes(query);
        const inCategory = (prod.categories || [prod.category]).some(c => c.toLowerCase().includes(query));
        const inForm = prod.dosageForm.toLowerCase().includes(query);
        if (!inName && !inTagline && !inComposition && !inIndications && !inCategory && !inForm) {
          return false;
        }
      }

      return true;
    });

    if (visibleCountEl) visibleCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      productsContainer.innerHTML = `
        <div class="catalog-empty-state">
          <div class="empty-icon"><i class="fas fa-search-minus"></i></div>
          <h3>No Veterinary Products Found</h3>
          <p>We couldn't find any products matching "${escapeHtml(searchQuery)}". Try another keyword or clear filters.</p>
          <button class="btn btn-outline" id="reset-filters-btn">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          searchQuery = '';
          currentCategory = 'all';
          currentAnimal = 'all';
          initCategoryPills();
          animalPills.forEach(p => p.classList.remove('active'));
          document.querySelector('.animal-pill[data-animal="all"]')?.classList.add('active');
          renderProducts();
        });
      }
      return;
    }

    productsContainer.innerHTML = filtered.map(prod => {
      const posterSrc = encodeURI(prod.file);
      const variantCount = Object.keys(prod.posters || {}).length;
      const animalTags = (prod.animals || []).map(a => `<span class="animal-tag">${ANIMAL_LABELS[a] || a}</span>`).join('');
      const waText = encodeURIComponent(`Hello Moonvet Lifesciences LLP, I am interested in knowing more about ${prod.name} (${prod.presentation}).`);
      const displayCat = (currentCategory !== 'all' && (prod.categories || []).includes(currentCategory))
        ? currentCategory
        : (prod.categories && prod.categories.length > 0 ? prod.categories[0] : prod.category);

      return `
        <div class="product-card" data-id="${prod.id}">
          <div class="product-card-media" onclick="openProductModal('${prod.id}')">
            <div class="product-badges">
              <span class="badge-cat">${displayCat}</span>
              <span class="badge-form">${prod.dosageForm}</span>
            </div>
            ${variantCount > 1 ? `
              <div class="languages-available-badge" title="Posters available in ${variantCount} regional languages">
                <i class="fas fa-language"></i> ${variantCount} Languages
              </div>
            ` : ''}
            <img src="${posterSrc}" alt="${escapeHtml(prod.name)}" class="product-poster-thumb" loading="lazy">
            <div class="quick-view-overlay">
              <span class="btn-quick-view"><i class="fas fa-eye"></i> View Poster & Details</span>
            </div>
          </div>
          <div class="product-card-body">
            <h3 class="product-name" onclick="openProductModal('${prod.id}')" style="cursor:pointer">${prod.name}</h3>
            <p class="product-tagline">${prod.tagline}</p>
            <p class="product-indications-snippet"><strong>Indications:</strong> ${prod.indications}</p>
            <div class="product-animal-tags">
              ${animalTags}
            </div>
            <div class="product-pack-info">
              <div class="pack-sizes"><i class="fas fa-box"></i> Pack: <span>${prod.presentation}</span></div>
            </div>
            <div class="product-card-actions">
              <button class="btn-card-details" onclick="openProductModal('${prod.id}')">
                <i class="fas fa-file-medical-alt"></i> Clinical Profile
              </button>
              <a href="https://wa.me/918849655177?text=${waText}" target="_blank" rel="noopener" class="btn-card-wa" title="Inquire on WhatsApp">
                <i class="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update Modal Localized Side Content
  function updateModalLocalizedContent(prod, lang = 'en') {
    if (!prod) return;

    const ui = (typeof UI_TRANSLATIONS !== 'undefined' && UI_TRANSLATIONS[lang]) ? UI_TRANSLATIONS[lang] : (typeof UI_TRANSLATIONS !== 'undefined' ? UI_TRANSLATIONS.en : {});
    const prodTranslations = (typeof PRODUCT_TRANSLATIONS !== 'undefined' && PRODUCT_TRANSLATIONS[prod.id]) ? PRODUCT_TRANSLATIONS[prod.id] : null;
    const trans = (prodTranslations && prodTranslations[lang]) ? prodTranslations[lang] : null;

    // Localized Brand Name & Dosage Form Badge
    const localName = (trans && trans.name_local) ? trans.name_local : prod.name;
    const localForm = (trans && trans.form_local) ? trans.form_local : prod.dosageForm;
    if (modalTitle) modalTitle.innerHTML = `${localName} <span class="badge-cat" style="font-size:0.75rem">${localForm}</span>`;

    // Localized Clinical Profile
    if (modalTagline) modalTagline.textContent = (trans && trans.tagline) ? trans.tagline : prod.tagline;
    if (modalComposition) modalComposition.textContent = (trans && trans.composition) ? trans.composition : prod.composition;
    if (modalIndications) modalIndications.textContent = (trans && trans.indications) ? trans.indications : prod.indications;
    if (modalDosage) modalDosage.textContent = (trans && trans.dosage) ? trans.dosage : prod.dosage;
    if (modalPresentation) modalPresentation.textContent = (trans && trans.presentation) ? trans.presentation : prod.presentation;

    // Localized Benefits List
    if (modalBenefits) {
      const benefitsList = (trans && trans.benefits && trans.benefits.length) ? trans.benefits : prod.benefits;
      modalBenefits.innerHTML = (benefitsList || []).map(b => `
        <li><i class="fas fa-check-circle"></i> <span>${b}</span></li>
      `).join('');
    }

    // Localized Target Animals
    if (modalAnimals) {
      const animalDict = ui.animals || {};
      modalAnimals.innerHTML = (prod.animals || []).map(a => `<span class="animal-tag" style="font-size:0.8rem; padding: 0.25rem 0.65rem;">${animalDict[a] || ANIMAL_LABELS[a] || a}</span>`).join('');
    }

    // Localized Therapeutic Categories
    const modalCategories = document.getElementById('modal-categories');
    if (modalCategories) {
      const catDict = ui.categories || {};
      const cats = prod.categories || [prod.category];
      modalCategories.innerHTML = cats.map(c => `<span class="badge-cat" style="font-size:0.8rem; padding: 0.25rem 0.65rem; background: rgba(30, 122, 69, 0.12); color: var(--primary); font-weight: 600; border-radius: 999px;"><i class="fas fa-check" style="font-size:0.7rem; margin-right:4px;"></i>${catDict[c] || c}</span>`).join('');
    }

    // Localized Section Headings
    const compHead = document.getElementById('modal-head-comp');
    if (compHead && ui.comp_title) compHead.innerHTML = `<i class="fas fa-flask"></i> ${ui.comp_title}`;

    const indicHead = document.getElementById('modal-head-indic');
    if (indicHead && ui.indic_title) indicHead.innerHTML = `<i class="fas fa-stethoscope"></i> ${ui.indic_title}`;

    const beneHead = document.getElementById('modal-head-benefits');
    if (beneHead && ui.bene_title) beneHead.innerHTML = `<i class="fas fa-check-double"></i> ${ui.bene_title}`;

    const dosageHead = document.getElementById('modal-head-dosage');
    if (dosageHead && ui.dosage_title) dosageHead.innerHTML = `<i class="fas fa-prescription"></i> ${ui.dosage_title}`;

    const animalsHead = document.getElementById('modal-head-animals');
    if (animalsHead && ui.animals_title) animalsHead.innerHTML = `<i class="fas fa-paw"></i> ${ui.animals_title}`;

    const presHead = document.getElementById('modal-head-pres');
    if (presHead && ui.pres_title) presHead.innerHTML = `<i class="fas fa-box"></i> ${ui.pres_title}`;

    const catsHead = document.getElementById('modal-head-cats');
    if (catsHead && ui.cats_title) catsHead.innerHTML = `<i class="fas fa-tags"></i> ${ui.cats_title}`;

    const postersLbl = document.getElementById('modal-lbl-posters');
    if (postersLbl && ui.posters_label) postersLbl.innerHTML = `<i class="fas fa-language"></i> ${ui.posters_label}`;

    const previewLbl = document.getElementById('modal-lbl-preview');
    if (previewLbl && ui.posters_sublabel) previewLbl.textContent = ui.posters_sublabel;

    const viewFullTxt = document.getElementById('modal-txt-viewfull');
    if (viewFullTxt && ui.view_full) viewFullTxt.textContent = ui.view_full;

    const downloadTxt = document.getElementById('modal-txt-download');
    if (downloadTxt && ui.download_poster) downloadTxt.textContent = ui.download_poster;

    const waTxt = document.getElementById('modal-txt-wa');
    if (waTxt && ui.wa_inquire) waTxt.textContent = ui.wa_inquire;

    const queryTxt = document.getElementById('modal-txt-query') || document.getElementById('modal-txt-franchise');
    if (queryTxt && (ui.query_enquire || ui.franchise_enquire)) queryTxt.textContent = ui.query_enquire || ui.franchise_enquire;

    // Localized WhatsApp Inquiry Message
    if (modalWaLink) {
      let waInquiryText = `Hello Moonvet Lifesciences LLP, I would like to inquire about ${prod.name} (${prod.presentation}). Please share product details and pricing.`;
      const presText = (trans && trans.presentation) ? trans.presentation : prod.presentation;
      if (lang === 'gu') {
        waInquiryText = `નમસ્તે મૂનવેત લાઇફસાયન્સિસ LLP, હું ${localName} (${presText}) વિશે પૂછપરછ કરવા માંગુ છું. કૃપા કરીને વિગતો અને ભાવ મોકલો.`;
      } else if (lang === 'hi') {
        waInquiryText = `नमस्ते मूनवेट लाइफसाइंसेज LLP, मैं ${localName} (${presText}) के बारे में पूछताछ करना चाहता हूँ। कृपया मूल्य एवं उत्पाद विवरण साझा करें।`;
      } else if (lang === 'mr') {
        waInquiryText = `नमस्ते मूनवेट लाइफसायन्सेस LLP, मला ${localName} (${presText}) बद्दल माहिती हवी आहे. कृपया दर आणि उत्पादन माहिती पाठवावी.`;
      } else if (lang === 'ta') {
        waInquiryText = `வணக்கம் மூன்வெட் லைஃப்சயின்சஸ் LLP, ${localName} (${presText}) பற்றிய விலை மற்றும் தயாரிப்பு விவரங்களை அறிய விரும்புகிறேன்.`;
      } else if (lang === 'te') {
        waInquiryText = `నమస్కారం మూన్‌వెట్ లైఫ్‌సైన్సెస్ LLP, నేను ${localName} (${presText}) గురించి సమాచారం మరియు ధర వివరాలను తెలుసుకోవాలనుకుంటున్నాను.`;
      }
      modalWaLink.href = `https://wa.me/918849655177?text=${encodeURIComponent(waInquiryText)}`;
    }
  }

  // Open Product Modal
  window.openProductModal = function(productId, preferredLang = 'en') {
    const prod = MOONVET_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    activeProduct = prod;
    activeLang = (preferredLang && LANG_NAMES[preferredLang]) ? preferredLang : 'en';

    // Render Language Poster Switcher & Image
    renderModalPosterAndLanguages();

    // Render Localized Side Content
    updateModalLocalizedContent(activeProduct, activeLang);

    // Show modal
    if (modalBackdrop) {
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  // Render Poster and Language Buttons
  function renderModalPosterAndLanguages() {
    if (!activeProduct || !modalLangGrid || !modalPosterImg) return;

    const posters = activeProduct.posters || { en: activeProduct.file };
    const currentPosterFile = posters[activeLang] || posters['en'] || activeProduct.file;

    // Update Poster Image
    modalPosterImg.src = encodeURI(currentPosterFile);
    modalPosterImg.alt = `${activeProduct.name} Poster (${LANG_NAMES[activeLang] || activeLang})`;

    // Update Fullscreen & Download links
    if (modalViewFullscreen) {
      modalViewFullscreen.href = encodeURI(currentPosterFile);
    }
    if (modalDownloadPoster) {
      modalDownloadPoster.href = encodeURI(currentPosterFile);
      modalDownloadPoster.download = currentPosterFile;
    }

    // Supported Languages: show all available Indian languages so users can switch to any language
    const ALL_LANGS = ['en', 'gu', 'hi', 'mr', 'ta', 'te'];
    modalLangGrid.innerHTML = ALL_LANGS.map(code => {
      const isActive = code === activeLang;
      const label = LANG_NAMES[code] || code.toUpperCase();
      return `
        <button class="btn-lang-tab ${isActive ? 'active' : ''}" data-lang="${code}">
          ${label}
        </button>
      `;
    }).join('');

    // Attach listeners
    modalLangGrid.querySelectorAll('.btn-lang-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeLang = btn.dataset.lang;
        renderModalPosterAndLanguages();
        updateModalLocalizedContent(activeProduct, activeLang);
      });
    });
  }

  // Close Modal
  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
      activeProduct = null;
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // Close menu when clicking nav links
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });
  }

  // Toast Notifications
  window.showToast = function(message, duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:#4ade80"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Hero Carousel Slider Functionality
  function initHeroSlider() {
    const slider = document.getElementById('hero-slider');
    const dots = document.querySelectorAll('#hero-dots .slider-dot');
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    let currentSlide = 0;
    const totalSlides = slides.length || 3;
    let autoSlideTimer = null;

    function goToSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentSlide = index;
      slider.style.transform = `translateX(-${currentSlide * (100 / totalSlides)}%)`;

      slides.forEach((slide, idx) => {
        slide.classList.remove('active');
        if (idx === currentSlide) {
          // Force layout reflow so the coming-forward CSS animation restarts cleanly
          void slide.offsetWidth;
          slide.classList.add('active');
        }
      });

      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = setInterval(() => {
        goToSlide(currentSlide + 1);
      }, 8000); // Transitions to next slide every 8 seconds
    }

    function stopAutoSlide() {
      if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
        startAutoSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
        startAutoSlide();
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
        goToSlide(idx);
        startAutoSlide();
      });
    });

    // Pause on hover or touch
    const sliderWrap = document.querySelector('.hero-slider-wrap');
    if (sliderWrap) {
      sliderWrap.addEventListener('mouseenter', stopAutoSlide);
      sliderWrap.addEventListener('mouseleave', startAutoSlide);
      sliderWrap.addEventListener('touchstart', stopAutoSlide, { passive: true });
      sliderWrap.addEventListener('touchend', startAutoSlide, { passive: true });
    }

    goToSlide(0);
    startAutoSlide();
  }

  // Query Form Handler (Ask Your Query)
  const queryForm = document.getElementById('query-form') || document.getElementById('franchise-form');
  if (queryForm) {
    queryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('query-name')?.value || document.getElementById('franchise-name')?.value || '';
      const phone = document.getElementById('query-phone')?.value || document.getElementById('franchise-phone')?.value || '';
      const location = document.getElementById('query-location')?.value || document.getElementById('franchise-location')?.value || '';
      const queryType = document.getElementById('query-type')?.value || 'General Query';
      const message = document.getElementById('query-message')?.value || document.getElementById('franchise-message')?.value || '';

      const waMsg = encodeURIComponent(
        `Hello Moonvet Lifesciences LLP,\n\nI have a Query from your Website:\nName: ${name}\nPhone: ${phone}\nLocation: ${location}\nQuery Type: ${queryType}\nMessage: ${message}`
      );

      showToast(`Thank you, ${name}! Redirecting to WhatsApp for instant priority assistance...`);
      queryForm.reset();

      setTimeout(() => {
        window.open(`https://wa.me/918849655177?text=${waMsg}`, '_blank');
      }, 1200);
    });
  }

  // Third Party Manufacturing Query Handler
  const mfgForm = document.getElementById('mfg-query-form');
  if (mfgForm) {
    mfgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('mfg-name')?.value || '';
      const phone = document.getElementById('mfg-phone')?.value || '';
      const location = document.getElementById('mfg-location')?.value || '';
      const category = document.getElementById('mfg-category')?.value || '';
      const batch = document.getElementById('mfg-batch')?.value || '';
      const details = document.getElementById('mfg-details')?.value || '';

      const waMsg = encodeURIComponent(
        `Hello Moonvet Lifesciences LLP,\n\n*Third Party Manufacturing Inquiry:*\n• Company / Name: ${name}\n• Phone: ${phone}\n• City / State: ${location}\n• Product Category: ${category}\n• Estimated Batch: ${batch}\n• Formulation / Pack Requirements: ${details}`
      );

      showToast(`Thank you, ${name}! Redirecting your manufacturing inquiry to WhatsApp...`);
      mfgForm.reset();

      setTimeout(() => {
        window.open(`https://wa.me/918849655177?text=${waMsg}`, '_blank');
      }, 1200);
    });
  }

  // Contact Form Handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value || '';
      const email = document.getElementById('contact-email')?.value || '';
      const phone = document.getElementById('contact-phone')?.value || '';
      const msg = document.getElementById('contact-msg')?.value || '';

      const waMsg = encodeURIComponent(
        `Hello Moonvet Lifesciences LLP,\n\nInquiry from Website:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${msg}`
      );

      showToast('Thank you for contacting Moonvet Lifesciences LLP! We will connect with you promptly.');
      contactForm.reset();

      setTimeout(() => {
        window.open(`https://wa.me/918849655177?text=${waMsg}`, '_blank');
      }, 1200);
    });
  }

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Initialize
  initHeroSlider();
  initCategoryPills();
  renderProducts();
});
