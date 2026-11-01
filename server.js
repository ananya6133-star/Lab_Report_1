
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
const port = process.env.PORT || 3000;

let db;

// Database connection middleware for both local and serverless environments
app.use(async (request, response, next) => {
    if (!db) {
        try {
            db = await open({
                filename: dbPath,
                driver: sqlite3.Database,
            });
        } catch (error) {
            return response.status(500).json({ error: "Database connection failed." });
        }
    }
    next();
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
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

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
