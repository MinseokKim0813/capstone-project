// --- THEME AND GLOBAL SETUP ---
document.body.style.backgroundColor = "#e0e0e0";
document.body.style.color = "black";

// Generates a unique user ID for the session and randomly selects a quiz
const userId = "user-" + Math.random().toString(36).substring(2, 9);
const quizIndex = Math.floor(Math.random() * 3); // Randomly picks 0, 1, or 2

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
  "^": "^", // Superscript
  _: "_", // Subscript
  exist: "\\exists",
};

// --- DATA STRUCTURE: QUIZ-BASED ---
const quizSet = [
  {
    title: "Math Quiz (Version 1)",
    questions: [
      {
        question:
          "\\text{Is it true that $\\overline{\\overline{x+y}+z} = \\overline{x + \\overline{y+z}}$? Justify clearly.}",
        symbols: ["\\cdot", "\\neq"],
      },
      {
        question:
          "\\text{Prove or disprove: $\\overline{A - B} = \\overline{A} \\cup \\overline{B}$}",
        symbols: ["\\in", "\\mid", "\\land", "\\neg", "\\lor", "\\cup", "\\ne"],
      },
    ],
  },
  {
    title: "Math Quiz (Version 2)",
    questions: [
      {
        question:
          "\\text{Is it true that $\\overline{\\overline{x \\cdot y} + \\overline{x + z}} = x \\cdot (y + z)$? Justify clearly.}",
        symbols: ["\\cdot", "\\neq"],
      },
      {
        question:
          "\\text{Prove that $A \\cap (B - C) = (A \\cap B) - (A \\cap C)$}}",
        symbols: [
          "\\cap",
          "\\in",
          "\\iff",
          "\\land",
          "\\neg",
          "\\lor",
          "\\Rightarrow",
        ],
      },
    ],
  },
  {
    title: "Math Quiz (Version 3)",
    questions: [
      {
        question:
          "\\text{Use a truth table to show that $\\neg p \\lor (p \\land \\neg q) \\to q \\equiv (p \\land q) \\lor q$.}",
        symbols: ["\\neg", "\\lor", "\\land", "\\to"],
      },
      {
        question:
          "\\text{Prove the following old rule: An integer is divisible by 3 if and only if the sum of its digits is divisible by 3.}",
        symbols: ["\\cdot", "\\leq", "\\equiv"],
      },
    ],
  },
];

// --- STATE MANAGEMENT ---
const mainAppContainer = document.getElementById("questions");
const answers = quizSet[quizIndex].questions.map(() => "");

// --- FUNCTIONS ---
function renderInstructions() {
  mainAppContainer.innerHTML = `
    <div id="instructions-container" class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h1 class="text-3xl font-bold mb-4 text-gray-800">Instructions</h1>
      <p class="mb-4 text-gray-600">This is an interface for mathematical writing. Please follow these instructions:</p>
      <ul class="list-decimal list-inside mb-6 space-y-3 text-gray-700">
        <li>Type your solution in the text box. You can mix regular text and mathematical formulas.</li>
        <li>To write math, click the <strong>Text/Math toggle switch</strong>. When it's blue, you are in Math mode.
            <br><em class="text-gray-500 text-sm">Example: Type "The answer is", switch to Math mode, type "x^2", switch back to Text mode, and continue writing.</em>
        </li>
        <li>To create a new line in your answer, simply press the <strong>Enter</strong> key.</li>
        <li>Use the symbol and layout buttons to insert complex structures like tables or operators.</li>
      </ul>
      <hr class="my-6">
      <h2 class="text-2xl font-semibold mb-4">Trial Question</h2>
      <p class="mb-4 text-gray-500">Use the tools below to practice. Your answer here will not be graded.</p>
      <div id="trial-question-block"></div>
      <button id="start-quiz-btn" class="w-full mt-8 px-4 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-700 transition-colors">Begin Quiz</button>
    </div>
    
    <div id="quiz-wrapper" class="hidden">
        <div id="quiz-content-container"></div>
    </div>
  `;

  const trialBlock = mainAppContainer.querySelector("#trial-question-block");
  const trialSymbols = ["overline", "∨", "→"];
  const trialTargetId = "input-trial";

  const renderTrialButtons = (symbols) =>
    symbols
      .map((symbol) => {
        const latex = latexMap[symbol] || symbol;
        let buttonText = latex;
        if (symbol === "overline") buttonText = "\\overline{\\square}";
        return `<math-field read-only data-target="${trialTargetId}" data-symbol="${latex}" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded insert-btn inline-block text-xl cursor-pointer select-none">${buttonText}</math-field>`;
      })
      .join("");

  trialBlock.innerHTML = `
    <div class="mb-4 text-xl">
        <math-field read-only class="pointer-events-none">
            \\text{In digital logic, 'not p' can be written with an overline, like } \\overline{p}. \\text{ Given that } p \\rightarrow q \\text{ is equivalent to 'not p or q', write it using the overline notation.}
        </math-field>
    </div>
    <div class="mb-2 no-print">
        <h3 class="text-sm font-medium text-gray-600 mb-1">Practice Symbols</h3>
        <div class="flex flex-wrap gap-2">${renderTrialButtons(
          trialSymbols
        )}</div>
    </div>
    <div class="flex items-center justify-end gap-2 my-2 no-print">
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

  const trialMf = document.getElementById(trialTargetId);
  trialMf.keybindings = [
    { key: "[Enter]", command: "addRowAfter" },
    { key: "[Return]", command: "addRowAfter" },
    ...trialMf.keybindings,
  ];

  attachEventListenersForBlock(trialTargetId);

  document.getElementById("start-quiz-btn").addEventListener("click", () => {
    document.getElementById("instructions-container").style.display = "none";
    document.getElementById("quiz-wrapper").classList.remove("hidden");
    renderQuizPage(quizIndex);
  });
}

function attachEventListenersForBlock(blockId, saveCallback) {
  const mf = document.getElementById(blockId);
  if (!mf) return;

  mf.addEventListener("contextmenu", (e) => e.preventDefault());

  if (saveCallback) {
    mf.addEventListener("input", () => saveCallback(mf.value));
  }

  const toggle = document.querySelector(
    `input[data-toggle-target="${blockId}"]`
  );
  toggle?.addEventListener("change", () => {
    mf.executeCommand(["switchMode", toggle.checked ? "math" : "text"]);
    mf.focus();
  });

  document
    .querySelectorAll(`.insert-btn[data-target="${blockId}"]`)
    .forEach((btn) => {
      btn.addEventListener("pointerdown", (event) => {
        if (!event.isTrusted) return;
        event.preventDefault();
        event.stopPropagation();

        const symbol = btn.dataset.symbol;
        const type = btn.dataset.type;

        mf.executeCommand(["switchMode", "math"]);
        if (toggle && !toggle.checked) toggle.checked = true;

        if (type === "table") {
          mf.insert("\\begin{array}{cc} #0 & #? \\\\ #? & #? \\end{array}");
        } else if (symbol.includes("overline")) {
          mf.insert("\\overline{#0}");
        } else if (symbol === "^") {
          mf.insert("^{#0}");
        } else if (symbol === "_") {
          mf.insert("_{#0}");
        } else if (symbol === "\\sum") {
          mf.insert("\\sum_{#?}^{#?}");
        } else if (symbol === "\\prod") {
          mf.insert("\\prod_{#?}^{#?}");
        } else {
          mf.executeCommand("insert", symbol);
        }
        mf.focus();
      });
    });
}

function renderQuizPage(quizIdx) {
  const quiz = quizSet[quizIdx];
  const container = document.getElementById("quiz-content-container");
  container.innerHTML = "";

  const quizTitle = document.createElement("h1");
  quizTitle.className = "text-3xl font-bold mb-6 text-gray-800";
  quizTitle.textContent = quiz.title;
  container.appendChild(quizTitle);

  const fixedOperatorList = ["overline", "^", "_", "\\sum", "\\prod"];

  quiz.questions.forEach((item, questionIdx) => {
    const blockId = `input-${quizIdx}-${questionIdx}`;
    const block = document.createElement("div");
    block.className = "bg-white p-4 mb-6 question-block";

    // 1. The "Formatting & Operators" buttons are always the fixed list, plus the "table" button.
    const operatorSymbols = [...fixedOperatorList, "table"];

    // 2. The "Symbols" buttons are specific to the question. We take the question's
    //    symbol list and filter out any symbols that are already in our fixed operator list.
    const logicSymbols = (item.symbols || []).filter(
      (s) => !fixedOperatorList.includes(s)
    );

    const renderButtons = (symbols) =>
      symbols
        .map((symbol) => {
          if (symbol === "table") {
            return `<button data-target="${blockId}" data-type="table" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded insert-btn text-sm">Insert Table</button>`;
          }

          const latex = latexMap[symbol] || symbol;
          let buttonText = latex;
          if (symbol === "overline") buttonText = "\\overline{\\square}";
          else if (symbol === "^") buttonText = "x^\\square";
          else if (symbol === "_") buttonText = "x_\\square";
          else if (symbol === "\\sum")
            buttonText = "\\textstyle{\\sum_{\\square}^{\\square}}";
          else if (symbol === "\\prod")
            buttonText = "\\textstyle{\\prod_{\\square}^{\\square}}";
          return `<math-field read-only data-target="${blockId}" data-symbol="${latex}" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded insert-btn inline-block text-xl cursor-pointer select-none">${buttonText}</math-field>`;
        })
        .join("");

    const operatorRow =
      operatorSymbols.length > 0
        ? `
        <div class="mb-3 no-print">
            <h3 class="text-sm font-medium text-gray-600 mb-1">Formatting & Operators</h3>
            <div class="flex flex-wrap items-center gap-2">${renderButtons(
              operatorSymbols
            )}</div>
        </div>`
        : "";

    const logicRow =
      logicSymbols.length > 0
        ? `
        <div class="mb-2 no-print">
            <h3 class="text-sm font-medium text-gray-600 mb-1">Symbols</h3>
            <div class="flex flex-wrap gap-2">${renderButtons(
              logicSymbols
            )}</div>
        </div>`
        : "";

    block.innerHTML = `
        <h2 class="text-lg font-semibold mb-2">Question ${questionIdx + 1}</h2>
        <div class="mb-4 text-xl"><math-field read-only class="pointer-events-none">${
          item.question
        }</math-field></div>
        ${operatorRow}
        ${logicRow}

        <div class="flex items-center justify-end gap-2 mb-2 no-print">
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
    inputField.value = answers[questionIdx] || "";
    inputField.keybindings = [
      { key: "[Enter]", command: "addRowAfter" },
      { key: "[Return]", command: "addRowAfter" },
      ...inputField.keybindings,
    ];

    attachEventListenersForBlock(blockId, (value) => {
      answers[questionIdx] = value;
    });
  });

  const submitContainer = document.createElement("div");
  submitContainer.className = "flex justify-center mt-8 no-print";
  submitContainer.innerHTML = `<button id="submit-btn" class="px-6 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">Submit & Save as PDF</button>`;
  container.appendChild(submitContainer);

  document.getElementById("submit-btn").addEventListener("click", () => {
    window.print();
  });
}

// --- INITIALIZATION ---
renderInstructions();
