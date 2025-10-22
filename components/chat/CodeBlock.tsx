import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { CopyIcon, CheckIcon } from '../Icons';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState<'Copy' | 'Copied!'>('Copy');

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, []); // Only run once on mount to avoid infinite loops

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  return (
    <pre>
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button onClick={handleCopy} className="code-copy-button">
          {copyStatus === 'Copy' ? <CopyIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
          <span>{copyStatus}</span>
        </button>
      </div>
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
};
