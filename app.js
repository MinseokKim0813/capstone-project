// TODO:
// 1. Disable page and separate each quiz with different version for different user
// 2. Table formatting button (without border)
// 4. Add superscript, subscript, Sigma, Pi
// 5. Fix toggle switch (just enable/disable button -- mkae hover message as description (switching b/w math and text mode, text default))
// 6. Hide copy/paste options in the menu
// 7. Submit button: javascript print function, and instead of printing, save as pdf and save into a google drive folder
// then remove the saved file

// 7. Write to let them know new line is mathmode + command enter for the first line
// - Give example to let them toggle between text and math mode
// - Check if I can make it 2 lines default so simple enter works
// Remove all the options except inserts, color, background
// 10. Milestone table

const { jsPDF } = window.jspdf;
const doc = new jsPDF();

// --- THEME AND GLOBAL SETUP ---
document.body.style.backgroundColor = "white";
document.body.style.color = "black";

const latexMap = {
  "→": "\\rightarrow",
  "∨": "\\vee",
  "¬": "\\neg",
  "∅": "\\emptyset",
  "×": "\\times",
  "≠": "\\neq",
  "⊆": "\\subseteq",
  "≡": "\\equiv",
  "∀": "\\forall",
  "∈": "\\in",
  "∉": "\\notin",
  "∪": "\\cup",
};

// --- DATA STRUCTURE: QUIZ-BASED ---
const quizSet = [
  {
    title: "Math Quiz 1",
    questions: [
      {
        question:
          "\\text{Is it true that $\\overline{\\overline{x+y}+z} = \\overline{x + \\overline{y+z}}$? Justify clearly.}",
        symbols: [
          "overline",
          "\\cdot",
          "\\neg",
          "\\neq",
          "\\rightarrow",
          "\\lor",
          "\\land",
        ],
      },
      {
        question:
          "\\text{Prove or disprove: $\\overline{A - B} = \\overline{A} \\cup \\overline{B}$}",
        symbols: [
          "overline",
          "\\cdot",
          "\\neg",
          "\\neq",
          "\\rightarrow",
          "\\lor",
          "\\land",
          "\\cup",
          "\\cap",
        ],
      },
    ],
  },
  {
    title: "Math Quiz 2",
    questions: [
      {
        question:
          "\\text{Is it true that $\\overline{\\overline{x \\cdot y} + \\overline{x + z}} = x \\cdot (y + z)$? Justify clearly.}",
        symbols: [
          "overline",
          "\\cdot",
          "\\neg",
          "\\neq",
          "\\rightarrow",
          "\\lor",
          "\\land",
        ],
      },
      {
        question:
          "\\text{Prove that $A \\cap (B - C) = (A \\cap B) - (A \\cap C)$}}",
        symbols: [],
      },
    ],
  },
  {
    title: "Math Quiz 3",
    questions: [
      {
        question:
          "\\text{Use a truth table to show that $\\neg p \\lor (p \\land \\neg q) \\to q \\equiv (p \\land q) \\lor q$.}",
        symbols: ["\\neg", "\\lor", "\\land", "\\rightarrow"],
      },
      {
        question:
          "\\text{Prove the following old rule: An integer is divisible by 3 if and only if the sum of its digits is divisible by 3.}",
        symbols: [],
      },
    ],
  },
];

// --- STATE MANAGEMENT ---
let currentQuizIndex = 0;
const totalQuizzes = quizSet.length;
const mainAppContainer = document.getElementById("questions");
const answers = quizSet.map((quiz) => quiz.questions.map(() => ""));

// --- FUNCTIONS ---
function renderInstructions() {
  mainAppContainer.innerHTML = `
    <div id="instructions-container" class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h1 class="text-3xl font-bold mb-4 text-gray-800">Instructions</h1>
      <p class="mb-4 text-gray-600">This is an interface for mathematical writing. Please follow these steps to write your solutions:</p>
      <ul class="list-decimal list-inside mb-6 space-y-2 text-gray-700">
        <li>Type your answer in the text box. You can mix regular text and math.</li>
        <li>Click the symbol buttons (e.g., '→', '¬') to insert them into your answer.</li>
        <li>Use the <strong>Text/Math toggle switch</strong> to change the input mode manually at any time.</li>
      </ul>
      <hr class="my-6">
      <h2 class="text-2xl font-semibold mb-4">Trial Question</h2>
      <p class="mb-4 text-gray-500">Use the tools below to practice. Your answer here will not be graded.</p>
      <div id="trial-question-block">
        </div>
      <button id="start-quiz-btn" class="w-full mt-8 px-4 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-700 transition-colors">Begin Quiz 1</button>
    </div>
    
    <div id="quiz-wrapper" class="hidden">
        <div id="quiz-content-container"></div>
        <div id="pagination-container"></div>
    </div>
  `;

  const trialBlock = mainAppContainer.querySelector("#trial-question-block");
  // Updated symbols to use overline for negation
  const trialSymbols = ["overline", "∨", "→"];
  const trialTargetId = "input-trial";

  const renderTrialButtons = (symbols) =>
    symbols
      .map((symbol) => {
        const latex = latexMap[symbol] || symbol;
        const buttonText = symbol === "overline" ? "Overline" : latex;
        return `<math-field read-only data-target="${trialTargetId}" data-symbol="${latex}" class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded insert-btn inline-block text-base cursor-pointer select-none">${buttonText}</math-field>`;
      })
      .join("");

  trialBlock.innerHTML = `
    <div class="mb-4 text-xl">
        <math-field read-only class="pointer-events-none">
            \\text{In digital logic, 'not p' can be written with an overline, like } \\overline{p}. \\text{ Given that } p \\rightarrow q \\text{ is equivalent to 'not p or q', write it using the overline notation.}
        </math-field>
    </div>
    <div class="mb-2">
        <h3 class="text-sm font-medium text-gray-600 mb-1">Practice Symbols</h3>
        <div class="flex flex-wrap gap-2">${renderTrialButtons(
          trialSymbols
        )}</div>
    </div>
    <div class="flex items-center justify-end gap-2 my-2">
      <span class="text-sm font-medium text-gray-800">Text</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" data-toggle-target="${trialTargetId}" class="sr-only peer">
        <div class="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
        <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 pointer-events-none"></div>
      </label>
      <span class="text-sm font-medium text-gray-800">Math</span>
    </div>
    <math-field 
        id="${trialTargetId}" 
        class="w-full p-2 text-lg bg-white border border-gray-300 rounded" 
        default-mode="text" 
        virtual-keyboard-mode="manual"
        placeholder="\\text{Try writing $\\overline{p}\\lor q$ here...}">
    </math-field>
  `;

  attachEventListenersForBlock(trialTargetId);

  document.getElementById("start-quiz-btn").addEventListener("click", () => {
    document.getElementById("instructions-container").classList.add("hidden");
    document.getElementById("quiz-wrapper").classList.remove("hidden");
    setupPagination();
    renderQuizPage(currentQuizIndex);
  });
}

function attachEventListenersForBlock(blockId, saveCallback) {
  const mf = document.getElementById(blockId);
  if (!mf) return;

  if (saveCallback) {
    mf.addEventListener("input", () => saveCallback(mf.value));
  }

  const toggle = document.querySelector(
    `input[data-toggle-target="${blockId}"]`
  );
  toggle?.addEventListener("change", () => {
    const mode = toggle.checked ? "math" : "text";
    mf.executeCommand(["switchMode", mode]);
    mf.focus();
  });

  document
    .querySelectorAll(`.insert-btn[data-target="${blockId}"]`)
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        if (!event.isTrusted) return;
        event.stopPropagation();

        const symbol = btn.dataset.symbol;
        mf.executeCommand(["switchMode", "math"]);
        if (toggle && !toggle.checked) {
          toggle.checked = true;
        }

        if (symbol.includes("overline")) mf.insert("\\overline{#?}");
        else mf.executeCommand("insert", symbol);

        mf.focus();
      });
    });
}

function renderQuizPage(quizIndex) {
  const quiz = quizSet[quizIndex];
  const container = document.getElementById("quiz-content-container");
  if (!quiz || !container) return;

  container.innerHTML = "";

  const quizTitle = document.createElement("h1");
  quizTitle.className = "text-3xl font-bold mb-6 text-gray-800";
  quizTitle.textContent = quiz.title;
  container.appendChild(quizTitle);

  if (quiz.questions.length === 0) {
    container.innerHTML +=
      '<p class="text-gray-500">There are no questions in this quiz yet.</p>';
    updateNavButtons();
    return;
  }

  quiz.questions.forEach((item, questionIdx) => {
    const blockId = `input-${quizIndex}-${questionIdx}`;
    const block = document.createElement("div");
    block.className = "bg-white p-4 rounded shadow border border-gray-200 mb-6";

    const renderButtons = (symbols) =>
      symbols
        .map((symbol) => {
          const latex = latexMap[symbol] || symbol;
          const buttonText = symbol === "overline" ? "Overline" : latex;
          return `<math-field read-only data-target="${blockId}" data-symbol="${latex}" class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded insert-btn inline-block text-base cursor-pointer select-none">${buttonText}</math-field>`;
        })
        .join("");

    block.innerHTML = `
        <h2 class="text-lg font-semibold mb-2">Question ${questionIdx + 1}</h2>
        <div class="mb-4 text-xl"><math-field read-only class="pointer-events-none">${
          item.question
        }</math-field></div>
        <div class="mb-2"><h3 class="text-sm font-medium text-gray-600 mb-1">Symbols</h3><div class="flex flex-wrap gap-2">${renderButtons(
          item.symbols
        )}</div></div>
        <div class="flex items-center justify-end gap-2 mb-2">
          <span class="text-sm font-medium text-gray-800">Text</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" data-toggle-target="${blockId}" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 pointer-events-none"></div>
          </label>
          <span class="text-sm font-medium text-gray-800">Math</span>
        </div>
        <math-field id="${blockId}" class="w-full p-2 text-lg bg-white border border-gray-300 rounded" default-mode="text" virtual-keyboard-mode="manual"></math-field>
      `;
    container.appendChild(block);

    const inputField = document.getElementById(blockId);
    if (inputField) inputField.value = answers[quizIndex][questionIdx] || "";

    attachEventListenersForBlock(blockId, (value) => {
      answers[quizIndex][questionIdx] = value;
    });
  });

  const submitContainer = document.createElement("div");
  submitContainer.className = "flex justify-center mt-8";
  submitContainer.innerHTML = `<button id="submit-btn" class="px-6 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">Submit Quiz</button>`;
  container.appendChild(submitContainer);

  document.getElementById("submit-btn").addEventListener("click", () => {
    const currentAnswers = answers[quizIndex];
    console.log(`--- Quiz ${quizIndex + 1} Submitted ---`);
    console.log(`Title: ${quiz.title}`);
    currentAnswers.forEach((answer, idx) =>
      console.log(`Question ${idx + 1}:`, answer || "(No answer provided)")
    );
    console.log("-------------------------");
    alert(`Quiz "${quiz.title}" submitted! Check the console for answers.`);
  });

  updateNavButtons();
}

function setupPagination() {
  const navContainer = document.getElementById("pagination-container");
  navContainer.className = "flex items-center justify-center gap-4 my-8";
  const buttonClasses =
    "px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75";
  navContainer.innerHTML = `
        <button id="prev-btn" class="${buttonClasses}">Previous Quiz</button>
        <span id="page-indicator" class="font-semibold text-gray-700 text-lg"></span>
        <button id="next-btn" class="${buttonClasses}">Next Quiz</button>
    `;

  document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentQuizIndex > 0) {
      currentQuizIndex--;
      renderQuizPage(currentQuizIndex);
    }
  });

  document.getElementById("next-btn").addEventListener("click", () => {
    if (currentQuizIndex < totalQuizzes - 1) {
      currentQuizIndex++;
      renderQuizPage(currentQuizIndex);
    }
  });
}

function updateNavButtons() {
  const prevButton = document.getElementById("prev-btn");
  const nextButton = document.getElementById("next-btn");
  const pageIndicator = document.getElementById("page-indicator");
  if (!prevButton || !nextButton || !pageIndicator) return;

  pageIndicator.textContent = `Quiz ${currentQuizIndex + 1} of ${totalQuizzes}`;
  prevButton.disabled = currentQuizIndex === 0;
  nextButton.disabled = currentQuizIndex === totalQuizzes - 1;

  [prevButton, nextButton].forEach((btn) => {
    if (btn.disabled) btn.classList.add("opacity-50", "cursor-not-allowed");
    else btn.classList.remove("opacity-50", "cursor-not-allowed");
  });
}

// --- INITIALIZATION ---
renderInstructions();
