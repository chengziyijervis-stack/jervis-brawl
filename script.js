let x = 200;
let y = 200;

let vx = 0;
let vy = 0;

const acceleration = 0.5;
const friction = 0.95;
const maxSpeed = 9;

const keys = {};

const character = document.getElementById('character');

function updatePosition() {
    character.style.left = x + "px";
    character.style.top = y + "px";
}

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function gameLoop() {

    if (keys['w'] || keys['arrowup']) {
        vy -= acceleration;
    }

    if (keys['s'] || keys['arrowdown']) {
        vy += acceleration;
    }

    if (keys['a'] || keys['arrowleft']) {
        vx -= acceleration;
    }

    if (keys['d'] || keys['arrowright']) {
        vx += acceleration;
    }

    vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
    vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));

    vx *= friction;
    vy *= friction;

    if (Math.abs(vx) < 0.01) vx = 0;
    if (Math.abs(vy) < 0.01) vy = 0;

    x += vx;
    y += vy;

    x = Math.max(0, Math.min(window.innerWidth - 30, x));
    y = Math.max(0, Math.min(window.innerHeight - 30, y));

    updatePosition();

    requestAnimationFrame(gameLoop);
}

gameLoop();