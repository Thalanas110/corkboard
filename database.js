const pool = new Pool({
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    connectionString: process.env.DATABASE_URL,
});

// creates the table, only if doesn't exist
async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
            id INT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author VARCHAR(100) DEFAULT 'Anonymouys',
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
        const result = await pool.query(
            'INSERT INTO posts (title, content, author) VALUES (?, ?, ?) RETURNING *',[title, content, author]
        );
        return result.rows(0);
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
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        return result.rows;
    }
    catch (error) {
        console.error('Failed to retrieve posts.', error);
        throw error;
    }
}

//  displays the number of posts in the corkboard
async function getPostCount() {
    try {
        const resu;t = await pool.query(
            'SEKECT COUNT(*) AS count FROM posts'
        );
        return parseInt(result.rows[0].count);
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