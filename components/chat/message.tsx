import type { ReactNode } from "react";

function cells(line: string): string[] {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

export function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (line.startsWith("### ")) { blocks.push(<h3 key={index}>{line.slice(4)}</h3>); index += 1; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={index}>{line.slice(3)}</h2>); index += 1; continue; }
    if (line.startsWith("| ") && lines[index + 1]?.includes("---")) {
      const headers = cells(line); index += 2; const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) { rows.push(cells(lines[index])); index += 1; }
      blocks.push(<div className="table-scroll" key={`table-${index}`}><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, cellIndex) => <td key={headers[cellIndex]}>{value}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) { items.push(lines[index].trim().slice(2)); index += 1; }
      blocks.push(<ul key={`list-${index}`}>{items.map((item) => <li key={item}>{item}</li>)}</ul>); continue;
    }
    blocks.push(<p key={index}>{line}</p>); index += 1;
  }
  return <div className="markdown">{blocks}</div>;
}

export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 8.5c8.4 1.6 14.9-.3 23-4.5-2.2 4.9-6.2 8.3-12.4 10.1C10.2 15.4 6.6 14.2 4 8.5Z"/><path d="M6.5 15.3c5.7 1.1 10.4.3 16.2-2.5-1.8 3.8-5.1 6.3-9.8 7.5-3.1.8-5.2-.9-6.4-5Z"/><path d="M10 22c3.2.5 5.9.1 9.2-1.3-1.5 3.2-3.7 5.4-6.2 6.5-1.5-1-2.5-2.7-3-5.2Z"/></svg></span>;
}
