
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to local database
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    console.log("Connected to SQLite. Querying Audio Posts...");

    db.all("SELECT id, title, type, videoUrl FROM Post WHERE type = 'audio' LIMIT 5", [], (err, posts) => {
        if (err) throw err;
        console.log("Audio Posts:", JSON.stringify(posts, null, 2));
    });
});

// Close later
setTimeout(() => {
    db.close();
}, 1000);
