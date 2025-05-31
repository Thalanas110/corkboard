const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    // connectionLimit: 10, // optional pool size
});

// creates the table, only if doesn't exist
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author VARCHAR(100) DEFAULT 'Anonymous',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Initialization of database is successful');
    }
    catch (error) {
        console.error('Database not initialized.', error);
        throw error;
    }
}

// allows the user to create the posts
async function createPost(title, content, author = 'Anonymous') {
    try {
        const [result] = await pool.query(
            'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)', [title, content, author]
        );
        // Return the inserted post with the new id
        const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
        return rows[0];
    }
    catch (error) {
        console.error('Post not created.', error);
        throw error;
    }
}

async function clearAllPosts() {
    try {
        await pool.query('DELETE FROM posts');
        console.log('All posts cleared successfully');
    }
    catch (error) {
        console.error('Failed to clear posts.', error);
        throw error;
    }
}

// displays all the posts for everyone else
async function getAllPosts() {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        return rows;
    }
    catch (error) {
        console.error('Failed to retrieve posts.', error);
        throw error;
    }
}

// displays the number of posts in the corkboard
async function getPostCount() {
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) AS count FROM posts'
        );
        return parseInt(rows[0].count);
    }
    catch (error) {
        console.error('Failed to get post count.', error);
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
