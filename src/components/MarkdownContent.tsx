'use client';

import { useMemo } from 'react';

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const parsedContent = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 跳過空行
      if (!trimmed) {
        i++;
        continue;
      }

      // H1 標題
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold mt-4 mb-2 text-white">
            {trimmed.slice(2)}
          </h1>
        );
        i++;
        continue;
      }

      // H2 標題
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-lg font-bold mt-3 mb-2 text-blue-300">
            {trimmed.slice(3)}
          </h2>
        );
        i++;
        continue;
      }

      // H3 標題
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold mt-2 mb-1 text-gray-300">
            {trimmed.slice(4)}
          </h3>
        );
        i++;
        continue;
      }

      // 列表項
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const listItems: JSX.Element[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          const itemText = lines[i].trim().slice(2);
          listItems.push(
            <li key={`li-${i}`} className="text-sm text-gray-300 mb-1">
              {parseInlineMarkdown(itemText)}
            </li>
          );
          i++;
        }
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside ml-2 mb-2">
            {listItems}
          </ul>
        );
        continue;
      }

      // 分割線
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-700" />);
        i++;
        continue;
      }

      // 普通段落
      elements.push(
        <p key={`p-${i}`} className="text-sm text-gray-300 mb-2 leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  }, [content]);

  return <div className="space-y-2 text-gray-100">{parsedContent}</div>;
}

function parseInlineMarkdown(text: string): JSX.Element | string {
  const parts: (JSX.Element | string)[] = [];
  let lastIndex = 0;
  const regex = /\*\*(.*?)\*\*|__(.*?)__|`(.*?)`|\*(.*?)\*|_(.*?)_|【(.*?)】/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] || match[2]) {
      // 粗體 **text** 或 __text__
      parts.push(
        <strong key={`strong-${parts.length}`} className="font-bold text-white">
          {match[1] || match[2]}
        </strong>
      );
    } else if (match[3]) {
      // 代碼 `text`
      parts.push(
        <code key={`code-${parts.length}`} className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-300 text-xs font-mono">
          {match[3]}
        </code>
      );
    } else if (match[4] || match[5]) {
      // 斜體 *text* 或 _text_
      parts.push(
        <em key={`em-${parts.length}`} className="italic text-gray-400">
          {match[4] || match[5]}
        </em>
      );
    } else if (match[6]) {
      // 中文方括號 【text】 - 用於強調
      parts.push(
        <span key={`highlight-${parts.length}`} className="bg-blue-900/40 px-1 rounded text-blue-200">
          {match[6]}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // 添加剩餘文本
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}
