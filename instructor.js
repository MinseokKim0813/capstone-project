// --- API CONFIGURATION ---

/**
 * ⚠️ PASTE YOUR GEMINI API KEY HERE ⚠️
 * You can get one from Google AI Studio: https://aistudio.google.com/app/apikey
 */
const GEMINI_API_KEY = "AIzaSyAjmXOKWLWNz2uRnrXRcgZgWH1Ha2CEuCg";

// We'll use a fast and capable model for this task.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// --- SYMBOL DATABASE (Used for the AI's prompt) ---

// This list represents all possible symbols the AI should recognize.
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
 * Calls the Gemini API to extract relevant symbols from a LaTeX string.
 * @param {string} latexString The question text written in LaTeX.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested symbols.
 */
async function getAiSymbolSuggestions(latexString) {
  console.log("Contacting Gemini AI for:", latexString);

  if (!GEMINI_API_KEY) {
    alert("Please set your GEMINI_API_KEY at the top of the script.");
    console.error("Missing Gemini API Key");
    return []; // Return empty array to prevent further errors
  }

  // This prompt instructs the AI to act as an extractor and only return
  // symbols from our database, in a specific JSON format.
  const prompt = `
    Analyze the following LaTeX text and extract all unique mathematical symbols 
    that are present in the provided valid symbol list.

    RULES:
    1.  Only return symbols that are present in the "VALID SYMBOL LIST".
    2.  Return your answer *only* as a valid JSON array of strings.
    3.  Do not include any other text, explanations, or markdown (like \`\`\`json).
    4.  If no valid symbols are found, return an empty array [].

    --- VALID SYMBOL LIST ---
    ${AI_SYMBOL_DATABASE.join("\n")}
    --- END OF LIST ---

    --- EXAMPLE ---
    User Input: "Prove that $\\neg (A \\land B) \\equiv (\\neg A) \\vee (\\neg B)$ for all $A, B$."
    Your Response:
    ["\\neg", "\\land", "\\equiv", "\\vee", "\\forall"]
    --- END OF EXAMPLE ---

    --- USER INPUT ---
    ${latexString}
    --- END OF USER INPUT ---

    Your Response:
  `;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // Force the model to output JSON
          responseMimeType: "application/json",
          temperature: 0.0, // We want deterministic output
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid API response structure.");
    }

    // The model's response is a JSON *string*, which we must parse
    const jsonText = data.candidates[0].content.parts[0].text;
    console.log("Raw AI response:", jsonText);

    // --- ROBUSTNESS FIX ---
    // Find the first block of text that starts with [ and ends with ]
    // The 's' flag lets '.' match newlines, in case the array is multi-line
    const match = jsonText.match(/\[.*?\]/s);

    if (!match || !match[0]) {
      console.error("AI did not return a valid JSON array string:", jsonText);
      throw new Error("AI response was not in the expected format.");
    }

    // Now, we parse *only* the matched array string, not the whole text
    const cleanedJsonText = match[0];
    const suggestions = JSON.parse(cleanedJsonText);
    // --- END OF FIX ---

    if (!Array.isArray(suggestions)) {
      throw new Error("AI response was not a valid JSON array.");
    }

    // Final filter to be 100% sure we only have symbols from our database
    const validSuggestions = suggestions.filter((s) =>
      AI_SYMBOL_DATABASE.includes(s)
    );

    console.log("AI suggestions:", validSuggestions);
    return [...new Set(validSuggestions)]; // Return unique symbols
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    alert(
      `An error occurred while generating symbols: ${error.message}\n\nCheck the console for more details. (Did you set your API key?)`
    );
    return []; // Return an empty array on failure
  }
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

    // Disable button to prevent multiple clicks
    getSymbolsBtn.disabled = true;
    symbolsDisplay.innerHTML =
      '<div class="loader"></div> <span class="text-gray-600 ml-2">Analyzing...</span>';

    const suggestions = await getAiSymbolSuggestions(latex);

    symbolsInput.value = suggestions.join(",");
    renderSymbols(symbolsDisplay, symbolsInput);

    // Re-enable button
    getSymbolsBtn.disabled = false;
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
    if (!symbol) return; // Handle potential empty strings from split
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
