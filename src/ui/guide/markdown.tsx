import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";

/**
 * Safe Markdown renderer built on react-markdown. `remark-gfm` enables tables,
 * strikethrough, task lists, and autolinks; `remark-math` + `rehype-katex`
 * render LaTeX math (`$...$` inline, `$$...$$` display); `rehype-sanitize`
 * strips raw HTML so untrusted model output cannot inject markup, while still
 * permitting the KaTeX math span classes.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", "math", "math-inline", "math-display"],
    ],
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeSanitize, schema], rehypeKatex]}
    >
      {children}
    </ReactMarkdown>
  );
}