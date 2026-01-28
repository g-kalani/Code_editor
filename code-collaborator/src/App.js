import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Group, Panel, Separator } from "react-resizable-panels";

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // This function runs once when Monaco is ready
  const handleEditorDidMount = (editor, monaco) => {
    // Manually register snippets for each language to fix "No Suggestions"
    const languages = ['cpp', 'python', 'java'];

    languages.forEach((lang) => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model, position) => {
          const suggestions = [];

          if (lang === 'cpp') {
            suggestions.push(
              { label: 'include', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'include <${1:iostream}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'C++ Include Directive' },
              { label: 'cout', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'std::cout << ${1:"message"} << std::endl;', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Standard Output' },
              { label: 'cin', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'std::cin >> ${1:variable};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: 'main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'int main() {\n\t$0\n\treturn 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
            );
          }

          if (lang === 'python') {
            suggestions.push(
              { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print($0)', detail: 'Print to console' },
              { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:module}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: 'def', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'def ${1:function_name}(${2:params}):\n\t$0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
            );
          }

          if (lang === 'java') {
            suggestions.push(
              { label: 'sysout', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'System.out.println($0);', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: 'public class', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'public class ${1:Main} {\n\tpublic static void main(String[] args) {\n\t\t$0\n\t}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
            );
          }

          return { suggestions: suggestions };
        }
      });
    });
  };

  const handleRun = async () => {
    setOutput("Running...");
    setAiAnalysis("");
    try {
      const { data } = await axios.post("http://localhost:5000/execute", { code, language });
      setOutput(data.stdout || data.stderr || "Program executed with no output.");
      
      if (data.stderr) {
        setIsAnalyzing(true);
        const cleaned = data.aiExplanation
          ? data.aiExplanation.replace(/^(Great start|Hello|Hi|Greetings|Let's fix).*?[.!]\s*/gi, "").replace(/^\d+\.\s/gm, '* ').trim()
          : "";
        setAiAnalysis(cleaned);
        setIsAnalyzing(false);
      }
    } catch (err) {
      setOutput("Error: Server unreachable.");
    }
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1e1e1e", overflow: "hidden" }}>
      <header style={{ padding: "8px 15px", background: "#333", borderBottom: "1px solid #444", display: "flex", alignItems: "center" }}>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: "#444", color: "#fff", padding: "4px", borderRadius: "4px" }}>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <button onClick={handleRun} style={{ marginLeft: "10px", padding: "4px 12px", background: "#007acc", color: "white", border: "none", borderRadius: "3px", fontWeight: "bold", cursor: "pointer" }}>
          Run Code
        </button>
      </header>

      <main style={{ flex: 1, overflow: "hidden" }}>
        <Group direction="horizontal">
          <Panel defaultSize={50} minSize={20}>
            <div style={{ height: "100%", overflow: "hidden" }}>
              <Editor 
                height="100%" 
                theme="vs-dark" 
                language={language} 
                value={code} 
                onMount={handleEditorDidMount} // Essential for registration
                onChange={(val) => setCode(val)} 
                options={{ 
                  fontSize: 14,
                  automaticLayout: true, 
                  wordWrap: "on",
                  minimap: { enabled: false },
                  quickSuggestions: { other: true, comments: true, strings: true },
                  suggestOnTriggerCharacters: true,
                  snippetSuggestions: "top"
                }} 
              />
            </div>
          </Panel>

          <Separator style={{ width: "4px", background: "#333", cursor: "col-resize" }} />

          <Panel defaultSize={50} minSize={20}>
            <Group direction="vertical">
              <Panel defaultSize={40}>
                <div style={{ height: "100%", padding: "12px", color: "#00ff00", overflowY: "auto", background: "#1e1e1e" }}>
                  <div style={{ color: "#888", fontSize: "10px", textTransform: "uppercase", marginBottom: "5px" }}>Output</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "13px" }}>{output}</pre>
                </div>
              </Panel>
              
              <Separator style={{ height: "4px", background: "#333", cursor: "row-resize" }} />

              <Panel defaultSize={60}>
                <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#252526", overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", color: "#00d4ff", fontSize: "10px", fontWeight: "bold", borderBottom: "1px solid #333" }}>
                    AI DEBUGGER INSIGHTS
                  </div>
                  <div style={{ flex: 1, padding: "15px", overflowY: "auto", overflowX: "hidden" }}>
                    {isAnalyzing ? (
                      <span style={{ color: "#fff" }}>Analyzing...</span>
                    ) : aiAnalysis ? (
                      <div style={{ width: "100%", maxWidth: "100%", color: "#fff" }}>
                        <ReactMarkdown 
                          components={{
                            p: ({children}) => <p style={{ color: "#fff", marginBottom: "10px", wordBreak: "break-word" }}>{children}</p>,
                            li: ({children}) => <li style={{ color: "#fff", marginBottom: "5px" }}>{children}</li>,
                            code({node, inline, className, children, ...props}) {
                              const content = String(children).replace(/\n$/, '');
                              const isCorrectedBlock = aiAnalysis.toLowerCase().includes("corrected code") && !inline && content.length > 10;
                              return isCorrectedBlock ? (
                                <div style={{ marginTop: "15px", marginBottom: "15px", maxWidth: "100%" }}>
                                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2px" }}>
                                    <button onClick={() => copyToClipboard(content)} style={{ padding: "2px 8px", fontSize: "10px", background: "#f0f0f0", color: "#333", border: "1px solid #ccc", cursor: "pointer", borderRadius: "2px" }}>
                                      Copy Fixed Code
                                    </button>
                                  </div>
                                  <pre style={{ margin: 0, padding: "12px", background: "#ffffff", color: "#000", borderRadius: "4px", overflowX: "auto", border: "1px solid #ddd" }}>
                                    <code style={{ fontSize: "12px", whiteSpace: "pre", fontFamily: "monospace" }} {...props}>{children}</code>
                                  </pre>
                                </div>
                              ) : (
                                <code style={{ background: "#444", padding: "2px 4px", borderRadius: "3px", color: "#fff", wordBreak: "break-all" }} {...props}>{children}</code>
                              );
                            }
                          }}
                        >
                          {aiAnalysis}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span style={{ color: "#666", fontSize: "13px" }}>Waiting for execution...</span>
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

export default App;