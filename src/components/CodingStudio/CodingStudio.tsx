import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Copy,
  Check,
  Download,
  AlignLeft,
  Trash2,
  Bug,
  Eye,
  Code2,
  Terminal,
  FolderOpen,
  Sparkles,
  ExternalLink,
  Loader2,
  Plus,
} from 'lucide-react';
import type { CodeProject } from '../../types/index.ts';

interface CodingStudioProps {
  initialCode?: string;
  initialLanguage?: string;
  onSendToChat?: (prompt: string) => void;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: #4f46e5;
      color: #e0e7ff;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: 1px;
    }
    button {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">LIVE PREVIEW SANDBOX</div>
    <h2>Interactive NOVA Studio App</h2>
    <p style="color: #94a3b8; max-width: 320px;">Edit this HTML/CSS/JS code and see instant live reload in your browser preview.</p>
    <button id="counterBtn">Clicks: 0</button>
  </div>
  <script>
    let count = 0;
    const btn = document.getElementById('counterBtn');
    btn.addEventListener('click', () => {
      count++;
      btn.innerText = 'Clicks: ' + count;
    });
  </script>
</body>
</html>`,
  javascript: `// JavaScript Sandbox Runner
function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    let next = a + b;
    a = b;
    b = next;
  }
  return b;
}

console.log("Computing Fibonacci sequence with NOVA Engine...");
const results = [0, 1, 2, 5, 10, 15, 20].map(n => ({
  input: n,
  fib: fibonacci(n)
}));

console.table(results);
console.log("Execution complete! ✨");
`,
  python: `# Python 3 Algorithm & Data Processing
import math

def calculate_stats(numbers):
    avg = sum(numbers) / len(numbers)
    variance = sum((x - avg) ** 2 for x in numbers) / len(numbers)
    std_dev = math.sqrt(variance)
    return {
        "count": len(numbers),
        "mean": round(avg, 3),
        "std_dev": round(std_dev, 3),
        "min": min(numbers),
        "max": max(numbers)
    }

dataset = [14.2, 19.5, 23.8, 17.1, 22.4, 28.0, 31.5, 18.9]
print("--- NOVA Data Analysis Execution ---")
stats = calculate_stats(dataset)
for key, val in stats.items():
    print(f"  {key.upper()}: {val}")

print("Python runtime verified successfully!")
`,
  json: `{
  "projectName": "Nova Coding Studio",
  "version": "2.0.0",
  "capabilities": [
    "Isolated Python Execution",
    "Node.js Subprocess Sandbox",
    "HTML Live DOM Preview",
    "AI Automated Debugger"
  ],
  "status": "ready"
}`,
};

export const CodingStudio: React.FC<CodingStudioProps> = ({
  initialCode,
  initialLanguage = 'javascript',
  onSendToChat,
}) => {
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [code, setCode] = useState<string>(initialCode || DEFAULT_TEMPLATES[initialLanguage] || DEFAULT_TEMPLATES.javascript);
  const [output, setOutput] = useState<string>('');
  const [errorOutput, setErrorOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');
  const [copied, setCopied] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isDebugging, setIsDebugging] = useState<boolean>(false);
  const [aiDebugAnalysis, setAiDebugAnalysis] = useState<string | null>(null);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Update code when initial props change
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      if (initialLanguage) setLanguage(initialLanguage);
    }
  }, [initialCode, initialLanguage]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!initialCode && DEFAULT_TEMPLATES[newLang]) {
      setCode(DEFAULT_TEMPLATES[newLang]);
    }
    if (newLang === 'html') {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setErrorOutput('');
    setAiDebugAnalysis(null);

    if (language === 'html') {
      // Live preview inside sandboxed iframe
      setActiveTab('preview');
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorOutput(data.stderr || data.error || 'Execution failed.');
      } else {
        setOutput(data.stdout || '');
        if (data.stderr) setErrorOutput(data.stderr);
        setExecutionTime(data.executionTime);
      }
    } catch (err: any) {
      setErrorOutput(`Client request error: ${err.message}`);
    } finally {
      setIsRunning(false);
      setActiveTab('console');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      javascript: 'js',
      python: 'py',
      html: 'html',
      typescript: 'ts',
      json: 'json',
    };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-project.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFormat = () => {
    if (language === 'json') {
      try {
        setCode(JSON.stringify(JSON.parse(code), null, 2));
      } catch (e) {
        // ignore invalid json formatting
      }
    } else {
      // Clean trim and normalized line endings
      setCode(code.trimEnd() + '\n');
    }
  };

  const handleAiDebug = async () => {
    if (!code) return;
    setIsDebugging(true);
    setAiDebugAnalysis(null);

    const diagnostics = errorOutput ? `Errors:\n${errorOutput}` : 'Please review this code for bugs, optimization, and security issues.';

    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'code_debug',
          input: code,
          context: diagnostics,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setAiDebugAnalysis(data.result);
      }
    } catch (err: any) {
      setAiDebugAnalysis(`Failed to run AI debugger: ${err.message}`);
    } finally {
      setIsDebugging(false);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-slate-200 overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#111827] border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm tracking-wide">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <span>CODING STUDIO</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Select programming language"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3 (Sandbox)</option>
            <option value="html">HTML / CSS / JS (Live Preview)</option>
            <option value="typescript">TypeScript</option>
            <option value="json">JSON</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm shadow-emerald-900/40 disabled:opacity-50"
            title="Execute Code"
            aria-label="Run code"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          {/* AI Debug Button */}
          <button
            onClick={handleAiDebug}
            disabled={isDebugging}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-medium text-xs transition-colors"
            title="Analyze & Fix Code with AI"
            aria-label="AI Debug"
          >
            {isDebugging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Bug className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Debug</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Copy Code"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Format Button */}
          <button
            onClick={handleFormat}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Format Code"
            aria-label="Format code"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Download Code File"
            aria-label="Download code file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setCode(DEFAULT_TEMPLATES[language] || '')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset to Template"
            aria-label="Reset code template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor & Output Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-0 overflow-hidden">
        {/* Left: Code Editor with Line Numbers */}
        <div className="relative flex h-full min-h-[300px] bg-[#0c101d] overflow-hidden">
          {/* Line Numbers Gutter */}
          <div className="w-11 py-4 pr-2 text-right font-mono text-xs text-slate-600 bg-[#090d18] select-none border-r border-slate-800/80 overflow-hidden shrink-0">
            {Array.from({ length: Math.max(lineCount, 20) }).map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea Code Input */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 p-4 bg-transparent font-mono text-xs md:text-sm text-slate-200 placeholder-slate-600 leading-6 resize-none focus:outline-none overflow-y-auto whitespace-pre tab-[2]"
            aria-label="Code editor"
          />
        </div>

        {/* Right: Output Tabs (Console / Web Preview / AI Diagnostics) */}
        <div className="flex flex-col h-full bg-[#0a0e1a] min-h-[250px] overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'console'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Output</span>
              </button>

              {language === 'html' && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {executionTime !== null && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {executionTime}ms
                </span>
              )}
              <button
                onClick={() => {
                  setOutput('');
                  setErrorOutput('');
                  setAiDebugAnalysis(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="Clear Output"
                aria-label="Clear output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm">
            {activeTab === 'preview' && language === 'html' ? (
              <iframe
                ref={previewIframeRef}
                srcDoc={code}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full min-h-[300px] border-none rounded-lg bg-white"
                title="HTML Live Sandbox Preview"
              />
            ) : (
              <div className="space-y-4">
                {/* AI Debug Diagnosis Card */}
                {aiDebugAnalysis && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-slate-200">
                    <div className="flex items-center space-x-2 text-indigo-300 font-semibold mb-2 text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>AI Code Diagnostics & Suggested Fix</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-indigo-100">
                      {aiDebugAnalysis}
                    </pre>
                  </div>
                )}

                {/* Stderr Banner */}
                {errorOutput && (
                  <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300">
                    <div className="font-semibold mb-1 text-xs uppercase tracking-wider text-rose-400">
                      Runtime Error / Stderr:
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{errorOutput}</pre>
                  </div>
                )}

                {/* Stdout Output */}
                {output ? (
                  <div className="p-3 rounded-lg bg-[#0f1422] border border-slate-800 text-slate-200 font-mono">
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  </div>
                ) : !errorOutput && !aiDebugAnalysis ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-center font-sans">
                    <Terminal className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Click <strong className="text-slate-400">Run</strong> to execute code in the sandbox</p>
                    <p className="text-xs text-slate-600 mt-1">Output and diagnostics will appear here in real time.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
