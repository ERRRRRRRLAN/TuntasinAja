'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'
import { XIcon } from './Icons'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    maxWidth?: string
    showCloseButton?: boolean
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '500px',
    showCloseButton = true
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [contentVisible, setContentVisible] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll
            document.body.style.overflow = 'hidden'
            setIsVisible(true)
            const timer = setTimeout(() => {
                setContentVisible(true)
            }, 30)
            return () => clearTimeout(timer)
        } else if (isVisible) {
            setContentVisible(false)
            const timer = setTimeout(() => {
                setIsVisible(false)
                document.body.style.overflow = 'unset'
            }, 400)
            return () => clearTimeout(timer)
        }
    }, [isOpen, isVisible])

    // Back handler for mobile/browser
    const [shouldHandleBack, setShouldHandleBack] = useState(false)
    useEffect(() => {
        if (isOpen && isVisible) {
            const timer = setTimeout(() => {
                setShouldHandleBack(true)
            }, 100)
            return () => clearTimeout(timer)
        } else {
            setShouldHandleBack(false)
        }
    }, [isOpen, isVisible])

    useBackHandler(shouldHandleBack, onClose)

    if (!mounted || (!isOpen && !isVisible)) return null

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose()
        }
    }

    const modalContent = (
        <div
            ref={overlayRef}
            className="modal-portal-overlay"
            onClick={handleOverlayClick}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)',
                WebkitBackdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '1rem'
            }}
        >
            <div
                ref={contentRef}
                className="modal-portal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white',
                    width: '100%',
                    maxWidth,
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    opacity: contentVisible ? 1 : 0,
                    transform: contentVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1.25rem',
                            right: '1.25rem',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-light)',
                            zIndex: 10,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light)'}
                    >
                        <XIcon size={18} />
                    </button>
                )}

                {title && (
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                        {title}
                    </h3>
                )}

                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
