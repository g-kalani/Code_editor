require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// --- STABLE DATASET LOADING ---
// This block ensures dataset.json is found whether it's in /server or the root /capstone
const datasetPath = path.join(__dirname, 'dataset.json');
let localDataset = [];

try {
    if (fs.existsSync(datasetPath)) {
        localDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
        console.log(`✅ Success: Loaded ${localDataset.length} examples from server/dataset.json`);
    } else {
        const parentPath = path.join(__dirname, '..', 'dataset.json');
        if (fs.existsSync(parentPath)) {
            localDataset = JSON.parse(fs.readFileSync(parentPath, 'utf8'));
            console.log(`💡 Found dataset.json in parent folder! Loaded ${localDataset.length} examples.`);
        } else {
            console.warn("⚠️ Warning: dataset.json not found in server or root folder.");
        }
    }
} catch (err) {
    console.error("❌ Error parsing dataset.json:", err.message);
}

// Initialize Gemini with a stable version
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

// Helper to execute commands in Docker
const runCommand = (cmd) => {
    return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            resolve({ stdout, stderr });
        });
    });
};

// --- DATASET-GROUNDED AI ANALYSIS ---
async function getGeminiErrorAnalysis(code, error, language) {
    // Filter dataset for current language and take 3 examples for few-shot prompting
    const languageExamples = localDataset
        .filter(item => item.lang === language)
        .slice(0, 3); 

    const examplesContext = languageExamples.map((ex, i) => 
        `Reference Example ${i + 1}:\nError Context: ${ex.error_context}\nFixed Code:\n${ex.fix}`
    ).join("\n\n");

    // Inside getGeminiErrorAnalysis in index.js
const prompt = `
    You are an expert programming tutor for ${language}. 
    
    CRITICAL: If you use the "Reference Examples" below to help your analysis, 
    start your response with: "🔍 [DATASET-GROUNDED ANALYSIS]".

    Reference Examples for style and logic:
    ${examplesContext || "No local examples found for this language."}

    Student Code:
    ${code}
    
    Error Message:
    ${error}
    
    Instructions:
    1. Explain why this error happened in 2 simple sentences.
    2. Provide the corrected code under a heading titled "Corrected Code:". 
       Wrap the code in a triple-backtick block with the language name (e.g., \`\`\`cpp).
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error("DEBUG: Gemini API Error ->", err);
        return `AI analysis failed. Error: ${err.message}`;
    }
}

app.post('/execute', async (req, res) => {
    const { code, language } = req.body;
    let filename = "";
    let className = "";
    let dockerCmd = "";

    // --- Language Logic ---
    if (language === 'java') {
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        className = classMatch ? classMatch[1] : "Main"; 
        filename = `${className}.java`;
        fs.writeFileSync(path.join(__dirname, filename), code);
        dockerCmd = `docker run --rm -v "${process.cwd()}:/app" compiler-box sh -c "javac /app/${filename} && java -cp /app ${className}"`;
    } else {
        const extension = language === 'python' ? 'py' : 'cpp';
        filename = `temp_code.${extension}`;
        fs.writeFileSync(path.join(__dirname, filename), code);

        if (language === 'python') {
            dockerCmd = `docker run --rm -v "${process.cwd()}:/app" compiler-box python3 /app/${filename}`;
        } else if (language === 'cpp') {
            dockerCmd = `docker run --rm -v "${process.cwd()}:/app" compiler-box sh -c "g++ /app/${filename} -o /app/out && /app/out"`;
        }
    }

    // --- Run and Analyze ---
    const { stdout, stderr } = await runCommand(dockerCmd);

    let aiExplanation = "";
    if (stderr && stderr.trim() !== "") {
        aiExplanation = await getGeminiErrorAnalysis(code, stderr, language);
    }

    res.json({ stdout, stderr, aiExplanation });

    // --- Cleanup ---
    const mainFilePath = path.join(__dirname, filename);
    if (fs.existsSync(mainFilePath)) fs.unlinkSync(mainFilePath);
    if (language === 'java' && className) {
        const classFile = path.join(__dirname, `${className}.class`);
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
    }
});

app.listen(5000, () => console.log("🚀 AI-Powered Backend running on port 5000"));