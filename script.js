/* ==========================================================
   BTS | Beyond The Stars
   ========================================================== */

(function () {
    'use strict';

    document.documentElement.classList.add('js');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Loader ---------- */

    var loader = document.getElementById('loader');
    var loaderDone = false;

    function hideLoader() {
        if (loaderDone) return;
        loaderDone = true;
        loader.classList.add('hide');
        document.body.classList.add('is-ready');
    }

    window.addEventListener('load', function () {
        setTimeout(hideLoader, reduceMotion ? 0 : 900);
    });
    // Never trap the visitor behind the loader if an image is slow
    setTimeout(hideLoader, 4000);


    /* ---------- Header: solid background after scrolling ---------- */

    var header = document.getElementById('siteHeader');

    function updateHeader() {
        header.classList.toggle('is-scrolled', window.scrollY > 40);
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });


    /* ---------- Mobile menu ---------- */

    var menuToggle = document.getElementById('menuToggle');
    var nav = document.getElementById('nav');

    function setMenu(open) {
        nav.classList.toggle('active', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menuToggle.textContent = open ? '✕' : '☰';
    }

    menuToggle.addEventListener('click', function () {
        setMenu(!nav.classList.contains('active'));
    });

    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            setMenu(false);
            menuToggle.focus();
        }
    });


    /* ---------- Highlight the nav link for the section in view ---------- */

    var navLinks = Array.from(nav.querySelectorAll('a'));
    var navSections = navLinks
        .map(function (link) { return document.querySelector(link.getAttribute('href')); })
        .filter(Boolean);

    if ('IntersectionObserver' in window) {
        var navObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        navSections.forEach(function (section) { navObserver.observe(section); });
    }


    /* ---------- Images that fail to load keep their soft placeholder ---------- */

    document.querySelectorAll('.photo img').forEach(function (img) {
        function markBroken() { img.classList.add('is-broken'); }
        img.addEventListener('error', markBroken);
        if (img.complete && img.naturalWidth === 0 && img.currentSrc) markBroken();
    });


    /* ==========================================================
       HERO STARFIELD
       Twinkling stars, gentle pointer parallax, an occasional
       shooting star. Pauses when the hero is off screen.
       ========================================================== */

    (function starfield() {
        var canvas = document.getElementById('starfield');
        if (!canvas || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var hero = canvas.parentElement;
        var stars = [];
        var w = 0, h = 0, dpr = 1;
        var targetX = 0, targetY = 0, px = 0, py = 0;
        var shooting = null;
        var nextShot = 3000;
        var running = false;
        var raf = 0;

        function build() {
            var count = Math.max(70, Math.min(230, Math.round((w * h) / 7500)));
            stars = [];
            for (var i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: Math.random() * 1.4 + 0.3,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 1.4,
                    depth: Math.random(),
                    warm: Math.random() > 0.82
                });
            }
        }

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            var rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build();
            draw(0);
        }

        function draw(t) {
            var time = t / 1000;
            ctx.clearRect(0, 0, w, h);

            px += (targetX - px) * 0.05;
            py += (targetY - py) * 0.05;

            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = reduceMotion ? 0.8 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
                var x = s.x + px * s.depth * 16;
                var y = s.y + py * s.depth * 12;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = s.warm ? '#f6d7ee' : '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Shooting star
            if (!reduceMotion) {
                if (!shooting && t > nextShot) {
                    shooting = {
                        x: Math.random() * w * 0.7 + w * 0.1,
                        y: Math.random() * h * 0.35,
                        vx: 9 + Math.random() * 4,
                        vy: 4 + Math.random() * 2,
                        life: 0
                    };
                }
                if (shooting) {
                    shooting.x += shooting.vx;
                    shooting.y += shooting.vy;
                    shooting.life += 1;

                    var fade = Math.max(0, 1 - shooting.life / 55);
                    var grad = ctx.createLinearGradient(
                        shooting.x, shooting.y,
                        shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9
                    );
                    grad.addColorStop(0, 'rgba(255,255,255,' + fade + ')');
                    grad.addColorStop(1, 'rgba(255,255,255,0)');

                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.6;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(shooting.x, shooting.y);
                    ctx.lineTo(shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9);
                    ctx.stroke();

                    if (shooting.life > 55) {
                        shooting = null;
                        nextShot = t + 6000 + Math.random() * 4000;
                    }
                }
            }

            ctx.globalAlpha = 1;
        }

        function loop(t) {
            draw(t);
            if (running) raf = requestAnimationFrame(loop);
        }

        function start() {
            if (running || reduceMotion) return;
            running = true;
            raf = requestAnimationFrame(loop);
        }

        function stop() {
            running = false;
            cancelAnimationFrame(raf);
        }

        resize();
        window.addEventListener('resize', resize);

        if (!reduceMotion) {
            hero.addEventListener('pointermove', function (e) {
                var rect = hero.getBoundingClientRect();
                targetX = (e.clientX - rect.left) / rect.width - 0.5;
                targetY = (e.clientY - rect.top) / rect.height - 0.5;
            });

            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    entries[0].isIntersecting ? start() : stop();
                }).observe(hero);
            } else {
                start();
            }
        }
    })();


    /* ==========================================================
       THE SEVEN STARS (Big Dipper)
       One star per member. Hovering a member lights their star.
       ========================================================== */

    (function constellation() {
        var svg = document.getElementById('constellation');
        var caption = document.getElementById('skyCaption');
        var panel = document.getElementById('skyPanel');
        var grid = document.getElementById('memberGrid');
        if (!svg || !grid) return;

        var NS = 'http://www.w3.org/2000/svg';
        var points = [
            [40, 70], [135, 108], [225, 124], [312, 154],
            [330, 262], [472, 278], [490, 168]
        ];
        var pathData = 'M40 70 L135 108 L225 124 L312 154 L330 262 L472 278 L490 168 L312 154';
        var defaultCaption = caption.textContent;

        function el(name, attrs) {
            var node = document.createElementNS(NS, name);
            Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
            return node;
        }

        var line = el('path', { d: pathData, 'class': 'c-line' });
        svg.appendChild(line);

        var starNodes = points.map(function (p, i) {
            var group = el('g', { 'class': 'c-star', 'data-i': i });
            group.appendChild(el('circle', { cx: p[0], cy: p[1], r: 10, 'class': 'c-halo' }));
            group.appendChild(el('circle', { cx: p[0], cy: p[1], r: 4.5, 'class': 'c-core' }));
            svg.appendChild(group);
            return group;
        });

        // Draw the constellation once, when it scrolls into view
        var length = line.getTotalLength ? line.getTotalLength() : 0;
        if (length && !reduceMotion) {
            line.style.strokeDasharray = length;
            line.style.strokeDashoffset = length;
            line.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(.22,.8,.3,1)';

            if ('IntersectionObserver' in window) {
                var drawObserver = new IntersectionObserver(function (entries) {
                    if (!entries[0].isIntersecting) return;
                    line.style.strokeDashoffset = 0;
                    drawObserver.disconnect();
                }, { threshold: 0.4 });
                drawObserver.observe(panel);
            } else {
                line.style.strokeDashoffset = 0;
            }
        }

        var activeCard = null;

        function light(card) {
            if (activeCard === card) return;
            clear();
            activeCard = card;
            card.classList.add('is-lit');

            var index = Number(card.getAttribute('data-star'));
            if (starNodes[index]) starNodes[index].classList.add('is-active');

            var name = card.querySelector('h3').textContent;
            caption.textContent = name + ', ' + card.getAttribute('data-role').toLowerCase();
        }

        function clear() {
            if (!activeCard) return;
            var index = Number(activeCard.getAttribute('data-star'));
            if (starNodes[index]) starNodes[index].classList.remove('is-active');
            activeCard.classList.remove('is-lit');
            activeCard = null;
            caption.textContent = defaultCaption;
        }

        grid.querySelectorAll('.member-card').forEach(function (card) {
            card.addEventListener('pointerenter', function () { light(card); });
            card.addEventListener('pointerleave', clear);
            card.addEventListener('click', function () { light(card); });
        });
    })();


    /* ---------- Gentle reveal for cards and timeline items ---------- */

    (function reveal() {
        var items = document.querySelectorAll('.member-card, .album-card, .timeline-item, .army-box, .about-image, .about-text');
        if (!('IntersectionObserver' in window) || reduceMotion) return;

        items.forEach(function (item, i) {
            item.classList.add('reveal');
            item.style.setProperty('--d', (i % 4) * 0.08 + 's');
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12 });

        items.forEach(function (item) { observer.observe(item); });
    })();


    /* ---------- Timeline: the line fills as you scroll ---------- */

    (function timeline() {
        var wrap = document.getElementById('timeline');
        if (!wrap) return;

        var items = Array.from(wrap.querySelectorAll('.timeline-item'));
        var ticking = false;

        function update() {
            ticking = false;
            var rect = wrap.getBoundingClientRect();
            var mark = window.innerHeight * 0.55;
            var progress = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));

            wrap.style.setProperty('--progress', progress.toFixed(4));

            items.forEach(function (item) {
                var dot = item.querySelector('.timeline-dot').getBoundingClientRect();
                item.classList.toggle('is-lit', dot.top + dot.height / 2 <= mark);
            });
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        }

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
    })();


    /* ---------- Floating stars ---------- */

    var starButton = document.getElementById('starButton');
    var symbols = ['✦', '✧', '♡', '✩', '⋆'];

    function releaseStars(count) {
        if (reduceMotion) return;

        for (var i = 0; i < count; i++) {
            var star = document.createElement('span');
            star.className = 'floating-star';
            star.setAttribute('aria-hidden', 'true');
            star.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            star.style.left = (Math.random() * 100) + 'vw';
            star.style.bottom = (Math.random() * 15) + 'vh';
            star.style.fontSize = (12 + Math.random() * 22) + 'px';
            star.style.animationDelay = (Math.random() * 0.7) + 's';
            document.body.appendChild(star);

            (function (node) {
                setTimeout(function () { node.remove(); }, 3500);
            })(star);
        }
    }

    starButton.addEventListener('click', function () { releaseStars(18); });


    /* ---------- ARMY message wall ---------- */

    (function army() {
        var STORAGE_KEY = 'btsArmyNotes';
        var MAX_NOTES = 8;

        var textarea = document.getElementById('armyMessage');
        var sendBtn = document.getElementById('sendMessage');
        var status = document.getElementById('messageStatus');
        var counter = document.getElementById('charCount');
        var wall = document.getElementById('wall');
        var noteList = document.getElementById('noteWall');
        var clearBtn = document.getElementById('clearWall');

        var notes = load();

        function load() {
            try {
                var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
                return Array.isArray(saved) ? saved.slice(0, MAX_NOTES) : [];
            } catch (err) {
                return [];
            }
        }

        function save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            } catch (err) { /* storage unavailable, notes last for this visit */ }
        }

        function render() {
            noteList.innerHTML = '';
            notes.forEach(function (text) {
                var li = document.createElement('li');
                li.className = 'note';
                li.textContent = text; // textContent keeps visitor text safe
                noteList.appendChild(li);
            });
            wall.hidden = notes.length === 0;
        }

        function updateCount() {
            counter.textContent = textarea.value.length + ' / ' + textarea.maxLength;
        }

        textarea.addEventListener('input', updateCount);

        sendBtn.addEventListener('click', function () {
            var message = textarea.value.trim();

            if (message === '') {
                status.textContent = 'Write a little message first ♡';
                textarea.focus();
                return;
            }

            notes.unshift(message);
            notes = notes.slice(0, MAX_NOTES);
            save();
            render();

            textarea.value = '';
            updateCount();
            status.textContent = 'Your love for BTS is beautiful! Borahae 💜';
            releaseStars(12);
        });

        clearBtn.addEventListener('click', function () {
            notes = [];
            save();
            render();
            status.textContent = 'The wall is clear. Leave a new message anytime ♡';
        });

        updateCount();
        render();
    })();

})();
