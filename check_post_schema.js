
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) throw err;
});

db.serialize(() => {
    db.all("PRAGMA table_info(Post)", [], (err, columns) => {
        if (err) throw err;
        console.log("Post columns:", columns.map(c => c.name));
    });

    db.all("SELECT id, title, type, videoUrl, content FROM Post WHERE type = 'audio' AND videoUrl IS NOT NULL LIMIT 5", [], (err, posts) => {
        if (err) throw err;
        console.log("Audio Posts with videoUrl:", JSON.stringify(posts, null, 2));
    });

    db.all("SELECT id, title, type, videoUrl, content FROM Post WHERE type = 'audio' AND content LIKE '%.mp3%' LIMIT 5", [], (err, posts) => {
        if (err) throw err;
        console.log("Audio Posts with .mp3 in content:", JSON.stringify(posts, null, 2));
    });
});

setTimeout(() => db.close(), 1000);
