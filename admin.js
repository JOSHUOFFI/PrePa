const CREDENTIALS = { id: "teacher1", password: "pass1234" };
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const logoutBtn = document.getElementById("logout-btn");
const resultRows = document.getElementById("result-rows");
const resultCount = document.getElementById("result-count");
document.getElementById("admin-login").addEventListener("submit", e => {
  e.preventDefault();
  const adminId = document.getElementById("admin-id").value.trim();
  const adminPassword = document.getElementById("admin-password").value.trim();
  if (adminId === CREDENTIALS.id && adminPassword === CREDENTIALS.password) {
    localStorage.setItem("adminAuth", "1");
    loginSection.classList.add("d-none");
    dashboardSection.classList.remove("d-none");
    renderResults();
  } else {
    alert("Invalid credentials");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminAuth");
  loginSection.classList.remove("d-none");
  dashboardSection.classList.add("d-none");
});
window.addEventListener("load", () => {
  if (localStorage.getItem("adminAuth") === "1") {
    loginSection.classList.add("d-none");
    dashboardSection.classList.remove("d-none");
    renderResults();
  }
});
function renderResults() {
  const store = JSON.parse(localStorage.getItem("examResults")) || [];
  resultCount.textContent = store.length + " record(s)";
  resultRows.innerHTML = "";
  store
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach(entry => {
      const tr = document.createElement("tr");
      const name = `${entry.firstName} ${entry.lastName}`;
      const date = new Date(entry.timestamp).toLocaleString();
      tr.innerHTML = `
        <td class="px-2 py-3 fw-medium">${name}</td>
        <td class="px-2 py-3">${entry.studentClass}</td>
        <td class="px-2 py-3 text-primary fw-bold">${entry.correct}/${entry.total} (${entry.percentage}%)</td>
        <td class="px-2 py-3"><span class="badge ${getGradeColor(entry.grade)}">${entry.grade}</span></td>
        <td class="px-2 py-3 text-muted small">${date}</td>
        <td class="px-2 py-3 text-end">
          <button class="btn btn-outline-primary btn-sm hover-lift" data-action="view" data-id="${entry.sessionId}">
            <i class="bi bi-eye"></i> View
          </button>
          <div class="btn-group">
            <button class="btn btn-light btn-sm dropdown-toggle hover-lift" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-download"></i> Export
            </button>
            <ul class="dropdown-menu shadow border-0">
              <li><button class="dropdown-item d-flex align-items-center gap-2" data-action="print" data-id="${entry.sessionId}"><i class="bi bi-printer text-primary"></i> Print</button></li>
              <li><button class="dropdown-item d-flex align-items-center gap-2 text-danger" data-action="pdf" data-id="${entry.sessionId}"><i class="bi bi-file-earmark-pdf"></i> PDF</button></li>
              <li><button class="dropdown-item d-flex align-items-center gap-2 text-success" data-action="excel" data-id="${entry.sessionId}"><i class="bi bi-file-earmark-excel"></i> Excel</button></li>
            </ul>
          </div>
          <button class="btn btn-outline-danger btn-sm hover-lift" data-action="delete" data-id="${entry.sessionId}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      resultRows.appendChild(tr);
    });

  resultRows.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      const store = JSON.parse(localStorage.getItem("examResults")) || [];
      const entry = store.find(r => r.sessionId === id);
      if (!entry && action !== "delete") return;

      if (action === "view") viewResult(entry);
      if (action === "excel") exportExcel(entry);
      if (action === "pdf") exportPdf(entry);
      if (action === "print") printEntry(entry);
      if (action === "delete") deleteResult(id);
    });
  });
}

function getGradeColor(grade) {
  if (grade === "A") return "bg-success";
  if (grade === "B") return "bg-primary";
  if (grade === "C") return "bg-info text-dark";
  if (grade === "D") return "bg-warning text-dark";
  return "bg-danger";
}

function viewResult(entry) {
  const modalContent = document.getElementById("modal-content");
  const modalPrintBtn = document.getElementById("modal-print-btn");
  
  modalContent.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-6">
        <p class="mb-0 text-muted small">Name</p>
        <p class="fw-bold mb-0">${entry.firstName} ${entry.lastName}</p>
      </div>
      <div class="col-6 text-end">
        <p class="mb-0 text-muted small">Date</p>
        <p class="fw-bold mb-0">${new Date(entry.timestamp).toLocaleString()}</p>
      </div>
      <div class="col-4 text-center border rounded py-2">
        <p class="mb-0 text-muted small"><i class="bi bi-card-checklist"></i> Score</p>
        <p class="fw-bold mb-0 h5">${entry.correct}/${entry.total}</p>
      </div>
      <div class="col-4 text-center border rounded py-2">
        <p class="mb-0 text-muted small"><i class="bi bi-percent"></i> Percentage</p>
        <p class="fw-bold mb-0 h5">${entry.percentage}%</p>
      </div>
      <div class="col-4 text-center border rounded py-2 bg-light">
        <p class="mb-0 text-muted small"><i class="bi bi-award"></i> Grade</p>
        <p class="fw-bold mb-0 h5 text-primary">${entry.grade}</p>
      </div>
    </div>
    <div class="mt-3">
      <h6 class="fw-bold mb-3 border-bottom pb-2">Question Breakdown</h6>
      <div class="list-group list-group-flush">
        ${entry.breakdown.map(b => `
          <div class="list-group-item px-0 border-0 mb-3">
            <div class="d-flex justify-content-between">
              <span class="fw-bold small">Q${b.no}: ${b.text}</span>
              <span class="badge ${b.outcome === "Correct" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}">
                ${b.outcome}
              </span>
            </div>
            <div class="small mt-1 text-muted">
              <div>Selected: <span class="${b.outcome === "Correct" ? "text-success" : "text-danger"} fw-medium">${b.selected}</span></div>
              ${b.outcome !== "Correct" ? `<div>Correct: <span class="text-success fw-medium">${b.correct}</span></div>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  modalPrintBtn.onclick = () => printEntry(entry);
  
  const myModal = new bootstrap.Modal(document.getElementById('viewModal'));
  myModal.show();
}

function deleteResult(id) {
  if (confirm("Are you sure you want to delete this result? This action cannot be undone.")) {
    let store = JSON.parse(localStorage.getItem("examResults")) || [];
    store = store.filter(r => r.sessionId !== id);
    localStorage.setItem("examResults", JSON.stringify(store));
    renderResults();
  }
}
function exportExcel(entry) {
  const breakdown = entry.breakdown.map(b => ({
    "Question No": b.no,
    "Question": b.text,
    "Selected Answer": b.selected,
    "Correct Answer": b.correct,
    "Result": b.outcome
  }));
  breakdown.push({});
  breakdown.push({
    "Question": "SUMMARY",
    "Selected Answer": `Score: ${entry.correct}/${entry.total}`,
    "Correct Answer": `Percentage: ${entry.percentage}%`,
    "Result": `Grade: ${entry.grade}`
  });
  const worksheet = XLSX.utils.json_to_sheet(breakdown);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Result");
  const fileName = `${entry.firstName}_${entry.lastName}_${entry.studentClass}_Result.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
function exportPdf(entry) {
  const container = document.getElementById("print-container");
  const div = document.createElement("div");
  div.className = "p-6";
  div.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Exam Result</h2>
    <div class="mb-2">Name: ${entry.firstName} ${entry.lastName}</div>
    <div class="mb-2">Class: ${entry.studentClass}</div>
    <div class="mb-2">Score: ${entry.correct}/${entry.total} (${entry.percentage}%)</div>
    <div class="mb-4">Grade: ${entry.grade}</div>
    <div class="grid gap-2">
      ${entry.breakdown.map(b => `
        <div class="border rounded p-3">
          <div><strong>Q${b.no}:</strong> ${b.text}</div>
          <div>Selected: ${b.selected}</div>
          <div>Correct: ${b.correct}</div>
          <div>Result: ${b.outcome}</div>
        </div>
      `).join("")}
    </div>
  `;
  container.appendChild(div);
  const opt = {
    margin: 0.5,
    filename: `${entry.firstName}_${entry.lastName}_Result.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  html2pdf().set(opt).from(div).save().then(() => {
    container.removeChild(div);
  });
}
function printEntry(entry) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>Print Result</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
          .item { margin-bottom: 8px; }
          .q { margin: 8px 0; padding: 8px; border: 1px solid #eee; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Exam Result</h2>
          <div class="item">Name: ${entry.firstName} ${entry.lastName}</div>
          <div class="item">Class: ${entry.studentClass}</div>
          <div class="item">Score: ${entry.correct}/${entry.total} (${entry.percentage}%)</div>
          <div class="item">Grade: ${entry.grade}</div>
          ${entry.breakdown.map(b => `
            <div class="q">
              <div><strong>Q${b.no}:</strong> ${b.text}</div>
              <div>Selected: ${b.selected}</div>
              <div>Correct: ${b.correct}</div>
              <div>Result: ${b.outcome}</div>
            </div>
          `).join("")}
        </div>
        <script>
          window.onload = function(){ window.print(); };
        <\/script>
      </body>
    </html>
  `);
  w.document.close();
}

// ==========================
// Question Upload & Conversion
// ==========================
const uploadForm = document.getElementById("upload-form");
const downloadBtn = document.getElementById("download-questions-btn");
const resetBtn = document.getElementById("reset-questions-btn");

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const targetClass = document.getElementById("upload-class").value;
    const fileInput = document.getElementById("docx-file");
    const file = fileInput.files[0];

    if (!file || !targetClass) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      const parsedQuestions = parseDocxQuestions(text, targetClass);
      
      if (parsedQuestions.length === 0) {
        alert("No questions found. Please check the document format.");
        return;
      }

      saveQuestionsToStorage(targetClass, parsedQuestions);
      alert(`Successfully uploaded ${parsedQuestions.length} questions for ${targetClass}!`);
      fileInput.value = "";
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      alert("Error parsing document. Make sure it's a valid .docx file.");
    }
  });
}

function parseDocxQuestions(text, studentClass) {
  // Split by "Q:" or "Q1:" or "1." or "Question 1:"
  // We'll look for patterns like "Q1:", "Q:", "1.", "Question 1:" at the start of a line
  const questionBlocks = text.split(/\n(?=(?:Q\d*[:.]|Question\s*\d*[:.]|\d+[:.]))/i).filter(block => block.trim() !== "");
  const classPrefix = studentClass.replace(/\s+/g, "").substring(0, 3).toUpperCase();
  
  return questionBlocks.map((block, index) => {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l !== "");
    if (lines.length === 0) return null;

    // First line is the question text, remove the prefix (e.g., "Q1:")
    const questionText = lines[0].replace(/^(?:Q\d*[:.]|Question\s*\d*[:.]|\d+[:.])\s*/i, "").trim();
    
    const options = [];
    let answer = "";
    let points = 1;

    lines.forEach(line => {
      // Matches: A) Option, A. Option, A: Option
      const optionMatch = line.match(/^([A-D])[).:]\s*(.*)/i);
      if (optionMatch) {
        options.push(optionMatch[2].trim());
      }
      
      // Matches: Ans: Option, Answer: Option, Correct: Option
      const answerMatch = line.match(/^(?:Ans|Answer|Correct)[:.]\s*(.*)/i);
      if (answerMatch) {
        answer = answerMatch[1].trim();
      }

      const pointsMatch = line.match(/^Points[:.]\s*(\d+)/i);
      if (pointsMatch) {
        points = parseInt(pointsMatch[1]);
      }
    });

    // If answer is "A", "B", etc., map it to the option text
    if (answer.length === 1 && /^[A-D]$/i.test(answer)) {
      const idx = answer.toUpperCase().charCodeAt(0) - 65;
      if (options[idx]) answer = options[idx];
    }

    return {
      id: `${classPrefix}-${Date.now()}-${index}`,
      text: questionText,
      options: options.length > 0 ? options : ["Option 1", "Option 2", "Option 3", "Option 4"],
      answer: answer || (options.length > 0 ? options[0] : "Option 1"),
      points: points
    };
  }).filter(q => q !== null);
}

function saveQuestionsToStorage(studentClass, questions) {
  const customStore = JSON.parse(localStorage.getItem("customQuestions")) || {};
  customStore[studentClass] = questions;
  localStorage.setItem("customQuestions", JSON.stringify(customStore));
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (confirm("This will delete all uploaded questions and revert to default. Proceed?")) {
      localStorage.removeItem("customQuestions");
      alert("Questions reset to defaults.");
    }
  });
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const customStore = JSON.parse(localStorage.getItem("customQuestions")) || {};
    
    // Attempt to merge with existing defaults if they are available in the current window scope
    // This makes the downloaded file a complete replacement.
    const finalQuestions = { ...QUESTIONS_BY_CLASS, ...customStore };
    const finalDurations = typeof EXAM_DURATION_BY_CLASS !== "undefined" ? EXAM_DURATION_BY_CLASS : {};
    const finalTitles = typeof EXAM_TITLES_BY_CLASS !== "undefined" ? EXAM_TITLES_BY_CLASS : {};

    let fileContent = `/* Updated questions.js */\n\n`;
    fileContent += `const examDuration = 30;\n\n`;
    fileContent += `const QUESTIONS_BY_CLASS = ${JSON.stringify(finalQuestions, null, 2)};\n\n`;
    fileContent += `const EXAM_DURATION_BY_CLASS = ${JSON.stringify(finalDurations, null, 2)};\n\n`;
    fileContent += `const EXAM_TITLES_BY_CLASS = ${JSON.stringify(finalTitles, null, 2)};\n`;

    const blob = new Blob([fileContent], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("Downloaded updated questions.js. Replace the existing file in your project folder with this one to make changes permanent.");
  });
}
