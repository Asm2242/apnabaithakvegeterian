const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : window.location.origin;

const particlesCanvas = document.getElementById('particles');
const ctx = particlesCanvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * particlesCanvas.width;
        this.y = Math.random() * particlesCanvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = -Math.random() * 0.8 - 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? '#d4a843' : '#f0d080';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.002;
        if (this.opacity <= 0 || this.y < -10) this.reset();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.15 });

document.querySelectorAll('.animated-reveal').forEach(el => observer.observe(el));

function showModal(type) {
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('loginModal').classList.toggle('hidden', type !== 'login');
    document.getElementById('signupModal').classList.toggle('hidden', type !== 'signup');
    hideAuthMessage();
}

function hideModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

function showAuthMessage(msg, isSuccess) {
    const el = document.getElementById('authMessage');
    el.textContent = msg;
    el.className = `auth-message ${isSuccess ? 'success' : 'error'}`;
    el.classList.remove('hidden');
}

function hideAuthMessage() {
    document.getElementById('authMessage').classList.add('hidden');
}

async function handleSignup(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('signupUsername').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        house: document.getElementById('signupHouse').value
    };
    try {
        const res = await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Signup failed');
        localStorage.setItem('hp_token', json.token);
        localStorage.setItem('hp_user', JSON.stringify(json.user));
        showAuthMessage('Welcome to the wizarding world!', true);
        setTimeout(() => { hideModal(); updateUI(json.user); }, 1000);
    } catch (err) {
        showAuthMessage(err.message, false);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Login failed');
        localStorage.setItem('hp_token', json.token);
        localStorage.setItem('hp_user', JSON.stringify(json.user));
        showAuthMessage('Welcome back, wizard!', true);
        setTimeout(() => { hideModal(); updateUI(json.user); }, 1000);
    } catch (err) {
        showAuthMessage(err.message, false);
    }
}

function logout() {
    localStorage.removeItem('hp_token');
    localStorage.removeItem('hp_user');
    updateUI(null);
}

function updateUI(user) {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    if (user) {
        navAuth.classList.add('hidden');
        navUser.classList.remove('hidden');
        document.getElementById('userName').textContent = user.username;
        const badge = document.getElementById('userHouse');
        badge.textContent = user.house;
        badge.className = `house-badge house-${user.house}`;
    } else {
        navAuth.classList.remove('hidden');
        navUser.classList.add('hidden');
    }
}

const savedUser = localStorage.getItem('hp_user');
if (savedUser) updateUI(JSON.parse(savedUser));

async function loadHouses() {
    try {
        const res = await fetch(`${API_URL}/api/houses`);
        const houses = await res.json();
        const grid = document.getElementById('housesGrid');
        grid.innerHTML = houses.map(h => `
            <div class="house-card house-${h.name}-card animated-reveal">
                <h3>${h.name}</h3>
                <p><strong>Trait:</strong> ${h.trait}</p>
                <p><strong>Animal:</strong> ${h.animal}</p>
            </div>
        `).join('');
        grid.querySelectorAll('.animated-reveal').forEach(el => observer.observe(el));
    } catch {}
}

loadHouses();

function castSpell(spellName) {
    const effect = document.getElementById('spellEffect');
    const burst = document.getElementById('spellBurst');
    const text = document.getElementById('spellText');
    effect.classList.remove('hidden');
    text.textContent = spellName;
    burst.style.animation = 'none';
    burst.offsetHeight;
    burst.style.animation = '';
    setTimeout(() => effect.classList.add('hidden'), 1500);
}

let currentSlide = 0;
const slides = document.querySelectorAll('.artifact-slide');

function changeSlide(dir) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    document.getElementById('slideIndicator').textContent = `${currentSlide + 1} / ${slides.length}`;
}

const quotes = [
    { text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.", author: "Albus Dumbledore" },
    { text: "It is our choices, Harry, that show what we truly are, far more than our abilities.", author: "Albus Dumbledore" },
    { text: "I am what I am, an' I'm not ashamed.", author: "Rubeus Hagrid" },
    { text: "Never trust anything that can think for itself if you can't see where it keeps its brain.", author: "Arthur Weasley" },
    { text: "Wit beyond measure is man's greatest treasure.", author: "Rowena Ravenclaw" }
];
let quoteIdx = 0;

function nextQuote() {
    quoteIdx = (quoteIdx + 1) % quotes.length;
    const qt = document.getElementById('quoteText');
    const qa = document.getElementById('quoteAuthor');
    qt.style.opacity = '0';
    qa.style.opacity = '0';
    setTimeout(() => {
        qt.textContent = `"${quotes[quoteIdx].text}"`;
        qa.textContent = `— ${quotes[quoteIdx].author}`;
        qt.style.opacity = '1';
        qa.style.opacity = '1';
    }, 300);
}

setInterval(() => {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .hero-section');
    let current = 'home';
    sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom > 100) current = s.id;
    });
    links.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
    });
}, 500);

document.getElementById('quoteText').style.transition = 'opacity 0.3s';
document.getElementById('quoteAuthor').style.transition = 'opacity 0.3s';
