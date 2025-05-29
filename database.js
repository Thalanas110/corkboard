const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'corkboard',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'password',
    connectionString: process.env.DATABASE_URL
});

async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) DEFAULT 'Anonymous',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

async function createPost(title, content, author = 'Anonymous') {
    try {
        const result = await pool.query(
            'INSERT INTO posts (title, content, author) VALUES ($1, $2, $3) RETURNING *',
            [title, content, author]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
}

async function getAllPosts() {
    try {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
}

async function clearAllPosts() {
    try {
        await pool.query('DELETE FROM posts');
        console.log('All posts cleared');
    } catch (error) {
        console.error('Error clearing posts:', error);
        throw error;
    }
}

async function getPostCount() {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM posts');
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error('Error getting post count:', error);
        throw error;
    }
}

module.exports = {
    initDatabase,
    createPost,
    getAllPosts,
    clearAllPosts,
    getPostCount
};
