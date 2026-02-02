// Track available letters
const letters = ['C1', 'I', 'R', 'C2', 'O', 'S', 'A', 'E'];
const revealedLetters = [];

// Get DOM elements
const prompt = document.getElementById('prompt');
const lettersContainer = document.getElementById('lettersContainer');
const airplane = document.getElementById('airplane');
const finalReveal = document.getElementById('finalReveal');

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
        }, 2000);
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
    
    // After airplane animation completes (2.5s), reveal final section
    setTimeout(() => {
        finalReveal.classList.add('visible');
    }, 1000);
}
