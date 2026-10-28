/**
 * DevQuiz - Production-Quality Web Development & JavaScript Quiz App
 * Built with vanilla HTML5, CSS3, and modern JavaScript (ES6+).
 * No external libraries or frameworks.
 */

'use strict';

/* ==========================================================================
   CONFIG & CONSTANTS
   ========================================================================== */

/** Duration allowed per question in seconds */
const QUESTION_DURATION = 15;

/**
 * Auto-advance delay in milliseconds after answering or timing out.
 * Set to 2000 to automatically move to the next question after 2 seconds,
 * or 0 to require the user to click the "Next" / "Finish" button (or press Enter).
 */
const AUTO_ADVANCE_DELAY_MS = 0;

/** LocalStorage storage keys */
const STORAGE_KEYS = {
  HIGH_SCORE: 'devquiz_high_score',
  THEME: 'devquiz_theme'
};

/**
 * Bank of 10 Web Development & JavaScript questions.
 * Format: { question: string, options: string[], answer: number (index of correct option) }
 */
const QUESTIONS = [
  {
    question: "What does the 'typeof null' expression evaluate to in JavaScript?",
    options: ['"object"', '"null"', '"undefined"', '"number"'],
    answer: 0
  },
  {
    question: "Which HTML5 semantic element is intended for self-contained, distributable content like an article or blog post?",
    options: ['<article>', '<section>', '<aside>', '<main>'],
    answer: 0
  },
  {
    question: "Which CSS declaration turns an element into a flexible flex container?",
    options: ['display: flex', 'position: flex', 'flex-direction: row', 'box-type: flex'],
    answer: 0
  },
  {
    question: "Which JavaScript Array method returns a new array containing all elements that satisfy a provided testing function?",
    options: ['filter()', 'map()', 'find()', 'every()'],
    answer: 0
  },
  {
    question: "Which HTTP status code indicates that a request has succeeded and resulted in the creation of a new resource?",
    options: ['201 Created', '200 OK', '204 No Content', '301 Moved Permanently'],
    answer: 0
  },
  {
    question: "Which browser runtime mechanism executes queued tasks and callbacks once the Call Stack is empty?",
    options: ['Event Loop', 'Garbage Collector', 'JIT Compiler', 'Call Stack Manager'],
    answer: 0
  },
  {
    question: "Which CSS box-sizing value includes padding and border in the element's total width and height calculation?",
    options: ['border-box', 'content-box', 'padding-box', 'initial-box'],
    answer: 0
  },
  {
    question: "Which native JavaScript function cancels a recurring timer that was scheduled with setInterval()?",
    options: ['clearInterval()', 'clearTimeout()', 'stopInterval()', 'cancelAnimationFrame()'],
    answer: 0
  },
  {
    question: "Which keyword is used to declare a block-scoped variable that cannot be reassigned?",
    options: ['const', 'let', 'var', 'static'],
    answer: 0
  },
  {
    question: "What does the 'DOM' acronym stand for in web browsers?",
    options: ['Document Object Model', 'Data Oriented Module', 'Digital Object Method', 'Display Order Model'],
    answer: 0
  }
];

/* ==========================================================================
   APPLICATION STATE
   ========================================================================== */

/**
 * Single centralized state object holding all active quiz data.
 */
const state = {
  currentIndex: 0,            // Index of current question in the deck
  score: 0,                   // Count of correct answers
  timeLeft: QUESTION_DURATION,// Remaining seconds for current question
  timerId: null,              // Interval ID for question countdown timer
  autoAdvanceTimerId: null,   // Timeout ID for optional auto-advancing
  isLocked: false,            // Prevents double-clicking / input after answer
  deck: [],                   // Shuffled question deck for current playthrough
  answers: []                 // Detailed log: { question, options, chosenIndex, correctIndex, isCorrect, isTimeout }
};

/* ==========================================================================
   DOM ELEMENT REFERENCES
   ========================================================================== */

const DOM = {
  // Screens
  startScreen: document.getElementById('startScreen'),
  quizScreen: document.getElementById('quizScreen'),
  resultScreen: document.getElementById('resultScreen'),

  // Header
  headerHighScore: document.getElementById('headerHighScore'),
  liveScoreContainer: document.getElementById('liveScoreContainer'),
  liveScoreValue: document.getElementById('liveScoreValue'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  themeLabel: document.getElementById('themeLabel'),

  // Start Screen
  startHighScore: document.getElementById('startHighScore'),
  startBtn: document.getElementById('startBtn'),

  // Quiz Screen
  quizProgressBar: document.getElementById('quizProgressBar'),
  quizProgressFill: document.getElementById('quizProgressFill'),
  questionCounter: document.getElementById('questionCounter'),
  timerContainer: document.getElementById('timerContainer'),
  timerText: document.getElementById('timerText'),
  timerBarFill: document.getElementById('timerBarFill'),
  questionContainer: document.getElementById('questionContainer'),
  questionText: document.getElementById('questionText'),
  optionsContainer: document.getElementById('optionsContainer'),
  feedbackText: document.getElementById('feedbackText'),
  nextBtn: document.getElementById('nextBtn'),
  nextBtnText: document.getElementById('nextBtnText'),

  // Result Screen
  resultTitle: document.getElementById('resultTitle'),
  performanceMessage: document.getElementById('performanceMessage'),
  scoreRingFg: document.getElementById('scoreRingFg'),
  scorePercentage: document.getElementById('scorePercentage'),
  finalScoreText: document.getElementById('finalScoreText'),
  resultHighScoreNotice: document.getElementById('resultHighScoreNotice'),
  statCorrect: document.getElementById('statCorrect'),
  statWrong: document.getElementById('statWrong'),
  statUnanswered: document.getElementById('statUnanswered'),
  restartBtn: document.getElementById('restartBtn'),
  reviewBtn: document.getElementById('reviewBtn'),
  reviewBtnText: document.getElementById('reviewBtnText'),
  reviewContainer: document.getElementById('reviewContainer'),
  reviewList: document.getElementById('reviewList')
};

/* ==========================================================================
   UTILITY & STORAGE HELPERS
   ========================================================================== */

/**
 * Fisher-Yates array shuffling algorithm.
 * Returns a new shallow-copied array in randomized order.
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds a fresh randomized deck from QUESTIONS:
 * 1. Shuffles the order of the questions.
 * 2. Shuffles each question's 4 option strings.
 * 3. Recalculates the correct answer index so answers remain 100% accurate.
 */
function buildShuffledDeck() {
  const shuffledQuestions = shuffleArray(QUESTIONS);
  return shuffledQuestions.map((q) => {
    const correctAnswerText = q.options[q.answer];
    const shuffledOptions = shuffleArray(q.options);
    const newAnswerIndex = shuffledOptions.indexOf(correctAnswerText);
    return {
      question: q.question,
      options: shuffledOptions,
      answer: newAnswerIndex
    };
  });
}

/**
 * Safely reads high score from localStorage.
 */
function getStoredHighScore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return saved !== null ? parseInt(saved, 10) : 0;
  } catch (err) {
    console.warn('LocalStorage inaccessible:', err);
    return 0;
  }
}

/**
 * Safely saves high score to localStorage.
 */
function saveStoredHighScore(score) {
  try {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(score));
  } catch (err) {
    console.warn('Failed to save high score to localStorage:', err);
  }
}

/**
 * Switches the visible screen in the DOM.
 */
function switchScreen(activeScreenName) {
  DOM.startScreen.hidden = activeScreenName !== 'start';
  DOM.quizScreen.hidden = activeScreenName !== 'quiz';
  DOM.resultScreen.hidden = activeScreenName !== 'result';

  // Live score badge is visible only during an active quiz
  DOM.liveScoreContainer.hidden = activeScreenName !== 'quiz';
}

/* ==========================================================================
   TIMER LOGIC
   ========================================================================== */

/**
 * Clears any active setInterval and auto-advance timeouts.
 * Guarantees that timers never leak across questions or restarts.
 */
function clearAllTimers() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  if (state.autoAdvanceTimerId !== null) {
    clearTimeout(state.autoAdvanceTimerId);
    state.autoAdvanceTimerId = null;
  }
}

/**
 * Updates visual countdown timer display:
 * 1. Number text (e.g. "12s").
 * 2. Shrinking bar width percentage.
 * 3. Color level attribute (ok > 50%, warn 25%-50%, danger <= 25%).
 */
function updateTimerVisual(immediateReset = false) {
  DOM.timerText.textContent = `${state.timeLeft}s`;

  const ratio = Math.max(0, state.timeLeft / QUESTION_DURATION);
  const percentage = ratio * 100;

  // Set color state based on remaining time ratio
  let level = 'ok';
  if (ratio <= 0.25) {
    level = 'danger';
  } else if (ratio <= 0.5) {
    level = 'warn';
  }

  DOM.timerContainer.dataset.level = level;
  DOM.timerBarFill.dataset.level = level;

  if (immediateReset) {
    DOM.timerBarFill.style.transition = 'none';
    DOM.timerBarFill.style.width = '100%';
    void DOM.timerBarFill.offsetWidth; // Force synchronous reflow to apply 100% width immediately
    DOM.timerBarFill.style.transition = 'width 1s linear, background-color 0.3s ease';
  } else {
    DOM.timerBarFill.style.width = `${percentage}%`;
  }
}

/**
 * Starts the per-question 15-second countdown timer using setInterval.
 * Clears any existing interval first to prevent duplicate ticks.
 */
function startTimer() {
  clearAllTimers();
  state.timeLeft = QUESTION_DURATION;
  updateTimerVisual(true);

  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateTimerVisual(false);

    // When timer expires, clear interval and trigger timeout handler
    if (state.timeLeft <= 0) {
      clearAllTimers();
      handleTimeout();
    }
  }, 1000);
}

/* ==========================================================================
   CORE QUIZ FLOW FUNCTIONS
   ========================================================================== */

/**
 * Starts a new quiz session:
 * Generates fresh shuffled deck, resets score and state, displays quiz screen.
 */
function startQuiz() {
  clearAllTimers();

  state.deck = buildShuffledDeck();
  state.currentIndex = 0;
  state.score = 0;
  state.answers = [];
  state.isLocked = false;

  DOM.liveScoreValue.textContent = '0';
  switchScreen('quiz');
  renderQuestion();
}

/**
 * Restarts the quiz from the result screen.
 */
function restartQuiz() {
  startQuiz();
}

/**
 * Renders the current question and options:
 * - Updates question counter and overall quiz progress bar.
 * - Injects 4 option buttons using clean DOM manipulation (createElement / textContent).
 * - Triggers slide/fade entrance animation.
 * - Starts the 15-second countdown timer.
 */
function renderQuestion() {
  clearAllTimers();
  state.isLocked = false;

  const currentQ = state.deck[state.currentIndex];
  const totalQuestions = state.deck.length;
  const questionNumber = state.currentIndex + 1;
  const isLastQuestion = state.currentIndex === totalQuestions - 1;

  // 1. Update question count and progress bar
  DOM.questionCounter.textContent = `Question ${questionNumber} of ${totalQuestions}`;
  const progressPercent = Math.round(((questionNumber - 1) / totalQuestions) * 100);
  DOM.quizProgressBar.setAttribute('aria-valuenow', String(progressPercent));
  DOM.quizProgressFill.style.width = `${progressPercent}%`;

  // 2. Set question text using textContent (safe against XSS)
  DOM.questionText.textContent = currentQ.question;

  // 3. Clear options container and construct 4 option buttons
  DOM.optionsContainer.replaceChildren();

  currentQ.options.forEach((optText, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.dataset.index = String(index);
    btn.setAttribute('aria-label', `Option ${index + 1}: ${optText}`);

    // Keyboard shortcut badge (1, 2, 3, 4)
    const keyBadge = document.createElement('span');
    keyBadge.className = 'option-key';
    keyBadge.textContent = String(index + 1);
    keyBadge.setAttribute('aria-hidden', 'true');

    // Option text label
    const textSpan = document.createElement('span');
    textSpan.className = 'option-label';
    textSpan.textContent = optText;

    btn.append(keyBadge, textSpan);
    DOM.optionsContainer.append(btn);
  });

  // 4. Reset feedback text and Next button state
  DOM.feedbackText.textContent = '';
  DOM.feedbackText.className = 'feedback-text';
  DOM.nextBtn.hidden = true;
  DOM.nextBtnText.textContent = isLastQuestion ? 'Finish' : 'Next';

  // 5. Re-trigger smooth entrance animation for question container
  DOM.questionContainer.classList.remove('slide-enter');
  void DOM.questionContainer.offsetWidth; // Force reflow
  DOM.questionContainer.classList.add('slide-enter');

  // 6. Start 15s timer for this question
  startTimer();
}

/**
 * Locks the current question options and freezes the timer.
 * Shared by both answer selection and timeout.
 */
function lockQuestionOptions() {
  state.isLocked = true;
  clearAllTimers();

  // Freeze the timer bar at its exact current visual width
  const currentComputedWidth = window.getComputedStyle(DOM.timerBarFill).width;
  DOM.timerBarFill.style.transition = 'none';
  DOM.timerBarFill.style.width = currentComputedWidth;

  // Disable all option buttons to prevent subsequent clicks
  const optionButtons = DOM.optionsContainer.querySelectorAll('.option-btn');
  optionButtons.forEach((btn) => {
    btn.disabled = true;
  });
}

/**
 * Handles the user selecting an answer option.
 * Immediately locks options, stops timer, checks answer, updates score & DOM.
 * @param {number} selectedIndex - Index (0-3) of the chosen option.
 */
function handleAnswer(selectedIndex) {
  // Prevent double-clicks or answering when question is locked
  if (state.isLocked) return;

  // Immediately lock all options and stop timer
  lockQuestionOptions();

  const currentQ = state.deck[state.currentIndex];
  const optionButtons = DOM.optionsContainer.querySelectorAll('.option-btn');
  const chosenBtn = optionButtons[selectedIndex];
  const isCorrect = selectedIndex === currentQ.answer;

  /* Score Calculation Logic:
     +1 point is awarded for each correct answer. Score updates immediately. */
  if (isCorrect) {
    state.score++;
    DOM.liveScoreValue.textContent = String(state.score);
    if (chosenBtn) {
      chosenBtn.classList.add('correct', 'pop-animation');
    }
    DOM.feedbackText.textContent = 'Correct! Great job.';
    DOM.feedbackText.className = 'feedback-text correct';
  } else {
    if (chosenBtn) {
      chosenBtn.classList.add('wrong', 'shake-animation');
    }
    // Highlight the correct answer in green
    const correctBtn = optionButtons[currentQ.answer];
    if (correctBtn) {
      correctBtn.classList.add('correct');
    }
    DOM.feedbackText.textContent = `Incorrect. The correct answer was: "${currentQ.options[currentQ.answer]}".`;
    DOM.feedbackText.className = 'feedback-text wrong';
  }

  // Record answer for final review
  state.answers.push({
    question: currentQ.question,
    options: currentQ.options,
    chosenIndex: selectedIndex,
    correctIndex: currentQ.answer,
    isCorrect: isCorrect,
    isTimeout: false
  });

  // Reveal Next/Finish button and configure auto-advance
  completeQuestionInteraction();
}

/**
 * Handles question timer expiration (timeout).
 * Locks options, highlights the correct answer in green, and displays "Time's up!".
 */
function handleTimeout() {
  if (state.isLocked) return;

  lockQuestionOptions();

  const currentQ = state.deck[state.currentIndex];
  const optionButtons = DOM.optionsContainer.querySelectorAll('.option-btn');

  // Highlight correct answer in green
  const correctBtn = optionButtons[currentQ.answer];
  if (correctBtn) {
    correctBtn.classList.add('correct');
  }

  DOM.feedbackText.textContent = `Time's up! The correct answer was: "${currentQ.options[currentQ.answer]}".`;
  DOM.feedbackText.className = 'feedback-text timeout';

  // Record unanswered timeout for review
  state.answers.push({
    question: currentQ.question,
    options: currentQ.options,
    chosenIndex: null,
    correctIndex: currentQ.answer,
    isCorrect: false,
    isTimeout: true
  });

  // Reveal Next/Finish button and configure auto-advance
  completeQuestionInteraction();
}

/**
 * Reveals the Next/Finish button, gives it focus, and initiates auto-advance if configured.
 */
function completeQuestionInteraction() {
  DOM.nextBtn.hidden = false;
  DOM.nextBtn.focus();

  if (AUTO_ADVANCE_DELAY_MS > 0) {
    state.autoAdvanceTimerId = setTimeout(() => {
      nextQuestion();
    }, AUTO_ADVANCE_DELAY_MS);
  }
}

/**
 * Advances to the next question or shows the result screen if on the final question.
 */
function nextQuestion() {
  // If user clicks Next before auto-advance fires, cancel the timeout
  if (state.autoAdvanceTimerId !== null) {
    clearTimeout(state.autoAdvanceTimerId);
    state.autoAdvanceTimerId = null;
  }

  // Only proceed if current question has been answered/timed out
  if (!state.isLocked) return;

  state.currentIndex++;

  if (state.currentIndex < state.deck.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

/* ==========================================================================
   RESULT & REVIEW SCREEN
   ========================================================================== */

/**
 * Displays the result screen with score visualization, breakdown, and high score.
 */
function showResult() {
  clearAllTimers();

  const totalQuestions = state.deck.length;
  const correctCount = state.score;
  const wrongCount = state.answers.filter((a) => !a.isCorrect && !a.isTimeout).length;
  const timeoutCount = state.answers.filter((a) => a.isTimeout).length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  // Complete the progress bar fill on completion
  DOM.quizProgressBar.setAttribute('aria-valuenow', '100');
  DOM.quizProgressFill.style.width = '100%';

  // Update text stats
  DOM.finalScoreText.textContent = `${correctCount} / ${totalQuestions}`;
  DOM.scorePercentage.textContent = `${percentage}%`;
  DOM.statCorrect.textContent = String(correctCount);
  DOM.statWrong.textContent = String(wrongCount);
  DOM.statUnanswered.textContent = String(timeoutCount);

  // Performance encouraging message based on score percentage
  let perfMsg = '';
  if (percentage === 100) {
    perfMsg = 'Flawless victory! You have mastered these web concepts!';
  } else if (percentage >= 80) {
    perfMsg = 'Excellent job! You demonstrated strong web development skills!';
  } else if (percentage >= 60) {
    perfMsg = 'Good effort! You have a solid base with some room to grow.';
  } else if (percentage >= 40) {
    perfMsg = 'Keep practicing! Review the answers below to sharpen your knowledge.';
  } else {
    perfMsg = "Don't give up! Review the solutions below and try again.";
  }
  DOM.performanceMessage.textContent = perfMsg;

  // SVG Circular Score Ring Visualization animation
  // Radius r = 50 => circumference = 2 * PI * 50 = 314.159
  const circumference = 2 * Math.PI * 50;
  DOM.scoreRingFg.style.strokeDasharray = `${circumference}`;
  DOM.scoreRingFg.style.strokeDashoffset = `${circumference}`;

  // Check and update High Score in LocalStorage
  const previousHigh = getStoredHighScore();
  if (correctCount > previousHigh) {
    saveStoredHighScore(correctCount);
    DOM.resultHighScoreNotice.textContent = '🎉 New High Score!';
    DOM.resultHighScoreNotice.className = 'high-score-notice new-record';
    updateAllHighScoreDisplays(correctCount, totalQuestions);
  } else {
    DOM.resultHighScoreNotice.textContent = `High Score: ${previousHigh} / ${totalQuestions}`;
    DOM.resultHighScoreNotice.className = 'high-score-notice';
  }

  // Build the review answers list
  buildReviewList();
  DOM.reviewContainer.hidden = true;
  DOM.reviewBtn.setAttribute('aria-expanded', 'false');
  DOM.reviewBtnText.textContent = 'Review Answers';

  // Switch to result screen
  switchScreen('result');

  // Trigger smooth circle stroke fill animation after DOM paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const strokeOffset = circumference - (circumference * percentage) / 100;
      DOM.scoreRingFg.style.strokeDashoffset = `${strokeOffset}`;
    });
  });
}

/**
 * Builds the question-by-question review section using DOM manipulation.
 */
function buildReviewList() {
  DOM.reviewList.replaceChildren();

  state.answers.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `review-item ${item.isCorrect ? 'correct' : item.isTimeout ? 'unanswered' : 'wrong'}`;

    // Item header: Question index & status badge
    const headerDiv = document.createElement('div');
    headerDiv.className = 'review-item-header';

    const indexBadge = document.createElement('span');
    indexBadge.className = 'review-index';
    indexBadge.textContent = `Question ${index + 1}`;

    const statusBadge = document.createElement('span');
    statusBadge.className = 'review-status-badge';
    if (item.isCorrect) {
      statusBadge.textContent = '✓ Correct';
    } else if (item.isTimeout) {
      statusBadge.textContent = '⏱ Timed Out';
    } else {
      statusBadge.textContent = '✗ Wrong';
    }

    headerDiv.append(indexBadge, statusBadge);

    // Question title
    const qTitle = document.createElement('h4');
    qTitle.className = 'review-q-title';
    qTitle.textContent = item.question;

    // User answer details
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'review-answers-details';

    const userAnsP = document.createElement('p');
    userAnsP.className = 'review-user-ans';
    const userAnsPrefix = document.createElement('span');
    userAnsPrefix.className = 'ans-label';
    userAnsPrefix.textContent = 'Your answer: ';

    const userAnsValue = document.createElement('strong');
    if (item.isTimeout) {
      userAnsValue.textContent = 'No answer given (Time ran out)';
    } else {
      userAnsValue.textContent = item.options[item.chosenIndex];
    }
    userAnsP.append(userAnsPrefix, userAnsValue);
    detailsDiv.append(userAnsP);

    // If answer was wrong or timed out, display the correct answer
    if (!item.isCorrect) {
      const correctAnsP = document.createElement('p');
      correctAnsP.className = 'review-correct-ans';
      const correctAnsPrefix = document.createElement('span');
      correctAnsPrefix.className = 'ans-label';
      correctAnsPrefix.textContent = 'Correct answer: ';

      const correctAnsValue = document.createElement('strong');
      correctAnsValue.textContent = item.options[item.correctIndex];

      correctAnsP.append(correctAnsPrefix, correctAnsValue);
      detailsDiv.append(correctAnsP);
    }

    li.append(headerDiv, qTitle, detailsDiv);
    DOM.reviewList.append(li);
  });
}

/**
 * Toggles the visibility of the review answers accordion.
 */
function toggleReview() {
  const isHidden = DOM.reviewContainer.hidden;
  DOM.reviewContainer.hidden = !isHidden;
  DOM.reviewBtn.setAttribute('aria-expanded', String(isHidden));
  DOM.reviewBtnText.textContent = isHidden ? 'Hide Review' : 'Review Answers';

  if (isHidden) {
    // Smooth scroll down to review
    DOM.reviewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Updates high score values across header and start screen.
 */
function updateAllHighScoreDisplays(score, total = QUESTIONS.length) {
  const formatted = `${score} / ${total}`;
  DOM.headerHighScore.textContent = formatted;
  DOM.startHighScore.textContent = formatted;
}

/* ==========================================================================
   THEME TOGGLE (DARK / LIGHT)
   ========================================================================== */

/**
 * Applies color theme to root html element and persists preference.
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  if (theme === 'dark') {
    DOM.themeIcon.textContent = '☀️';
    DOM.themeLabel.textContent = 'Light';
    DOM.themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    DOM.themeIcon.textContent = '🌙';
    DOM.themeLabel.textContent = 'Dark';
    DOM.themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  }

  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.warn('Unable to persist theme to localStorage:', err);
  }
}

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/* ==========================================================================
   EVENT LISTENERS & DELEGATION
   ========================================================================== */

/**
 * Event delegation for option buttons:
 * Attaches a single click listener to the options container.
 */
DOM.optionsContainer.addEventListener('click', (event) => {
  const optionBtn = event.target.closest('.option-btn');
  if (!optionBtn || state.isLocked) return;

  const selectedIndex = parseInt(optionBtn.dataset.index, 10);
  if (!isNaN(selectedIndex)) {
    handleAnswer(selectedIndex);
  }
});

// Primary Button actions
DOM.startBtn.addEventListener('click', startQuiz);
DOM.restartBtn.addEventListener('click', restartQuiz);
DOM.nextBtn.addEventListener('click', nextQuestion);
DOM.reviewBtn.addEventListener('click', toggleReview);
DOM.themeToggleBtn.addEventListener('click', toggleTheme);

/**
 * Keyboard shortcuts for accessibility:
 * - Keys '1' to '4': Select corresponding option buttons during active question.
 * - Key 'Enter': Advances to the next question / finish when button is visible,
 *   or starts quiz from the start screen.
 */
document.addEventListener('keydown', (event) => {
  // Ignore shortcuts when modifier keys are held or input fields are focused
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

  // Keys 1 - 4 for option selection
  if (/^[1-4]$/.test(event.key)) {
    if (!DOM.quizScreen.hidden && !state.isLocked) {
      event.preventDefault();
      const optionIndex = parseInt(event.key, 10) - 1;
      handleAnswer(optionIndex);
    }
    return;
  }

  // Enter key navigation
  if (event.key === 'Enter') {
    if (!DOM.quizScreen.hidden && !DOM.nextBtn.hidden) {
      event.preventDefault();
      nextQuestion();
    } else if (!DOM.startScreen.hidden) {
      event.preventDefault();
      startQuiz();
    }
  }
});

/* ==========================================================================
   APPLICATION INITIALIZATION
   ========================================================================== */

(function initializeApp() {
  // 1. Initialize Color Theme (saved preference or OS preference)
  let initialTheme = 'light';
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      initialTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
    }
  } catch (err) {
    initialTheme = 'light';
  }
  setTheme(initialTheme);

  // 2. Initialize High Score display
  const currentHigh = getStoredHighScore();
  updateAllHighScoreDisplays(currentHigh, QUESTIONS.length);

  // 3. Ensure initial view is start screen
  switchScreen('start');
})();
