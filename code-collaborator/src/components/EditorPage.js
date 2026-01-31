import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Group, Panel, Separator } from "react-resizable-panels";
import { useParams, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import { initCollaboration } from './CollaborationManager';

function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username || "Anonymous";

  const editorRef = useRef(null);
  
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
 
  useEffect(() => {
    socket.connect();
    socket.emit('join', { roomId, username });

    socket.on('language-changed', ({ newLanguage }) => {
      setLanguage(newLanguage);
    });

    socket.on('execution-results', ({ output, aiAnalysis }) => {
      setOutput(output);
      setAiAnalysis(aiAnalysis);
      setIsAnalyzing(false);
    });

    socket.on('remote-execution-started', () => {
      setOutput("Remote user is running code...");
      setAiAnalysis("");
    });
    
    return () => {
      socket.emit('leave', { roomId }); 
      socket.off('language-changed');
      socket.off('execution-results');
      socket.off('remote-execution-started');
      socket.off('user-joined');
    
    };
  }, [roomId, username]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    initCollaboration(editor, roomId);

    const languages = ['cpp', 'python', 'java'];
    languages.forEach((lang) => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model, position) => {
          const suggestions = [];
          if (lang === 'cpp') {
            suggestions.push(
              // Using backticks and escaped $ for C++ snippets
              { label: 'include', kind: monaco.languages.CompletionItemKind.Snippet, insertText: `include <\${1:iostream}>`, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'C++ Include Directive' },
              { label: 'main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: `int main() {\n\t$0\n\treturn 0;\n}`, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
            );
          }
          if (lang === 'python') {
            suggestions.push({ label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print($0)', detail: 'Print to console' });
          }
          if (lang === 'java') {
              suggestions.push(
                  { label: 'sysout', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'System.out.println($0);', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                  { 
                      label: 'public class', 
                      kind: monaco.languages.CompletionItemKind.Snippet, 
                      // Use backticks and escape the dollar sign (\$) to resolve terminal warnings
                      insertText: `public class \${1:Main} {\n\tpublic static void main(String[] args) {\n\t\t$0\n\t}\n}`, 
                      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet 
                  }
              );
          }
          return { suggestions };
        }
      });
    });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit('language-change', { roomId, newLanguage: newLang });
  };

    
  const handleClearCode = () => {
    // 1. Clear the Monaco Editor content
    if (editorRef.current) {
      editorRef.current.setValue(""); 
    }
    
    // 2. Clear the Terminal Output and AI Analysis panels
    setOutput("");
    setAiAnalysis("");
  };

  const handleRun = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : "";
    setOutput("Running...");
    setAiAnalysis("");
    socket.emit('execution-started', { roomId });

    try {
      const { data } = await axios.post("/execute", { 
        code: currentCode, 
        language 
      });

      const finalOutput = data.stdout || data.stderr || "Program executed with no output.";
      let finalAiAnalysis = "";

      if (data.stderr) {
        setIsAnalyzing(true);
        finalAiAnalysis = data.aiExplanation
          ? data.aiExplanation.replace(/^(Great start|Hello|Hi|Greetings|Let's fix).*?[.!]\s*/gi, "").replace(/^\d+\.\s/gm, '* ').trim()
          : "";
      }

      setOutput(finalOutput);
      setAiAnalysis(finalAiAnalysis);
      setIsAnalyzing(false);

      socket.emit('broadcast-results', { 
        roomId, 
        output: finalOutput, 
        aiAnalysis: finalAiAnalysis 
      });

    } catch (err) {
      setOutput("Error: Server unreachable.");
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  // --- Theme Styles ---
  const styles = {
    container: {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#020617", 
      color: "#f8fafc",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      padding: "12px 24px",
      background: "#0f172a",
      borderBottom: "1px solid #1e293b",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
    },
    runBtn: {
      padding: "8px 24px",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)"
    },
    panelLabel: {
      color: "#94a3b8",
      fontSize: "11px",
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      marginBottom: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .monaco-editor, .monaco-editor-background, .monaco-editor .margin {
          background-color: #020617 !important;
        }
        /* ... spinner styles ... */
      `}</style>

      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <select 
            value={language} 
            onChange={handleLanguageChange} 
            style={{ background: "#1e293b", color: "#fff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", outline: "none", cursor: "pointer" }}
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          <button onClick={handleRun} style={styles.runBtn}>
            RUN CODE
          </button>
          
          {/* NEW: Clear Code button now resides in the header next to the Run button */}
          <button 
            onClick={handleClearCode} 
            style={{ 
                background: "transparent", 
                color: "#94a3b8", 
                border: "1px solid #334155", 
                padding: "8px 16px", 
                borderRadius: "8px", 
                fontWeight: "600", 
                cursor: "pointer",
                fontSize: "12px"
            }}
          >
            CLEAR CODE
          </button>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "700" }}>ROOM: {roomId}</div>
          <div style={{ color: "#64748b", fontSize: "11px" }}>USER: {username.toUpperCase()}</div>
        </div>
      </header>

      <main style={{ flex: 1, overflow: "hidden" }}>
        <Group direction="horizontal">
          <Panel defaultSize={55} minSize={30}>
            {/* EDITOR: Deepest Layer (#020617) */}
            <div style={{ height: "100%", background: "#020617", borderRight: "1px solid #1e293b" }}>
              <Editor 
                height="100%" 
                theme="vs-dark" 
                language={language} 
                onMount={handleEditorDidMount} 
                options={{ 
                  fontSize: 14,
                  fontFamily: "'Fira Code', monospace",
                  automaticLayout: true, 
                  padding: { top: 20 },
                  minimap: { enabled: false },
                  wordWrap: "on"
                }} 
              />
            </div>
          </Panel>

          <Separator style={{ width: "2px", background: "#1e293b", cursor: "col-resize" }} />

          <Panel defaultSize={45} minSize={20}>
            <Group direction="vertical">
              <Panel defaultSize={40}>
                {/* TERMINAL: Middle Layer (#0b1120) */}
                <div style={{ height: "100%", padding: "20px", background: "#0b1120", overflowY: "auto" }}>
                  <div style={styles.panelLabel}>
                    <span>Terminal Output</span>
                  </div>
                  <pre style={{ margin: 0, color: "#10b981", fontSize: "13px", lineHeight: "1.6", fontFamily: "'Fira Code', monospace" }}>
                    {output || "> Ready to execute..."}
                  </pre>
                </div>
              </Panel>
              
              <Separator style={{ height: "2px", background: "#1e293b", cursor: "row-resize" }} />

              <Panel defaultSize={60}>
                {/* AI DEBUGGER: Surface Layer (#0f172a) */}
                <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0f172a" }}>
                  <div style={{ ...styles.panelLabel, padding: "12px 20px", borderBottom: "1px solid #1e293b", background: "#1e293b" }}>
                    <span>AI Debugger Insights</span>
                  </div>
                  <div style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#0f172a" }}>
                    {isAnalyzing ? (
                      <div style={{ color: "#3b82f6", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="spinner"></div>
                        <span style={{ fontWeight: "600" }}>Analyzing code logic...</span>
                      </div>
                    ) : aiAnalysis ? (
                      <div style={{ color: "#e2e8f0", lineHeight: "1.6" }}>
                        <ReactMarkdown 
                          components={{
                            p: ({children}) => <p style={{ marginBottom: "12px" }}>{children}</p>,
                            li: ({children}) => <li style={{ marginBottom: "8px" }}>{children}</li>,
                            code({node, inline, className, children, ...props}) {
                              const content = String(children).replace(/\n$/, '');
                              const isActualFix = !inline && content.length > 10 && aiAnalysis.toLowerCase().includes("corrected code");

                              return isActualFix ? (
                                <div style={{ margin: "20px 0", border: "1px solid #334155", borderRadius: "12px", background: "#020617", overflow: "hidden" }}>
                                  <div style={{ background: "#1e293b", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700" }}>FIXED CODE</span>
                                    <button 
                                        onClick={() => copyToClipboard(content)} 
                                        style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                                    >
                                        Copy
                                    </button>
                                  </div>
                                  <pre style={{ padding: "16px", margin: 0, overflowX: "auto" }}>
                                    <code style={{ color: "#e2e8f0", fontSize: "13px" }} {...props}>{children}</code>
                                  </pre>
                                </div>
                              ) : (
                                <code style={{ background: "#1e293b", color: "#60a5fa", padding: "2px 6px", borderRadius: "4px" }} {...props}>{children}</code>
                              );
                            }
                          }}
                        >
                          {aiAnalysis}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ color: "#475569", fontStyle: "italic", textAlign: "center", marginTop: "40px" }}>Awaiting execution logs for AI analysis...</div>
                    )}
                  </div>
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </main>
    </div>
  );
}

export default EditorPage;