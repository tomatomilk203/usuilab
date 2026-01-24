/**
 * USUI LAB - ウスイ研究所
 * Interactive JavaScript for laboratory theme
 */

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTypingEffect();
    initCounterAnimation();
    initSmoothScroll();
    initGlitchEffects();
    initCardHoverEffects();
});

/* =====================================================
   PARTICLE SYSTEM
   ===================================================== */
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;
    const colors = ['#00ff88', '#00d4ff', '#ff6b35', '#a855f7'];

    for (let i = 0; i < particleCount; i++) {
        createParticle(container, colors);
    }

    // Continuously create new particles
    setInterval(() => {
        if (container.children.length < particleCount * 1.5) {
            createParticle(container, colors);
        }
    }, 500);
}

function createParticle(container, colors) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random properties
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}%;
        background: ${color};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        box-shadow: 0 0 ${size * 2}px ${color};
    `;

    container.appendChild(particle);

    // Remove particle after animation
    setTimeout(() => {
        particle.remove();
    }, (duration + delay) * 1000);
}

/* =====================================================
   TYPING EFFECT
   ===================================================== */
function initTypingEffect() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;

    const messages = [
        '> SYSTEM ONLINE...',
        '> INITIALIZING USUI LAB...',
        '> LOADING EXPERIMENTS...',
        '> ALL SYSTEMS OPERATIONAL',
        '> WELCOME, VISITOR_001',
        '> ACCESS GRANTED ✓'
    ];

    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPausing = false;

    function type() {
        const currentMessage = messages[messageIndex];

        if (isPausing) {
            setTimeout(type, 1500);
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
                setTimeout(type, 500);
                return;
            }
        } else {
            typingElement.textContent = currentMessage.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === currentMessage.length) {
                isPausing = true;
            }
        }

        const speed = isDeleting ? 30 : 80;
        setTimeout(type, speed + Math.random() * 50);
    }

    // Start typing after a short delay
    setTimeout(type, 1000);
}

/* =====================================================
   COUNTER ANIMATION
   ===================================================== */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    if (counters.length === 0) return;

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);

            // Add completion glow effect
            element.style.textShadow = '0 0 30px #00ff88, 0 0 60px #00ff88';
            setTimeout(() => {
                element.style.textShadow = '';
            }, 500);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
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
   GLITCH EFFECTS
   ===================================================== */
function initGlitchEffects() {
    // Random glitch on hero title
    const glitchElement = document.querySelector('.glitch');
    if (!glitchElement) return;

    setInterval(() => {
        if (Math.random() > 0.95) {
            glitchElement.classList.add('glitch-active');
            setTimeout(() => {
                glitchElement.classList.remove('glitch-active');
            }, 200);
        }
    }, 100);

    // Add random screen shake effect
    setInterval(() => {
        if (Math.random() > 0.98) {
            document.body.style.transform = `translate(${Math.random() * 2 - 1}px, ${Math.random() * 2 - 1}px)`;
            setTimeout(() => {
                document.body.style.transform = '';
            }, 50);
        }
    }, 200);
}

/* =====================================================
   CARD HOVER EFFECTS
   ===================================================== */
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* =====================================================
   HEADER SCROLL EFFECT
   ===================================================== */
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (!header) return;

    const currentScrollY = window.scrollY;

    if (currentScrollY > 100) {
        header.style.background = 'rgba(10, 10, 15, 0.98)';
    } else {
        header.style.background = 'linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(10, 10, 15, 0.9) 100%)';
    }

    lastScrollY = currentScrollY;
});

/* =====================================================
   EASTER EGG: KONAMI CODE
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
    document.body.style.animation = 'secretFlash 0.5s ease';

    // Create secret message
    const secretMsg = document.createElement('div');
    secretMsg.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff88;
            padding: 40px;
            z-index: 10000;
            text-align: center;
            font-family: 'Share Tech Mono', monospace;
            color: #00ff88;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
        ">
            <h3 style="margin-bottom: 20px; font-size: 1.5rem;">🎮 SECRET CODE ACTIVATED 🎮</h3>
            <p style="font-size: 1rem;">エル・プサイ・コングルゥ</p>
            <p style="font-size: 0.8rem; margin-top: 20px; color: #888;">Click anywhere to close</p>
        </div>
    `;

    document.body.appendChild(secretMsg);

    secretMsg.addEventListener('click', () => {
        secretMsg.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (secretMsg.parentNode) {
            secretMsg.remove();
        }
    }, 5000);
}

// Add keyframe for secret flash
const style = document.createElement('style');
style.textContent = `
    @keyframes secretFlash {
        0%, 100% { filter: none; }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
    }
`;
document.head.appendChild(style);

/* =====================================================
   RANDOM LAB NOTES (Console Easter Egg)
   ===================================================== */
console.log('%c🔬 USUI LAB - ウスイ研究所', 'color: #00ff88; font-size: 24px; font-weight: bold;');
console.log('%c実験は常に進行中...', 'color: #00d4ff; font-size: 14px;');
console.log('%c↑↑↓↓←→←→BA で隠しモード発動', 'color: #888; font-size: 12px;');
