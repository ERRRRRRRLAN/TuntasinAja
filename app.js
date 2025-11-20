// State Management
const state = {
    currentUser: null,
    threads: [],
    currentThread: null,
    history: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    setupEventListeners();
    loadThreadsFromStorage();
    loadHistoryFromStorage();
    
    // Add demo data if no data exists (for testing)
    if (state.threads.length === 0 && !localStorage.getItem('demoDataAdded')) {
        addDemoData();
    }
    
    updateUI();
});

// Load user from localStorage
function loadUserFromStorage() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        state.currentUser = JSON.parse(userStr);
    }
}

// Save user to localStorage
function saveUserToStorage() {
    if (state.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem('currentUser');
    }
}

// Load threads from localStorage
function loadThreadsFromStorage() {
    const threadsStr = localStorage.getItem('threads');
    if (threadsStr) {
        state.threads = JSON.parse(threadsStr);
    }
}

// Save threads to localStorage
function saveThreadsToStorage() {
    localStorage.setItem('threads', JSON.stringify(state.threads));
}

// Load history from localStorage
function loadHistoryFromStorage() {
    const historyStr = localStorage.getItem('history');
    if (historyStr) {
        state.history = JSON.parse(historyStr);
    }
}

// Save history to localStorage
function saveHistoryToStorage() {
    localStorage.setItem('history', JSON.stringify(state.history));
}

// Setup Event Listeners
function setupEventListeners() {
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('registerPage');
    });
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('loginPage');
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page === 'feed') showPage('feedPage');
            else if (page === 'history') showPage('historyPage');
            else if (page === 'profile') showPage('profilePage');
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Clear Data (for testing)
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearAllData();
        });
    }

    // Thread form
    document.getElementById('createThreadBtn').addEventListener('click', () => {
        const form = document.getElementById('createThreadForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('cancelThreadBtn').addEventListener('click', () => {
        document.getElementById('createThreadForm').style.display = 'none';
        document.getElementById('threadForm').reset();
    });
    document.getElementById('threadForm').addEventListener('submit', handleCreateThread);

    // Back to feed
    document.getElementById('backToFeedBtn').addEventListener('click', () => {
        showPage('feedPage');
    });
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    updateUI();
}

// Update UI based on state
function updateUI() {
    if (state.currentUser) {
        // User is logged in
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('registerPage').classList.remove('active');
        if (!document.querySelector('.page.active')) {
            showPage('feedPage');
        }
        document.getElementById('mainNav').style.display = 'flex';
        document.getElementById('logoutBtn').style.display = 'block';
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) clearBtn.style.display = 'block';
        updateProfile();
        renderFeed();
        renderHistory();
    } else {
        // User is not logged in
        showPage('loginPage');
        document.getElementById('mainNav').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Email dan password wajib diisi!', 'error');
        return;
    }

    // Simulate login (in real app, this would be an API call)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        state.currentUser = { id: user.id, name: user.name, email: user.email };
        saveUserToStorage();
        showToast(`Selamat datang, ${user.name}!`, 'success');
        updateUI();
    } else {
        showToast('Email atau password salah!', 'error');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

// Handle Register
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    // Validation
    if (!name || name.length < 3) {
        showToast('Nama harus minimal 3 karakter!', 'error');
        document.getElementById('registerName').focus();
        return;
    }
    
    if (!email || !email.includes('@')) {
        showToast('Email tidak valid!', 'error');
        document.getElementById('registerEmail').focus();
        return;
    }
    
    if (!password || password.length < 6) {
        showToast('Password harus minimal 6 karakter!', 'error');
        document.getElementById('registerPassword').focus();
        return;
    }

    // Simulate registration
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showToast('Email sudah terdaftar!', 'error');
        document.getElementById('registerEmail').focus();
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password // In real app, this should be hashed
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    state.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    saveUserToStorage();
    showToast('Berhasil mendaftar!', 'success');
    updateUI();
}

// Handle Logout
function handleLogout() {
    state.currentUser = null;
    saveUserToStorage();
    showToast('Berhasil logout!', 'success');
    updateUI();
}

// Handle Create Thread
function handleCreateThread(e) {
    e.preventDefault();
    const titleSelect = document.getElementById('threadTitle');
    const title = titleSelect.value.trim();
    const comment = document.getElementById('threadComment').value.trim();

    // Validate mata pelajaran
    if (!title) {
        showToast('Pilih mata pelajaran terlebih dahulu!', 'error');
        titleSelect.focus();
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if thread with same title and date already exists
    const existingThread = state.threads.find(
        t => t.title.toLowerCase() === title.toLowerCase() && t.date === today && !t.completed
    );

    if (existingThread) {
        // Thread exists, add as comment instead
        if (comment) {
            addCommentToThread(existingThread.id, comment);
            showToast(
                `Thread "${title}" hari ini sudah dibuat oleh ${existingThread.author}. Postingan Anda ditambahkan sebagai komentar.`,
                'info'
            );
        } else {
            showToast('Thread sudah ada! Silakan tambahkan komentar di thread tersebut.', 'info');
        }
    } else {
        // Create new thread
        const newThread = {
            id: Date.now().toString(),
            title: title,
            author: state.currentUser.name,
            authorId: state.currentUser.id,
            date: today,
            comments: comment ? [{
                id: Date.now().toString(),
                text: comment,
                author: state.currentUser.name,
                authorId: state.currentUser.id,
                date: new Date().toISOString()
            }] : [],
            completed: false
        };

        state.threads.push(newThread);
        saveThreadsToStorage();
        showToast('Thread berhasil dibuat!', 'success');
    }

    document.getElementById('threadForm').reset();
    document.getElementById('createThreadForm').style.display = 'none';
    renderFeed();
}

// Add Comment to Thread
function addCommentToThread(threadId, commentText) {
    const thread = state.threads.find(t => t.id === threadId);
    if (thread) {
        const newComment = {
            id: Date.now().toString(),
            text: commentText,
            author: state.currentUser.name,
            authorId: state.currentUser.id,
            date: new Date().toISOString()
        };
        thread.comments.push(newComment);
        saveThreadsToStorage();
        renderFeed();
        if (state.currentThread && state.currentThread.id === threadId) {
            renderThreadDetail(threadId);
        }
    }
}

// Render Feed
function renderFeed() {
    const container = document.getElementById('threadsContainer');
    if (!container) return;

    // Sort threads: incomplete first, then by date (newest first)
    const sortedThreads = [...state.threads].sort((a, b) => {
        const aCompleted = isThreadCompletedByUser(a.id);
        const bCompleted = isThreadCompletedByUser(b.id);
        if (aCompleted !== bCompleted) {
            return aCompleted ? 1 : -1;
        }
        return new Date(b.date) - new Date(a.date);
    });

    if (sortedThreads.length === 0) {
        container.innerHTML = '<div class="card"><p style="text-align: center; color: var(--text-secondary);">Belum ada thread. Buat thread pertama Anda!</p></div>';
        return;
    }

    container.innerHTML = sortedThreads.map(thread => {
        const completed = isThreadCompletedByUser(thread.id);
        const commentsPreview = thread.comments.slice(0, 2);
        const hasMoreComments = thread.comments.length > 2;

        return `
            <div class="thread-card" onclick="viewThreadDetail('${thread.id}')">
                <div class="thread-header">
                    <div>
                        <h3 class="thread-title ${completed ? 'completed' : ''}">
                            <input type="checkbox" class="thread-checkbox" 
                                   ${completed ? 'checked' : ''} 
                                   onclick="event.stopPropagation(); toggleThreadComplete('${thread.id}')">
                            ${thread.title}
                        </h3>
                        <div class="thread-meta">
                            <span>👤 ${thread.author}</span>
                            <span>📅 ${formatDate(thread.date)}</span>
                            <span>💬 ${thread.comments.length} komentar</span>
                        </div>
                    </div>
                </div>
                ${thread.comments.length > 0 ? `
                    <div class="thread-comments-preview">
                        ${commentsPreview.map(comment => {
                            const commentCompleted = isCommentCompletedByUser(thread.id, comment.id);
                            return `
                                <div class="comment-item">
                                    <input type="checkbox" class="comment-checkbox" 
                                           ${commentCompleted ? 'checked' : ''} 
                                           onclick="event.stopPropagation(); toggleCommentComplete('${thread.id}', '${comment.id}')">
                                    <div class="comment-text ${commentCompleted ? 'completed' : ''}">
                                        ${comment.text}
                                        <div class="comment-author">- ${comment.author}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        ${hasMoreComments ? `<p style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">+ ${thread.comments.length - 2} komentar lainnya</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// View Thread Detail
function viewThreadDetail(threadId) {
    state.currentThread = state.threads.find(t => t.id === threadId);
    if (state.currentThread) {
        renderThreadDetail(threadId);
        showPage('threadDetailPage');
    }
}

// Render Thread Detail
function renderThreadDetail(threadId) {
    const thread = state.threads.find(t => t.id === threadId);
    if (!thread) return;

    const container = document.getElementById('threadDetailContent');
    const completed = isThreadCompletedByUser(thread.id);

    container.innerHTML = `
        <div class="thread-detail-header">
            <h2 class="thread-detail-title ${completed ? 'completed' : ''}">
                <input type="checkbox" class="thread-checkbox" 
                       ${completed ? 'checked' : ''} 
                       onchange="toggleThreadComplete('${thread.id}')">
                ${thread.title}
            </h2>
            <div class="thread-detail-meta">
                <span>👤 Dibuat oleh: ${thread.author}</span>
                <span>📅 Tanggal: ${formatDate(thread.date)}</span>
                <span>💬 ${thread.comments.length} komentar</span>
            </div>
        </div>
        <div class="comments-section">
            <h3>Komentar & Tugas</h3>
            <div class="add-comment-form">
                <form onsubmit="event.preventDefault(); addCommentToDetail('${thread.id}')">
                    <div class="form-group">
                        <textarea id="newCommentText" rows="3" placeholder="Tambah komentar/tugas..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Tambah Komentar</button>
                </form>
            </div>
            <div class="comments-list">
                ${thread.comments.length === 0 ? 
                    '<p style="text-align: center; color: var(--text-secondary);">Belum ada komentar. Jadilah yang pertama!</p>' :
                    thread.comments.map(comment => {
                        const commentCompleted = isCommentCompletedByUser(thread.id, comment.id);
                        return `
                            <div class="comment-card">
                                <input type="checkbox" class="comment-checkbox" 
                                       ${commentCompleted ? 'checked' : ''} 
                                       onchange="toggleCommentComplete('${thread.id}', '${comment.id}')">
                                <div class="comment-content ${commentCompleted ? 'completed' : ''}">
                                    ${comment.text}
                                    <div class="comment-footer">
                                        <span>👤 ${comment.author}</span>
                                        <span>📅 ${formatDateTime(comment.date)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
}

// Add Comment from Detail Page
function addCommentToDetail(threadId) {
    const textarea = document.getElementById('newCommentText');
    const commentText = textarea.value.trim();
    if (commentText) {
        addCommentToThread(threadId, commentText);
        textarea.value = '';
        showToast('Komentar berhasil ditambahkan!', 'success');
    }
}

// Toggle Thread Complete
function toggleThreadComplete(threadId) {
    const key = `thread_${threadId}_${state.currentUser.id}`;
    const current = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, (!current).toString());
    
    // Check if all comments are completed
    const thread = state.threads.find(t => t.id === threadId);
    if (thread) {
        const allCommentsCompleted = thread.comments.every(comment => 
            isCommentCompletedByUser(threadId, comment.id)
        );
        
        if (allCommentsCompleted && !current) {
            // Move to history
            moveThreadToHistory(threadId);
        }
    }
    
    renderFeed();
    if (state.currentThread && state.currentThread.id === threadId) {
        renderThreadDetail(threadId);
    }
}

// Toggle Comment Complete
function toggleCommentComplete(threadId, commentId) {
    const key = `comment_${threadId}_${commentId}_${state.currentUser.id}`;
    const current = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, (!current).toString());
    
    // Check if thread should be moved to history
    const thread = state.threads.find(t => t.id === threadId);
    if (thread) {
        const allCommentsCompleted = thread.comments.every(c => 
            isCommentCompletedByUser(threadId, c.id)
        );
        const threadCompleted = isThreadCompletedByUser(threadId);
        
        if (allCommentsCompleted && threadCompleted) {
            moveThreadToHistory(threadId);
        }
    }
    
    renderFeed();
    if (state.currentThread && state.currentThread.id === threadId) {
        renderThreadDetail(threadId);
    }
}

// Check if thread is completed by user
function isThreadCompletedByUser(threadId) {
    const key = `thread_${threadId}_${state.currentUser.id}`;
    return localStorage.getItem(key) === 'true';
}

// Check if comment is completed by user
function isCommentCompletedByUser(threadId, commentId) {
    const key = `comment_${threadId}_${commentId}_${state.currentUser.id}`;
    return localStorage.getItem(key) === 'true';
}

// Move Thread to History
function moveThreadToHistory(threadId) {
    const thread = state.threads.find(t => t.id === threadId);
    if (thread && !state.history.find(h => h.threadId === threadId && h.userId === state.currentUser.id)) {
        state.history.push({
            id: Date.now().toString(),
            threadId: threadId,
            userId: state.currentUser.id,
            threadTitle: thread.title,
            completedDate: new Date().toISOString()
        });
        saveHistoryToStorage();
        renderHistory();
        showToast('Thread selesai! Dipindahkan ke History.', 'success');
    }
}

// Render History
function renderHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    const userHistory = state.history.filter(h => h.userId === state.currentUser.id);
    
    if (userHistory.length === 0) {
        container.innerHTML = '<div class="card"><p style="text-align: center; color: var(--text-secondary);">Belum ada tugas yang selesai.</p></div>';
        return;
    }

    container.innerHTML = userHistory.map(item => {
        return `
            <div class="history-item">
                <div class="history-item-header">
                    <h3 class="history-item-title">${item.threadTitle}</h3>
                    <span class="history-item-date">✅ Selesai: ${formatDate(item.completedDate)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Update Profile
function updateProfile() {
    if (!state.currentUser) return;

    document.getElementById('profileName').textContent = state.currentUser.name;
    document.getElementById('profileEmail').textContent = state.currentUser.email;

    const userThreads = state.threads.filter(t => t.authorId === state.currentUser.id);
    const userComments = state.threads.reduce((sum, t) => 
        sum + t.comments.filter(c => c.authorId === state.currentUser.id).length, 0
    );
    const completedCount = state.history.filter(h => h.userId === state.currentUser.id).length;

    document.getElementById('threadsCount').textContent = userThreads.length;
    document.getElementById('commentsCount').textContent = userComments;
    document.getElementById('completedCount').textContent = completedCount;
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Remove previous type classes
    toast.classList.remove('toast-success', 'toast-error', 'toast-info');
    
    // Add type class
    toast.classList.add(`toast-${type}`);
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    // Auto hide after 5 seconds (longer for info messages)
    const hideDelay = type === 'info' ? 7000 : 5000;
    setTimeout(() => {
        toast.classList.remove('show');
    }, hideDelay);
}

// Close Toast
document.getElementById('toastClose').addEventListener('click', () => {
    document.getElementById('toast').classList.remove('show');
});

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Format DateTime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

// Add Demo Data for Testing
function addDemoData() {
    // Create demo users
    const demoUsers = [
        { id: '1', name: 'Budi Santoso', email: 'budi@test.com', password: 'test123' },
        { id: '2', name: 'Siti Nurhaliza', email: 'siti@test.com', password: 'test123' },
        { id: '3', name: 'Ahmad Dahlan', email: 'ahmad@test.com', password: 'test123' }
    ];
    localStorage.setItem('users', JSON.stringify(demoUsers));
    
    // Create demo threads
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const demoThreads = [
        {
            id: 'thread1',
            title: 'Matematika',
            author: 'Budi Santoso',
            authorId: '1',
            date: today,
            comments: [
                {
                    id: 'comment1',
                    text: 'Kerjakan halaman 42-45, latihan soal nomor 1-20',
                    author: 'Budi Santoso',
                    authorId: '1',
                    date: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 'comment2',
                    text: 'Jangan lupa kerjakan juga PR dari pertemuan kemarin',
                    author: 'Siti Nurhaliza',
                    authorId: '2',
                    date: new Date(Date.now() - 1800000).toISOString()
                }
            ],
            completed: false
        },
        {
            id: 'thread2',
            title: 'Bahasa Indonesia',
            author: 'Siti Nurhaliza',
            authorId: '2',
            date: today,
            comments: [
                {
                    id: 'comment3',
                    text: 'Buat rangkuman bab 5 tentang puisi',
                    author: 'Siti Nurhaliza',
                    authorId: '2',
                    date: new Date(Date.now() - 7200000).toISOString()
                }
            ],
            completed: false
        },
        {
            id: 'thread3',
            title: 'Fisika',
            author: 'Ahmad Dahlan',
            authorId: '3',
            date: yesterday,
            comments: [
                {
                    id: 'comment4',
                    text: 'Kerjakan soal tentang gerak lurus beraturan',
                    author: 'Ahmad Dahlan',
                    authorId: '3',
                    date: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 'comment5',
                    text: 'Jangan lupa bawa kalkulator untuk praktikum',
                    author: 'Budi Santoso',
                    authorId: '1',
                    date: new Date(Date.now() - 82800000).toISOString()
                }
            ],
            completed: false
        }
    ];
    
    state.threads = demoThreads;
    saveThreadsToStorage();
    localStorage.setItem('demoDataAdded', 'true');
    
    showToast('Data demo telah dimuat! Gunakan email: budi@test.com / test123 untuk login', 'info');
}

// Clear All Data (for testing)
function clearAllData() {
    if (confirm('Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.\n\nIni akan menghapus:\n- Semua user\n- Semua thread\n- Semua history\n- Session login')) {
        localStorage.clear();
        state.currentUser = null;
        state.threads = [];
        state.history = [];
        state.currentThread = null;
        updateUI();
        showToast('Semua data telah dihapus! Refresh halaman untuk memuat data demo baru.', 'info');
        
        // Reload after 2 seconds
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
}

// Make functions globally available
window.viewThreadDetail = viewThreadDetail;
window.toggleThreadComplete = toggleThreadComplete;
window.toggleCommentComplete = toggleCommentComplete;
window.addCommentToDetail = addCommentToDetail;
window.clearAllData = clearAllData;

