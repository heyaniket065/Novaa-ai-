import React, { useState } from 'react';
import { Copy, Check, Code2, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onOpenInCodeStudio?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onOpenInCodeStudio,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse blocks
  const parseBlocks = (raw: string) => {
    // Split by code blocks ```lang ... ```
    const parts = raw.split(/(```[a-zA-Z0-9_-]*\n[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const lang = part.substring(3, firstLineEnd).trim() || 'code';
        const code = part.substring(firstLineEnd + 1, part.length - 3).trim();

        return (
          <div
            key={idx}
            className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0d1322] shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                {lang}
              </span>
              <div className="flex items-center space-x-1.5">
                {onOpenInCodeStudio && (
                  <button
                    onClick={() => onOpenInCodeStudio(code, lang)}
                    className="flex items-center space-x-1 px-2 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors"
                    title="Open in Coding Studio"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Run in Studio</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopy(code, idx)}
                  className="flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy Code"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-slate-200 leading-relaxed scrollbar-thin">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Regular markdown paragraphs, lists, tables, bold, and inline codes
      return (
        <div key={idx} className="space-y-2 leading-relaxed text-slate-200 text-sm md:text-[15px]">
          {renderTextContent(part)}
        </div>
      );
    });
  };

  const renderTextContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        elements.push(renderTable(tableBuffer, `table-${elements.length}`));
        tableBuffer = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      // Table line check
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableBuffer.push(line);
        return;
      } else {
        flushTable();
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={lineIdx} className="text-base md:text-lg font-bold text-white mt-3 mb-1">
            {formatInline(line.substring(4))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={lineIdx} className="text-lg md:text-xl font-bold text-indigo-200 mt-4 mb-2 pb-1 border-b border-slate-800">
            {formatInline(line.substring(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={lineIdx} className="text-xl md:text-2xl font-black text-white mt-4 mb-2">
            {formatInline(line.substring(2))}
          </h1>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet list
        elements.push(
          <li key={lineIdx} className="ml-4 list-disc text-slate-300">
            {formatInline(line.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered list
        const num = line.match(/^\d+\.\s/)?.[0] || '1. ';
        elements.push(
          <div key={lineIdx} className="ml-3 flex items-start space-x-2 text-slate-300">
            <span className="font-semibold text-indigo-400 select-none">{num}</span>
            <span>{formatInline(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      } else if (line.startsWith('> ')) {
        // Blockquote
        elements.push(
          <blockquote key={lineIdx} className="border-l-4 border-indigo-500/60 pl-3 py-1 my-2 bg-indigo-500/5 text-slate-300 italic rounded-r">
            {formatInline(line.substring(2))}
          </blockquote>
        );
      } else if (line.trim().length > 0) {
        elements.push(
          <p key={lineIdx} className="my-1">
            {formatInline(line)}
          </p>
        );
      }
    });

    flushTable();
    return elements;
  };

  const renderTable = (rows: string[], key: string) => {
    const parsedRows = rows
      .filter((r) => !r.includes('---'))
      .map((r) =>
        r
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );

    if (parsedRows.length === 0) return null;
    const header = parsedRows[0];
    const body = parsedRows.slice(1);

    return (
      <div key={key} className="my-3 overflow-x-auto rounded-lg border border-slate-700/60">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-slate-800/80 text-slate-200">
            <tr>
              {header.map((col, i) => (
                <th key={i} className="px-3 py-2 font-semibold border-b border-slate-700">
                  {formatInline(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/30">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-300">
                    {formatInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatInline = (text: string): React.ReactNode => {
    // Process inline code, bold, links, LaTeX formula preview
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\$[^$]+\$)/g);

    return tokens.map((token, i) => {
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono text-xs border border-slate-700/50"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return <em key={i} className="italic text-slate-300">{token.slice(1, -1)}</em>;
      }
      if (token.startsWith('$') && token.endsWith('$')) {
        return (
          <span
            key={i}
            className="font-serif italic text-amber-300 px-1 py-0.5 bg-amber-500/10 rounded inline-block"
            title="Formula"
          >
            {token.slice(1, -1)}
          </span>
        );
      }
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        );
      }
      return token;
    });
  };

  return <div className="space-y-1">{parseBlocks(content)}</div>;
};
