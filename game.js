const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// State Permainan
let difficulty = 'mudah';
let score = 0;
let timeRemaining = 45;
let gameInterval, timerInterval;
let currentMonster = null;
let currentHP = 0;
let targetNumber = 0;
let primeFactorsChain = [];
let lasers = [];
let particles = [];
let flashColor = null;
let flashTicks = 0;

// Data Nombor Bulat Silabus DSKP Bab 2
const numberPool = {
    mudah: [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30],
    sederhana: [32, 35, 36, 40, 42, 44, 45, 48, 50, 52, 54, 56, 60, 63, 64, 70, 72, 75, 80, 84, 90],
    susah: [96, 100, 105, 108, 112, 120, 126, 132, 135, 140, 144, 150, 160, 162, 168, 175, 180]
};

// Pengurusan Responsif Skrin Canvas
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);
// Panggilan pertama sejurus fail dimuatkan
setTimeout(resizeCanvas, 100);

// [DIBAIKI] Navigasi Fungsi Skrin Dengan Penyahaktifan Kelas CSS Yang Betul
function showDifficulty() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('difficulty-screen').classList.remove('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
}

function backToMenu() {
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('difficulty-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
}

// Memulakan Permainan Berdasarkan Tahap Pilihan
function startGame(selectedDiff) {
    difficulty = selectedDiff;
    score = 0;
    lasers = [];
    particles = [];
    
    // Sembunyikan semua skrin menu supaya tidak mengganggu sentuhan skrin
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('difficulty-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    
    document.getElementById('score-display').innerText = `SKOR: ${score}`;
    timeRemaining = difficulty === 'mudah' ? 45 : difficulty === 'sederhana' ? 40 : 30;
    document.getElementById('timer').innerText = `MASA: ${timeRemaining}s`;

    resizeCanvas(); 
    spawnMonster();

    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameInterval = setInterval(updateGame, 1000 / 60); // 60 FPS
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timeRemaining--;
    document.getElementById('timer').innerText = `MASA: ${timeRemaining}s`;
    if (timeRemaining <= 0) {
        endGame(false, "MASA TAMAT!", "Raksasa melebihi kelajuan pemfaktoran anda!");
    }
}

// Kemunculan Raksasa Ganas
function spawnMonster() {
    const pool = numberPool[difficulty];
    targetNumber = pool[Math.floor(Math.random() * pool.length)];
    currentHP = targetNumber;
    primeFactorsChain = [];
    updateChainUI();

    let speed = 0.3;
    let color = '#ff3e3e'; 
    if (difficulty === 'sederhana') { speed = 0.5; color = '#d4af37'; }
    if (difficulty === 'susah') { speed = 0.8; color = '#a100ff'; }

    currentMonster = {
        x: canvas.width / 2,
        y: -60,
        radius: 45,
        maxHP: targetNumber,
        speed: speed,
        color: color,
        pulse: 0
    };
}

// Logik Bedilan Meriam
function fireLaser(primeValue) {
    if (!currentMonster) return;

    lasers.push({
        x: canvas.width / 2,
        y: canvas.height - 40,
        targetX: currentMonster.x,
        targetY: currentMonster.y,
        speed: 15,
        val: primeValue
    });

    if (currentHP % primeValue === 0) {
        currentHP = currentHP / primeValue;
        primeFactorsChain.push(primeValue);
        
        triggerFlash('#00cc7a');
        createExplosion(currentMonster.x, currentMonster.y, '#00ff99');
        
        setTimeout(() => {
            updateChainUI();
            if (currentHP === 1) {
                score += (difficulty === 'mudah' ? 10 : difficulty === 'sederhana' ? 20 : 35);
                document.getElementById('score-display').innerText = `SKOR: ${score}`;
                createExplosion(currentMonster.x, currentMonster.y, '#ffea00', 30);
                timeRemaining += 5; 
                spawnMonster();
            }
        }, 150);
    } else {
        triggerFlash('#cc2424');
        timeRemaining = Math.max(0, timeRemaining - 4);
        document.getElementById('timer').innerText = `MASA: ${timeRemaining}s`;
        createExplosion(canvas.width / 2, canvas.height - 40, '#ff3e3e', 8);
    }
}

function updateChainUI() {
    const container = document.getElementById('chain-container');
    container.innerHTML = '';
    
    if (primeFactorsChain.length === 0) {
        container.innerHTML = `<span style="color:#5f6480; font-size:0.85rem;">Menunggu bedilan...</span>`;
        return;
    }

    primeFactorsChain.forEach((num, index) => {
        const node = document.createElement('div');
        node.className = 'chain-node';
        node.innerText = num;
        container.appendChild(node);

        if (index < primeFactorsChain.length - 1) {
            const sym = document.createElement('span');
            sym.className = 'chain-symbol';
            sym.innerText = '×';
            container.appendChild(sym);
        }
    });

    if (currentHP > 1) {
        const sym = document.createElement('span');
        sym.className = 'chain-symbol';
        sym.innerText = '×';
        container.appendChild(sym);

        const rem = document.createElement('div');
        rem.className = 'chain-node';
        rem.style.background = '#444';
        rem.innerText = currentHP;
        container.appendChild(rem);
    }
}

function createExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 4 + 2,
            color: color,
            alpha: 1
        });
    }
}

function triggerFlash(color) {
    flashColor = color;
    flashTicks = 8;
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (flashTicks > 0) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashTicks * 0.05;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        flashTicks--;
    }

    // Benteng
    ctx.fillStyle = '#1c1e2e';
    ctx.fillRect(0, canvas.height - 25, canvas.width, 25);
    ctx.fillStyle = '#ff3e3e';
    ctx.fillRect(0, canvas.height - 28, canvas.width, 3);

    // Meriam
    const turretX = canvas.width / 2;
    const turretY = canvas.height - 25;
    
    ctx.fillStyle = '#3a3f58';
    ctx.beginPath();
    ctx.arc(turretX, turretY, 35, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(turretX, turretY, 12, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = '#2a2d42';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(turretX, turretY); ctx.lineTo(turretX, turretY - 45); ctx.stroke();
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(turretX, turretY); ctx.lineTo(turretX, turretY - 43); ctx.stroke();

    // Raksasa
    if (currentMonster) {
        currentMonster.y += currentMonster.speed;
        currentMonster.pulse += 0.07;
        
        const pulseRadius = currentMonster.radius + Math.sin(currentMonster.pulse) * 3;
        
        ctx.fillStyle = currentMonster.color;
        ctx.beginPath();
        ctx.arc(currentMonster.x, currentMonster.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(currentMonster.x - 25, currentMonster.y - 20);
        ctx.lineTo(currentMonster.x - 45, currentMonster.y - 50);
        ctx.lineTo(currentMonster.x - 10, currentMonster.y - 30);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(currentMonster.x + 25, currentMonster.y - 20);
        ctx.lineTo(currentMonster.x + 45, currentMonster.y - 50);
        ctx.lineTo(currentMonster.x + 10, currentMonster.y - 30);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(currentMonster.x - 15, currentMonster.y - 5, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(currentMonster.x + 15, currentMonster.y - 5, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(currentMonster.x - 15, currentMonster.y - 5, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(currentMonster.x + 15, currentMonster.y - 5, 3, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentHP, currentMonster.x, currentMonster.y + 15);

        if (currentMonster.y + currentMonster.radius >= canvas.height - 25) {
            endGame(false, "BENTENG MELETUP!", `Raksasa angka ${targetNumber} menembusi pertahanan.`);
        }
    }

    // Laser
    for (let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i];
        let dx = l.targetX - l.x;
        let dy = l.targetY - l.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < l.speed) {
            lasers.splice(i, 1);
        } else {
            l.x += (dx / dist) * l.speed;
            l.y += (dy / dist) * l.speed;

            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.x - (dx/dist)*20, l.y - (dy/dist)*20);
            ctx.stroke();
        }
    }

