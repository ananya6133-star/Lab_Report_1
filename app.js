const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());


// Database folder and file path (compatible with local environment and Vercel serverless)
const isVercel = !!process.env.VERCEL;
const dbFolder = isVercel ? "/tmp" : path.join(__dirname, "database");
const dbPath = path.join(dbFolder, "library.db");
let db = null;

// ================= INITIALIZE DB AND SERVER =================
// Single async function to connect to SQLite and start Express server
const initializeDBAndServer = async () => {
  try {
    // Ensure the database folder exists
    if (!fs.existsSync(dbFolder)) {
      fs.mkdirSync(dbFolder, { recursive: true });
    }

    // In Vercel serverless, copy the bundled database to /tmp (writable directory)
    if (isVercel && !fs.existsSync(dbPath)) {
      const sourceDb = path.join(__dirname, "database", "library.db");
      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, dbPath);
      }
    }

    // Connect to SQLite database using async/await
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create the 'book' table if it does not already exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `);

    // Insert 10 sample books if the table is empty (prevents duplicate records on restart)
    const bookCount = await db.get(`SELECT COUNT(*) AS count FROM book;`);
    if (bookCount.count === 0) {
      await db.exec(`
        INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
        (1, 'To Kill a Mockingbird', 'Harper Lee', 399, 281),
        (2, '1984', 'George Orwell', 299, 328),
        (3, 'The Great Gatsby', 'F. Scott Fitzgerald', 250, 180),
        (4, 'The Catcher in the Rye', 'J.D. Salinger', 350, 234),
        (5, 'Pride and Prejudice', 'Jane Austen', 220, 279),
        (6, 'The Hobbit', 'J.R.R. Tolkien', 450, 310),
        (7, 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 499, 223),
        (8, 'The Alchemist', 'Paulo Coelho', 299, 208),
        (9, 'Crime and Punishment', 'Fyodor Dostoevsky', 420, 430),
        (10, 'The Da Vinci Code', 'Dan Brown', 380, 454);
      `);
      console.log("Sample book records inserted into library.db successfully.");
    }

    // Start Express server on port 3000 locally (Vercel manages listening automatically)
    if (!isVercel) {
      app.listen(3000, () => {
        console.log("Server running at http://localhost:3000/");
      });
    }
  } catch (error) {
    // Handle database connection errors
    console.error(`DB Error: ${error.message}`);
    if (!isVercel) {
      process.exit(1);
    }
  }
};

// Store promise so serverless handlers wait for DB initialization
const dbPromise = initializeDBAndServer();

// Middleware to ensure DB is initialized before route execution
app.use(async (req, res, next) => {
  if (!db) {
    await dbPromise;
  }
  next();
});

// ================= CRUD ROUTES =================

// 1. Root Route
app.get("/", (req, res) => {
  res.send("Backend Development Fundamentals Lab 2 - SQLite Database and CRUD Routes");
});

// 2. READ ALL: Get list of all books
app.get("/books", async (req, res) => {
  try {
    const getBooksQuery = `SELECT * FROM book ORDER BY id;`;
    const books = await db.all(getBooksQuery);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. READ ONE: Get a single book by ID
app.get("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. CREATE: Add a new book
app.post("/books", async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }

    const { title, author, price, pages } = req.body;

    // Validate required fields: title, author, price, and pages
    if (
      title === undefined ||
      author === undefined ||
      price === undefined ||
      pages === undefined ||
      title === "" ||
      author === ""
    ) {
      return res.status(400).json({
        error: "All fields are required: title, author, price, pages",
      });
    }

    // Parameterized SQLite query with ? placeholders
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);

    res.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. UPDATE: Update book details by ID
app.put("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    const result = await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book Details Updated Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. DELETE: Delete a book by ID
app.delete("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    const result = await db.run(deleteBookQuery, [bookId]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
