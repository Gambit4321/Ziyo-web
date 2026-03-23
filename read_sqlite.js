
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to Y: drive database
const dbPath = 'Y:\\ziyo-web\\prisma\\dev.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    console.log("Connected to SQLite backup. Querying Categories...");

    // Find 'korsatuvlar' or 'lavha' or any category that might be the parent
    db.all("SELECT id, name, slug FROM Category WHERE slug IN ('korsatuvlar', 'lavha', 'shows')", [], (err, parents) => {
        if (err) throw err;

        if (parents.length === 0) {
            console.log("Parent category not found in SQLite.");
            // List all top level categories just in case
            db.all("SELECT * FROM Category WHERE parentId IS NULL", [], (err, roots) => {
                console.log("Root categories:", roots.map(r => r.name + ' (' + r.slug + ')'));
            });
            return;
        }

        parents.forEach(parent => {
            console.log(`\nFound Parent: ${parent.name} (${parent.slug}) ID: ${parent.id}`);

            db.all(`SELECT * FROM Category WHERE parentId = ?`, [parent.id], (err, children) => {
                if (err) throw err;
                console.log(`Found ${children.length} children for ${parent.slug}:`);
                children.forEach(child => {
                    console.log(JSON.stringify(child));
                });
            });
        });
    });
});

// Close later
setTimeout(() => {
    db.close();
}, 2000);
