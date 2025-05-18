import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="prose prose-lg prose-blue max-w-none text-gray-800 
                   prose-headings:font-bold prose-headings:mb-4 
                   prose-h1:text-3xl prose-h1:mt-6 
                   prose-h2:text-2xl prose-h2:mt-5 
                   prose-h3:text-xl prose-h3:mt-4 
                   prose-h4:text-lg prose-h4:mt-4
                   prose-p:my-3
                   prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                   prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-md
                   prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                   prose-code:text-sm prose-code:font-mono
                   prose-ul:pl-6 prose-ul:my-3 
                   prose-ol:pl-6 prose-ol:my-3
                   prose-li:my-1 prose-li:pl-2
                   prose-strong:font-bold prose-strong:text-gray-900
                   prose-blockquote:pl-4 prose-blockquote:border-l-4 prose-blockquote:border-gray-300
                   prose-blockquote:italic prose-blockquote:my-4 prose-blockquote:text-gray-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 