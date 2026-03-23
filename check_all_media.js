
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) throw err;
});

db.serialize(() => {
    db.all("SELECT id, title, type, videoUrl FROM Post WHERE videoUrl IS NOT NULL LIMIT 20", [], (err, posts) => {
        if (err) throw err;
        console.log("Posts with videoUrl (all types):", JSON.stringify(posts, null, 2));
    });
});

setTimeout(() => db.close(), 1000);
