'use client'

import React from 'react'

interface FormattedTextProps {
    text: string
    className?: string
    style?: React.CSSProperties
}

export default function FormattedText({ text, className, style }: FormattedTextProps) {
    if (!text) return null

    // Split by lines first to handle newlines
    const lines = text.split('\n')

    const formatText = (content: string) => {
        // Regex for WhatsApp formatting
        // *bold*
        // _italic_
        // ~strikethrough~
        // `code`
        // @username

        // We use a strategy of splitting and mapping to avoid complex nested regex issues
        // for this simple implementation.

        let parts: (string | JSX.Element)[] = [content]

        // Code: `text`
        parts = parts.flatMap(part => {
            if (typeof part !== 'string') return [part]
            const regex = /`([^`]+)`/g
            const result: (string | JSX.Element)[] = []
            let lastIndex = 0
            let match

            while ((match = regex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    result.push(part.substring(lastIndex, match.index))
                }
                result.push(
                    <code key={`code-${match.index}`} style={{
                        background: 'var(--bg-secondary)',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                    }}>
                        {match[1]}
                    </code>
                )
                lastIndex = regex.lastIndex
            }
            if (lastIndex < part.length) {
                result.push(part.substring(lastIndex))
            }
            return result
        })

        // Bold: *text*
        parts = parts.flatMap(part => {
            if (typeof part !== 'string') return [part]
            const regex = /\*([^*]+)\*/g
            const result: (string | JSX.Element)[] = []
            let lastIndex = 0
            let match

            while ((match = regex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    result.push(part.substring(lastIndex, match.index))
                }
                result.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>)
                lastIndex = regex.lastIndex
            }
            if (lastIndex < part.length) {
                result.push(part.substring(lastIndex))
            }
            return result
        })

        // Italic: _text_
        parts = parts.flatMap(part => {
            if (typeof part !== 'string') return [part]
            const regex = /_([^_]+)_/g
            const result: (string | JSX.Element)[] = []
            let lastIndex = 0
            let match

            while ((match = regex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    result.push(part.substring(lastIndex, match.index))
                }
                result.push(<em key={`italic-${match.index}`}>{match[1]}</em>)
                lastIndex = regex.lastIndex
            }
            if (lastIndex < part.length) {
                result.push(part.substring(lastIndex))
            }
            return result
        })

        // Strikethrough: ~text~
        parts = parts.flatMap(part => {
            if (typeof part !== 'string') return [part]
            const regex = /~([^~]+)~/g
            const result: (string | JSX.Element)[] = []
            let lastIndex = 0
            let match

            while ((match = regex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    result.push(part.substring(lastIndex, match.index))
                }
                result.push(<del key={`strike-${match.index}`}>{match[1]}</del>)
                lastIndex = regex.lastIndex
            }
            if (lastIndex < part.length) {
                result.push(part.substring(lastIndex))
            }
            return result
        })

        // Tags: @username
        parts = parts.flatMap(part => {
            if (typeof part !== 'string') return [part]
            const regex = /@(\w+)/g
            const result: (string | JSX.Element)[] = []
            let lastIndex = 0
            let match

            while ((match = regex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    result.push(part.substring(lastIndex, match.index))
                }
                result.push(
                    <span key={`tag-${match.index}`} style={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                        background: 'var(--primary-light)',
                        padding: '0 2px',
                        borderRadius: '2px'
                    }}>
                        @{match[1]}
                    </span>
                )
                lastIndex = regex.lastIndex
            }
            if (lastIndex < part.length) {
                result.push(part.substring(lastIndex))
            }
            return result
        })

        return parts
    }

    return (
        <div className={className} style={{ ...style, whiteSpace: 'pre-wrap' }}>
            {lines.map((line, i) => (
                <React.Fragment key={i}>
                    {formatText(line)}
                    {i < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </div>
    )
}
