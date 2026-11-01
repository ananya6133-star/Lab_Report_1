
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

const dbPath = process.env.VERCEL
    ? path.join("/tmp", "books.db")
    : path.join(__dirname, "books.db");

// In serverless environments, copy the database to writable /tmp
if (process.env.VERCEL && !fs.existsSync(dbPath)) {
    const bundledDbPath = path.join(__dirname, "books.db");
    if (fs.existsSync(bundledDbPath)) {
        try {
            fs.copyFileSync(bundledDbPath, dbPath);
        } catch (copyErr) {
            console.error("Failed to copy database to /tmp:", copyErr.message);
        }
    }
}

const port = process.env.PORT || 3000;

let db;

// Unified database connector with native sqlite3 and WebAssembly sql.js fallback
const getDatabase = async () => {
    if (db) return db;

    try {
        const sqlite3 = require("sqlite3");
        const { open } = require("sqlite");
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        return db;
    } catch (nativeError) {
        // Fallback to pure WebAssembly sql.js for serverless runtimes
        const initSqlJs = require("sql.js");
        const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
        const wasmBinary = fs.readFileSync(wasmPath);
        const SQL = await initSqlJs({ wasmBinary });
        const filebuffer = fs.readFileSync(dbPath);
        const memDb = new SQL.Database(filebuffer);

        const save = () => {
            try {
                const data = memDb.export();
                fs.writeFileSync(dbPath, Buffer.from(data));
            } catch (e) {}
        };

        db = {
            async all(sql, params = []) {
                const stmt = memDb.prepare(sql);
                stmt.bind(params);
                const rows = [];
                while (stmt.step()) {
                    rows.push(stmt.getAsObject());
                }
                stmt.free();
                return rows;
            },
            async get(sql, params = []) {
                const stmt = memDb.prepare(sql);
                stmt.bind(params);
                let row;
                if (stmt.step()) {
                    row = stmt.getAsObject();
                }
                stmt.free();
                return row;
            },
            async run(sql, params = []) {
                memDb.run(sql, params);
                save();
                const res = memDb.exec("SELECT last_insert_rowid() as id, changes() as changes");
                return {
                    lastID: res[0]?.values[0][0],
                    changes: res[0]?.values[0][1]
                };
            }
        };
        return db;
    }
};

// Database connection middleware for all requests
app.use(async (request, response, next) => {
    try {
        await getDatabase();
        next();
    } catch (error) {
        return response.status(500).json({ error: "Database connection failed: " + error.message });
    }
});

// Root endpoint for API welcome and guide
app.get("/", (request, response) => {
    response.status(200).json({
        message: "Welcome to Lab 02 - Express & SQLite Books CRUD API!",
        author: {
            name: "D. Ananya",
            section: "CSE AIML-2B"
        },
        endpoints: {
            getAllBooks: "GET /books/",
            getBookById: "GET /books/:bookId/",
            addBook: "POST /books/",
            updateBook: "PUT /books/:bookId/",
            deleteBook: "DELETE /books/:bookId/"
        }
    });
});

// Initialize the database before starting the server locally
const initializeDBAndServer = async () => {
    try {
        await getDatabase();
        console.log("Connected to SQLite database.");

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error(`Database initialization failed: ${error.message}`);
        process.exit(1);
    }
};

if (!process.env.VERCEL) {
    initializeDBAndServer();
}

// GET /books/ - Retrieve all books.
app.get("/books/", async (request, response) => {
    try {
        const books = await db.all("SELECT * FROM book ORDER BY id");
        response.status(200).json(books);
    } catch (error) {
        response.status(500).json({ error: "Failed to retrieve books." });
    }
});

// GET /books/:bookId/ - Retrieve one book.
app.get("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;

    try {
        const book = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!book) {
            return response.status(404).json({ error: "Book not found." });
        }

        response.status(200).json(book);
    } catch (error) {
        response.status(500).json({ error: "Failed to retrieve book." });
    }
});

// POST /books/ - Add a book.
app.post("/books/", async (request, response) => {
    const { title, author, price, pages } = request.body || {};

    if (
        typeof title !== "string" || !title.trim() ||
        typeof author !== "string" || !author.trim() ||
        !Number.isInteger(price) || price < 0 ||
        !Number.isInteger(pages) || pages <= 0
    ) {
        return response.status(400).json({
            error: "Provide a valid title, author, non-negative integer price, and positive integer pages."
        });
    }

    try {
        const result = await db.run(
            `INSERT INTO book (title, author, price, pages)
       VALUES (?, ?, ?, ?)`,
            [title.trim(), author.trim(), price, pages]
        );

        const newBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [result.lastID]
        );

        response.status(201).json({ message: "Book added successfully.", book: newBook });
    } catch (error) {
        response.status(500).json({ error: "Failed to add book." });
    }
});

// PUT /books/:bookId/ - Update a book.
app.put("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body || {};

    if (
        typeof title !== "string" || !title.trim() ||
        typeof author !== "string" || !author.trim() ||
        !Number.isInteger(price) || price < 0 ||
        !Number.isInteger(pages) || pages <= 0
    ) {
        return response.status(400).json({
            error: "Provide a valid title, author, non-negative integer price, and positive integer pages."
        });
    }

    try {
        const existingBook = await db.get(
            "SELECT id FROM book WHERE id = ?",
            [bookId]
        );

        if (!existingBook) {
            return response.status(404).json({ error: "Book not found." });
        }

        await db.run(
            `UPDATE book
       SET title = ?, author = ?, price = ?, pages = ?
       WHERE id = ?`,
            [title.trim(), author.trim(), price, pages, bookId]
        );

        const updatedBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        response.status(200).json({ message: "Book details updated successfully.", book: updatedBook });
    } catch (error) {
        response.status(500).json({ error: "Failed to update book." });
    }
});

// DELETE /books/:bookId/ - Delete a book.
app.delete("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;

    try {
        const existingBook = await db.get(
            "SELECT id FROM book WHERE id = ?",
            [bookId]
        );

        if (!existingBook) {
            return response.status(404).json({ error: "Book not found." });
        }

        await db.run("DELETE FROM book WHERE id = ?", [bookId]);

        response.status(200).json({ message: "Book deleted successfully." });
    } catch (error) {
        response.status(500).json({ error: "Failed to delete book." });
    }
});

module.exports = app;
