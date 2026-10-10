import { Fragment } from "react";

// Renders the small markdown subset used by CMS pages: "## h2", "### h3", "- list", paragraphs, **bold**.
// Builds React elements (never innerHTML), so admin-entered text cannot inject markup.
function inline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong> : <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>,
  );
}

export function parseBlocks(source = "") {
  const blocks = [];
  let list = null;
  let para = [];
  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "ul", items: list });
    list = null;
  };
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith("### ")) {
      flushPara();
      flushList();
      blocks.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (/^[-*] /.test(line)) {
      flushPara();
      (list ??= []).push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export function Markdown({ source, className = "prose", headingId }) {
  let h2 = 0;
  return (
    <div className={className}>
      {parseBlocks(source).map((b, i) => {
        if (b.type === "h2") return <h2 key={i} id={headingId ? headingId(h2++) : undefined}>{b.text}</h2>;
        if (b.type === "h3") return <h3 key={i}>{b.text}</h3>;
        if (b.type === "ul") return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</ul>;
        return <p key={i}>{inline(b.text, i)}</p>;
      })}
    </div>
  );
}

// Splits a page into its "## " sections — used for the rules accordion
export function sections(source = "") {
  const out = [];
  let current = null;
  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      current = { title: line.slice(3).trim(), body: [] };
      out.push(current);
    } else if (current) current.body.push(line);
  }
  return out.map((s) => ({ ...s, body: s.body.join("\n").trim() }));
}
