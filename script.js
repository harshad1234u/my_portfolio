const matrixCanvas = document.getElementById('matrix-canvas');
const matrixCtx = matrixCanvas.getContext('2d');
const particlesCanvas = document.getElementById('particles-canvas');
const particlesCtx = particlesCanvas.getContext('2d');
const cursorCanvas = document.getElementById('cursor-trail-canvas');
const cursorCtx = cursorCanvas.getContext('2d');

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
let pageVisible = !document.hidden;

const matrixChars = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF!@#$%^&*';
const matrixFontSize = 14;
let matrixColumns = 0;
let matrixDrops = [];

let particles = [];
let cursorParticles = [];
let mouse = { x: null, y: null };
let cursorThrottle = 0;

let animationHandles = {
    matrix: null,
    particles: null,
    cursor: null
};

const MATRIX_FRAME_INTERVAL = 1000 / 45;
const PARTICLE_FRAME_INTERVAL = 1000 / 60;
const CURSOR_FRAME_INTERVAL = 1000 / 60;

let matrixLastTime = 0;
let particlesLastTime = 0;
let cursorLastTime = 0;

function getParticleCount() {
    if (reducedMotion) return 0;
    return window.innerWidth <= 768 ? 30 : 60;
}

function getConnectionDistance() {
    return window.innerWidth <= 768 ? 85 : 110;
}

function resizeAllCanvases() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;

    matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize);
    matrixDrops = Array(matrixColumns).fill(1);
}

class Particle {
    constructor() {
        this.x = Math.random() * particlesCanvas.width;
        this.y = Math.random() * particlesCanvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.4 + 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > particlesCanvas.width) this.x = 0;
        if (this.x < 0) this.x = particlesCanvas.width;
        if (this.y > particlesCanvas.height) this.y = 0;
        if (this.y < 0) this.y = particlesCanvas.height;

        if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const mouseRadius = window.innerWidth <= 768 ? 110 : 150;

            if (dist < mouseRadius && dist > 0) {
                const force = (mouseRadius - dist) / mouseRadius;
                this.x += (dx / dist) * force * 2;
                this.y += (dy / dist) * force * 2;
            }
        }
    }

    draw() {
        particlesCtx.beginPath();
        particlesCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particlesCtx.fillStyle = `rgba(0, 255, 65, ${this.opacity})`;
        particlesCtx.fill();
    }
}

class CursorParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.isChar = Math.random() > 0.6;
        this.char = this.isChar ? matrixChars[Math.floor(Math.random() * matrixChars.length)] : null;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        cursorCtx.globalAlpha = this.life * 0.6;
        if (this.isChar && this.char) {
            cursorCtx.fillStyle = '#00ff41';
            cursorCtx.font = `${Math.floor(this.size * 4)}px monospace`;
            cursorCtx.fillText(this.char, this.x, this.y);
        } else {
            cursorCtx.beginPath();
            cursorCtx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
            cursorCtx.fillStyle = `rgba(0, 255, 65, ${this.life * 0.5})`;
            cursorCtx.fill();
        }
        cursorCtx.globalAlpha = 1;
    }
}

function initParticles() {
    particles = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function drawMatrix(timestamp) {
    if (!pageVisible || reducedMotion) return;

    if (timestamp - matrixLastTime < MATRIX_FRAME_INTERVAL) {
        animationHandles.matrix = requestAnimationFrame(drawMatrix);
        return;
    }
    matrixLastTime = timestamp;

    matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    matrixCtx.fillStyle = '#00ff41';
    matrixCtx.font = `${matrixFontSize}px monospace`;

    for (let i = 0; i < matrixDrops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * matrixFontSize;
        const y = matrixDrops[i] * matrixFontSize;

        matrixCtx.globalAlpha = Math.random() * 0.5 + 0.1;
        matrixCtx.fillText(char, x, y);
        matrixCtx.globalAlpha = 1;

        if (y > matrixCanvas.height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
        }
        matrixDrops[i] += 1;
    }

    animationHandles.matrix = requestAnimationFrame(drawMatrix);
}

function connectParticles() {
    const connectionDistance = getConnectionDistance();

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
                const opacity = 1 - dist / connectionDistance;
                particlesCtx.beginPath();
                particlesCtx.strokeStyle = `rgba(0, 255, 65, ${opacity * 0.12})`;
                particlesCtx.lineWidth = 0.5;
                particlesCtx.moveTo(particles[i].x, particles[i].y);
                particlesCtx.lineTo(particles[j].x, particles[j].y);
                particlesCtx.stroke();
            }
        }
    }
}

function animateParticles(timestamp) {
    if (!pageVisible || reducedMotion) return;

    if (timestamp - particlesLastTime < PARTICLE_FRAME_INTERVAL) {
        animationHandles.particles = requestAnimationFrame(animateParticles);
        return;
    }
    particlesLastTime = timestamp;

    particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    connectParticles();
    animationHandles.particles = requestAnimationFrame(animateParticles);
}

function animateCursorTrail(timestamp) {
    if (!pageVisible || reducedMotion) return;

    if (timestamp - cursorLastTime < CURSOR_FRAME_INTERVAL) {
        animationHandles.cursor = requestAnimationFrame(animateCursorTrail);
        return;
    }
    cursorLastTime = timestamp;

    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    cursorParticles = cursorParticles.filter((particle) => particle.life > 0);

    for (let i = 0; i < cursorParticles.length; i++) {
        cursorParticles[i].update();
        cursorParticles[i].draw();
    }

    animationHandles.cursor = requestAnimationFrame(animateCursorTrail);
}

function stopCanvasAnimations() {
    Object.keys(animationHandles).forEach((key) => {
        if (animationHandles[key]) {
            cancelAnimationFrame(animationHandles[key]);
            animationHandles[key] = null;
        }
    });
}

function startCanvasAnimations() {
    if (reducedMotion || !pageVisible) {
        stopCanvasAnimations();
        return;
    }

    if (!animationHandles.matrix) animationHandles.matrix = requestAnimationFrame(drawMatrix);
    if (!animationHandles.particles) animationHandles.particles = requestAnimationFrame(animateParticles);
    if (!animationHandles.cursor) animationHandles.cursor = requestAnimationFrame(animateCursorTrail);
}

function applyMotionPreferenceState() {
    const shouldHideCanvas = reducedMotion;
    [matrixCanvas, particlesCanvas, cursorCanvas].forEach((canvas) => {
        canvas.style.display = shouldHideCanvas ? 'none' : 'block';
    });

    if (reducedMotion) {
        stopCanvasAnimations();
    } else {
        resizeAllCanvases();
        initParticles();
        startCanvasAnimations();
    }
}

const hackerNameEl = document.getElementById('hacker-name');
const realName = 'Harshad R';
const scrambleChars = '0123456789!@#$%&*<>{}[]=/\\|~^';
let nameAnimationInterval = null;

function scrambleName() {
    if (reducedMotion) {
        hackerNameEl.textContent = realName;
        return;
    }

    let iteration = 0;
    const totalLength = realName.length;

    clearInterval(nameAnimationInterval);

    nameAnimationInterval = setInterval(() => {
        hackerNameEl.textContent = realName
            .split('')
            .map((char, index) => {
                if (index < iteration) return realName[index];
                if (char === ' ') return ' ';
                return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            })
            .join('');

        if (iteration >= totalLength) clearInterval(nameAnimationInterval);
        iteration += 1 / 3;
    }, 40);
}

const typingElement = document.getElementById('typing-text');
const phrases = [
    'Aspiring Cybersecurity Engineer',
    'CS Student',
    'Ethical Hacker in Training',
    'Code Builder',
    'Security Enthusiast',
    'Problem Solver'
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    if (reducedMotion) {
        typingElement.textContent = phrases[0];
        return;
    }

    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex -= 1;
    } else {
        typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex += 1;
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2500;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 400;
    }

    setTimeout(typeEffect, typeSpeed);
}

const revealElements = document.querySelectorAll('.reveal');
let revealObserver = null;

function initRevealObserver() {
    if (reducedMotion) {
        revealElements.forEach((element) => element.classList.add('visible'));
        if (revealObserver) revealObserver.disconnect();
        return;
    }

    revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
}

const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

let activeSectionId = '';
let scrollTicking = false;

function updateActiveLink() {
    const scrollPos = window.scrollY + 200;
    let newActiveId = activeSectionId;

    sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
            newActiveId = section.getAttribute('id');
        }
    });

    if (newActiveId === activeSectionId) return;

    activeSectionId = newActiveId;
    navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${activeSectionId}`;
        link.classList.toggle('active', isActive);
    });
}

function onScroll() {
    if (scrollTicking) return;

    scrollTicking = true;
    requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        updateActiveLink();
        scrollTicking = false;
    });
}

const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('nav-links');

function closeMenu() {
    hamburger.classList.remove('active');
    navLinksContainer.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
}

function openMenu() {
    hamburger.classList.add('active');
    navLinksContainer.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
}

hamburger.addEventListener('click', () => {
    const isOpen = navLinksContainer.classList.contains('open');
    if (isOpen) {
        closeMenu();
    } else {
        openMenu();
    }
});

document.addEventListener('click', (event) => {
    if (!hamburger.contains(event.target) && !navLinksContainer.contains(event.target)) {
        closeMenu();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});

navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        }

        closeMenu();
    });
});

window.addEventListener(
    'mousemove',
    (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;

        if (reducedMotion) return;

        cursorThrottle += 1;
        if (cursorThrottle % 3 === 0) {
            cursorParticles.push(new CursorParticle(event.clientX, event.clientY));
            cursorParticles.push(new CursorParticle(event.clientX, event.clientY));
        }
    },
    { passive: true }
);

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('resize', () => {
    resizeAllCanvases();
    initParticles();
});

window.addEventListener('scroll', onScroll, { passive: true });

document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) {
        startCanvasAnimations();
    } else {
        stopCanvasAnimations();
    }
});

motionQuery.addEventListener('change', (event) => {
    reducedMotion = event.matches;
    initRevealObserver();
    applyMotionPreferenceState();
    if (reducedMotion) {
        typingElement.textContent = phrases[0];
        hackerNameEl.textContent = realName;
    } else {
        scrambleName();
        typeEffect();
    }
});

resizeAllCanvases();
initParticles();
applyMotionPreferenceState();
initRevealObserver();
scrambleName();
setTimeout(scrambleName, 800);
setInterval(scrambleName, 6000);
typeEffect();
onScroll();
