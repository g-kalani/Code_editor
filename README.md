# AI-Powered Code Collaborator & Compiler

A full-stack web application featuring a real-time, multi-language code editor and a secure execution environment. This platform distinguishes itself with an **AI Debugger** that utilizes **Retrieval-Augmented Generation (RAG)** to provide grounded, high-accuracy fixes for coding errors by referencing professional datasets.

---

## 🚀 Key Features

* **Multi-Language Support**: Execute C++, Python, and Java code within secure, isolated environments.
* **IntelliSense & Snippets**: Custom Monaco Editor integration providing instant snippets for common patterns like `cout`, `main`, and `sysout`.
* **Dockerized Execution**: Uses a custom Docker container (`compiler-box`) to safely compile and run user code, preventing host system vulnerabilities.
* **Grounded AI Debugging**: Utilizes a **Few-Shot RAG** approach. When code fails, the system queries a local dataset of ~850+ examples to provide "Dataset-Grounded" analysis.
* **Modern IDE Interface**: Built with React, featuring resizable panels and Markdown-rendered AI insights.

---

## 🏗️ System Architecture

1.  **Frontend**: React.js with Monaco Editor for high-performance code editing.
2.  **Backend**: Node.js/Express server managing Dockerized execution and Gemini AI integration.
3.  **Data Layer**: Local `dataset.json` containing professional code patterns from **CodeSearchNet** (C++/Java) and **MBPP** (Python).

---

## 🛠️ Installation & Setup

Follow these steps to set up the project locally after cloning:

### 1. Prerequisites
* **Node.js** (v16 or higher)
* **Docker Desktop** (Must be running)
* **Python 3.x** (For dataset generation)

### 2. Backend Setup
Navigate to the `server` directory and install dependencies:
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
(move the resultant dataset.json to the server folder)
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
Wait for the success message: ✅ Loaded 257 examples from dataset.json.

### 2. Start the Frontend
Navigate to the /client folder and start the React development server:

```
npm start
```
### 3. Access the Application
Open your browser and go to: `http://localhost:3000`
