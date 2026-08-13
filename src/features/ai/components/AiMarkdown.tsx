import type { ReactNode } from "react";

const INLINE_PATTERN = /(\[[^\]]+\]\([^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

export function AiMarkdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="ai-markdown text-[14px] leading-7 text-slate-700 sm:text-[15px]">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "code"; language: string; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; rows: string[][] };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.trimStart().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", language, text: code.join("\n") });
      index += 1;
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }
    if (line.trimStart().startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith(">")) {
        quote.push(lines[index].trimStart().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quote });
      continue;
    }
    const listMatch = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(lines[index]);
        if (!item || Boolean(item[2]) !== ordered) break;
        items.push(item[3]);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (isTableHeader(lines, index)) {
      const rows = [splitTableRow(lines[index])];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !startsBlock(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index];
  return (
    /^#{1,4}\s+/.test(line.trim()) ||
    line.trimStart().startsWith("```") ||
    line.trimStart().startsWith(">") ||
    /^\s*(?:[-*+]|\d+\.)\s+/.test(line) ||
    isTableHeader(lines, index)
  );
}

function isTableHeader(lines: string[], index: number): boolean {
  return Boolean(
    lines[index]?.includes("|") &&
      lines[index + 1] &&
      /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])
  );
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function renderBlock(block: Block, key: number): ReactNode {
  if (block.type === "heading") {
    const sizes = ["", "text-xl", "text-lg", "text-base", "text-sm"];
    return (
      <h3 key={key} className={`mb-2 mt-5 font-semibold tracking-tight text-slate-950 ${sizes[block.level]}`}>
        {inline(block.text)}
      </h3>
    );
  }
  if (block.type === "paragraph") {
    return <p key={key} className="mb-3 text-pretty last:mb-0">{inline(block.text)}</p>;
  }
  if (block.type === "quote") {
    return (
      <blockquote key={key} className="my-4 border-l-2 border-cyan-500 bg-cyan-50/70 px-4 py-3 text-slate-600">
        {block.lines.map((line, index) => <p key={index}>{inline(line)}</p>)}
      </blockquote>
    );
  }
  if (block.type === "code") {
    return (
      <div key={key} className="my-4 overflow-hidden rounded-xl bg-slate-950 text-slate-100">
        {block.language ? <div className="border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-widest text-slate-400">{block.language}</div> : null}
        <pre className="overflow-x-auto p-4 text-xs leading-6"><code>{block.text}</code></pre>
      </div>
    );
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag key={key} className={`mb-4 ml-5 space-y-1.5 ${block.ordered ? "list-decimal" : "list-disc marker:text-cyan-600"}`}>
        {block.items.map((item, index) => <li key={index} className="pl-1">{inline(item)}</li>)}
      </Tag>
    );
  }
  return (
    <div key={key} className="my-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs font-semibold text-slate-700">
          <tr>{block.rows[0].map((cell, index) => <th key={index} className="border-b border-slate-200 px-4 py-3">{inline(cell)}</th>)}</tr>
        </thead>
        <tbody>
          {block.rows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top tabular-nums">{inline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).filter(Boolean).map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={index} className="font-semibold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-cyan-800">{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(part);
    if (link && /^https?:\/\//i.test(link[2])) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-900">{link[1]}</a>;
    }
    return part;
  });
}
