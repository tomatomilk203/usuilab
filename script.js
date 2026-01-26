/**
 * USUI LAB - ウスイ研究所
 * Retro CRT TV Effects
 */

document.addEventListener('DOMContentLoaded', () => {
    initTV();
    initEffectsToggle();
    initTypingEffect();
    initCounterAnimation();
    initSmoothScroll();
    initScoreAnimation();
    initLangToggle();
    initVHSTimer();
});

/* =====================================================
   VHS TIMER - レトロビデオ風タイムコード
   ===================================================== */
function initVHSTimer() {
    const vhsTime = document.getElementById('vhs-time');
    if (!vhsTime) return;

    let seconds = 0;
    setInterval(() => {
        seconds++;
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        vhsTime.textContent = `${h}:${m}:${s}`;
    }, 1000);
}

/* =====================================================
   LANGUAGE TOGGLE
   ===================================================== */
let currentLang = 'ja';

const translations = {
    ja: {
        // TV Screen
        'welcome-line1': 'ようこそ',
        'welcome-line3': 'ウスイ研究所',
        'welcome-hint': '← チャンネルを選択 →',
        'preview-desc-1': 'コメント弾幕シューティング',
        'preview-footer-1': 'クリックで入る',
        'ch-status-1': '● 放送中',
        'preview-desc-2': '???',
        'preview-footer-2': '開発中...',
        'ch-status-2': '● COMING SOON',
        'preview-footer-3': '信号待機中...',
        'ch-status-3': '● 準備中',
        'scroll-hint': '↓ 下にスクロール ↓',

        // Profile Card
        'profile-name-label': 'NAME',
        'profile-name-sub': 'ウスイ',
        'profile-hobby-label': 'HOBBY',
        'profile-hobby-value': '開発',
        'profile-works-label': 'WORKS',
        'profile-works-value': 'Chrome拡張 / Webアプリ / モバイルアプリ',
        'profile-motto': '"自分が楽しいものを作り続ける"',

        // Projects
        'project-1-title': 'YouTube Shooting',
        'project-1-category': 'Chrome拡張機能',
        'project-1-desc': 'YouTubeのコメントが弾幕になって襲いかかる！避けて撃って、コメントを制圧せよ。実際の動画コメントを使用した新感覚シューティングゲーム。',
        'project-1-status': '✓ RELEASED',
        'project-1-btn-store': 'Chrome ストア',
        'project-1-btn-github': 'GitHub',

        'project-2-title': 'Brainrot Collection',
        'project-2-category': '???',
        'project-2-desc': '脳が溶ける何か。詳細は不明。',
        'project-2-status': '⚡ 開発中',
        'project-2-coming': 'COMING SOON',

        'project-3-title': 'Next Project',
        'project-3-category': 'To Be Announced',
        'project-3-desc': '次なる実験は何になるのか...？',
        'project-3-status': '? UNKNOWN',
        'project-3-waiting': '▌ AWAITING...',

        // Contact
        'contact-twitter': 'Twitter / X',
        'contact-github': 'GitHub',

        // Footer
        'footer-disclaimer': '※ 全て個人の趣味で行われています',
        'footer-code': '[ 放送終了 ]'
    },
    en: {
        // TV Screen
        'welcome-line1': 'WELCOME TO',
        'welcome-line3': 'USUI LABORATORY',
        'welcome-hint': '← SELECT CHANNEL →',
        'preview-desc-1': 'Comment Bullet Hell Shooter',
        'preview-footer-1': 'CLICK TO ENTER',
        'ch-status-1': '● ON AIR',
        'preview-desc-2': '???',
        'preview-footer-2': 'IN DEVELOPMENT...',
        'ch-status-2': '● COMING SOON',
        'preview-footer-3': 'AWAITING SIGNAL...',
        'ch-status-3': '● STANDBY',
        'scroll-hint': '↓ SCROLL FOR MORE ↓',

        // Profile Card
        'profile-name-label': 'NAME',
        'profile-name-sub': 'Usui',
        'profile-hobby-label': 'HOBBY',
        'profile-hobby-value': 'Development',
        'profile-works-label': 'WORKS',
        'profile-works-value': 'Chrome Extensions / Web Apps / Mobile Apps',
        'profile-motto': '"Keep making things I enjoy"',

        // Projects
        'project-1-title': 'YouTube Shooting',
        'project-1-category': 'Chrome Extension',
        'project-1-desc': 'YouTube comments turn into a bullet hell! Dodge and shoot to survive the comment chaos. A new shooting experience using actual video comments.',
        'project-1-status': '✓ RELEASED',
        'project-1-btn-store': 'Chrome Store',
        'project-1-btn-github': 'GitHub',

        'project-2-title': 'Brainrot Collection',
        'project-2-category': '???',
        'project-2-desc': 'Something that melts your brain. Details unknown.',
        'project-2-status': '⚡ IN DEV',
        'project-2-coming': 'COMING SOON',

        'project-3-title': 'Next Project',
        'project-3-category': 'To Be Announced',
        'project-3-desc': 'What will the next experiment be...?',
        'project-3-status': '? UNKNOWN',
        'project-3-waiting': '▌ AWAITING...',

        // Contact
        'contact-twitter': 'Twitter / X',
        'contact-github': 'GitHub',

        // Footer
        'footer-disclaimer': '※ All projects are personal hobbies',
        'footer-code': '[ END OF TRANSMISSION ]'
    }
};

function initLangToggle() {
    const toggle = document.getElementById('lang-toggle');
    if (!toggle) return;

    // Load saved preference
    const saved = localStorage.getItem('usuilab_lang');
    if (saved) {
        currentLang = saved;
        updateLangUI();
        applyTranslations();
    }

    toggle.addEventListener('click', () => {
        currentLang = currentLang === 'ja' ? 'en' : 'ja';
        localStorage.setItem('usuilab_lang', currentLang);
        updateLangUI();
        applyTranslations();
    });
}

function updateLangUI() {
    const jaBtn = document.querySelector('.lang-ja');
    const enBtn = document.querySelector('.lang-en');

    if (currentLang === 'ja') {
        jaBtn?.classList.add('active');
        enBtn?.classList.remove('active');
    } else {
        jaBtn?.classList.remove('active');
        enBtn?.classList.add('active');
    }
}

function applyTranslations() {
    const t = translations[currentLang];

    // Generic i18n elements (data-i18n attribute)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Legacy support for existing elements
    // Welcome screen
    const line1 = document.querySelector('.welcome-line1');
    const line3 = document.querySelector('.welcome-line3');
    const hint = document.querySelector('.welcome-hint');

    if (line1) line1.textContent = t['welcome-line1'];
    if (line3) line3.textContent = t['welcome-line3'];
    if (hint) hint.textContent = t['welcome-hint'];

    // Preview descriptions
    const desc1 = document.querySelector('.channel[data-channel="1"] .preview-desc');
    const footer1 = document.querySelector('.channel[data-channel="1"] .preview-footer span');
    const status1 = document.querySelector('.channel[data-channel="1"] .ch-status');
    const footer2 = document.querySelector('.channel[data-channel="2"] .preview-footer span');
    const footer3 = document.querySelector('.channel[data-channel="3"] .preview-footer span');

    if (desc1) desc1.textContent = t['preview-desc-1'];
    if (footer1) footer1.textContent = t['preview-footer-1'];
    if (status1) status1.textContent = t['ch-status-1'];
    if (footer2) footer2.textContent = t['preview-footer-2'];
    if (footer3) footer3.textContent = t['preview-footer-3'];

    // Scroll hint
    const scrollHint = document.querySelector('.scroll-hint span');
    if (scrollHint) scrollHint.textContent = t['scroll-hint'];

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
}

/* =====================================================
   TV SYSTEM - Power & Channel Control
   ===================================================== */
let currentChannel = 0;
let tvIsOn = false;

function initTV() {
    const mainPowerBtn = document.getElementById('main-power-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const secretBtn1 = document.getElementById('secret-btn-1');
    const secretBtn2 = document.getElementById('secret-btn-2');

    // メイン電源ボタン - 電源ON/OFF
    if (mainPowerBtn) {
        mainPowerBtn.addEventListener('click', () => {
            if (!tvIsOn) {
                powerOnTV();
            } else {
                powerOffTV();
            }
        });
    }

    // 赤ボタン - 次のチャンネル
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (tvIsOn) {
                nextChannel();
            }
        });
    }

    // 黄ボタン - 前のチャンネル
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (tvIsOn) {
                prevChannel();
            }
        });
    }

    // 青ボタン - 隠しコマンド1
    if (secretBtn1) {
        secretBtn1.addEventListener('click', () => {
            secretCommand1();
        });
    }

    // 紫ボタン - 隠しコマンド2
    if (secretBtn2) {
        secretBtn2.addEventListener('click', () => {
            secretCommand2();
        });
    }

    // Keyboard controls
    document.addEventListener('keydown', handleKeyboard);

    // TV starts OFF - user must click power button
}

function toggleTV() {
    if (tvIsOn) {
        powerOffTV();
    } else {
        powerOnTV();
    }
}

function powerOnTV() {
    const body = document.body;
    const tvScreen = document.getElementById('tv-screen');
    const tvOffScreen = document.getElementById('tv-off-screen');
    const tvContent = document.getElementById('tv-content');

    body.classList.remove('tv-off');
    body.classList.add('tv-on');

    // TV screen power-on sequence
    if (tvScreen) {
        tvScreen.classList.add('powering-on');

        // After power-on animation, show content
        setTimeout(() => {
            tvScreen.classList.remove('powering-on');
            tvScreen.classList.add('powered');
            if (tvOffScreen) tvOffScreen.style.display = 'none';
            if (tvContent) tvContent.style.opacity = '1';
        }, 800);
    }

    tvIsOn = true;

    // Show scroll hint after TV is on
    setTimeout(() => {
        const scrollHint = document.getElementById('scroll-hint');
        if (scrollHint) {
            scrollHint.classList.add('visible');
        }
    }, 2000);
}

function powerOffTV() {
    const body = document.body;
    const tvScreen = document.getElementById('tv-screen');
    const tvOffScreen = document.getElementById('tv-off-screen');
    const tvContent = document.getElementById('tv-content');
    const scrollHint = document.getElementById('scroll-hint');

    body.classList.remove('tv-on');
    body.classList.add('tv-off');

    if (tvScreen) {
        tvScreen.classList.remove('powered');
        tvScreen.classList.add('powering-off');

        setTimeout(() => {
            tvScreen.classList.remove('powering-off');
            if (tvOffScreen) tvOffScreen.style.display = 'flex';
            if (tvContent) tvContent.style.opacity = '0';
        }, 500);
    }

    if (scrollHint) {
        scrollHint.classList.remove('visible');
    }

    tvIsOn = false;
}

function switchChannel(channel) {
    if (channel === currentChannel) return;

    const channels = document.querySelectorAll('.channel');
    const tvScreen = document.getElementById('tv-screen');

    // Channel switch animation
    if (tvScreen) {
        tvScreen.classList.add('switching');

        setTimeout(() => {
            // Hide all channels
            channels.forEach(ch => ch.classList.remove('active'));

            // Show selected channel
            const targetChannel = document.querySelector(`.channel[data-channel="${channel}"]`);
            if (targetChannel) {
                targetChannel.classList.add('active');
            }

            currentChannel = channel;

            setTimeout(() => {
                tvScreen.classList.remove('switching');
            }, 200);
        }, 150);
    }
}

function nextChannel() {
    const maxChannel = 3;
    const next = currentChannel < maxChannel ? currentChannel + 1 : 0;
    switchChannel(next);
}

function prevChannel() {
    const maxChannel = 3;
    const prev = currentChannel > 0 ? currentChannel - 1 : maxChannel;
    switchChannel(prev);
}

// 隠しコマンド - 青ボタン
let secretClicks1 = 0;
function secretCommand1() {
    secretClicks1++;
    if (secretClicks1 >= 3) {
        activateSecretMode();
        secretClicks1 = 0;
    }
}

// 隠しコマンド - 紫ボタン（青と組み合わせ）
let secretClicks2 = 0;
function secretCommand2() {
    secretClicks2++;
    // 青3回 + 紫2回でエルプサイ
    if (secretClicks1 >= 3 && secretClicks2 >= 2) {
        activateSecretMode();
        secretClicks1 = 0;
        secretClicks2 = 0;
    }
}

function handleKeyboard(e) {
    if (!tvIsOn) {
        // Space or Enter to turn on TV
        if (e.key === ' ' || e.key === 'Enter') {
            powerOnTV();
        }
        return;
    }

    switch (e.key) {
        case 'ArrowLeft':
            prevChannel();
            break;
        case 'ArrowRight':
            nextChannel();
            break;
        case 'Escape':
            powerOffTV();
            break;
    }
}

/* =====================================================
   SCORE ANIMATION (YouTube Shooting Preview)
   ===================================================== */
function initScoreAnimation() {
    const scoreValue = document.querySelector('.score-value');
    if (!scoreValue) return;

    let score = 0;
    const maxScore = 99999;

    function animateScore() {
        // Random score increment
        score += Math.floor(Math.random() * 150) + 50;
        if (score > maxScore) score = 0;

        scoreValue.textContent = score;

        // Continue animation
        setTimeout(animateScore, Math.random() * 500 + 200);
    }

    // Start after TV is on
    setTimeout(() => {
        if (tvIsOn) {
            animateScore();
        }
    }, 1500);
}

/* =====================================================
   CRT EFFECTS TOGGLE
   ===================================================== */
function initEffectsToggle() {
    const toggle = document.getElementById('effects-toggle');
    if (!toggle) return;

    // Load saved preference
    const saved = localStorage.getItem('usuilab_effects');
    if (saved === 'off') {
        document.body.classList.add('effects-off');
        toggle.textContent = 'CRT: OFF';
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('effects-off');
        const isOff = document.body.classList.contains('effects-off');
        toggle.textContent = isOff ? 'CRT: OFF' : 'CRT: ON';
        localStorage.setItem('usuilab_effects', isOff ? 'off' : 'on');
    });
}

/* =====================================================
   TYPING EFFECT
   ===================================================== */
function initTypingEffect() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;

    const messages = [
        '> SYSTEM ONLINE',
        '> LOADING CHANNEL...',
        '> SIGNAL ACQUIRED',
        '> WELCOME TO USUI LAB',
        '> EXPERIMENTS IN PROGRESS',
        '> STAND BY...'
    ];

    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPausing = false;

    function type() {
        const currentMessage = messages[messageIndex];

        if (isPausing) {
            setTimeout(type, 2000);
            isPausing = false;
            isDeleting = true;
            return;
        }

        if (isDeleting) {
            typingElement.textContent = currentMessage.substring(0, charIndex - 1);
            charIndex--;

            if (charIndex === 0) {
                isDeleting = false;
                messageIndex = (messageIndex + 1) % messages.length;
                setTimeout(type, 300);
                return;
            }
        } else {
            typingElement.textContent = currentMessage.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === currentMessage.length) {
                isPausing = true;
            }
        }

        const speed = isDeleting ? 40 : 70;
        setTimeout(type, speed);
    }

    setTimeout(type, 500);
}

/* =====================================================
   COUNTER ANIMATION
   ===================================================== */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 1500;
    const increment = target / (duration / 20);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 20);
}

/* =====================================================
   SMOOTH SCROLL
   ===================================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =====================================================
   KONAMI CODE EASTER EGG
   ===================================================== */
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateSecretMode();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateSecretMode() {
    const secretMsg = document.createElement('div');
    secretMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1815;
        border: 4px solid #ffd000;
        padding: 50px;
        z-index: 100000;
        text-align: center;
        font-family: 'VT323', monospace;
    `;
    secretMsg.innerHTML = `
        <h3 style="color: #ffd000; font-size: 2rem; margin-bottom: 20px;">📺 SECRET CHANNEL 📺</h3>
        <p style="color: #00ff00; font-size: 1.5rem;">エル・プサイ・コングルゥ</p>
        <p style="color: #888; font-size: 1rem; margin-top: 30px;">Click to close</p>
    `;

    document.body.appendChild(secretMsg);

    secretMsg.addEventListener('click', () => secretMsg.remove());
    setTimeout(() => secretMsg.remove(), 5000);
}

/* =====================================================
   CONSOLE MESSAGE
   ===================================================== */
console.log('%c📺 USUI LAB', 'color: #ffd000; font-size: 24px; font-weight: bold; font-family: monospace;');
console.log('%cウスイ研究所へようこそ', 'color: #00ff00; font-size: 14px; font-family: monospace;');
console.log('%c↑↑↓↓←→←→BA で隠しチャンネル', 'color: #888; font-size: 12px; font-family: monospace;');
