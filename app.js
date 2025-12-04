// --- THEME AND GLOBAL SETUP ---
document.body.style.backgroundColor = "#e0e0e0";
document.body.style.color = "black";

// Generates a unique user ID for the session
const userId = "user-" + Math.random().toString(36).substring(2, 9);

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
  "\\land": "\\land",
  exist: "\\exists",
};

// Define operator keywords globally to be shared by functions
const operatorKeywords = ["overline", "^", "_", "\\sum", "\\prod", "table"];

// --- DATA STRUCTURE: QUIZ-BASED ---
// MODIFIED: quizSet is now declared as an empty array and will be populated from the TXT file.
let quizSet = [];

// --- STATE MANAGEMENT ---
const mainAppContainer = document.getElementById("questions");
let answers = []; // Answers array is initialized after the user chooses a quiz version.

// --- FUNCTIONS ---

/**
 * ADDED: Fetches and parses the quiz data from a local TXT file.
 * @param {string} filePath - The path to the quizzes.txt file.
 * @returns {Promise<Array>} A promise that resolves to the structured quizSet array.
 */
async function loadAndParseQuizzes(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const lines = text.split("\n");

    const parsedQuizzes = [];
    let currentQuiz = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Skip empty lines

      if (trimmedLine.startsWith("QUIZ:")) {
        const title = trimmedLine.substring(6).trim();
        currentQuiz = { title: title, questions: [] };
        parsedQuizzes.push(currentQuiz);
      } else if (currentQuiz) {
        // Use a regex to split only on the first colon, in case the question contains colons
        const parts = trimmedLine.split(/\s:(.*)/s);
        if (parts.length >= 2) {
          const question = parts[0].trim();
          const symbolsString = parts[1].trim();
          const symbols = symbolsString.split(",").map((s) => s.trim());

          currentQuiz.questions.push({ question, symbols });
        }
      }
    }
    return parsedQuizzes;
  } catch (error) {
    console.error("Failed to load or parse quiz file:", error);
    mainAppContainer.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">Could not load quizzes from <code>quizzes.txt</code>. Please ensure the file exists and is accessible.</span>
    </div>`;
    return []; // Return empty array on failure
  }
}

function renderInstructions() {
  // Dynamically generate the dropdown options from the quizSet data.
  const quizOptions = quizSet
    .map((quiz, index) => `<option value="${index}">${quiz.title}</option>`)
    .join("");

  mainAppContainer.innerHTML = `
    <div id="instructions-container" class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h1 class="text-3xl font-bold mb-4 text-gray-800">Instructions</h1>
      <p class="mb-4 text-gray-600">This is an interface for mathematical writing. Please follow these instructions:</p>
      <ul class="list-decimal list-inside mb-6 space-y-3 text-gray-700">
        <li>Type your solution in the text box. You can mix regular text and mathematical formulas.</li>
        <li>To write math, click the <strong>Text/Math toggle switch</strong>. When it's blue, you are in Math mode.</li>
        <li>To create a new line in your answer, simply press the <strong>Enter</strong> key.</li>
        <li>Use the symbol and layout buttons to insert complex structures like tables or operators.</li>
        <li>You can access more options by right-clicking on the input area or clicking on the menu button at the right end to bring up a menu, but you will likely not need these advanced features.</li>
      </ul>
      <hr class="my-6">
      <h2 class="text-2xl font-semibold mb-4">Practice Area</h2>
      <p class="mb-4 text-gray-500">Use the tools below to practice rewriting the following expressions. Your answers here will not be graded.</p>
      <div id="trial-question-block"></div>

      <div class="my-8">
        <label for="quiz-version-select" class="block mb-2 text-lg font-medium text-gray-900">Choose your quiz version:</label>
        <select id="quiz-version-select" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" disabled>
          ${quizOptions}
        </select>
      </div>
      
      <button id="start-quiz-btn" class="w-full px-4 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-700 transition-colors">Begin Quiz</button>
    </div>
    
    <div id="quiz-wrapper" class="hidden">
        <div id="quiz-content-container"></div>
    </div>
  `;

  const trialBlock = mainAppContainer.querySelector("#trial-question-block");
  const trialSymbols = [
    "overline",
    "∨",
    "→",
    "\\sum",
    "^",
    "_",
    "\\land",
    "table",
  ];
  const trialTargetId = "input-trial";

  const operatorSymbols = trialSymbols.filter((s) =>
    operatorKeywords.includes(s)
  );
  const logicSymbols = trialSymbols.filter(
    (s) => !operatorKeywords.includes(s)
  );

  const renderTrialButtons = (symbols) =>
    symbols
      .map((symbol) => {
        if (symbol === "table") {
          return `<button data-target="${trialTargetId}" data-type="table" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded insert-btn text-sm table-icon-button"><div class="table-icon-grid"><div></div><div></div><div></div><div></div></div></button>`;
        }
        const latex = latexMap[symbol] || symbol;
        let buttonText = latex;
        if (symbol === "overline") buttonText = "\\overline{\\square}";
        else if (symbol === "^") buttonText = "x^\\square";
        else if (symbol === "_") buttonText = "x_\\square";
        else if (symbol === "\\sum")
          buttonText = "\\textstyle{\\sum_{\\square}^{\\square}}";
        return `<math-field read-only data-target="${trialTargetId}" data-symbol="${latex}" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded insert-btn inline-block text-xl cursor-pointer select-none">${buttonText}</math-field>`;
      })
      .join("");

  const operatorRow =
    operatorSymbols.length > 0
      ? `
      <div class="mb-3 no-print">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Formatting & Operators</h3>
          <div class="flex flex-wrap items-center gap-2">${renderTrialButtons(
            operatorSymbols
          )}</div>
      </div>`
      : "";

  const logicRow =
    logicSymbols.length > 0
      ? `
      <div class="mb-2 no-print">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Symbols</h3>
          <div class="flex flex-wrap gap-2">${renderTrialButtons(
            logicSymbols
          )}</div>
      </div>`
      : "";

  trialBlock.innerHTML = `
    <div class="space-y-4 text-lg border p-4 rounded-lg bg-gray-50">
        <div class="p-2">
            <math-field read-only class="pointer-events-none bg-gray-50" >
                \\text{1. Rewrite } p \\rightarrow q \\text{ (which is equivalent to 'not p or q') using the overline for 'not', like } \\overline{p}.
            </math-field>
        </div>
         <div class="p-2">
            <math-field read-only class="pointer-events-none bg-gray-50">
                \\text{2. Rewrite the expression for a summation: } \\sum_{i=1}^{n} a_i
            </math-field>
        </div>
         <div class="p-2">
            <math-field read-only class="pointer-events-none bg-gray-50">
                \\text{3. Use the table button to write a simple 2x2 truth table for } p \\land q.
            </math-field>
        </div>
    </div>
    <div class="my-4 no-print">
       ${operatorRow}
       ${logicRow}
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
        class="w-full p-2 text-lg border border-gray-300 rounded" 
        default-mode="text" 
        virtual-keyboard-mode="manual"
        placeholder="\\text{Try rewriting the expressions here...}">
    </math-field>
  `;

  const trialMf = document.getElementById(trialTargetId);
  trialMf.executeCommand(["switchMode", "text"]);
  trialMf.keybindings = [
    { key: "[Enter]", command: "addRowAfter" },
    { key: "[Return]", command: "addRowAfter" },
    ...trialMf.keybindings,
  ];

  attachEventListenersForBlock(trialTargetId);

  // Guard against case where no quizzes were loaded
  if (quizSet.length > 0) {
    document.getElementById("start-quiz-btn").addEventListener("click", () => {
      const selectedQuizIndex = parseInt(
        document.getElementById("quiz-version-select").value,
        10
      );

      answers = quizSet[selectedQuizIndex].questions.map(() => "");

      document.getElementById("instructions-container").style.display = "none";
      document.getElementById("quiz-wrapper").classList.remove("hidden");

      renderQuizPage(selectedQuizIndex);
    });
  } else {
    document.getElementById("start-quiz-btn").disabled = true;
    document.getElementById("start-quiz-btn").textContent = "No Quizzes Found";
    document
      .getElementById("start-quiz-btn")
      .classList.remove("bg-green-600", "hover:bg-green-700");
    document
      .getElementById("start-quiz-btn")
      .classList.add("bg-gray-400", "cursor-not-allowed");
  }
}

function attachEventListenersForBlock(blockId, saveCallback) {
  const mf = document.getElementById(blockId);
  if (!mf) return;

  // Hide some features from the context menu
  const idsToHide = ["cut", "copy", "paste", "mode", "select-all", "variant"];
  mf.menuItems = mf.menuItems.filter((item) => !idsToHide.includes(item.id));

  mf.addEventListener("contextmenu", (e) => e.preventDefault());

  if (saveCallback) {
    mf.addEventListener("input", () => saveCallback(mf.value));
  }

  // --- ADD THIS NEW LISTENER ---
  // This separately "listens" for an Enter key press
  // without interfering with the library's internal keybindings.
  mf.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === "Return") {
      // Find the toggle associated with this math-field
      const toggle = document.querySelector(
        `input[data-toggle-target="${blockId}"]`
      );

      // Use a 0ms timeout. This tells the browser:
      // "Let the math-field library finish handling the 'Enter' key first.
      // AFTER it's done (and has switched to math mode), then run this code."
      setTimeout(() => {
        if (toggle) {
          // By now, the library has run 'addRowAfter',
          // so we just sync our slider to be 'on'.
          toggle.checked = true;
        }
      }, 0);
    }
  });
  // --- END OF NEW LISTENER ---

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
          showTablePicker(event.currentTarget, mf);
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

/**
 * Creates and displays a grid UI for selecting table dimensions.
 * @param {HTMLElement} button - The button that was clicked to trigger the picker.
 * @param {MathfieldElement} mf - The mathfield to insert the table into.
 */
function showTablePicker(button, mf) {
  const oldPicker = document.querySelector(".table-picker");
  if (oldPicker) {
    oldPicker.remove();
    return;
  }

  const picker = document.createElement("div");
  picker.className = "table-picker";

  const grid = document.createElement("div");
  grid.className = "insert-matrix-submenu";
  picker.appendChild(grid);

  const MAX_ROWS = 5;
  const MAX_COLS = 5;

  const allCells = [];
  for (let r = 1; r <= MAX_ROWS; r++) {
    for (let c = 1; c <= MAX_COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "picker-cell";
      cell.dataset.rows = r;
      cell.dataset.cols = c;
      cell.textContent = "☐";
      grid.appendChild(cell);
      allCells.push(cell);
    }
  }

  allCells.forEach((cell) => {
    cell.addEventListener("mouseover", (event) => {
      const currentRows = parseInt(event.currentTarget.dataset.rows);
      const currentCols = parseInt(event.currentTarget.dataset.cols);
      allCells.forEach((c_el) => {
        const cellRows = parseInt(c_el.dataset.rows);
        const cellCols = parseInt(c_el.dataset.cols);
        if (cellRows <= currentRows && cellCols <= currentCols) {
          c_el.classList.add("highlight");
        } else {
          c_el.classList.remove("highlight");
        }
      });
    });

    cell.addEventListener("click", (event) => {
      const rows = parseInt(event.currentTarget.dataset.rows);
      const cols = parseInt(event.currentTarget.dataset.cols);
      const allRows = Array.from({ length: rows }, (_, r_idx) =>
        Array.from({ length: cols }, (_, c_idx) =>
          r_idx === 0 && c_idx === 0 ? "#0" : "#?"
        ).join(" & ")
      ).join(" \\\\ ");
      const latex = `\\begin{array}{${"c".repeat(
        cols
      )}} ${allRows} \\end{array}`;
      mf.insert(latex);
      mf.focus();
      picker.remove();
    });
  });

  document.body.appendChild(picker);
  const btnRect = button.getBoundingClientRect();
  const pickerHeight = picker.offsetHeight;

  picker.style.left = `${btnRect.left + window.scrollX}px`;
  picker.style.top = `${btnRect.top + window.scrollY - pickerHeight - 5}px`;

  setTimeout(() => {
    document.addEventListener("click", function closePicker(e) {
      if (!picker.contains(e.target) && !button.contains(e.target)) {
        picker.remove();
        document.removeEventListener("click", closePicker);
      }
    });
  }, 0);
}

function renderQuizPage(quizIdx) {
  const quiz = quizSet[quizIdx];
  const container = document.getElementById("quiz-content-container");
  container.innerHTML = "";

  const quizTitle = document.createElement("h1");
  quizTitle.className = "text-3xl font-bold mb-6 text-gray-800";
  quizTitle.textContent = quiz.title;
  container.appendChild(quizTitle);

  quiz.questions.forEach((item, questionIdx) => {
    const blockId = `input-${quizIdx}-${questionIdx}`;
    const block = document.createElement("div");
    block.className = "bg-white p-4 mb-6 question-block";

    const allQuestionSymbols = item.symbols || [];
    const operatorSymbols = allQuestionSymbols.filter((s) =>
      operatorKeywords.includes(s)
    );
    const logicSymbols = allQuestionSymbols.filter(
      (s) => !operatorKeywords.includes(s)
    );

    const renderButtons = (symbols) =>
      symbols
        .map((symbol) => {
          if (symbol === "table") {
            return `<button data-target="${blockId}" data-type="table" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded insert-btn text-sm table-icon-button"><div class="table-icon-grid"><div></div><div></div><div></div><div></div></div></button>`;
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
        <math-field id="${blockId}" class="w-full p-2 text-lg bg-white border border-gray-300 rounded" default-mode="text" virtual-keyboard-mode="manual" placeholder="\\text{Write your answer here}"></math-field>
      `;
    container.appendChild(block);

    const inputField = document.getElementById(blockId);
    inputField.executeCommand(["switchMode", "text"]);
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
/**
 * ADDED: Main async function to orchestrate the application startup.
 * It first loads the quizzes, then renders the initial page.
 */
async function main() {
  quizSet = await loadAndParseQuizzes("quizzes.txt");
  renderInstructions();
}

// MODIFIED: The script now starts by calling the main async function.
main();
