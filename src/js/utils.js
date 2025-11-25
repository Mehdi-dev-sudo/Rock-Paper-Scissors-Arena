export const CHOICES = {
    rock: { emoji: '🪨', name: 'Rock', beats: 'scissors' },
    paper: { emoji: '📄', name: 'Paper', beats: 'rock' },
    scissors: { emoji: '✂️', name: 'Scissors', beats: 'paper' }
};

export const GAME_MODES = {
    ENDLESS: 'endless',
    BEST_OF_5: 'bestof5'
};

export const STORAGE_KEY = 'epicRPSData';

export const WELCOME_MESSAGES = [
    "🎮 Ready for battle! Choose your weapon!",
    "🔥 Let's see what you've got!",
    "⚔️ The arena awaits your decision!",
    "🌟 Time to show your skills!",
    "🎯 Make your choice wisely!"
];

export const createRippleEffect = (x, y) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: fixed;
        border-radius: 50%;
        background: rgba(102, 126, 234, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x - 25}px;
        top: ${y - 25}px;
        width: 50px;
        height: 50px;
        pointer-events: none;
        z-index: 9999;
    `;

    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
};

export const getRandomChoice = () => {
    const choices = Object.keys(CHOICES);
    return choices[Math.floor(Math.random() * choices.length)];
};

export const getWeightedComputerChoice = (lastPlayerChoice) => {
    const choices = Object.keys(CHOICES);
    const weights = [1, 1, 1];

    if (lastPlayerChoice) {
        const indexThatBeats = choices.findIndex(choice =>
            CHOICES[choice].beats === lastPlayerChoice
        );
        if (indexThatBeats !== -1) {
            weights[indexThatBeats] = 1.3;
        }
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < choices.length; i++) {
        random -= weights[i];
        if (random <= 0) return choices[i];
    }

    return choices[0];
};

export const determineWinner = (playerChoice, computerChoice) => {
    if (playerChoice === computerChoice) return 'tie';
    return CHOICES[playerChoice].beats === computerChoice ? 'win' : 'lose';
};

export const saveGameData = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save game data:', error);
    }
};

export const loadGameData = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load game data:', error);
        return null;
    }
};
