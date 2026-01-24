/**
 * USUI LAB - ウスイ研究所
 * Retro CRT TV Effects
 */

document.addEventListener('DOMContentLoaded', () => {
    initEffectsToggle();
    initTypingEffect();
    initCounterAnimation();
    initSmoothScroll();
});

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
