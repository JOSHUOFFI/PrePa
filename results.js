/* =========================
   CBT RESULTS SCRIPT
   Final Corrected Version
========================= */

// ==========================
// Load Stored Data
// ==========================
const studentDetails = JSON.parse(localStorage.getItem("studentDetails")) || null;
const userAnswers = JSON.parse(localStorage.getItem("userAnswers")) || {};
const shuffledQuestions = JSON.parse(localStorage.getItem("shuffledQuestions")) || [];

// DOM Elements
const summaryGrid = document.getElementById("summary-grid");
const performanceCard = document.getElementById("performance-card");
const percentageDisplay = document.getElementById("percentage-display");
const progressCircle = document.getElementById("progress-circle");
const excelBtn = document.getElementById("excel-btn");
const pdfBtn = document.getElementById("pdf-btn");

// ==========================
// Guard: Prevent Direct Access
// ==========================
if (!studentDetails || shuffledQuestions.length === 0) {
  alert("No result data found. Please take the exam first.");
  window.location.href = "index.html";
}

// ==========================
// Grade Scale
// ==========================
const gradeScale = [
  { min: 80, grade: "A+", message: "Golden 🎉" },
  { min: 70, grade: "A", message: "Excellent 👏" },
  { min: 60, grade: "B", message: "Very Good Job 👍" },
  { min: 50, grade: "C", message: "Good Job 🙂" },
   { min: 40, grade: "D", message: "pass 🙂" },
  { min: 0,  grade: "F", message: "Needs Improvement 💪" }
];

// ==========================
// Grading Logic (FIXED HERE)
// ==========================
function calculateResults() {
  let correct = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  shuffledQuestions.forEach(q => {
    const questionPoints = Number(q.points) || 1;
    totalPoints += questionPoints;

    // ✅ FIX: Use q.answer (not q.correctAnswer)
    if (userAnswers[q.id] === q.answer) {
      correct++;
      earnedPoints += questionPoints;
    }
  });

  const wrong = shuffledQuestions.length - correct;

  const percentage = totalPoints > 0
    ? Math.round((earnedPoints / totalPoints) * 100)
    : 0;

  const gradeInfo = gradeScale.find(g => percentage >= g.min);

  return {
    correct,
    wrong,
    percentage,
    grade: gradeInfo.grade,
    performanceMessage: gradeInfo.message
  };
}

const result = calculateResults();

function persistExamResult() {
  const sessionId = studentDetails.sessionId || String(Date.now());
  const entry = {
    sessionId,
    timestamp: Date.now(),
    firstName: studentDetails.firstName,
    lastName: studentDetails.lastName,
    selectedSubject: studentDetails.selectedSubject,
    correct: result.correct,
    wrong: result.wrong,
    total: shuffledQuestions.length,
    percentage: result.percentage,
    grade: result.grade,
    breakdown: shuffledQuestions.map((q, index) => ({
      no: index + 1,
      text: q.text,
      selected: userAnswers[q.id] || "Not Answered",
      correct: q.answer,
      outcome: userAnswers[q.id] === q.answer ? "Correct" : "Wrong"
    }))
  };
  const store = JSON.parse(localStorage.getItem("examResults")) || [];
  const existingIndex = store.findIndex(r => r.sessionId === entry.sessionId);
  if (existingIndex >= 0) {
    store[existingIndex] = entry;
  } else {
    store.push(entry);
  }
  localStorage.setItem("examResults", JSON.stringify(store));
}

persistExamResult();

// ==========================
// Render Summary
// ==========================
function renderSummary() {
  summaryGrid.innerHTML = `
    <div class="col-md-6">
      <div class="d-flex align-items-center gap-3">
        <div class="bg-white rounded p-2 shadow-sm"><i class="bi bi-person text-primary"></i></div>
        <div>
          <p class="text-muted small mb-0">Student Name</p>
          <p class="fw-bold mb-0">${studentDetails.firstName} ${studentDetails.lastName}</p>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="d-flex align-items-center gap-3">
        <div class="bg-white rounded p-2 shadow-sm"><i class="bi bi-book text-primary"></i></div>
        <div>
          <p class="text-muted small mb-0">Subject</p>
          <p class="fw-bold mb-0">${studentDetails.selectedSubject}</p>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="d-flex align-items-center gap-3">
        <div class="bg-white rounded p-2 shadow-sm"><i class="bi bi-question-circle text-primary"></i></div>
        <div>
          <p class="text-muted small mb-0">Total Questions</p>
          <p class="fw-bold mb-0">${shuffledQuestions.length}</p>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="d-flex align-items-center gap-3">
        <div class="bg-white rounded p-2 shadow-sm"><i class="bi bi-check-circle text-success"></i></div>
        <div>
          <p class="text-muted small mb-0">Correct Answers</p>
          <p class="fw-bold mb-0 text-success">${result.correct}</p>
        </div>
      </div>
    </div>
  `;

  performanceCard.textContent = result.performanceMessage;

  if (result.percentage >= 70) {
    performanceCard.className = "p-3 rounded-pill text-center fw-bold mb-5 bg-success-subtle text-success border border-success-subtle";
  } else if (result.percentage < 40) {
    performanceCard.className = "p-3 rounded-pill text-center fw-bold mb-5 bg-danger-subtle text-danger border border-danger-subtle";
  } else {
    performanceCard.className = "p-3 rounded-pill text-center fw-bold mb-5 bg-warning-subtle text-warning border border-warning-subtle";
  }

  animatePercentage(result.percentage);
  localStorage.removeItem("userAnswers");
  localStorage.removeItem("shuffledQuestions");
}

// ==========================
// Circular Progress Animation
// ==========================
function animatePercentage(target) {
  const circumference = 283; // 2 * PI * 45
  let current = 0;

  const interval = setInterval(() => {
    if (current >= target) {
      clearInterval(interval);
      return;
    }

    current++;
    percentageDisplay.textContent = current + "%";
    const offset = circumference - (current / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

  }, 15);
}

// ==========================
// Excel Export
// ==========================
excelBtn.addEventListener("click", () => {

  const breakdown = shuffledQuestions.map((q, index) => ({
    "Question No": index + 1,
    "Question": q.text,
    "Selected Answer": userAnswers[q.id] || "Not Answered",
    "Correct Answer": q.answer,
    "Result":
      userAnswers[q.id] === q.answer ? "Correct" : "Wrong"
  }));

  breakdown.push({});
  breakdown.push({
    "Question": "SUMMARY",
    "Selected Answer": `Score: ${result.correct}/${shuffledQuestions.length}`,
    "Correct Answer": `Percentage: ${result.percentage}%`,
    "Result": `Grade: ${result.grade}`
  });

  const worksheet = XLSX.utils.json_to_sheet(breakdown);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Result");

  const fileName = `${studentDetails.firstName}_${studentDetails.lastName}_${studentDetails.selectedSubject}_Result.xlsx`;

  XLSX.writeFile(workbook, fileName);
});

// ==========================
// PDF Export
// ==========================
pdfBtn.addEventListener("click", () => {

  const element = document.getElementById("result-page");

  const opt = {
    margin: 0.5,
    filename: `${studentDetails.firstName}_${studentDetails.lastName}_Result.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
});

// ==========================
// Confetti
// ==========================
function launchConfetti() {
  const confetti = document.createElement("div");
  confetti.textContent = "🎉🎊🎉";
  confetti.className = "position-fixed start-50 translate-middle-x mt-3 display-4";
  document.body.appendChild(confetti);

  setTimeout(() => confetti.remove(), 3000);
}

// ==========================
renderSummary();
