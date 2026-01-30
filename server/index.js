require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws'); // Added for Yjs


// Locate the y-websocket package root folder
const yWebsocketDir = path.dirname(require.resolve('y-websocket/package.json'));

/**
 * Robust utility finder: This recursively searches the package for the setupWSConnection logic
 * regardless of whether it's in /bin, /dist, or /src.
 */
const findUtilsPath = (dir) => {
    const targets = ['utils.js', 'utils.cjs', 'index.js', 'index.cjs'];
    const subfolders = ['bin', 'dist', 'src', 'dist/bin', 'lib'];
    
    for (const folder of subfolders) {
        for (const file of targets) {
            const fullPath = path.join(dir, folder, file);
            if (fs.existsSync(fullPath)) return fullPath;
        }
    }
    return null;
};

const yUtilsPath = findUtilsPath(yWebsocketDir);

if (!yUtilsPath) {
    console.error("❌ CRITICAL ERROR: Could not locate y-websocket utilities.");
    console.log("Please run: npm install y-websocket@1.3.15"); // Known stable version
    process.exit(1);
}

const { setupWSConnection } = require(yUtilsPath);
console.log(`📡 Sync Engine linked via: ${path.relative(yWebsocketDir, yUtilsPath)}`);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 1. Socket.io for Rooms and UI events
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// 2. WebSocket Server for Yjs document sync
const wss = new WebSocket.Server({ noServer: true });

// --- STABLE DATASET LOADING ---
const datasetFileName = 'dataset.jsonl';
let localDataset = [];
const loadJSONL = async (filePath) => {
    const data = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, terminal: false });
    for await (const line of rl) {
        if (line.trim()) {
            try { data.push(JSON.parse(line)); } 
            catch (err) { console.error("Malformed JSON line skipped"); }
        }
    }
    return data;
};

(async () => {
    const localPath = path.join(__dirname, datasetFileName);
    const parentPath = path.join(__dirname, '..', datasetFileName);
    try {
        if (fs.existsSync(localPath)) { localDataset = await loadJSONL(localPath); } 
        else if (fs.existsSync(parentPath)) { localDataset = await loadJSONL(parentPath); }
        console.log(`✅ Loaded ${localDataset.length} examples.`);
    } catch (err) { console.error("Error loading dataset:", err.message); }
})();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

// --- COLLABORATION LOGIC ---
io.on('connection', (socket) => {
    socket.on('join', ({ roomId, username }) => {
        socket.join(roomId);
        socket.in(roomId).emit('user-joined', { username, socketId: socket.id });
    });
    // Inside your io.on('connection') block
    socket.on('language-change', ({ roomId, newLanguage }) => {
        socket.in(roomId).emit('language-changed', { newLanguage });
    });

    socket.on('broadcast-results', ({ roomId, output, aiAnalysis }) => {
        socket.in(roomId).emit('execution-results', { output, aiAnalysis });
    });

    socket.on('execution-started', ({ roomId }) => {
        socket.in(roomId).emit('execution-started'); // Optional: show "Running..." on all screens
    });
});

// Handle the Yjs protocol upgrade
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  
  // Only handle upgrades for paths that AREN'T socket.io
  if (!url.pathname.startsWith('/socket.io')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      setupWSConnection(ws, request);
    });
  }
});

// --- EXECUTION LOGIC ---
const runCommand = (cmd) => new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => resolve({ stdout, stderr }));
});

async function getGeminiErrorAnalysis(code, error, language) {
    const languageExamples = localDataset.filter(item => item.lang === language).slice(0, 3); 
    const examplesContext = languageExamples.map((ex, i) => 
        `Example ${i + 1}:\nError: ${ex.error_context}\nFix:\n${ex.fix || ex.code}`
    ).join("\n\n");

    const prompt = `
    You are an expert programming tutor for ${language}. 
    
    STRICT FORMATTING RULES:
    1. NEVER use backticks (\`) or code blocks (\`\`\`) in the explanation section.
    2. NEVER wrap error names like SyntaxError in backticks. Just use plain text.
    3. The ONLY triple-backtick block allowed is at the very end of your response.
    4. Start with: 🔍 [DATASET-GROUNDED ANALYSIS]

    Reference Examples:
    ${examplesContext || "No local examples found."}

    Student Code:
    ${code}
    
    Error Message:
    ${error}
    
    Response Structure:
    [Explanation in plain text - max 2 sentences]
    
    Corrected Code:
    [\`\`\`language block here]
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
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
        // Dynamically extract the public class name to avoid filename mismatches
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        className = classMatch ? classMatch[1] : "Main"; 
        filename = `${className}.java`;
        
        fs.writeFileSync(path.join(__dirname, filename), code);
        // Step 1: Compile the specific class file. Step 2: Run that class
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
    try {
        const { stdout, stderr } = await runCommand(dockerCmd);

        let aiExplanation = "";
        if (stderr && stderr.trim() !== "") {
            aiExplanation = await getGeminiErrorAnalysis(code, stderr, language);
        }

        res.json({ stdout, stderr, aiExplanation });
    } catch (error) {
        res.status(500).json({ stdout: "", stderr: error.message, aiExplanation: "" });
    } finally {
        // --- Enhanced Cleanup ---
        const mainFilePath = path.join(__dirname, filename);
        if (fs.existsSync(mainFilePath)) fs.unlinkSync(mainFilePath);
        if (language === 'java' && className) {
            const classFile = path.join(__dirname, `${className}.class`);
            if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
        }
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});