// Track available letters
const letters = ['C1', 'I', 'R', 'C2', 'O', 'S', 'A', 'E'];
const revealedLetters = [];

// Get DOM elements
const prompt = document.getElementById('prompt');
const lettersContainer = document.getElementById('lettersContainer');
const airplane = document.getElementById('airplane');
const finalReveal = document.getElementById('finalReveal');
const bgMusic = document.getElementById('bgMusic');
const logoImg = document.querySelector('#finalReveal .logo');

const BPM = 131;
const BEAT_INTERVAL_MS = (60 / BPM) * 1000;
const BUMP_DURATION_MS = 200;
let logoBeatIntervalId = null;

// Click handler
document.addEventListener('click', handleClick);

function handleClick() {
    // Hide prompt after first click
    if (!prompt.classList.contains('hidden')) {
        prompt.classList.add('hidden');
    }
    
    // Check if all letters are revealed
    if (revealedLetters.length >= letters.length) {
        return; // Do nothing if all letters are already revealed
    }
    
    // Update music: first click starts song at 12.5%, each click +12.5% until 100%
    const step = 0.125;
    const volume = (revealedLetters.length + 1) * step;
    bgMusic.volume = Math.min(volume, 1);
    if (revealedLetters.length === 0) {
        bgMusic.play().catch(() => {});
    }
    
    // Get unrevealed letters
    const unrevealedLetters = letters.filter(letter => !revealedLetters.includes(letter));
    
    if (unrevealedLetters.length === 0) {
        return;
    }
    
    // Randomly select an unrevealed letter
    const randomIndex = Math.floor(Math.random() * unrevealedLetters.length);
    const selectedLetter = unrevealedLetters[randomIndex];
    
    // Reveal the letter
    revealLetter(selectedLetter);
    
    // Check if all letters are now revealed
    if (revealedLetters.length === letters.length) {
        // Wait 2 seconds, then trigger airplane animation
        setTimeout(() => {
            triggerAirplaneAnimation();
        }, 3000);
    }
}

function revealLetter(letterId) {
    const letterImg = document.getElementById(`letter-${letterId}`);
    
    if (letterImg && !revealedLetters.includes(letterId)) {
        // Add revealed class to trigger fall animation
        letterImg.classList.add('revealed');
        
        // After fall animation completes, add wiggle
        setTimeout(() => {
            letterImg.classList.add('wiggle');
        }, 800);
        
        // Track as revealed
        revealedLetters.push(letterId);
    }
}

function triggerAirplaneAnimation() {
    // Start the plane flying
    airplane.classList.add('flying');
    
    // Hide the CIRCOSAE letters halfway through the flight so the transition happens behind the plane
    setTimeout(() => {
        lettersContainer.classList.add('hidden-by-plane');
    }, 1000);
    
    // After airplane animation completes, reveal final section and start logo bump to beat
    setTimeout(() => {
        finalReveal.classList.add('visible');
        startLogoBeatBump();
    }, 1000);
}

function startLogoBeatBump() {
    if (!logoImg || !bgMusic) return;
    if (logoBeatIntervalId) clearInterval(logoBeatIntervalId);
    const beatIntervalSec = 60 / BPM;

    function doBump() {
        logoImg.classList.remove('bump');
        void logoImg.offsetWidth;
        logoImg.classList.add('bump');
        setTimeout(() => logoImg.classList.remove('bump'), BUMP_DURATION_MS);
    }

    function scheduleNextBeat() {
        const now = bgMusic.currentTime;
        const beatIndex = Math.floor(now / beatIntervalSec);
        const nextBeatTime = (beatIndex + 1) * beatIntervalSec;
        let delay = (nextBeatTime - now) * 1000;
        if (delay < 0 || delay > beatIntervalSec * 1000) delay = 0;
        setTimeout(() => {
            doBump();
            logoBeatIntervalId = setInterval(doBump, BEAT_INTERVAL_MS);
        }, delay);
    }

    if (bgMusic.paused) {
        doBump();
        logoBeatIntervalId = setInterval(doBump, BEAT_INTERVAL_MS);
    } else {
        scheduleNextBeat();
    }
}
