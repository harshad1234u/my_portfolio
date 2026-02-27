/* ========================================
   MATRIX RAIN BACKGROUND
   ======================================== */
const matrixCanvas = document.getElementById('matrix-canvas');
const matrixCtx = matrixCanvas.getContext('2d');

function resizeMatrix() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
}

resizeMatrix();

const matrixChars = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF!@#$%^&*';
const matrixFontSize = 14;
let matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize);
let matrixDrops = Array(matrixColumns).fill(1);

function drawMatrix() {
    matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    matrixCtx.fillStyle = '#00ff41';
    matrixCtx.font = matrixFontSize + 'px monospace';

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
        matrixDrops[i]++;
    }
    requestAnimationFrame(drawMatrix);
}

drawMatrix();

/* ========================================
   PARTICLE SYSTEM (Green Data Streams)
   ======================================== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null };
const PARTICLE_COUNT = 60;
const CONNECTION_DISTANCE = 110;
const MOUSE_RADIUS = 150;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.4 + 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS) {
                const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                this.x += (dx / dist) * force * 2;
                this.y += (dy / dist) * force * 2;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 65, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECTION_DISTANCE) {
                const opacity = 1 - dist / CONNECTION_DISTANCE;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 255, 65, ${opacity * 0.12})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    connectParticles();
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    resizeMatrix();
    matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize);
    matrixDrops = Array(matrixColumns).fill(1);
    resizeCursorCanvas();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

resizeCanvas();
initParticles();
animateParticles();

/* ========================================
   CURSOR TRAIL EFFECT
   ======================================== */
const cursorCanvas = document.getElementById('cursor-trail-canvas');
const cursorCtx = cursorCanvas.getContext('2d');
let cursorParticles = [];

function resizeCursorCanvas() {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
}

resizeCursorCanvas();

class CursorParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        // Sometimes spawn a character instead of a dot
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

let cursorThrottle = 0;
window.addEventListener('mousemove', (e) => {
    cursorThrottle++;
    if (cursorThrottle % 3 === 0) {
        for (let i = 0; i < 2; i++) {
            cursorParticles.push(new CursorParticle(e.clientX, e.clientY));
        }
    }
});

function animateCursorTrail() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    cursorParticles = cursorParticles.filter(p => p.life > 0);
    cursorParticles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateCursorTrail);
}

animateCursorTrail();

/* ========================================
   HACKER NAME SCRAMBLE EFFECT
   ======================================== */
const hackerNameEl = document.getElementById('hacker-name');
const realName = 'Harshad R';
const scrambleChars = '0123456789!@#$%&*<>{}[]=/\\|~^';
let nameAnimationInterval = null;

function scrambleName() {
    let iteration = 0;
    const totalLength = realName.length;

    clearInterval(nameAnimationInterval);

    nameAnimationInterval = setInterval(() => {
        hackerNameEl.textContent = realName
            .split('')
            .map((char, index) => {
                if (index < iteration) {
                    return realName[index];
                }
                if (char === ' ') return ' ';
                return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            })
            .join('');

        if (iteration >= totalLength) {
            clearInterval(nameAnimationInterval);
        }
        iteration += 1 / 3;
    }, 40);
}

// Initial scramble after page load
setTimeout(scrambleName, 800);
// Repeat scramble every 6 seconds
setInterval(scrambleName, 6000);

/* ========================================
   TYPING EFFECT
   ======================================== */
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
let typeSpeed = 80;

function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 40;
    } else {
        typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 80;
    }

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

typeEffect();

/* ========================================
   SCROLL REVEAL
   ======================================== */
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

/* ========================================
   NAVBAR SCROLL EFFECT
   ======================================== */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/* ========================================
   ACTIVE NAV LINK ON SCROLL
   ======================================== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveLink() {
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveLink);

/* ========================================
   SMOOTH SCROLL FOR NAV LINKS
   ======================================== */
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
        document.getElementById('nav-links').classList.remove('open');
        document.getElementById('hamburger').classList.remove('active');
    });
});

/* ========================================
   MOBILE HAMBURGER MENU
   ======================================== */
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinksContainer.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('open');
    }
});
