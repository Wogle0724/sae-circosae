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
const songQueryInput = document.getElementById('songQuery');
const songResults = document.getElementById('songResults');
const songSubmit = document.getElementById('songSubmit');

const BPM = 131;
const BEAT_INTERVAL_MS = (60 / BPM) * 1000;
const BUMP_DURATION_MS = 200;
let logoBeatIntervalId = null;
let searchTimeoutId = null;
let activeSearchController = null;
let selectedTrack = null;

// Click handler
document.addEventListener('click', handleClick);
initSongSearch();

function handleClick() {
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
        setTimeout(() => {
            prompt.textContent = "keep clicking";
        }, 1000);
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
        prompt.classList.add('hidden');

        // Wait 3 seconds, then trigger airplane animation
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

function initSongSearch() {
    if (!songQueryInput || !songResults || !songSubmit) return;

    songQueryInput.addEventListener('input', () => {
        const query = songQueryInput.value.trim();
        clearTimeout(searchTimeoutId);
        if (query.length < 2) {
            clearSongResults();
            updateSelectedTrack(null);
            return;
        }
        updateSelectedTrack(null);
        searchTimeoutId = setTimeout(() => {
            searchSpotify(query);
        }, 350);
    });
}

function clearSongResults() {
    if (!songResults) return;
    songResults.innerHTML = '';
}

async function searchSpotify(query) {
    if (!songResults) return;
    if (activeSearchController) activeSearchController.abort();
    activeSearchController = new AbortController();

    try {
        const response = await fetch(`/api/spotify-search?q=${encodeURIComponent(query)}`,
            { signal: activeSearchController.signal }
        );
        if (!response.ok) {
            throw new Error('spotify search failed');
        }
        const data = await response.json();
        renderSongResults(data.tracks || []);
    } catch (error) {
        if (error.name === 'AbortError') return;
        clearSongResults();
    }
}

function renderSongResults(tracks) {
    clearSongResults();
    if (!tracks.length) {
        return;
    }

    tracks.forEach((track) => {
        const item = document.createElement('li');
        item.className = 'song-result';

        const cover = document.createElement('img');
        cover.className = 'song-cover';
        cover.alt = `${track.name} cover`;
        cover.src = track.coverUrl || '';

        const meta = document.createElement('div');
        meta.className = 'song-meta';

        const title = document.createElement('div');
        title.className = 'song-title';
        title.textContent = track.name.length > 35 ? track.name.substring(0, 35) + '...' : track.name;

        const artist = document.createElement('div');
        artist.className = 'song-artist';
        artist.textContent = track.artist;

        const pickButton = document.createElement('button');
        pickButton.className = 'song-pick';
        pickButton.type = 'button';
        pickButton.textContent = 'select';
        pickButton.addEventListener('click', () => {
            updateSelectedTrack(track);
        });

        meta.appendChild(title);
        meta.appendChild(artist);
        item.appendChild(cover);
        item.appendChild(meta);
        item.appendChild(pickButton);
        songResults.appendChild(item);
    });
}

function updateSelectedTrack(track) {
    selectedTrack = track;
    setSubmitVisible(!!track);
}

function setSubmitVisible(isVisible) {
    if (!songSubmit) return;
    songSubmit.classList.toggle('visible', isVisible);
}
