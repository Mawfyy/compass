import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * Safe Markdown renderer built on react-markdown. `remark-gfm` enables tables,
 * strikethrough, task lists, and autolinks; `rehype-sanitize` strips any raw
 * HTML so untrusted model output cannot inject markup.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
      {children}
    </ReactMarkdown>
  );
}