import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // Process content line by line for better block identification
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let currentBlock: string[] = [];
    let inCodeBlock = false;
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const renderInlineStyles = (text: string) => {
        // Handle links: [text](url)
        const linkParts = text.split(/(\[.*?\]\(.*?\))/g);

        return linkParts.flatMap((part, i) => {
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                    return (
                        <a
                            key={i}
                            href={match[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium"
                        >
                            {renderInlineStyles(match[1])}
                        </a>
                    );
                }
            }

            // Handle bold: **text**
            const boldParts = part.split(/(\*\*.*?\*\*)/g);

            return boldParts.flatMap((bPart, bi) => {
                if (bPart.startsWith('**') && bPart.endsWith('**')) {
                    return <strong key={`${i}-${bi}`} className="text-white font-bold">{bPart.slice(2, -2)}</strong>;
                }

                // Handle inline code: `code`
                const codeParts = bPart.split(/(`.*?`)/g);
                return codeParts.flatMap((cPart, ci) => {
                    if (cPart.startsWith('`') && cPart.endsWith('`')) {
                        return <code key={`${i}-${bi}-${ci}`} className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded font-mono text-sm">{cPart.slice(1, -1)}</code>;
                    }

                    // Handle italic: *text*
                    const italicParts = cPart.split(/(\*.*?\*)/g);
                    return italicParts.map((iPart, ii) => {
                        if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
                            return <em key={`${i}-${bi}-${ci}-${ii}`} className="text-gray-300 italic">{iPart.slice(1, -1)}</em>;
                        }
                        return iPart;
                    });
                });
            });
        });
    };

    const flushList = () => {
        if (listItems.length > 0) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul';
            const listClass = listType === 'ol' ? "list-decimal ml-8 space-y-3 my-6" : "list-disc ml-8 space-y-3 my-6";

            elements.push(
                <ListTag key={`list-${elements.length}`} className={`${listClass} text-gray-300 text-lg`}>
                    {listItems.map((item, idx) => (
                        <li key={idx} className="pl-2 leading-relaxed">
                            {renderInlineStyles(item)}
                        </li>
                    ))}
                </ListTag>
            );
            listItems = [];
            listType = null;
        }
    };

    const flushParagraph = () => {
        if (currentBlock.length > 0) {
            const text = currentBlock.join(' ').trim();
            if (text) {
                elements.push(
                    <p key={`p-${elements.length}`} className="text-lg text-gray-300 leading-relaxed font-light my-6">
                        {renderInlineStyles(text)}
                    </p>
                );
            }
            currentBlock = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Code Block Toggle
        if (trimmed.startsWith('```')) {
            flushParagraph();
            flushList();
            if (!inCodeBlock) {
                inCodeBlock = true;
                currentBlock = [];
            } else {
                elements.push(
                    <div key={`code-${elements.length}`} className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 overflow-x-auto my-8 font-mono text-sm text-gray-300 shadow-2xl backdrop-blur-sm">
                        <pre className="whitespace-pre">{currentBlock.join('\n')}</pre>
                    </div>
                );
                currentBlock = [];
                inCodeBlock = false;
            }
            continue;
        }

        if (inCodeBlock) {
            currentBlock.push(line);
            continue;
        }

        // Headers
        if (trimmed.startsWith('# ')) {
            flushParagraph(); flushList();
            elements.push(<h1 key={i} className="text-4xl md:text-5xl font-black text-white mt-16 mb-8 tracking-tight">{renderInlineStyles(trimmed.slice(2))}</h1>);
            continue;
        }
        if (trimmed.startsWith('## ')) {
            flushParagraph(); flushList();
            elements.push(<h2 key={i} className="text-3xl md:text-4xl font-bold text-white mt-14 mb-6 border-l-4 border-purple-500 pl-6">{renderInlineStyles(trimmed.slice(3))}</h2>);
            continue;
        }
        if (trimmed.startsWith('### ')) {
            flushParagraph(); flushList();
            elements.push(<h3 key={i} className="text-2xl md:text-3xl font-bold text-white mt-12 mb-5">{renderInlineStyles(trimmed.slice(4))}</h3>);
            continue;
        }

        // Horizontal Rule
        if (trimmed === '---') {
            flushParagraph(); flushList();
            elements.push(<hr key={i} className="my-12 border-white/10" />);
            continue;
        }

        // Lists (unordered)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            flushParagraph();
            if (listType === 'ol') flushList();
            listType = 'ul';
            listItems.push(trimmed.slice(2));
            continue;
        }

        // Lists (ordered)
        if (/^\d+\.\s/.test(trimmed)) {
            flushParagraph();
            if (listType === 'ul') flushList();
            listType = 'ol';
            listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
            continue;
        }

        // Empty line
        if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
        }

        // Regular line (accumulate into paragraph)
        currentBlock.push(line);
    }

    // Final flush
    flushParagraph();
    flushList();

    return <div className="markdown-content">{elements}</div>;
};
