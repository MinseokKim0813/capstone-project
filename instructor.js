// --- MOCK AI AND SYMBOL DATABASE ---

// This list represents all possible symbols the "AI" knows about.
const AI_SYMBOL_DATABASE = [
  "\\rightarrow",
  "\\vee",
  "\\neg",
  "\\emptyset",
  "\\times",
  "\\neq",
  "\\subseteq",
  "\\equiv",
  "\\forall",
  "\\in",
  "\\notin",
  "\\cup",
  "\\cap",
  "\\land",
  "\\exists",
  "\\pm",
  "\\mp",
  "\\cdot",
  "\\div",
  "\\ast",
  "\\star",
  "\\circ",
  "\\bullet",
  "\\leq",
  "\\geq",
  "\\approx",
  "\\sim",
  "\\simeq",
  "\\cong",
  "\\propto",
  "\\perp",
  "\\mid",
  "\\parallel",
  "\\angle",
  "\\triangle",
  "\\nabla",
  "\\partial",
  "\\int",
  "\\sum",
  "\\prod",
  "\\sqrt",
  "\\lim",
  "\\sin",
  "\\cos",
  "\\tan",
  "\\log",
  "\\alpha",
  "\\beta",
  "\\gamma",
  "\\delta",
  "\\epsilon",
  "\\zeta",
  "\\eta",
  "\\theta",
  "\\lambda",
  "\\mu",
  "\\pi",
  "\\rho",
  "\\sigma",
  "\\tau",
  "\\phi",
  "\\psi",
  "\\omega",
  "\\Gamma",
  "\\Delta",
  "\\Theta",
  "\\Lambda",
  "\\Pi",
  "\\Sigma",
  "\\Phi",
  "\\Psi",
  "\\Omega",
  "overline",
  "^",
  "_",
  "table", // Keywords
];

/**
 * Simulates an AI call to extract relevant symbols from a LaTeX string.
 * In a real application, this would be a fetch call to a server-side AI model.
 * @param {string} latexString The question text written in LaTeX.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested symbols.
 */
function getAiSymbolSuggestions(latexString) {
  console.log("AI analyzing:", latexString);
  return new Promise((resolve) => {
    setTimeout(() => {
      const suggestions = new Set();
      // Simple regex to find LaTeX commands (e.g., \command)
      const commands = latexString.match(/\\([a-zA-Z]+)/g) || [];

      commands.forEach((cmd) => {
        // Check if the found command is in our database
        if (AI_SYMBOL_DATABASE.includes(cmd)) {
          suggestions.add(cmd);
        }
      });

      // Check for single-character symbols and keywords
      AI_SYMBOL_DATABASE.forEach((symbol) => {
        // Use a regex to avoid matching parts of words (e.g., finding '\in' inside '\sin')
        const symbolRegex = new RegExp(
          `(?<!\\\\)${symbol.replace(/\\/g, "\\\\")}(?!\\w)`,
          "g"
        );
        if (latexString.match(symbolRegex)) {
          suggestions.add(symbol);
        }
      });

      console.log("AI suggestions:", [...suggestions]);
      resolve([...suggestions]);
    }, 500); // Simulate network delay
  });
}

// --- DOM ELEMENTS AND STATE ---

const quizBuilderArea = document.getElementById("quiz-builder-area");
const addQuizBtn = document.getElementById("add-quiz-btn");
const downloadBtn = document.getElementById("download-btn");

let quizCount = 0;

// --- CORE FUNCTIONS ---

/**
 * Creates the HTML structure for a new quiz.
 */
function createQuizElement() {
  quizCount++;
  const quizId = `quiz-${quizCount}`;

  const quizContainer = document.createElement("div");
  quizContainer.className = "quiz-container space-y-4";
  quizContainer.id = quizId;
  quizContainer.innerHTML = `
        <div class="flex justify-between items-center">
            <input type="text" placeholder="Enter Quiz Title (e.g., Math Quiz Version ${quizCount})" class="quiz-title-input text-2xl font-bold border-b-2 border-gray-300 focus:border-blue-500 outline-none w-full pb-1">
            <button class="remove-quiz-btn text-red-500 hover:text-red-700 font-bold text-2xl px-2">&times;</button>
        </div>
        <div class="questions-area space-y-4">
            </div>
        <button class="add-question-btn w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors">
            + Add Question
        </button>
    `;

  quizBuilderArea.appendChild(quizContainer);

  // Attach event listeners for this new quiz
  quizContainer
    .querySelector(".add-question-btn")
    .addEventListener("click", () => addQuestionToQuiz(quizId));
  quizContainer
    .querySelector(".remove-quiz-btn")
    .addEventListener("click", () => quizContainer.remove());

  // Add one question by default
  addQuestionToQuiz(quizId);
}

/**
 * Adds a new question block to a specific quiz.
 * @param {string} quizId The ID of the parent quiz container.
 */
function addQuestionToQuiz(quizId) {
  const quizContainer = document.getElementById(quizId);
  const questionsArea = quizContainer.querySelector(".questions-area");
  const questionId = `q-${quizId}-${questionsArea.children.length + 1}`;

  const questionBlock = document.createElement("div");
  questionBlock.className = "question-block";
  questionBlock.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="w-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">Question LaTeX</label>
                <math-field id="${questionId}-mf" class="w-full border border-gray-300 rounded-md p-2" virtual-keyboard-mode="manual" default-mode="text" placeholder="\\text{Type your question here...}"></math-field>
            </div>
            <button class="remove-question-btn text-red-500 hover:text-red-700 font-semibold ml-4 mt-6">&times;</button>
        </div>
        <div class="mt-3">
            <button class="get-symbols-btn bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold py-1 px-3 rounded-md">Generate Symbols (AI)</button>
            <div id="${questionId}-symbols" class="symbols-display mt-2 p-2 bg-gray-50 rounded-md min-h-[40px]">
                <span class="text-gray-500 text-sm">Click "Generate Symbols" to get AI suggestions.</span>
            </div>
            <input type="hidden" id="${questionId}-symbols-input" class="symbols-hidden-input">
        </div>
    `;
  questionsArea.appendChild(questionBlock);

  // Attach event listeners for this new question
  const mf = document.getElementById(`${questionId}-mf`);
  const getSymbolsBtn = questionBlock.querySelector(".get-symbols-btn");
  const symbolsDisplay = document.getElementById(`${questionId}-symbols`);
  const symbolsInput = document.getElementById(`${questionId}-symbols-input`);

  questionBlock
    .querySelector(".remove-question-btn")
    .addEventListener("click", () => questionBlock.remove());

  getSymbolsBtn.addEventListener("click", async () => {
    const latex = mf.value;
    if (!latex) {
      alert("Please enter a question first.");
      return;
    }

    symbolsDisplay.innerHTML =
      '<div class="loader"></div> <span class="text-gray-600 ml-2">Analyzing...</span>';

    const suggestions = await getAiSymbolSuggestions(latex);

    symbolsInput.value = suggestions.join(",");
    renderSymbols(symbolsDisplay, symbolsInput);
  });
}

/**
 * Renders the suggested symbols as clickable tags in the display area.
 * @param {HTMLElement} displayEl The element to render tags into.
 * @param {HTMLInputElement} inputEl The hidden input holding the comma-separated values.
 */
function renderSymbols(displayEl, inputEl) {
  displayEl.innerHTML = "";
  const symbols = inputEl.value ? inputEl.value.split(",") : [];

  if (symbols.length === 0) {
    displayEl.innerHTML =
      '<span class="text-gray-500 text-sm">No symbols suggested. You can add them manually.</span>';
  }

  symbols.forEach((symbol) => {
    const tag = document.createElement("span");
    tag.className = "symbol-tag";
    tag.textContent = symbol;
    tag.title = "Click to remove";
    tag.onclick = () => {
      const currentSymbols = inputEl.value.split(",");
      const newSymbols = currentSymbols.filter((s) => s !== symbol);
      inputEl.value = newSymbols.join(",");
      renderSymbols(displayEl, inputEl); // Re-render
    };
    displayEl.appendChild(tag);
  });
}

/**
 * Compiles all quiz data from the DOM into the quizzes.txt format.
 * @returns {string} The formatted string ready for download.
 */
function compileQuizFile() {
  let fileContent = "";
  const quizContainers = document.querySelectorAll(".quiz-container");

  quizContainers.forEach((quizEl, index) => {
    const title =
      quizEl.querySelector(".quiz-title-input").value ||
      `Math Quiz (Version ${index + 1})`;
    fileContent += `QUIZ: ${title}\n`;

    const questionBlocks = quizEl.querySelectorAll(".question-block");
    questionBlocks.forEach((qEl) => {
      const latex = qEl.querySelector("math-field").value;
      const symbols = qEl.querySelector(".symbols-hidden-input").value;
      if (latex && symbols) {
        fileContent += `${latex} : ${symbols}\n`;
      }
    });
    fileContent += "\n"; // Add a newline between quizzes
  });

  return fileContent.trim();
}

/**
 * Triggers a browser download for the generated quiz file.
 */
function downloadQuizFile() {
  const content = compileQuizFile();
  if (!content) {
    alert("No quizzes to download. Please add a quiz first.");
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quizzes.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- INITIALIZATION ---
addQuizBtn.addEventListener("click", createQuizElement);
downloadBtn.addEventListener("click", downloadQuizFile);

// Create the first quiz by default on page load
createQuizElement();
