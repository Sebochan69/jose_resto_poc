import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownReportProps {
  content: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="markdown-report__h1">{children}</h1>,
  h2: ({ children }) => <h2 className="markdown-report__h2">{children}</h2>,
  h3: ({ children }) => <h3 className="markdown-report__h3">{children}</h3>,
  p: ({ children }) => <p className="markdown-report__p">{children}</p>,
  hr: () => <hr className="markdown-report__hr" />,
  strong: ({ children }) => (
    <strong className="markdown-report__strong">{children}</strong>
  ),
  ul: ({ children }) => <ul className="markdown-report__list">{children}</ul>,
  ol: ({ children }) => (
    <ol className="markdown-report__list markdown-report__list--ordered">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="markdown-report__item">{children}</li>,
  table: ({ children }) => (
    <div className="markdown-report__table-wrap">
      <table className="markdown-report__table">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="markdown-report__thead">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="markdown-report__tbody">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="markdown-report__tr">{children}</tr>,
  th: ({ children }) => <th className="markdown-report__th">{children}</th>,
  td: ({ children }) => <td className="markdown-report__td">{children}</td>,
};

export function MarkdownReport({ content }: MarkdownReportProps) {
  return (
    <div className="markdown-report">
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
