// corkboard javascript application

class CorkboardApp {
    constructor() {
        this.postsContainer = document.getElementById('postsContainer');
        this.postForm = document.getElementById('postForm');
        this.initializeApp();
    }

    async initializeApp() {
        // Set up form submission
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmission(e));
        
        // Load initial posts
        await this.loadPosts();
        
        // Set up auto-refresh every 10 seconds
        setInterval(() => this.loadPosts(), 10000);
    }

    async handlePostSubmission(event) {
        event.preventDefault();
        
        const formData = new FormData(this.postForm);
        const postData = {
            title: formData.get('title').trim(),
            content: formData.get('content').trim(),
            author: formData.get('author').trim() || 'Anonymous'
        };

        // Validate input
        if (!postData.title || !postData.content) {
            this.showError('Title and content are required');
            return;
        }

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                // Clear form
                this.postForm.reset();
                
                // Reload posts to show the new one
                await this.loadPosts();
                
                // Show success message
                this.showSuccess('Post added successfully!');
            } 
            else {
                const error = await response.json();
                this.showError(error.error || 'Failed to create post');
            }
        } 
        catch (error) {
            console.error('Error creating post:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async loadPosts() {
        try {
            const response = await fetch('/api/posts');
            
            if (response.ok) {
                const posts = await response.json();
                this.renderPosts(posts);
            } 
            else {
                this.showError('Failed to load posts');
            }
        } 
        catch (error) {
            console.error('Error loading posts:', error);
            this.renderError('Failed to load posts. Please refresh the page.');
        }
    }

    renderPosts(posts) {
        try {
            if (posts.length === 0) {
                this.postsContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>No posts yet</h3>
                        <p>Be the first to share your thoughts on the corkboard!</p>
                    </div>
                `;
                return;
            }

            this.postsContainer.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
        } 
        catch (error) {
            console.error('Error rendering posts:', error);
            this.renderError('Failed to display posts. Please refresh the page.');
        }
    }

    createPostHTML(post) {
        const createdAt = new Date(post.created_at);
        const timeAgo = this.getTimeAgo(createdAt);
        
        return `
            <article class="post-card">
                <div class="post-header">
                    <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <div>By ${this.escapeHtml(post.author)}</div>
                        <div>${timeAgo}</div>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
            </article>
        `;
    }

    renderError(message) {
        this.postsContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.temporary-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message ${type === 'error' ? 'error-message' : 'success-message'}`;
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.maxWidth = '300px';

        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        try {
            switch (true) {
            case (diffInSeconds < 60):
                return 'Just now';
            case (diffInSeconds < 3600):
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            case (diffInSeconds < 86400):
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            default:
                const days = Math.floor(diffInSeconds / 86400);
                return `${days} day${days !== 1 ? 's' : ''} ago`;
            }
        } 
        catch (error) {
            console.error('Error calculating time difference:', error);
            return 'Unknown time';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

function applyDarkMode(isDark) {
    try {
        if (isDark) {
            document.body.classList.add('dark-mode');
            const icon = document.getElementById('darkModeIcon');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } 
        else {
            document.body.classList.remove('dark-mode');
            const icon = document.getElementById('darkModeIcon');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    } 
    catch (error) {
        console.error('Error applying dark mode:', error);
    }
}

function toggleDarkMode() {
    try {
        const isDark = document.body.classList.contains('dark-mode');
        applyDarkMode(!isDark);
        localStorage.setItem('darkMode', !isDark);
    } 
    catch (error) {
        console.error('Error toggling dark mode:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CorkboardApp();

    try {
        // Apply saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        applyDarkMode(savedDarkMode);

        // Set up dark mode toggle button
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleDarkMode);
        }
    } 
    catch (error) {
        console.error('Error initializing dark mode:', error);
    }
});

/* this part has been repeated.
class CorkboardApp {
    constructor() {
        this.postsContainer = document.getElementById('postsContainer');
        this.postForm = document.getElementById('postForm');
        this.initializeApp();
    }

    async initializeApp() {
        // Set up form submission
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmission(e));
        
        // Load initial posts
        await this.loadPosts();
        
        // Set up auto-refresh every 10 seconds
        setInterval(() => this.loadPosts(), 10000);
    }

    async handlePostSubmission(event) {
        event.preventDefault();
        
        const formData = new FormData(this.postForm);
        const postData = {
            title: formData.get('title').trim(),
            content: formData.get('content').trim(),
            author: formData.get('author').trim() || 'Anonymous'
        };

        // Validate input
        if (!postData.title || !postData.content) {
            this.showError('Title and content are required');
            return;
        }

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                // Clear form
                this.postForm.reset();
                
                // Reload posts to show the new one
                await this.loadPosts();
                
                // Show success message
                this.showSuccess('Post added successfully!');
            } 
            else {
                const error = await response.json();
                this.showError(error.error || 'Failed to create post');
            }
        } 
        catch (error) {
            console.error('Error creating post:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async loadPosts() {
        try {
            const response = await fetch('/api/posts');
            
            if (response.ok) {
                const posts = await response.json();
                this.renderPosts(posts);
            } else {
                this.showError('Failed to load posts');
            }
        } 
        catch (error) {
            console.error('Error loading posts:', error);
            this.renderError('Failed to load posts. Please refresh the page.');
        }
    }

    renderPosts(posts) {
        if (posts.length === 0) {
            this.postsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No posts yet</h3>
                    <p>Be the first to share your thoughts on the corkboard!</p>
                </div>
            `;
            return;
        }

        this.postsContainer.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
    }

    createPostHTML(post) {
        const createdAt = new Date(post.created_at);
        const timeAgo = this.getTimeAgo(createdAt);
        
        return `
            <article class="post-card">
                <div class="post-header">
                    <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <div>By ${this.escapeHtml(post.author)}</div>
                        <div>${timeAgo}</div>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
            </article>
        `;
    }

    renderError(message) {
        this.postsContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.temporary-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message ${type === 'error' ? 'error-message' : 'success-message'}`;
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.maxWidth = '300px';

        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        try {
            switch (true) {
            case (diffInSeconds < 60):
                return 'Just now';
            case (diffInSeconds < 3600):
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            case (diffInSeconds < 86400):
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            default:
                const days = Math.floor(diffInSeconds / 86400);
                return `${days} day${days !== 1 ? 's' : ''} ago`;
            }
        } 
        catch (error) {
            console.error('Error calculating time difference:', error);
            return 'Unknown time';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

*/