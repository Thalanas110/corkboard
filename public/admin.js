// javascrppt admin panel

class AdminPanel {
    constructor() {
        this.authCheck = document.getElementById('authCheck');
        this.adminDashboard = document.getElementById('adminDashboard');
        this.loginRequired = document.getElementById('loginRequired');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.refreshStatsBtn = document.getElementById('refreshStats');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmClearBtn = document.getElementById('confirmClear');
        this.cancelClearBtn = document.getElementById('cancelClear');
        this.adminPostsContainer = document.getElementById('adminPostsContainer');
        
        this.initializeAdmin();
    }

    async initializeAdmin() {
        // Check authentication status
        await this.checkAuthentication();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // If authenticated, load initial data
        if (this.isAuthenticated()) {
            await this.loadStats();
            await this.loadPostsPreview();
            
            // Set up auto-refresh every 30 seconds
            setInterval(() => {
                this.loadStats();
                this.loadPostsPreview();
            }, 30000);
        }
    }

    setupEventListeners() {
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        if (this.refreshStatsBtn) {
            this.refreshStatsBtn.addEventListener('click', () => this.loadStats());
        }
        
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.showConfirmModal());
        }
        
        if (this.confirmClearBtn) {
            this.confirmClearBtn.addEventListener('click', () => this.handleClearAll());
        }
        
        if (this.cancelClearBtn) {
            this.cancelClearBtn.addEventListener('click', () => this.hideConfirmModal());
        }
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/admin/check');
            const data = await response.json();
            
            this.authCheck.style.display = 'none';
            
            if (data.authenticated) {
                this.adminDashboard.style.display = 'block';
                this.loginRequired.style.display = 'none';
            } 
            else {
                this.adminDashboard.style.display = 'none';
                this.loginRequired.style.display = 'block';
            }
        } 
        catch (error) {
            console.error('Error checking authentication:', error);
            this.authCheck.style.display = 'none';
            this.loginRequired.style.display = 'block';
        }
    }

    isAuthenticated() {
        return this.adminDashboard.style.display === 'block';
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/admin/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                window.location.href = '/login.html';
            } else {
                this.showError('Logout failed');
            }
        } 
        catch (error) {
            console.error('Error during logout:', error);
            this.showError('Network error during logout');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            
            if (response.ok) {
                const stats = await response.json();
                this.renderStats(stats);
            } 
            else if (response.status === 401) {
                window.location.href = '/login.html';
            } 
            else {
                this.showError('Failed to load statistics');
            }
        } 
        catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Network error loading statistics');
        }
    }

    renderStats(stats) {
        document.getElementById('totalPosts').textContent = stats.totalPosts;
        document.getElementById('recentPosts').textContent = stats.recentPosts;
        
        const lastUpdated = new Date(stats.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleString();
        
        // Render the chart if we have data
        if (stats.postsPerDay) {
            this.renderChart(stats.postsPerDay);
        }
    }

    renderChart(postsPerDay) {
        const canvas = document.getElementById('postsChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart dimensions
        const padding = 60;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Find max value for scaling
        const maxPosts = Math.max(...postsPerDay.map(d => d.count), 1);
        const yScale = chartHeight / maxPosts;
        const xScale = chartWidth / (postsPerDay.length - 1);
        
        // Set up colors (using CSS custom properties)
        const primaryColor = '#0080FF';
        const borderColor = '#D1D5DB';
        const textColor = '#1F2937';
        
        // Draw grid lines
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }
        
        // Draw bars
        const barWidth = chartWidth / postsPerDay.length * 0.6;
        
        postsPerDay.forEach((day, index) => {
            const x = padding + index * xScale - barWidth / 2;
            const barHeight = day.count * yScale;
            const y = padding + chartHeight - barHeight;
            
            // Draw bar
            ctx.fillStyle = primaryColor;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw count on top of bar
            ctx.fillStyle = textColor;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(day.count.toString(), x + barWidth / 2, y - 5);
            
            // Draw day label
            ctx.fillText(day.label, x + barWidth / 2, padding + chartHeight + 20);
        });
        
        // Draw y-axis labels
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxPosts / 5) * (5 - i));
            const y = padding + (chartHeight / 5) * i + 4;
            ctx.fillText(value.toString(), padding - 10, y);
        }
        
        // Draw chart title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Posts Per Day', canvas.width / 2, 25);
        
        // Draw axes
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
    }

    async loadPostsPreview() {
        try {
            const response = await fetch('/api/posts');
            
            if (response.ok) {
                const posts = await response.json();
                this.renderPostsPreview(posts.slice(0, 5)); // Show only first 5 posts
            } 
            else {
                this.showError('Failed to load posts preview');
            }
        } 
        catch (error) {
            console.error('Error loading posts preview:', error);
        }
    }

    renderPostsPreview(posts) {
        try {
            if (posts.length === 0) {
                this.adminPostsContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>No posts available</h3>
                        <p>The corkboard is currently empty.</p>
                    </div>
                `;
                return;
            }
        this.adminPostsContainer.innerHTML = posts.map(post => this.createPostPreviewHTML(post)).join('');
        } 
        catch (error) {
            console.error('Error rendering posts preview:', error);
            this.showError('Failed to render posts preview');
            return;
        }
    }

    createPostPreviewHTML(post) {
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
                <div class="post-content">${this.escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</div>
            </article>
        `;
    }

    showConfirmModal() {
        this.confirmModal.style.display = 'flex';
    }

    hideConfirmModal() {
        this.confirmModal.style.display = 'none';
    }

    async handleClearAll() {
        try {
            const response = await fetch('/api/admin/clear', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.hideConfirmModal();
                this.showMessageModal('Success', 'All posts have been cleared successfully');
                
                // Refresh stats and posts preview
                await this.loadStats();
                await this.loadPostsPreview();
            } 
            
            else if (response.status === 401) {
                window.location.href = '/login.html';
            } 
            else {
                this.showMessageModal('Error', 'Failed to clear posts');
            }
        } 
        catch (error) {
            console.error('Error clearing posts:', error);
            this.showMessageModal('Error', 'Network error while clearing posts');
        }
    }

    showMessageModal(title, message) {
        const modal = document.getElementById('messageModal');
        const titleElem = document.getElementById('messageModalTitle');
        const bodyElem = document.getElementById('messageModalBody');
        const okBtn = document.getElementById('messageModalOkBtn');

        titleElem.textContent = title;
        bodyElem.textContent = message;

        modal.style.display = 'flex';

        const hideModal = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', hideModal);
        };

        okBtn.addEventListener('click', hideModal);
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
        try {
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
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
    new AdminPanel();

    // Apply saved dark mode preference and set up toggle
    try {
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
