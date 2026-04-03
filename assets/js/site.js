(function () {
    'use strict';

    var body = document.body;
    var head = document.head;
    var MOBILE_BREAKPOINT = 860;
    var requestHref = body ? body.dataset.requestHref || '' : '';
    var jqueryCallbacks = [];
    var jqueryLoading = false;
    var ripplesCallbacks = [];
    var ripplesLoading = false;
    var ripplesSyncTimer = 0;
    var blockRipplesTextureCache = '';

    function findCurrentScript() {
        if (document.currentScript) {
            return document.currentScript;
        }

        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i -= 1) {
            if (/assets\/js\/site\.js($|\?)/.test(scripts[i].src)) {
                return scripts[i];
            }
        }

        return null;
    }

    var scriptEl = findCurrentScript();
    var scriptSrc = scriptEl ? scriptEl.src : window.location.href;
    var imagesBase = new URL('../images/', scriptSrc).href;

    var decorRegistry = {
        home: {
            cards: {
                'Геотехнология': {
                    desktop: 'cards/geo_main.png',
                    mobile: 'cards/mobile/geo_main.png'
                },
                'Бур Сервис': {
                    desktop: 'cards/bur_service_main.png',
                    mobile: 'cards/mobile/bur_service_main.png'
                }
            },
            features: {
                'Инженерный и сервисный контур': {
                    desktop: 'features/engineering_service_contour.png',
                    mobile: 'features/mobile/engineering_service_contour.png'
                },
                'Работа с исходными данными': {
                    desktop: 'features/source_data.png',
                    mobile: 'features/mobile/source_data.png'
                },
                'Нормативная база': {
                    desktop: 'features/regulations.png',
                    mobile: 'features/mobile/regulations.png'
                },
                'Практическая реализация': {
                    desktop: 'features/practical_implementation.png',
                    mobile: 'features/mobile/practical_implementation.png'
                },
                'Работа в регионах': {
                    desktop: 'features/regions_work.png',
                    mobile: 'features/mobile/regions_work.png'
                },
                'Понятная логика взаимодействия': {
                    desktop: 'features/clear_logic.png',
                    mobile: 'features/mobile/clear_logic.png'
                }
            }
        },
        services: {
            cards: {
                'Гидрогеологическое заключение и проектирование': {
                    desktop: 'cards/hydrogeology.png',
                    mobile: 'cards/mobile/hydrogeology.png'
                },
                'Лицензирование, ЗСО, защита запасов и аудит': {
                    desktop: 'cards/licensing.png',
                    mobile: 'cards/mobile/licensing.png'
                },
                'Бурение скважин': {
                    desktop: 'cards/drilling.png',
                    mobile: 'cards/mobile/drilling.png'
                },
                'Водоподготовка': {
                    desktop: 'cards/water_treatment.png',
                    mobile: 'cards/mobile/water_treatment.png'
                },
                'Очистные сооружения': {
                    desktop: 'cards/treatment_facilities.png',
                    mobile: 'cards/mobile/treatment_facilities.png'
                },
                'Автоматизация и пусконаладочные работы': {
                    desktop: 'cards/automation.png',
                    mobile: 'cards/mobile/automation.png'
                }
            }
        },
        bur_service: {
            cards: {
                'Восстановление дебита скважины': {
                    desktop: 'cards/debit_recovery.png',
                    mobile: 'cards/mobile/debit_recovery.png'
                },
                'Очистка мембран обратного осмоса': {
                    desktop: 'cards/membrane_cleaning.png',
                    mobile: 'cards/mobile/membrane_cleaning.png'
                },
                'Телеинспекция скважин': {
                    desktop: 'cards/teleinspection.png',
                    mobile: 'cards/mobile/teleinspection.png'
                }
            }
        },
        geography: {
            features: {
                'Геотехнология — главный офис': {
                    desktop: 'features/geo_office_syzran.png',
                    mobile: 'features/mobile/geo_office_syzran.png'
                },
                'Бур Сервис — главный офис': {
                    desktop: 'features/bur_office_syzran.png',
                    mobile: 'features/mobile/bur_office_syzran.png'
                },
                'Представительство Геотехнологии': {
                    desktop: 'features/geo_office_lipetsk.png',
                    mobile: 'features/mobile/geo_office_lipetsk.png'
                }
            }
        },
        contacts: {
            features: {
                'Геотехнология': {
                    desktop: 'features/contact_geotechnology.png',
                    mobile: 'features/mobile/contact_geotechnology.png'
                },
                'Бур Сервис': {
                    desktop: 'features/contact_bur_service.png',
                    mobile: 'features/mobile/contact_bur_service.png'
                },
                'Представительство Геотехнологии в Липецке': {
                    desktop: 'features/contact_lipetsk.png',
                    mobile: 'features/mobile/contact_lipetsk.png'
                }
            }
        }
    };

    var footerMediaMap = {
        'контакты': {
            desktop: 'features/nav_contacts.png',
            mobile: 'features/mobile/nav_contacts.png'
        }
    };

    function isMobileViewport() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function normalize(text) {
        return String(text || '')
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function toAbsolute(path) {
        return new URL(path, imagesBase).href;
    }

    function getHeaderOffset() {
        var header = document.querySelector('.site-header');
        return header ? header.offsetHeight + 8 : 0;
    }

    function lockBody(isLocked) {
        if (!body) {
            return;
        }
        body.style.overflow = isLocked ? 'hidden' : '';
    }

    function getCurrentPageKey() {
        if (!body) {
            return null;
        }

        var keys = Object.keys(decorRegistry);
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            var aliases = [
                'page-' + key,
                'page-' + key.replace(/_/g, '-'),
                'page-' + key.replace(/-/g, '_')
            ];

            for (var j = 0; j < aliases.length; j += 1) {
                if (body.classList.contains(aliases[j])) {
                    return key;
                }
            }
        }

        var path = window.location.pathname || '/';
        path = path.replace(/\/index\.html$/, '/');
        path = path.replace(/\/+$/, '/');

        if (path === '/' || path === '') return 'home';
        if (/\/services\/?$/.test(path)) return 'services';
        if (/\/bur-service\/?$/.test(path)) return 'bur_service';
        if (/\/geography\/?$/.test(path)) return 'geography';
        if (/\/contacts\/?$/.test(path)) return 'contacts';

        return null;
    }

    function getMappedConfig(map, title) {
        if (!map || !title) {
            return null;
        }

        if (map[title]) {
            return map[title];
        }

        var normalizedTitle = normalize(title);
        var keys = Object.keys(map);

        for (var i = 0; i < keys.length; i += 1) {
            if (normalize(keys[i]) === normalizedTitle) {
                return map[keys[i]];
            }
        }

        return null;
    }

    function setResponsiveImage(img, desktopSrc, mobileSrc) {
        if (!img) {
            return;
        }

        img.setAttribute('data-decor-desktop', desktopSrc);
        img.setAttribute('data-decor-mobile', mobileSrc || desktopSrc);

        if (img.dataset.responsiveBound !== '1') {
            img.dataset.responsiveBound = '1';

            img.addEventListener('error', function () {
                var desktop = img.getAttribute('data-decor-desktop');
                var mobile = img.getAttribute('data-decor-mobile') || desktop;
                var current = img.getAttribute('src');

                if (current === mobile && mobile !== desktop) {
                    img.dataset.mobileBroken = '1';
                    img.setAttribute('src', desktop);
                    requestRipplesSync();
                    return;
                }

                if (current !== desktop) {
                    img.setAttribute('src', desktop);
                    requestRipplesSync();
                    return;
                }

                var wrapper = img.parentNode;
                if (
                    wrapper &&
                    (wrapper.classList.contains('card-media') ||
                        wrapper.classList.contains('feature-media') ||
                        wrapper.classList.contains('footer-block__media'))
                ) {
                    wrapper.remove();
                }
            });

            img.addEventListener('load', requestRipplesSync);
        }

        applyResponsiveImage(img);
    }

    function applyResponsiveImage(img) {
        if (!img) {
            return;
        }

        var desktop = img.getAttribute('data-decor-desktop');
        var mobile = img.getAttribute('data-decor-mobile') || desktop;
        var mobileBroken = img.dataset.mobileBroken === '1';
        var target = isMobileViewport() && !mobileBroken ? mobile : desktop;

        if (img.getAttribute('src') !== target) {
            img.setAttribute('src', target);
        }
    }

    function updateResponsiveDecorImages() {
        var images = document.querySelectorAll('img[data-decor-desktop]');
        for (var i = 0; i < images.length; i += 1) {
            applyResponsiveImage(images[i]);
        }
    }

    function createMedia(kind, config) {
        var desktop = toAbsolute(config.desktop);
        var mobile = toAbsolute(config.mobile || config.desktop);

        var wrapper = document.createElement('div');
        wrapper.className = kind === 'card' ? 'card-media' : 'feature-media';

        var img = document.createElement('img');
        img.className = kind === 'card' ? 'card-media__img' : 'feature-media__img';
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';

        wrapper.appendChild(img);
        setResponsiveImage(img, desktop, mobile);

        return wrapper;
    }

    function decorate(selector, map, kind) {
        if (!map) {
            return;
        }

        var items = document.querySelectorAll(selector);

        for (var i = 0; i < items.length; i += 1) {
            var item = items[i];
            if (item.classList.contains('has-media')) {
                continue;
            }

            var titleNode = item.querySelector('h3');
            if (!titleNode) {
                continue;
            }

            var title = titleNode.textContent.trim();
            var config = getMappedConfig(map, title);

            if (!config) {
                continue;
            }

            var media = createMedia(kind, config);
            item.insertBefore(media, item.firstChild);
            item.classList.add('has-media');
        }
    }

    function enhanceClickableCards() {
        var cards = document.querySelectorAll('.card');

        for (var i = 0; i < cards.length; i += 1) {
            (function (card) {
                var link = card.querySelector('.card__link[href]');
                if (!link) return;

                var href = link.getAttribute('href');
                if (!href || href === '#') return;

                card.classList.add('is-card-link');
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'link');

                card.addEventListener('click', function (event) {
                    if (event.target.closest('a, button, input, textarea, select, label')) {
                        return;
                    }
                    window.location.href = href;
                });

                card.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        window.location.href = href;
                    }
                });
            })(cards[i]);
        }
    }

    function prepareDownloadLinks() {
        var links = document.querySelectorAll(
            'a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".xls"], a[href$=".xlsx"]'
        );

        for (var i = 0; i < links.length; i += 1) {
            if (!links[i].hasAttribute('download')) {
                links[i].setAttribute('download', '');
            }
        }
    }

    function scrollToHash(hash, updateHistory) {
        if (!hash || hash.charAt(0) !== '#') {
            return false;
        }

        var target = document.querySelector(hash);
        if (!target) {
            return false;
        }

        var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

        window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth'
        });

        if (updateHistory) {
            history.replaceState(null, '', hash);
        }

        return true;
    }

    function handleMissingRequestTarget(hash) {
        if (hash !== '#request') return false;
        if (!requestHref) return false;

        window.location.href = requestHref;
        return true;
    }

    function setupNavigation() {
        var navToggle = document.querySelector('[data-nav-toggle]');
        var nav = document.querySelector('[data-nav]');

        if (!navToggle || !nav) {
            return;
        }

        function setNavState(isOpen) {
            nav.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));

            if (isMobileViewport()) {
                lockBody(isOpen);
            } else {
                lockBody(false);
            }
        }

        function closeNav() {
            setNavState(false);
        }

        function toggleNav() {
            var isOpen = nav.classList.contains('is-open');
            setNavState(!isOpen);
        }

        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-controls', 'site-nav-panel');
        nav.setAttribute('id', 'site-nav-panel');

        navToggle.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleNav();
        });

        document.addEventListener('click', function (event) {
            if (!isMobileViewport()) return;
            if (!nav.classList.contains('is-open')) return;

            var clickedInsideNav = nav.contains(event.target);
            var clickedToggle = navToggle.contains(event.target);

            if (!clickedInsideNav && !clickedToggle) {
                closeNav();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeNav();
            }
        });

        var navLinks = nav.querySelectorAll('a');
        for (var i = 0; i < navLinks.length; i += 1) {
            navLinks[i].addEventListener('click', function () {
                if (isMobileViewport()) {
                    closeNav();
                }
            });
        }

        window.addEventListener('resize', function () {
            if (!isMobileViewport()) {
                closeNav();
            }
        });
    }

    function setupAnchorLinks() {
        var anchors = document.querySelectorAll('a[href^="#"]');

        for (var i = 0; i < anchors.length; i += 1) {
            anchors[i].addEventListener('click', function (event) {
                var href = this.getAttribute('href');
                if (!href || href === '#') return;

                var handled = scrollToHash(href, true);
                if (handled) {
                    event.preventDefault();
                    lockBody(false);
                    return;
                }

                var redirected = handleMissingRequestTarget(href);
                if (redirected) {
                    event.preventDefault();
                    lockBody(false);
                }
            });
        }

        if (window.location.hash) {
            window.setTimeout(function () {
                scrollToHash(window.location.hash, false);
            }, 120);
        }
    }

    function setupForms() {
        var forms = document.querySelectorAll('form[data-demo-submit="true"]');

        for (var i = 0; i < forms.length; i += 1) {
            forms[i].addEventListener('submit', function (event) {
                event.preventDefault();

                var requiredFields = this.querySelectorAll('[required]');
                var firstInvalidField = null;

                for (var j = 0; j < requiredFields.length; j += 1) {
                    var field = requiredFields[j];
                    var isFile = field.type === 'file';
                    var isEmpty = isFile
                        ? !field.files || field.files.length === 0
                        : !String(field.value || '').trim();

                    field.style.borderColor = '';

                    if (isEmpty) {
                        field.style.borderColor = 'rgba(180, 80, 80, 0.85)';
                        if (!firstInvalidField) {
                            firstInvalidField = field;
                        }
                    }
                }

                var status = this.querySelector('.form-status');
                if (!status) {
                    status = document.createElement('p');
                    status.className = 'form-status';
                    this.appendChild(status);
                }

                if (firstInvalidField) {
                    status.textContent = 'Пожалуйста, заполните обязательные поля.';
                    status.style.color = '#d8b0b0';
                    firstInvalidField.focus();
                    return;
                }

                status.textContent = 'Форма работает в демо-режиме. Для боевого запуска нужно подключить отправку на почту, CRM или backend.';
                status.style.color = '#B4C4A7';

                this.reset();
            });
        }
    }

    function installFonts() {
        if (!head || document.querySelector('link[data-fonts="geologica-inter"]')) {
            return;
        }

        var preconnect1 = document.createElement('link');
        preconnect1.rel = 'preconnect';
        preconnect1.href = 'https://fonts.googleapis.com';

        var preconnect2 = document.createElement('link');
        preconnect2.rel = 'preconnect';
        preconnect2.href = 'https://fonts.gstatic.com';
        preconnect2.crossOrigin = 'anonymous';

        var fonts = document.createElement('link');
        fonts.rel = 'stylesheet';
        fonts.href = 'https://fonts.googleapis.com/css2?family=Geologica:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
        fonts.setAttribute('data-fonts', 'geologica-inter');

        head.appendChild(preconnect1);
        head.appendChild(preconnect2);
        head.appendChild(fonts);
    }

    function installHeaderState() {
        var header = document.querySelector('.site-header');
        if (!header) {
            return;
        }

        function updateHeaderState() {
            header.classList.toggle('is-scrolled', window.scrollY > 12);
        }

        updateHeaderState();
        window.addEventListener('scroll', updateHeaderState, { passive: true });
    }

    function probeImage(urls, onSuccess, onError) {
        if (!urls || !urls.length) {
            if (onError) onError();
            return;
        }

        var url = urls.shift();
        var probe = new Image();

        probe.onload = function () {
            onSuccess(url);
        };

        probe.onerror = function () {
            probeImage(urls, onSuccess, onError);
        };

        probe.src = url;
    }

    function installHeaderLogo() {
        var brand = document.querySelector('.site-header .brand');
        if (!brand || brand.querySelector('.brand__logo') || brand.dataset.logoInit === '1') {
            return;
        }

        brand.dataset.logoInit = '1';

        var logoCandidates = [
            new URL('logo.svg', imagesBase).href,
            new URL('logo.png', imagesBase).href
        ];

        probeImage(
            logoCandidates.slice(),
            function (logoUrl) {
                var textWrap = brand.querySelector('.brand__text');

                if (!textWrap) {
                    textWrap = document.createElement('span');
                    textWrap.className = 'brand__text';

                    while (brand.firstChild) {
                        textWrap.appendChild(brand.firstChild);
                    }

                    brand.appendChild(textWrap);
                }

                var logo = document.createElement('img');
                logo.className = 'brand__logo';
                logo.src = logoUrl;
                logo.alt = 'Логотип Геотехнология';
                logo.decoding = 'async';
                logo.loading = 'eager';

                brand.insertBefore(logo, textWrap);
                brand.classList.add('brand--with-logo');
            },
            function () {
                /* no logo file found */
            }
        );
    }

    function installResponsiveHero() {
        var heroImage = document.querySelector('.hero__image');
        if (!heroImage) {
            return;
        }

        if (heroImage.dataset.mobileHeroReady !== '1') {
            var rawSrc = heroImage.getAttribute('src');
            if (!rawSrc) {
                return;
            }

            var desktopSrc = new URL(rawSrc, window.location.href).href;
            var mobileSrc = desktopSrc.replace('/images/pages/', '/images/pages/mobile/');

            heroImage.dataset.heroDesktop = desktopSrc;
            heroImage.dataset.heroMobile = mobileSrc;
            heroImage.dataset.mobileHeroReady = '1';

            heroImage.addEventListener('error', function () {
                var desktop = heroImage.dataset.heroDesktop;
                var mobile = heroImage.dataset.heroMobile;

                if (heroImage.src === mobile) {
                    heroImage.dataset.heroMobileBroken = '1';
                    heroImage.src = desktop;
                }

                requestRipplesSync();
            });

            heroImage.addEventListener('load', requestRipplesSync);
        }

        function applyHeroSource() {
            var desktop = heroImage.dataset.heroDesktop;
            var mobile = heroImage.dataset.heroMobile;
            var mobileBroken = heroImage.dataset.heroMobileBroken === '1';

            var target =
                window.innerWidth <= MOBILE_BREAKPOINT && !mobileBroken
                    ? mobile
                    : desktop;

            if (heroImage.src !== target) {
                heroImage.src = target;
            }
        }

        applyHeroSource();
        window.addEventListener('resize', applyHeroSource);
    }

    function installDecorMedia() {
        var pageKey = getCurrentPageKey();
        if (!pageKey || !decorRegistry[pageKey]) {
            return;
        }

        var pageConfig = decorRegistry[pageKey];
        decorate('.card', pageConfig.cards, 'card');
        decorate('.feature-card', pageConfig.features, 'feature');
        updateResponsiveDecorImages();
    }

    function getFooterTitleText(block) {
        if (!block) {
            return '';
        }

        var heading = block.querySelector('h3');
        var brandName = block.querySelector('.brand__name');

        if (heading) {
            return heading.textContent || '';
        }

        if (brandName) {
            return brandName.textContent || '';
        }

        return block.textContent || '';
    }

    function isContactsFooterBlock(block) {
        var titleText = normalize(getFooterTitleText(block));
    var rawText = block ? block.textContent || '' : '';

    if (titleText.indexOf('навигац') !== -1) {
        return false;
    }

    if (titleText.indexOf('контакт') !== -1) {
        return true;
    }

    if (/\+7/.test(rawText) || /@/.test(rawText)) {
        return true;
    }

    return false;
}

    function compactFooterToContacts() {
        var grid = document.querySelector('.site-footer__grid');
        if (!grid) {
            return;
        }

        var blocks = grid.children;
        if (!blocks || blocks.length <= 1) {
            grid.classList.add('site-footer__grid--single');
            if (blocks.length === 1) {
                blocks[0].classList.add('site-footer__block--contacts-only');
            }
            return;
        }

        var contactsBlock = null;
        for (var i = 0; i < blocks.length; i += 1) {
            if (isContactsFooterBlock(blocks[i])) {
                contactsBlock = blocks[i];
                break;
            }
        }

        if (!contactsBlock) {
            return;
        }

        var children = Array.prototype.slice.call(blocks);
        for (var j = 0; j < children.length; j += 1) {
            if (children[j] !== contactsBlock) {
                children[j].remove();
            }
        }

        grid.classList.add('site-footer__grid--single');
        contactsBlock.classList.add('site-footer__block--contacts-only');
    }

    function installFooterMedia() {
        var blocks = document.querySelectorAll('.site-footer__grid > div');

        for (var i = 0; i < blocks.length; i += 1) {
            var block = blocks[i];
            var titleText = getFooterTitleText(block);
            var config = footerMediaMap[normalize(titleText)];

            if (!config) {
                continue;
            }

            var media = block.querySelector('.footer-block__media');
            var img = block.querySelector('.footer-block__image');

            if (!media) {
                media = document.createElement('div');
                media.className = 'footer-block__media';
                block.insertBefore(media, block.firstChild);
            }

            if (!img) {
                img = document.createElement('img');
                img.className = 'footer-block__image';
                img.alt = titleText.trim();
                img.loading = 'lazy';
                img.decoding = 'async';
                media.appendChild(img);
            }

            setResponsiveImage(
                img,
                toAbsolute(config.desktop),
                toAbsolute(config.mobile || config.desktop)
            );

            block.classList.add('has-footer-media');
        }

        updateResponsiveDecorImages();
    }

    function buildYandexMapSection() {
        var pageKey = getCurrentPageKey();
        if (pageKey !== 'geography') {
            return;
        }

        var regionsBlock = document.getElementById('geo_regions');
        if (!regionsBlock || regionsBlock.dataset.mapReady === '1') {
            return;
        }

        regionsBlock.dataset.mapReady = '1';

        var mapEmbedSrc = 'https://yandex.ru/map-widget/v1/?ll=45.700000%2C53.100000&z=4&pt=48.474541%2C53.155782%2Cpm2gnm~48.474000%2C53.154700%2Cpm2blm~39.594633%2C52.612199%2Cpm2dgm';
        var mapOpenHref = 'https://yandex.ru/maps/?ll=45.700000%2C53.100000&z=4';

        var section = document.createElement('section');
        section.className = 'section geo-embed-section';
        section.id = 'geo-map';
        section.innerHTML =
            '<div class="container">' +
                '<div class="section-head">' +
                    '<h2>Карта присутствия</h2>' +
                    '<p>Ниже размещена обычная Яндекс-карта с основными точками присутствия компании.</p>' +
                '</div>' +
                '<div class="geo-embed">' +
                    '<div class="geo-embed__map">' +
                        '<iframe ' +
                            'src="' + mapEmbedSrc + '" ' +
                            'loading="lazy" ' +
                            'allowfullscreen="true" ' +
                            'referrerpolicy="no-referrer-when-downgrade" ' +
                            'title="Яндекс карта присутствия Геотехнологии и Бур Сервиса">' +
                        '</iframe>' +
                    '</div>' +
                    '<div class="geo-embed__note">' +
                        '<h3>Точки присутствия</h3>' +
                        '<ul class="bullet-list bullet-list--large">' +
                            '<li>Геотехнология — главный офис, Сызрань</li>' +
                            '<li>Бур Сервис — главный офис, Сызрань</li>' +
                            '<li>Представительство Геотехнологии, Липецк</li>' +
                        '</ul>' +
                        '<div class="actions">' +
                            '<a class="btn btn--secondary" href="' + mapOpenHref + '" target="_blank" rel="noopener noreferrer">Открыть Яндекс карту</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        regionsBlock.parentNode.insertBefore(section, regionsBlock);
    }

    function ensurePageBackgroundScrolls() {
        document.documentElement.style.backgroundAttachment = 'scroll';

        if (body) {
            body.style.backgroundAttachment = 'scroll';
        }

        var wrappers = document.querySelectorAll(
            'main, .site, .site-shell, .page, .page-shell, .layout, .wrapper, .app, #app'
        );

        for (var i = 0; i < wrappers.length; i += 1) {
            wrappers[i].style.backgroundAttachment = 'scroll';
        }
    }

    function removeHomeHeroTags() {
        var pageKey = getCurrentPageKey();
        if (pageKey !== 'home') {
            return;
        }

        var lists = document.querySelectorAll('.hero-tags');
        for (var i = 0; i < lists.length; i += 1) {
            lists[i].remove();
        }
    }

    function markHomeMainCards() {
        var pageKey = getCurrentPageKey();
        if (pageKey !== 'home') {
            return;
        }

        var section =
            document.getElementById('home_services') ||
            document.querySelector('[data-block-id="home_services"]') ||
            document.querySelector('.page-home .section .cards-grid') ||
            document.querySelector('.cards-grid');

        var grid = section && section.classList && section.classList.contains('cards-grid')
            ? section
            : section
                ? section.querySelector('.cards-grid')
                : null;

        if (!grid) {
            return;
        }

        var cards = grid.querySelectorAll('.card');
        if (cards.length !== 2) {
            return;
        }

        grid.classList.add('cards-grid--centered-two');
        grid.classList.add('cards-grid--home-main-two');

        for (var i = 0; i < cards.length; i += 1) {
            cards[i].classList.add('card--home-main');
        }
    }

    function markCompactForms() {
        var forms = document.querySelectorAll('.form-card');
        if (!forms.length) {
            return;
        }

        if (body) {
            body.classList.add('has-compact-forms');
        }

        for (var i = 0; i < forms.length; i += 1) {
            forms[i].classList.add('form-card--compact');

            var cta = forms[i].closest('.cta-box');
            if (cta) {
                cta.classList.add('cta-box--compact');
            }
        }
    }

    function loadScriptSequence(urls, onSuccess, onError) {
        if (!urls || !urls.length) {
            if (onError) {
                onError();
            }
            return;
        }

        var url = urls.shift();
        var script = document.createElement('script');
        script.src = url;
        script.async = true;

        script.onload = function () {
            onSuccess();
        };

        script.onerror = function () {
            script.remove();
            loadScriptSequence(urls, onSuccess, onError);
        };

        head.appendChild(script);
    }

    function loadJquery(callback) {
        if (window.jQuery) {
            callback(window.jQuery);
            return;
        }

        jqueryCallbacks.push(callback);

        if (jqueryLoading) {
            return;
        }

        jqueryLoading = true;

        loadScriptSequence(
            [
                'https://code.jquery.com/jquery-3.7.1.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js'
            ],
            function () {
                jqueryLoading = false;

                var $ = window.jQuery;
                while (jqueryCallbacks.length) {
                    try {
                        jqueryCallbacks.shift()($);
                    } catch (error) {
                        console.error(error);
                    }
                }
            },
            function () {
                jqueryLoading = false;
                jqueryCallbacks = [];
                console.warn('Не удалось загрузить jQuery.');
            }
        );
    }

    function flushRipplesCallbacks() {
        var $ = window.jQuery;

        while (ripplesCallbacks.length) {
            try {
                ripplesCallbacks.shift()($);
            } catch (error) {
                console.error(error);
            }
        }
    }

    function loadRipplesPlugin(callback) {
        if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.ripples === 'function') {
            callback(window.jQuery);
            return;
        }

        ripplesCallbacks.push(callback);

        if (ripplesLoading) {
            return;
        }

        ripplesLoading = true;

        loadJquery(function ($) {
            if ($ && $.fn && typeof $.fn.ripples === 'function') {
                ripplesLoading = false;
                flushRipplesCallbacks();
                return;
            }

            var ripplesUrl = new URL('jquery.ripples.js', scriptSrc).href;

            loadScriptSequence(
                [ripplesUrl],
                function () {
                    ripplesLoading = false;
                    flushRipplesCallbacks();
                },
                function () {
                    ripplesLoading = false;
                    ripplesCallbacks = [];
                    console.warn('Не удалось загрузить jquery.ripples.');
                }
            );
        });
    }

    function getImageSourceUrl(img) {
        if (!img) {
            return '';
        }

        var raw = img.currentSrc || img.getAttribute('src') || '';
        if (!raw) {
            return '';
        }

        try {
            return new URL(raw, window.location.href).href;
        } catch (error) {
            return raw;
        }
    }

    function cleanupBrokenRipplesHosts() {
        var hosts = document.querySelectorAll('.hero__ripples-surface, .media-ripples-surface');
        for (var i = 0; i < hosts.length; i += 1) {
            hosts[i].remove();
        }
    }

    function getBlockRipplesTexture() {
        if (blockRipplesTextureCache) {
            return blockRipplesTextureCache;
        }

        var svg = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="none">',
            '<defs>',
            '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">',
            '<stop offset="0%" stop-color="#173717"/>',
            '<stop offset="45%" stop-color="#102910"/>',
            '<stop offset="100%" stop-color="#091909"/>',
            '</linearGradient>',
            '<radialGradient id="g1" cx="18%" cy="20%" r="40%">',
            '<stop offset="0%" stop-color="rgba(169,216,200,0.22)"/>',
            '<stop offset="55%" stop-color="rgba(120,170,160,0.08)"/>',
            '<stop offset="100%" stop-color="rgba(0,0,0,0)"/>',
            '</radialGradient>',
            '<radialGradient id="g2" cx="82%" cy="22%" r="34%">',
            '<stop offset="0%" stop-color="rgba(164,210,188,0.16)"/>',
            '<stop offset="60%" stop-color="rgba(130,170,160,0.06)"/>',
            '<stop offset="100%" stop-color="rgba(0,0,0,0)"/>',
            '</radialGradient>',
            '<radialGradient id="g3" cx="50%" cy="78%" r="48%">',
            '<stop offset="0%" stop-color="rgba(140,190,178,0.12)"/>',
            '<stop offset="58%" stop-color="rgba(100,140,132,0.04)"/>',
            '<stop offset="100%" stop-color="rgba(0,0,0,0)"/>',
            '</radialGradient>',
            '</defs>',
            '<rect width="1600" height="900" fill="url(#bg)"/>',
            '<rect width="1600" height="900" fill="url(#g1)"/>',
            '<rect width="1600" height="900" fill="url(#g2)"/>',
            '<rect width="1600" height="900" fill="url(#g3)"/>',
            '<g fill="none" stroke="#AED8C8" stroke-opacity="0.10" stroke-width="4">',
            '<path d="M-40 150 C 120 100, 280 210, 460 170 S 820 80, 1040 150 S 1400 235, 1660 160"/>',
            '<path d="M-60 310 C 150 250, 290 360, 500 320 S 860 250, 1080 320 S 1390 410, 1660 340"/>',
            '<path d="M-20 500 C 180 450, 330 560, 560 520 S 900 450, 1140 520 S 1410 590, 1640 540"/>',
            '<path d="M-40 700 C 160 650, 340 760, 560 720 S 930 650, 1140 720 S 1420 800, 1660 730"/>',
            '</g>',
            '<g fill="#D7F2E8" fill-opacity="0.06">',
            '<circle cx="220" cy="170" r="44"/>',
            '<circle cx="510" cy="265" r="22"/>',
            '<circle cx="1180" cy="180" r="34"/>',
            '<circle cx="1340" cy="580" r="26"/>',
            '<circle cx="760" cy="690" r="30"/>',
            '<circle cx="320" cy="720" r="18"/>',
            '</g>',
            '</svg>'
        ].join('');

        blockRipplesTextureCache = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        return blockRipplesTextureCache;
    }

    function getRipplesProfile(kind) {
        var mobile = isMobileViewport();

        if (kind === 'hero') {
            return {
                resolution: mobile ? 240 : 420,
                dropRadius: mobile ? 26 : 40,
                perturbance: mobile ? 0.075 : 0.11,
                interactive: false,
                boost: {
                    moveRadius: mobile ? 14 : 22,
                    moveStrength: mobile ? 0.038 : 0.06,
                    moveThrottle: mobile ? 120 : 72,
                    enterRadius: mobile ? 34 : 58,
                    enterStrength: mobile ? 0.14 : 0.24,
                    clickRadius: mobile ? 64 : 108,
                    clickStrength: mobile ? 0.24 : 0.36,
                    echoDelay: 150,
                    echoRadiusScale: 0.72,
                    echoStrengthScale: 0.72,
                    ambient: true,
                    ambientRadius: mobile ? 34 : 52,
                    ambientStrength: mobile ? 0.07 : 0.1,
                    ambientMin: 1800,
                    ambientMax: 3400
                }
            };
        }

        if (kind === 'media') {
            return {
                resolution: mobile ? 140 : 240,
                dropRadius: mobile ? 14 : 20,
                perturbance: mobile ? 0.055 : 0.085,
                interactive: false,
                boost: {
                    moveRadius: mobile ? 8 : 12,
                    moveStrength: mobile ? 0.028 : 0.045,
                    moveThrottle: mobile ? 120 : 78,
                    enterRadius: mobile ? 20 : 30,
                    enterStrength: mobile ? 0.1 : 0.16,
                    clickRadius: mobile ? 38 : 58,
                    clickStrength: mobile ? 0.18 : 0.28,
                    echoDelay: 140,
                    echoRadiusScale: 0.74,
                    echoStrengthScale: 0.7
                }
            };
        }

        return {
            resolution: mobile ? 132 : 210,
            dropRadius: mobile ? 16 : 22,
            perturbance: mobile ? 0.06 : 0.095,
            interactive: false,
            boost: {
                moveRadius: mobile ? 10 : 14,
                moveStrength: mobile ? 0.03 : 0.044,
                moveThrottle: mobile ? 130 : 82,
                enterRadius: mobile ? 22 : 34,
                enterStrength: mobile ? 0.1 : 0.16,
                clickRadius: mobile ? 42 : 66,
                clickStrength: mobile ? 0.18 : 0.26,
                echoDelay: 150,
                echoRadiusScale: 0.76,
                echoStrengthScale: 0.72
            }
        };
    }

    function bindRipplesImageSync(imageElement) {
        if (!imageElement || imageElement.dataset.ripplesSyncBound === '1') {
            return;
        }

        imageElement.dataset.ripplesSyncBound = '1';
        imageElement.addEventListener('load', requestRipplesSync);
        imageElement.addEventListener('error', requestRipplesSync);
    }

    function tuneRipplesSurface(element) {
        if (!element) {
            return;
        }

        element.style.overflow = 'hidden';

        var canvas = element.querySelector('canvas');
        if (canvas) {
            canvas.style.borderRadius = window.getComputedStyle(element).borderRadius || 'inherit';
            canvas.style.pointerEvents = 'none';
        }
    }

    function updateRipplesOptions($element, options) {
        if (!$element || !$element.data('ripples')) {
            return;
        }

        try {
            $element.ripples('set', 'dropRadius', options.dropRadius);
            $element.ripples('set', 'perturbance', options.perturbance);
            $element.ripples('set', 'interactive', options.interactive);
            $element.ripples('updateSize');
        } catch (error) {
            console.warn(error);
        }
    }

    function initRipplesOnElement($, element, source, options, activeTarget) {
        if (!element || !source) {
            return false;
        }

        if (element.offsetWidth < 20 || element.offsetHeight < 20) {
            return false;
        }

        var $element = $(element);

        if ($element.data('ripples')) {
            try {
                $element.ripples('set', 'imageUrl', source);
                updateRipplesOptions($element, options);

                if (activeTarget) {
                    activeTarget.classList.add('is-ripples-active');
                }

                tuneRipplesSurface(element);
                return true;
            } catch (error) {
                console.warn(error);
            }
        }

        try {
            $element.ripples({
                imageUrl: source,
                resolution: options.resolution,
                dropRadius: options.dropRadius,
                perturbance: options.perturbance,
                interactive: options.interactive,
                crossOrigin: ''
            });

            if (activeTarget) {
                activeTarget.classList.add('is-ripples-active');
            }

            tuneRipplesSurface(element);
            return true;
        } catch (error) {
            console.warn('Ripples init error:', error);
            if (activeTarget) {
                activeTarget.classList.remove('is-ripples-active');
            }
            return false;
        }
    }

    function getPointerPagePosition(event) {
        if (!event) {
            return null;
        }

        if (event.touches && event.touches.length) {
            return {
                pageX: event.touches[0].pageX,
                pageY: event.touches[0].pageY
            };
        }

        if (event.changedTouches && event.changedTouches.length) {
            return {
                pageX: event.changedTouches[0].pageX,
                pageY: event.changedTouches[0].pageY
            };
        }

        if (typeof event.pageX === 'number' && typeof event.pageY === 'number') {
            return {
                pageX: event.pageX,
                pageY: event.pageY
            };
        }

        if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
            return {
                pageX: event.clientX + window.pageXOffset,
                pageY: event.clientY + window.pageYOffset
            };
        }

        return null;
    }

    function emitRippleDrop(element, x, y, radius, strength) {
        if (!element || !window.jQuery) {
            return;
        }

        var $element = window.jQuery(element);
        if (!$element.data('ripples')) {
            return;
        }

        try {
            $element.ripples('drop', x, y, radius, strength);
        } catch (error) {
            console.warn(error);
        }
    }

    function emitRippleFromEvent(element, event, radius, strength) {
        if (!element) {
            return;
        }

        var pos = getPointerPagePosition(event);
        if (!pos) {
            return;
        }

        var rect = element.getBoundingClientRect();
        var x = pos.pageX - (rect.left + window.pageXOffset);
        var y = pos.pageY - (rect.top + window.pageYOffset);

        emitRippleDrop(element, x, y, radius, strength);
    }

    function emitRippleAtCenter(element, radius, strength) {
        if (!element) {
            return;
        }

        emitRippleDrop(element, element.clientWidth / 2, element.clientHeight / 2, radius, strength);
    }

    function primeRipplesElement(element, boost, event) {
        if (!element || !boost) {
            return;
        }

        if (event) {
            emitRippleFromEvent(element, event, boost.enterRadius, boost.enterStrength);

            window.setTimeout(function () {
                emitRippleFromEvent(
                    element,
                    event,
                    boost.enterRadius * boost.echoRadiusScale,
                    boost.enterStrength * boost.echoStrengthScale
                );
            }, boost.echoDelay);
            return;
        }

        emitRippleAtCenter(element, boost.enterRadius, boost.enterStrength);

        window.setTimeout(function () {
            emitRippleAtCenter(
                element,
                boost.enterRadius * boost.echoRadiusScale,
                boost.enterStrength * boost.echoStrengthScale
            );
        }, boost.echoDelay);
    }

    function installEnhancedRipplesInteractions(element, boost) {
        if (!element || !boost || element.dataset.ripplesBoostBound === '1') {
            return;
        }

        element.dataset.ripplesBoostBound = '1';

        var lastMoveAt = 0;

        function onMove(event) {
            var now = Date.now();
            if (now - lastMoveAt < boost.moveThrottle) {
                return;
            }

            lastMoveAt = now;
            emitRippleFromEvent(element, event, boost.moveRadius, boost.moveStrength);
        }

        function onEnter(event) {
            emitRippleFromEvent(element, event, boost.enterRadius, boost.enterStrength);

            window.setTimeout(function () {
                emitRippleFromEvent(
                    element,
                    event,
                    boost.enterRadius * boost.echoRadiusScale,
                    boost.enterStrength * boost.echoStrengthScale
                );
            }, boost.echoDelay);
        }

        function onClick(event) {
            emitRippleFromEvent(element, event, boost.clickRadius, boost.clickStrength);

            window.setTimeout(function () {
                emitRippleFromEvent(
                    element,
                    event,
                    boost.clickRadius * boost.echoRadiusScale,
                    boost.clickStrength * boost.echoStrengthScale
                );
            }, boost.echoDelay);
        }

        function onFocus() {
            emitRippleAtCenter(element, boost.enterRadius * 0.9, boost.enterStrength);
        }

        element.addEventListener('mouseenter', onEnter, { passive: true });
        element.addEventListener('mousemove', onMove, { passive: true });
        element.addEventListener('mousedown', onClick, { passive: true });
        element.addEventListener('touchstart', onClick, { passive: true });
        element.addEventListener('touchmove', onMove, { passive: true });
        element.addEventListener('focusin', onFocus);
    }

    function startAmbientRipples(element, boost) {
        if (!element || !boost || !boost.ambient || element.dataset.ripplesAmbientBound === '1') {
            return;
        }

        element.dataset.ripplesAmbientBound = '1';

        function loop() {
            if (!document.hidden) {
                var rect = element.getBoundingClientRect();
                var inView = rect.bottom > 0 && rect.top < window.innerHeight;

                if (inView) {
                    var x = element.clientWidth * (0.18 + Math.random() * 0.64);
                    var y = element.clientHeight * (0.18 + Math.random() * 0.58);

                    emitRippleDrop(
                        element,
                        x,
                        y,
                        boost.ambientRadius,
                        boost.ambientStrength
                    );
                }
            }

            var delay = boost.ambientMin + Math.random() * (boost.ambientMax - boost.ambientMin);
            window.setTimeout(loop, delay);
        }

        window.setTimeout(loop, boost.ambientMin);
    }

    function syncRipplesElement(element, source, kind) {
        if (!element || !window.jQuery) {
            return;
        }

        var $element = window.jQuery(element);
        if (!$element.data('ripples')) {
            return;
        }

        try {
            if (source) {
                $element.ripples('set', 'imageUrl', source);
            }

            updateRipplesOptions($element, getRipplesProfile(kind));
            tuneRipplesSurface(element);
        } catch (error) {
            console.warn(error);
        }
    }

    function syncRipplesHosts() {
        var hero = document.querySelector('.hero');
        if (hero) {
            var heroImage = hero.querySelector('.hero__image');
            var heroSource = getImageSourceUrl(heroImage);
            if (heroSource) {
                syncRipplesElement(hero, heroSource, 'hero');
            }
        }

        var wrappers = document.querySelectorAll('.card-media, .feature-media, .footer-block__media');
        for (var i = 0; i < wrappers.length; i += 1) {
            var image = wrappers[i].querySelector('img');
            var source = getImageSourceUrl(image);
            if (source) {
                syncRipplesElement(wrappers[i], source, 'media');
            }
        }

        var blockTexture = getBlockRipplesTexture();
        var blocks = document.querySelectorAll(
            '.card, .feature-card, .info-card, .step-card, .form-card, .cta-box, .site-footer__grid > div, .geo-embed__map, .geo-embed__note, .geo-map__canvas-wrap, .geo-map__panel'
        );

        for (var j = 0; j < blocks.length; j += 1) {
            syncRipplesElement(blocks[j], blockTexture, 'block');
        }
    }

    function requestRipplesSync() {
        window.clearTimeout(ripplesSyncTimer);
        ripplesSyncTimer = window.setTimeout(syncRipplesHosts, 80);
    }

    function installRealJqueryRipples() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        cleanupBrokenRipplesHosts();

        loadRipplesPlugin(function ($) {
            if (!$ || !$.fn || typeof $.fn.ripples !== 'function') {
                return;
            }

            var supportsHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;
            var initImmediately = !supportsHover || isMobileViewport();

            var hero = document.querySelector('.hero');
            if (hero) {
                var heroImage = hero.querySelector('.hero__image');
                var heroSource = getImageSourceUrl(heroImage);

                if (heroImage && heroSource) {
                    bindRipplesImageSync(heroImage);

                    var heroProfile = getRipplesProfile('hero');
                    if (initRipplesOnElement($, hero, heroSource, heroProfile, hero)) {
                        installEnhancedRipplesInteractions(hero, heroProfile.boost);
                        primeRipplesElement(hero, heroProfile.boost);
                        startAmbientRipples(hero, heroProfile.boost);
                    }
                }
            }

            var wrappers = document.querySelectorAll('.card-media, .feature-media, .footer-block__media');
            for (var i = 0; i < wrappers.length; i += 1) {
                (function (wrapper) {
                    var image = wrapper.querySelector('img');
                    var source = getImageSourceUrl(image);
                    if (!image || !source) {
                        return;
                    }

                    bindRipplesImageSync(image);

                    function initMediaRipples(event) {
                        var profile = getRipplesProfile('media');

                        if (initRipplesOnElement($, wrapper, source, profile, wrapper)) {
                            installEnhancedRipplesInteractions(wrapper, profile.boost);
                            primeRipplesElement(wrapper, profile.boost, event);
                        }
                    }

                    if (initImmediately) {
                        initMediaRipples();
                    } else {
                        if (wrapper.dataset.ripplesLazyBound === '1') {
                            return;
                        }

                        wrapper.dataset.ripplesLazyBound = '1';
                        wrapper.addEventListener('mouseenter', initMediaRipples, { once: true, passive: true });
                        wrapper.addEventListener('focusin', initMediaRipples, { once: true });
                    }
                })(wrappers[i]);
            }

            var blocks = document.querySelectorAll(
                '.card, .feature-card, .info-card, .step-card, .form-card, .cta-box, .site-footer__grid > div, .geo-embed__map, .geo-embed__note, .geo-map__canvas-wrap, .geo-map__panel'
            );

            for (var j = 0; j < blocks.length; j += 1) {
                (function (block) {
                    var source = getBlockRipplesTexture();

                    function initBlockRipples(event) {
                        var profile = getRipplesProfile('block');

                        if (initRipplesOnElement($, block, source, profile, block)) {
                            installEnhancedRipplesInteractions(block, profile.boost);
                            primeRipplesElement(block, profile.boost, event);
                        }
                    }

                    if (initImmediately) {
                        initBlockRipples();
                    } else {
                        if (block.dataset.ripplesLazyBound === '1') {
                            return;
                        }

                        block.dataset.ripplesLazyBound = '1';
                        block.addEventListener('mouseenter', initBlockRipples, { once: true, passive: true });
                        block.addEventListener('focusin', initBlockRipples, { once: true });
                    }
                })(blocks[j]);
            }

            requestRipplesSync();

            if (body && body.dataset.ripplesResizeBound !== '1') {
                body.dataset.ripplesResizeBound = '1';
                window.addEventListener('resize', requestRipplesSync);
            }
        });
    }

    setupNavigation();
    setupAnchorLinks();
    setupForms();
    enhanceClickableCards();
    prepareDownloadLinks();
    installFonts();
    installHeaderState();
    installHeaderLogo();
    installResponsiveHero();
    ensurePageBackgroundScrolls();
    removeHomeHeroTags();
    markHomeMainCards();
    markCompactForms();
    installDecorMedia();
    compactFooterToContacts();
    installFooterMedia();
    buildYandexMapSection();
    installRealJqueryRipples();

    window.addEventListener('resize', function () {
        updateResponsiveDecorImages();
        requestRipplesSync();
    });
})();