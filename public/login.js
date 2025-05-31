// Login page JavaScript

class LoginPage {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.loginError = document.getElementById('loginError');
        this.loginSuccess = document.getElementById('loginSuccess');
        
        this.initializeLogin();
    }

    async initializeLogin() {
        // Check if already authenticated
        await this.checkExistingAuth();
        
        // Set up form submission
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    async checkExistingAuth() {
        try {
            const response = await fetch('/api/admin/check');
            const data = await response.json();
            
            if (data.authenticated) {
                // Already logged in, redirect to admin panel
                window.location.href = '/admin.html';
            }
        } 
        catch (error) {
            // Not authenticated or error, stay on login page
            console.log('Not authenticated, staying on login page');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        // Clear previous messages
        this.hideMessages();
        
        const formData = new FormData(this.loginForm);
        const credentials = {
            username: formData.get('username').trim(),
            password: formData.get('password')
        };

        // Basic validation
        if (!credentials.username || !credentials.password) {
            this.showError('Username and password are required');
            return;
        }

        // Disable form during submission
        this.setFormDisabled(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to admin panel after a short delay
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 1500);
            } else {
                const error = await response.json();
                this.showError(error.error || 'Login failed');
                this.setFormDisabled(false);
            }
        } 
        catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
            this.setFormDisabled(false);
        }
    }

    showError(message) {
        this.loginError.textContent = message;
        this.loginError.style.display = 'block';
        this.loginSuccess.style.display = 'none';
    }

    showSuccess(message) {
        this.loginSuccess.textContent = message;
        this.loginSuccess.style.display = 'block';
        this.loginError.style.display = 'none';
    }

    hideMessages() {
        this.loginError.style.display = 'none';
        this.loginSuccess.style.display = 'none';
    }

    setFormDisabled(disabled) {
        const inputs = this.loginForm.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = disabled;
        });
        
        const submitButton = this.loginForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = disabled ? 'Signing In...' : 'Sign In';
        }
    }
}

function applyDarkMode(isDark) {
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

function toggleDarkMode() {
    try {
        const isDark = document.body.classList.contains('dark-mode');
        applyDarkMode(!isDark);
        localStorage.setItem('darkMode', !isDark);
    } 
    catch (error) {
        console.error('Failed to toggle dark mode:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});




/* this section has been repeated, so it has been removed to avoid redundancy




class LoginPage {
    constructor() {.
        this.loginForm = document.getElementById('loginForm');
        this.loginError = document.getElementById('loginError');
        this.loginSuccess = document.getElementById('loginSuccess');
        
        this.initializeLogin();
    }

    async initializeLogin() {
        // Check if already authenticated
        await this.checkExistingAuth();
        
        // Set up form submission
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Apply saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        applyDarkMode(savedDarkMode);

        // Set up dark mode toggle button
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleDarkMode);
        }
    }

    async checkExistingAuth() {
        try {
            const response = await fetch('/api/admin/check');
            const data = await response.json();
            
            if (data.authenticated) {
                // Already logged in, redirect to admin panel
                window.location.href = '/admin.html';
            }
        } catch (error) {
            // Not authenticated or error, stay on login page
            console.log('Not authenticated, staying on login page');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        // Clear previous messages
        this.hideMessages();
        
        const formData = new FormData(this.loginForm);
        const credentials = {
            username: formData.get('username').trim(),
            password: formData.get('password')
        };

        // Basic validation
        if (!credentials.username || !credentials.password) {
            this.showError('Username and password are required');
            return;
        }

        // Disable form during submission
        this.setFormDisabled(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to admin panel after a short delay
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 1500);
            } else {
                const error = await response.json();
                this.showError(error.error || 'Login failed');
                this.setFormDisabled(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
            this.setFormDisabled(false);
        }
    }

    showError(message) {
        this.loginError.textContent = message;
        this.loginError.style.display = 'block';
        this.loginSuccess.style.display = 'none';
    }

    showSuccess(message) {
        this.loginSuccess.textContent = message;
        this.loginSuccess.style.display = 'block';
        this.loginError.style.display = 'none';
    }

    hideMessages() {
        this.loginError.style.display = 'none';
        this.loginSuccess.style.display = 'none';
    }

    setFormDisabled(disabled) {
        const inputs = this.loginForm.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = disabled;
        });
        
        const submitButton = this.loginForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = disabled ? 'Signing In...' : 'Sign In';
        }
    }
}

*/