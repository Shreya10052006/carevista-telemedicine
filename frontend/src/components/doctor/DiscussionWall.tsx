'use client';

/**
 * Discussion Wall Component
 * ==========================
 * Doctor-only professional discussion space.
 * 
 * COMPLIANCE NOTES:
 * - No patient names or IDs allowed
 * - No images, reports, or scans
 * - No case details that could identify patients
 * - Hypothetical/academic discussions only
 * - Stored OUTSIDE patient-linked tables
 */

import { useState, useEffect } from 'react';
import styles from './DiscussionWall.module.css';

interface Discussion {
    id: string;
    title: string;
    content: string;
    category: string;
    author_name: string;
    reply_count: number;
    created_at: string;
}

interface Reply {
    id: string;
    content: string;
    author_name: string;
    created_at: string;
}

export function DiscussionWall() {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [selectedPost, setSelectedPost] = useState<Discussion | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCategory, setNewPostCategory] = useState('general');
    const [replyContent, setReplyContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const fetchDiscussions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/discussions', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setDiscussions(data.discussions || []);
        } catch (err) {
            console.error('[Discussions] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPost = async (postId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/discussions/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setSelectedPost(data.post);
            setReplies(data.replies || []);
        } catch (err) {
            console.error('[Discussions] Error:', err);
        }
    };

    const createPost = async () => {
        setError(null);

        if (!newPostTitle.trim() || !newPostContent.trim()) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/discussions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: newPostTitle,
                    content: newPostContent,
                    category: newPostCategory,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to create post');
            }

            setNewPostTitle('');
            setNewPostContent('');
            setShowNewPost(false);
            fetchDiscussions();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const submitReply = async () => {
        if (!selectedPost || !replyContent.trim()) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/discussions/${selectedPost.id}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: replyContent }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to add reply');
            }

            setReplyContent('');
            fetchPost(selectedPost.id);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'academic': return '📚 Academic';
            case 'experience': return '💡 Experience';
            default: return '💬 General';
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading discussions...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Professional Discussion Wall</h2>
                <button
                    className={styles.newPostButton}
                    onClick={() => setShowNewPost(true)}
                >
                    + New Discussion
                </button>
            </div>

            {/* COMPLIANCE: Clear warning */}
            <div className={styles.warning}>
                ⚠️ <strong>Do NOT share:</strong> Patient names, IDs, images, reports, or any identifiable case details.
                This space is for hypothetical and academic discussions only.
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* New Post Form */}
            {showNewPost && (
                <div className={styles.newPostForm}>
                    <h3>Start a Discussion</h3>
                    <input
                        type="text"
                        placeholder="Discussion title..."
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        className={styles.input}
                    />
                    <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className={styles.select}
                    >
                        <option value="general">💬 General Discussion</option>
                        <option value="academic">📚 Academic / Research</option>
                        <option value="experience">💡 Clinical Experience</option>
                    </select>
                    <textarea
                        placeholder="Share your thoughts (hypothetical cases only)..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className={styles.textarea}
                        rows={5}
                    />
                    <div className={styles.formActions}>
                        <button
                            className={styles.cancelButton}
                            onClick={() => setShowNewPost(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.submitButton}
                            onClick={createPost}
                        >
                            Post Discussion
                        </button>
                    </div>
                </div>
            )}

            {/* Discussion List */}
            <div className={styles.discussionList}>
                {discussions.length === 0 ? (
                    <p className={styles.empty}>No discussions yet. Start one!</p>
                ) : (
                    discussions.map((disc) => (
                        <div
                            key={disc.id}
                            className={styles.discussionCard}
                            onClick={() => fetchPost(disc.id)}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.category}>
                                    {getCategoryLabel(disc.category)}
                                </span>
                                <span className={styles.replies}>
                                    💬 {disc.reply_count}
                                </span>
                            </div>
                            <h3 className={styles.cardTitle}>{disc.title}</h3>
                            <p className={styles.cardContent}>{disc.content}</p>
                            <div className={styles.cardFooter}>
                                <span className={styles.author}>{disc.author_name}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Selected Post Modal */}
            {selectedPost && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <button
                            className={styles.closeButton}
                            onClick={() => setSelectedPost(null)}
                        >
                            ✕
                        </button>

                        <div className={styles.postDetail}>
                            <span className={styles.category}>
                                {getCategoryLabel(selectedPost.category)}
                            </span>
                            <h2>{selectedPost.title}</h2>
                            <p className={styles.author}>By {selectedPost.author_name}</p>
                            <p className={styles.postContent}>{selectedPost.content}</p>
                        </div>

                        <div className={styles.repliesSection}>
                            <h4>Replies ({replies.length})</h4>
                            {replies.map((reply) => (
                                <div key={reply.id} className={styles.reply}>
                                    <p>{reply.content}</p>
                                    <span className={styles.replyAuthor}>
                                        — {reply.author_name}
                                    </span>
                                </div>
                            ))}

                            <div className={styles.replyForm}>
                                <textarea
                                    placeholder="Add a reply (hypothetical cases only)..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    rows={3}
                                />
                                <button onClick={submitReply}>Reply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPLIANCE: Footer */}
            <div className={styles.footer}>
                <small>
                    📌 This wall is NOT linked to patient records.
                    📌 This wall is NOT AI-moderated for diagnosis.
                </small>
            </div>
        </div>
    );
}
