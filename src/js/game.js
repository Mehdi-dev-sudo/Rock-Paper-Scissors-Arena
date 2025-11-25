import {
  CHOICES,
  GAME_MODES,
  WELCOME_MESSAGES,
  createRippleEffect,
  getRandomChoice,
  getWeightedComputerChoice,
  determineWinner,
  saveGameData,
  loadGameData,
} from './utils.js';

class RockPaperScissorsGame {
  constructor() {
    this.state = {
      playerScore: 0,
      computerScore: 0,
      roundNumber: 1,
      totalGames: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayerChoice: null,
      gameMode: GAME_MODES.ENDLESS,
      autoPlay: false,
      autoPlayInterval: null,
      isPlaying: false,
    };

    this.elements = this.initElements();
    this.init();
  }

  initElements() {
    const getElement = id => document.getElementById(id);
    const getElements = selector => document.querySelectorAll(selector);

    return {
      playerScore: getElement('playerScore'),
      computerScore: getElement('computerScore'),
      roundNumber: getElement('roundNumber'),
      playerChoice: getElement('playerChoice'),
      computerChoice: getElement('computerChoice'),
      resultMessage: getElement('resultMessage'),
      winRate: getElement('winRate'),
      totalGames: getElement('totalGames'),
      winStreak: getElement('winStreak'),
      bestStreak: getElement('bestStreak'),
      resetBtn: getElement('resetBtn'),
      modeBtn: getElement('modeBtn'),
      autoBtn: getElement('autoBtn'),
      choiceBtns: getElements('.choice-btn'),
    };
  }

  init() {
    this.loadSavedData();
    this.attachEventListeners();
    this.updateDisplay();
    this.showWelcomeMessage();
    this.logControls();
  }

  loadSavedData() {
    const savedData = loadGameData();
    if (savedData) {
      this.state.totalGames = savedData.totalGames || 0;
      this.state.wins = savedData.wins || 0;
      this.state.bestStreak = savedData.bestStreak || 0;
      this.state.gameMode = savedData.gameMode || GAME_MODES.ENDLESS;

      this.elements.modeBtn.textContent =
        this.state.gameMode === GAME_MODES.ENDLESS
          ? '🎯 Best of 5'
          : '♾️ Endless';
    }
  }

  attachEventListeners() {
    this.elements.choiceBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        if (!this.state.autoPlay && !this.state.isPlaying) {
          this.playRound(e.target.dataset.choice);
        }
      });
    });

    this.elements.resetBtn.addEventListener('click', () => this.resetGame());
    this.elements.modeBtn.addEventListener('click', () =>
      this.toggleGameMode()
    );
    this.elements.autoBtn.addEventListener('click', () =>
      this.toggleAutoPlay()
    );

    document.addEventListener('keydown', e => this.handleKeyboard(e));
    document.addEventListener('click', e =>
      createRippleEffect(e.clientX, e.clientY)
    );
  }

  handleKeyboard(e) {
    if (this.state.autoPlay || this.state.isPlaying) return;

    const keyActions = {
      r: () => this.playRound('rock'),
      1: () => this.playRound('rock'),
      p: () => this.playRound('paper'),
      2: () => this.playRound('paper'),
      s: () => this.playRound('scissors'),
      3: () => this.playRound('scissors'),
      ' ': () => {
        e.preventDefault();
        this.playRound(getRandomChoice());
      },
      Enter: () => {
        e.preventDefault();
        this.playRound(getRandomChoice());
      },
      Escape: () => this.resetGame(),
    };

    const action = keyActions[e.key.toLowerCase()];
    if (action) action();
  }

  async playRound(playerChoice) {
    if (!playerChoice || this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.setButtonsEnabled(false);

    const computerChoice = getWeightedComputerChoice(
      this.state.lastPlayerChoice
    );

    await this.animateChoices(playerChoice, computerChoice);

    const result = determineWinner(playerChoice, computerChoice);
    this.processResult(result, playerChoice, computerChoice);

    this.state.isPlaying = false;
    this.setButtonsEnabled(true);
  }

  async animateChoices(playerChoice, computerChoice) {
    this.elements.playerChoice.innerHTML = '<div class="loading"></div>';
    this.elements.computerChoice.innerHTML = '<div class="loading"></div>';

    await new Promise(resolve => setTimeout(resolve, 800));

    this.elements.playerChoice.textContent = CHOICES[playerChoice].emoji;
    this.elements.computerChoice.textContent = CHOICES[computerChoice].emoji;

    this.elements.choiceBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.choice === playerChoice);
    });

    await new Promise(resolve => setTimeout(resolve, 700));
  }

  processResult(result, playerChoice, computerChoice) {
    this.state.lastPlayerChoice = playerChoice;
    this.state.totalGames++;

    if (result === 'win') {
      this.state.playerScore++;
      this.state.wins++;
      this.state.currentStreak++;
      this.state.bestStreak = Math.max(
        this.state.bestStreak,
        this.state.currentStreak
      );
    } else if (result === 'lose') {
      this.state.computerScore++;
      this.state.currentStreak = 0;
    }

    this.showResult(result, playerChoice, computerChoice);
    this.updateDisplay();
    this.updateWinnerHighlight(result);
    this.checkGameEnd();
    this.saveProgress();

    this.state.roundNumber++;
  }

  showResult(result, playerChoice, computerChoice) {
    const resultEl = this.elements.resultMessage;
    const playerName = CHOICES[playerChoice].name;
    const computerName = CHOICES[computerChoice].name;

    const messages = {
      win: `🎉 You Win! ${playerName} beats ${computerName}!`,
      lose: `😔 You Lose! ${computerName} beats ${playerName}!`,
      tie: `🤝 It's a Tie! Both chose ${playerName}!`,
    };

    resultEl.textContent = messages[result];
    resultEl.className = `result-message show ${result}`;

    setTimeout(() => resultEl.classList.remove('show'), 3000);
  }

  updateWinnerHighlight(result) {
    this.elements.playerChoice.classList.remove('winner');
    this.elements.computerChoice.classList.remove('winner');

    if (result === 'win') {
      this.elements.playerChoice.classList.add('winner');
    } else if (result === 'lose') {
      this.elements.computerChoice.classList.add('winner');
    }
  }

  updateDisplay() {
    this.elements.playerScore.textContent = this.state.playerScore;
    this.elements.computerScore.textContent = this.state.computerScore;
    this.elements.roundNumber.textContent = this.state.roundNumber;

    const winRate =
      this.state.totalGames > 0
        ? Math.round((this.state.wins / this.state.totalGames) * 100)
        : 0;

    this.elements.winRate.textContent = `${winRate}%`;
    this.elements.totalGames.textContent = this.state.totalGames;
    this.elements.winStreak.textContent = this.state.currentStreak;
    this.elements.bestStreak.textContent = this.state.bestStreak;
  }

  checkGameEnd() {
    if (this.state.gameMode === GAME_MODES.BEST_OF_5) {
      const maxScore = Math.max(
        this.state.playerScore,
        this.state.computerScore
      );
      if (maxScore >= 3) {
        setTimeout(() => {
          const winner =
            this.state.playerScore > this.state.computerScore
              ? 'You'
              : 'Computer';
          const message = `🎊 Game Over!\n\n${winner} won the Best of 5!\n\nFinal Score: ${this.state.playerScore} - ${this.state.computerScore}`;

          if (confirm(message + '\n\nPlay again?')) {
            this.resetGame();
          }
        }, 2000);
      }
    }
  }

  toggleGameMode() {
    this.state.gameMode =
      this.state.gameMode === GAME_MODES.ENDLESS
        ? GAME_MODES.BEST_OF_5
        : GAME_MODES.ENDLESS;

    this.elements.modeBtn.textContent =
      this.state.gameMode === GAME_MODES.ENDLESS
        ? '🎯 Best of 5'
        : '♾️ Endless';

    if (this.state.gameMode === GAME_MODES.BEST_OF_5) {
      this.resetGame();
    }

    this.saveProgress();
  }

  toggleAutoPlay() {
    this.state.autoPlay = !this.state.autoPlay;

    if (this.state.autoPlay) {
      this.elements.autoBtn.textContent = '⏹️ Stop Auto';
      this.startAutoPlay();
    } else {
      this.elements.autoBtn.textContent = '🤖 Auto Play';
      this.stopAutoPlay();
    }
  }

  startAutoPlay() {
    this.state.autoPlayInterval = setInterval(() => {
      if (!this.state.isPlaying) {
        this.playRound(getRandomChoice());
      }
    }, 2500);
  }

  stopAutoPlay() {
    if (this.state.autoPlayInterval) {
      clearInterval(this.state.autoPlayInterval);
      this.state.autoPlayInterval = null;
    }
  }

  setButtonsEnabled(enabled) {
    this.elements.choiceBtns.forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  resetGame() {
    if (this.state.autoPlay) {
      this.toggleAutoPlay();
    }

    this.state.playerScore = 0;
    this.state.computerScore = 0;
    this.state.roundNumber = 1;

    this.elements.playerChoice.textContent = '❓';
    this.elements.computerChoice.textContent = '❓';
    this.elements.playerChoice.classList.remove('winner');
    this.elements.computerChoice.classList.remove('winner');
    this.elements.resultMessage.classList.remove('show');

    this.elements.choiceBtns.forEach(btn => btn.classList.remove('selected'));

    this.updateDisplay();
    this.saveProgress();
    this.showWelcomeMessage();
  }

  showWelcomeMessage() {
    const message =
      WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];

    setTimeout(() => {
      this.elements.resultMessage.textContent = message;
      this.elements.resultMessage.className = 'result-message show tie';

      setTimeout(() => {
        this.elements.resultMessage.classList.remove('show');
      }, 3000);
    }, 500);
  }

  saveProgress() {
    const dataToSave = {
      totalGames: this.state.totalGames,
      wins: this.state.wins,
      bestStreak: this.state.bestStreak,
      gameMode: this.state.gameMode,
    };

    saveGameData(dataToSave);
  }

  logControls() {
    console.log(
      '%c🎮 Epic Rock Paper Scissors Arena',
      'font-size: 20px; font-weight: bold; color: #667eea;'
    );
    console.log(
      '%c⌨️ Keyboard Controls:',
      'font-size: 14px; font-weight: bold; color: #4a5568;'
    );
    console.log('  R or 1 → Rock');
    console.log('  P or 2 → Paper');
    console.log('  S or 3 → Scissors');
    console.log('  Space/Enter → Random choice');
    console.log('  Escape → Reset game');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RockPaperScissorsGame();
});
