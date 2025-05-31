require('dotenv').config();

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { initDatabase, createPost, getAllPosts, clearAllPosts, getPostCount } = require('./database');
const { comparePasswords, generateSessionId, sessions } = require('./auth');


// Initialize database on startup
initDatabase();

const server = http.createServer(async (req, res) => {
    try {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method;

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // API Routes
        if (pathname.startsWith('/api/')) {
            try {
                await handleApiRequest(req, res, pathname, method);
            } 
            catch (apiError) {
                console.error('API Error:', apiError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error processing API request' }));
            }
            return;
        }

        // Static file serving
        try {
            await serveStaticFile(req, res, pathname);
        } 
        catch (staticError) {
            console.error('Static file error:', staticError);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 Internal Server Error</h1><p>Error serving static file</p>');
        }
    } 
    catch (globalError) {
        console.error('Server error:', globalError);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
    }
});

async function handleApiRequest(req, res, pathname, method) {
    try {
        // Get session from cookie
        const cookies = parseCookies(req.headers.cookie || '');
        const sessionId = cookies.sessionId;
        const isAuthenticated = sessionId && sessions[sessionId];

        if (pathname === '/api/posts' && method === 'GET') {
            const posts = await getAllPosts();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(posts));
        }
        else if (pathname === '/api/posts' && method === 'POST') {
            const body = await getRequestBody(req);
            const { title, content, author } = JSON.parse(body);
            
            if (!title || !content) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Title and content are required' }));
                return;
            }

            const post = await createPost(title, content, author || 'Anonymous');
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(post));
        }
        else if (pathname === '/api/admin/login' && method === 'POST') {
            const body = await getRequestBody(req);
            const { username, password } = JSON.parse(body);
            
            // Simple admin credentials (in production, this should be from database)
            const adminUsername = process.env.ADMIN_USERNAME;
            const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
            
            if (username === adminUsername && await comparePasswords(password, adminPasswordHash)) {
                const sessionId = generateSessionId();
                sessions[sessionId] = { username, isAdmin: true, createdAt: Date.now() };
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=3600`
                });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
            }
        }
        else if (pathname === '/api/admin/logout' && method === 'POST') {
            if (sessionId && sessions[sessionId]) {
                delete sessions[sessionId];
            }
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Set-Cookie': 'sessionId=; HttpOnly; Path=/; Max-Age=0'
            });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/admin/stats' && method === 'GET') {
            if (!isAuthenticated) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
            }
            
            const totalPosts = await getPostCount();
            const allPosts = await getAllPosts();
            const recentPosts = allPosts.filter(post => 
                new Date(post.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length;
            
            // Calculate posts per day for the last 7 days
            const postsPerDay = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                const dayPosts = allPosts.filter(post => {
                    const postDate = new Date(post.created_at);
                    return postDate >= date && postDate < nextDate;
                }).length;
                
                postsPerDay.push({
                    date: date.toISOString().split('T')[0],
                    count: dayPosts,
                    label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' })
                });
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                totalPosts, 
                recentPosts,
                postsPerDay,
                lastUpdated: new Date().toISOString()
            }));
        }
        else if (pathname === '/api/admin/clear' && method === 'DELETE') {
            if (!isAuthenticated) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
            }
            
            await clearAllPosts();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/admin/check' && method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ authenticated: !!isAuthenticated }));
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

async function serveStaticFile(req, res, pathname) {
    // Default to index.html for root path
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, 'public', pathname);
    
    try {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        
        let contentType = 'text/plain';
        switch (ext) {
            case '.html': contentType = 'text/html'; break;
            case '.css': contentType = 'text/css'; break;
            case '.js': contentType = 'application/javascript'; break;
            case '.json': contentType = 'application/json'; break;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
}

function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', reject);
    });
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
    }
    return cookies;
}

const PORT = process.env.PORT;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
