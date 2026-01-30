'use client';

/**
 * Intake Chatbot Component (Phase 3)
 * ===================================
 * Conversational AI for symptom intake and coordination.
 * 
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    ETHICAL SAFEGUARDS                             ║
 * ║══════════════════════════════════════════════════════════════════║
 * ║ This chatbot is STRICTLY LIMITED to:                              ║
 * ║ ✓ Helping patients describe symptoms                              ║
 * ║ ✓ Asking non-medical clarification questions                      ║
 * ║ ✓ Explaining consent steps                                        ║
 * ║ ✓ Helping schedule teleconsultations                              ║
 * ║                                                                   ║
 * ║ EXPLICITLY FORBIDDEN:                                             ║
 * ║ ✗ Disease names or diagnoses                                      ║
 * ║ ✗ Treatment advice or medications                                 ║
 * ║ ✗ Emergency guidance                                              ║
 * ║ ✗ Risk probabilities                                              ║
 * ║ ✗ Any medical conclusions                                         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface IntakeChatbotProps {
    onSymptomsCollected?: (symptoms: string) => void;
    language?: string;
}

// Initial system context (shown to user)
const WELCOME_MESSAGE = `Hello! 👋 I'm here to help you describe your symptoms clearly.

I can help with:
• Understanding what you're experiencing
• Asking clarifying questions
• Explaining how the process works

⚠️ Important: I am NOT a doctor. I cannot diagnose conditions, suggest treatments, or give medical advice. Only your doctor can do that.

How are you feeling today?`;

export function IntakeChatbot({
    onSymptomsCollected,
    language = 'en',
}: IntakeChatbotProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MESSAGE,
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [collectedSymptoms, setCollectedSymptoms] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Call backend chatbot endpoint
            const response = await fetch('/api/chatbot/intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input.trim(),
                    history: messages.slice(-6), // Last 6 messages for context
                    language,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Collect symptoms if extracted
            if (data.extractedSymptoms) {
                setCollectedSymptoms((prev) => [...prev, ...data.extractedSymptoms]);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content:
                        'I apologize, but I had trouble understanding. Could you please rephrase that?',
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, language]);

    // Handle finish and submit symptoms
    const handleFinish = useCallback(() => {
        // Compile all user messages as symptom description
        const userMessages = messages
            .filter((m) => m.role === 'user')
            .map((m) => m.content)
            .join('\n');

        onSymptomsCollected?.(userMessages);
    }, [messages, onSymptomsCollected]);

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>💬 Tell Me About Your Symptoms</h3>

            {/* Ethical Disclaimer */}
            <div style={styles.disclaimer}>
                ⚠️ This assistant helps you describe symptoms. It does NOT provide medical advice.
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            ...styles.message,
                            ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
                        }}
                    >
                        <p style={styles.messageContent}>{msg.content}</p>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ ...styles.message, ...styles.assistantMessage }}>
                        <p style={styles.messageContent}>Thinking...</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Collected Symptoms Summary */}
            {collectedSymptoms.length > 0 && (
                <div style={styles.symptomsSummary}>
                    <strong>Symptoms noted:</strong>
                    <ul style={styles.symptomsList}>
                        {collectedSymptoms.map((symptom, i) => (
                            <li key={i}>{symptom}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Input Area */}
            <div style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Describe how you're feeling..."
                    style={styles.input}
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    style={{
                        ...styles.sendBtn,
                        ...(!input.trim() || isLoading ? styles.sendBtnDisabled : {}),
                    }}
                >
                    ➤
                </button>
            </div>

            {/* Finish Button */}
            {messages.length > 2 && (
                <button onClick={handleFinish} style={styles.finishBtn}>
                    ✓ Done - Generate Summary
                </button>
            )}

            {/* Safety Notice */}
            <div style={styles.safetyNotice}>
                🚨 <strong>Emergency?</strong> Call emergency services immediately.
                This app is NOT for emergencies.
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '600px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
    },
    title: {
        padding: 'var(--spacing-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        borderBottom: '1px solid var(--border-color)',
        margin: 0,
    },
    disclaimer: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning-dark)',
        fontSize: 'var(--font-size-xs)',
        textAlign: 'center',
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
    },
    message: {
        maxWidth: '85%',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
    },
    userMessage: {
        alignSelf: 'flex-end',
        background: 'var(--color-primary)',
        color: 'white',
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        background: 'var(--bg-secondary)',
    },
    messageContent: {
        margin: 0,
        fontSize: 'var(--font-size-sm)',
        whiteSpace: 'pre-wrap',
    },
    symptomsSummary: {
        margin: '0 var(--spacing-md)',
        padding: 'var(--spacing-sm)',
        background: 'var(--color-success-light)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-xs)',
    },
    symptomsList: {
        margin: 'var(--spacing-xs) 0 0 var(--spacing-md)',
        padding: 0,
    },
    inputArea: {
        display: 'flex',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        borderTop: '1px solid var(--border-color)',
    },
    input: {
        flex: 1,
        padding: 'var(--spacing-md)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-base)',
    },
    sendBtn: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-lg)',
        cursor: 'pointer',
    },
    sendBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    finishBtn: {
        margin: '0 var(--spacing-md) var(--spacing-md)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 700,
        cursor: 'pointer',
    },
    safetyNotice: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        fontSize: 'var(--font-size-xs)',
        textAlign: 'center',
    },
};
