/* =========================
   CBT EXAM SCRIPT
   Improved & Safer Version
========================= */

// ==========================
// Authentication Check
// ==========================
function checkUserAuth() {
  try {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.email) {
      alert("You must be logged in to take an exam.");
      window.location.href = "login.html";
      return false;
    }
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = "login.html";
    return false;
  }
}

if (!checkUserAuth()) {
  throw new Error('User not authenticated');
}

// ==========================
// Anti-cheat protections (basic only)
// ==========================
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());



// ==========================
// Student Validation
// ==========================
const studentDetails = JSON.parse(localStorage.getItem("studentDetails")) || null;
const selectedSubject = localStorage.getItem("selectedSubject") || null;

if (!studentDetails || !studentDetails.firstName || !selectedSubject) {
  alert("Please select a subject and enter your details before starting the exam.");
  window.location.href = "index.html";
}

// ==========================
// Exam Duration
// ==========================
const EXAM_DURATION = (function () {
  if (typeof examDuration !== "undefined") return examDuration;
  return 40; // Default to 40 minutes if not specified
})(); // minutes

// ==========================
// Persistent Timer Setup
// ==========================
let savedEndTime = localStorage.getItem("examEndTime");

if (!savedEndTime) {
  savedEndTime = Date.now() + EXAM_DURATION * 60 * 1000;
  localStorage.setItem("examEndTime", savedEndTime);
}

let timeLeft = Math.floor((savedEndTime - Date.now()) / 1000);
if (timeLeft < 0) timeLeft = 0;

// ==========================
// Variables
// ==========================
let currentQuestionIndex = Number(localStorage.getItem("currentQuestionIndex")) || 0;
let shuffledQuestions = [];
let userAnswers = JSON.parse(localStorage.getItem("userAnswers")) || {};
let timer = null;
let isSubmitted = false;

// ==========================
// DOM Elements
// ==========================
const qNumEl = document.getElementById("question-number");
const qTextEl = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const nextTextEl = document.getElementById("next-text");
const palette = document.getElementById("question-palette");
const mobilePalette = document.getElementById("mobile-question-palette");
const timerEl = document.getElementById("timer-display");
const timerContainer = document.getElementById("timer");
const submitBtn = document.getElementById("submit-btn");
const submitBtnMobile = document.getElementById("submit-btn-mobile");
const loadingOverlay = document.getElementById("loading-overlay");
const studentInfoEl = document.getElementById("student-info");

// ==========================
// Display Student Info
// ==========================
if (studentInfoEl) {
  studentInfoEl.textContent =
    `Student: ${studentDetails.firstName} ${studentDetails.lastName}`;
}

// ==========================
// Fisher-Yates Shuffle
// ==========================
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ==========================
// Initialize Exam
// ==========================
function initExam() {
  const subject = localStorage.getItem("selectedSubject");

  const builtInQuestions =
    typeof questions === "object" && questions
      ? questions
      : (typeof QUESTIONS_BY_SUBJECT === "object" && QUESTIONS_BY_SUBJECT
          ? QUESTIONS_BY_SUBJECT
          : {});
  const customQuestions = JSON.parse(localStorage.getItem("customQuestions")) || {};
  const questionBank = { ...builtInQuestions, ...customQuestions };
  const baseQuestions = Array.isArray(questionBank[subject]) ? questionBank[subject] : [];

  if (baseQuestions.length === 0) {
    alert("Questions not loaded properly for the selected subject.");
    window.location.href = "index.html";
    return;
  }

  const examTitleEl = document.getElementById("exam-title");
  const subjectNameEl = document.getElementById("subject-name");

  if (examTitleEl) {
    examTitleEl.textContent = "JAMB CBT MOCK EXAM";
  }
  if (subjectNameEl) {
    subjectNameEl.textContent = `Subject: ${subject}`;
  }
  localStorage.setItem("examTitle", "JAMB CBT MOCK EXAM");

  const savedQuestions = JSON.parse(localStorage.getItem("shuffledQuestions"));

  if (savedQuestions && savedQuestions.length > 0) {
    shuffledQuestions = savedQuestions;
  } else {
    // Select 40 random questions from the pool and shuffle options
    shuffledQuestions = shuffleArray(baseQuestions).slice(0, 40).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
    localStorage.setItem("shuffledQuestions", JSON.stringify(shuffledQuestions));
  }

  renderPalette();
  renderQuestion();
  startTimer();
}

// ==========================
// Render Question
// ==========================
function renderQuestion() {
  const q = shuffledQuestions[currentQuestionIndex];
  if (!q) return;

  localStorage.setItem("currentQuestionIndex", currentQuestionIndex);

  qNumEl.textContent = `Question ${currentQuestionIndex + 1}`;
  qTextEl.textContent = q.questionText || q.text;

  optionsContainer.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn w-100";
    btn.textContent = opt;

    if (userAnswers[q.id] === opt) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      userAnswers[q.id] = opt;
      localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
      renderQuestion();
      updatePalette();
    });

    optionsContainer.appendChild(btn);
  });

  prevBtn.disabled = currentQuestionIndex === 0;
  
  if (currentQuestionIndex === shuffledQuestions.length - 1) {
    if (nextTextEl) nextTextEl.textContent = "Submit Exam";
    nextBtn.classList.remove("btn-primary");
    nextBtn.classList.add("btn-danger", "text-white");
  } else {
    if (nextTextEl) nextTextEl.textContent = "Next";
    nextBtn.classList.remove("btn-danger", "text-white");
    nextBtn.classList.add("btn-primary");
  }
  nextBtn.disabled = false;

  updatePalette();
}

// ==========================
// Navigation
// ==========================
prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentQuestionIndex === shuffledQuestions.length - 1) {
    // If it's the last question, clicking "Submit Exam" (formerly Next) triggers submission
    submitExam();
  } else if (currentQuestionIndex < shuffledQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
});

// ==========================
// Render Palette
// ==========================
function renderPalette() {
  const palettes = [palette, mobilePalette].filter(p => p !== null);

  palettes.forEach(p => {
    p.innerHTML = "";
    shuffledQuestions.forEach((q, index) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm fw-bold d-flex align-items-center justify-content-center";
      btn.style.width = "36px";
      btn.style.height = "36px";
      btn.style.borderRadius = "8px";
      btn.textContent = index + 1;

      btn.addEventListener("click", () => {
        currentQuestionIndex = index;
        renderQuestion();
        
        // On mobile, close offcanvas when a question is selected
        const offcanvasEl = document.getElementById('offcanvasPalette');
        if (offcanvasEl && p === mobilePalette) {
          const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
          if (offcanvas) offcanvas.hide();
        }
      });

      p.appendChild(btn);
    });
  });

  updatePalette();
}

// ==========================
// Update Palette Styling
// ==========================
function updatePalette() {
  const palettes = [palette, mobilePalette].filter(p => p !== null);

  palettes.forEach(p => {
    Array.from(p.children).forEach((btn, index) => {
      const qId = shuffledQuestions[index].id;

      btn.classList.remove("btn-primary", "btn-outline-primary", "btn-light", "text-white", "border-2", "border-primary");

      if (userAnswers[qId]) {
        btn.classList.add("btn-primary", "text-white");
      } else {
        btn.classList.add("btn-light", "text-muted");
      }

      if (index === currentQuestionIndex) {
        btn.classList.remove("btn-light");
        btn.classList.add("btn-outline-primary", "border-2");
        if (!userAnswers[qId]) {
          btn.classList.add("text-primary");
        }
      }
    });
  });
}

// ==========================
// Timer
// ==========================
function startTimer() {
  timerEl.textContent = formatTime(timeLeft);

  timer = setInterval(() => {
    timeLeft--;

    timerEl.textContent = formatTime(timeLeft);

    if (timeLeft <= 60) {
      timerContainer.classList.remove("bg-primary");
      timerContainer.classList.add("bg-danger");
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      submitExam();
    }
  }, 1000);
}

function formatTime(sec) {
  const minutes = String(Math.floor(sec / 60)).padStart(2, "0");
  const seconds = String(sec % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// ==========================
// Submit Exam
// ==========================
submitBtn.addEventListener("click", () => {
  if (isSubmitted) return;

  if (confirm("Are you sure you want to submit the exam?")) {
    submitExam();
  }
});

if (submitBtnMobile) {
  submitBtnMobile.addEventListener("click", () => {
    if (isSubmitted) return;
    if (confirm("Are you sure you want to submit the exam?")) {
      submitExam();
    }
  });
}

function submitExam() {

  if (isSubmitted) return;
  isSubmitted = true;

  if (timer) clearInterval(timer);

  if (loadingOverlay) {
    loadingOverlay.classList.remove("d-none");
  }

  setTimeout(() => {

    localStorage.removeItem("examEndTime");
    localStorage.removeItem("currentQuestionIndex");

    window.location.href = "results.html";

  }, 500);
}

// ==========================
// Prevent Accidental Exit
// ==========================
window.onbeforeunload = function () {
  if (!isSubmitted) {
    return "Are you sure you want to leave? Your progress will be lost.";
  }
};

// ==========================
window.onload = initExam;
