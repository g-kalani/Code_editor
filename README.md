# CodeSync- AI-Powered Code Collaborator & Compiler

A high-performance, real-time collaborative code editor and execution environment. CodeSync features a "Cyber-Slate" modern dark theme and a specialized **AI Debugger** that uses **Retrieval-Augmented Generation (RAG)** to provide grounded fixes by referencing an extensive professional dataset.

**Deployed link:** https://code-editor-app-euzi.onrender.com

* Lobby: Enter your username and generate a unique Room ID. Use the built-in "Copy" button to invite collaborators. 
* Editor: Select your language. The editor will sync your choice with all users in the room.
* Run & Debug: Click RUN CODE. If an error occurs, the AI Debugger will analyze the logs against the 1,500-example dataset to provide a grounded fix.
* Apply Fix: Use the "Copy Fixed Code" button to grab the AI's suggestion and paste it directly into your editor.

---

## ✨ Features

* **Real-Time Collaboration**: Multi-user synchronization using **Socket.io**, allowing teams to code together in the same room.
* **Grounded AI Debugging (RAG)**: Now utilizes a local dataset of **1,500+ examples** (CodeSearchNet & MBPP) to provide 🔍 `[DATASET-GROUNDED ANALYSIS]`.
* **Tiered Dark UI**: A modern "Cyber-Slate" interface with binary-particle background animations and clear visual hierarchy across the Editor, Terminal, and AI panels.
* **Dynamic Java Support**: Smart backend logic that automatically detects `public class` names to name and compile Java files correctly on the fly.
* **Custom IntelliSense**: Deep Monaco Editor integration with snippets for C++, Python, and Java (e.g., `public class`, `main`, `sysout`).
* **Integrated Toolkit**: One-click "Copy Fixed Code" buttons within AI insights and "Clear Console" functionality for a clean workspace.

---

## 🏗️ System Architecture

* **Frontend**: React.js with **Monaco Editor** and `react-resizable-panels`.
* **Collaboration**: **Socket.io** for instant state sync and language selection across clients.
* **Execution Layer**: Dockerized `compiler-box` isolating C++, Python, and Java runtimes.
* **Intelligence**: **Google Gemini API** combined with a local FAISS-inspired JSONL search engine.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
* **Node.js** (v18+)
* **Docker Desktop** (Must be running)
* **Gemini API Key** (From Google AI Studio)

### 2. Backend & Docker Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` folder to store your credentials:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Docker Image Setup
Build the secure execution environment image to isolate user code:

```bash
docker build -t compiler-box .
```

### 4. Dataset Generation (RAG)
To enable the grounded AI analysis, you must generate the local knowledge base using the provided Python scripts:

```bash
cd data_scripts
pip install datasets pandas
python download_datasets.py
```
(move the resultant dataset.jsonl to the server folder)
### 5. Frontend Setup
Navigate to the client directory to install the React-based user interface dependencies:
```bash
cd client
npm install
```
 
## 🚦 How to Run
### 1. Start the Backend
Navigate to the /server folder and start the Node.js server:

```
node index.js
```
Wait for the success message:✅ Loaded 1500 examples.

### 2. Start the Frontend
Navigate to the /client folder and start the React development server:

```
npm start
```
### 3. Access the Application
Open your browser and go to: `http://localhost:3000`
