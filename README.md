# Backend Development Fundamentals - Lab 2
## Project: SQLite Database and CRUD Routes

This repository contains the completed project for **Lab 2: SQLite Database and CRUD Routes**. Built using **Node.js**, **Express.js**, **SQLite**, and **nodemon**, it connects to a local SQLite database (`library.db`), initializes a `book` table with 10 sample records, and provides standard RESTful CRUD routes.

---

## 📁 Project Structure

```text
Lab_Report 2/
├── database/
│   └── library.db         # SQLite database file containing the 'book' table
├── app.js                 # Express application, DB initialization, and CRUD routes
├── package.json           # Node.js dependencies and script definitions
├── package-lock.json      # Locked versions of dependencies
├── .gitignore             # Ignores node_modules
└── README.md              # Project documentation and API guide
```

---

## 🗄️ Database Details

- **Database file:** `database/library.db`
- **Table name:** `book`

### Table Schema

| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each book |
| `title` | `TEXT` | | Title of the book |
| `author` | `TEXT` | | Author of the book |
| `price` | `INTEGER` | | Price of the book |
| `pages` | `INTEGER` | | Total number of pages |

### 10 Sample Records Seeded

| id | title | author | price | pages |
| :--- | :--- | :--- | :--- | :--- |
| 1 | To Kill a Mockingbird | Harper Lee | 399 | 281 |
| 2 | 1984 | George Orwell | 299 | 328 |
| 3 | The Great Gatsby | F. Scott Fitzgerald | 250 | 180 |
| 4 | The Catcher in the Rye | J.D. Salinger | 350 | 234 |
| 5 | Pride and Prejudice | Jane Austen | 220 | 279 |
| 6 | The Hobbit | J.R.R. Tolkien | 450 | 310 |
| 7 | Harry Potter and the Philosopher's Stone | J.K. Rowling | 499 | 223 |
| 8 | The Alchemist | Paulo Coelho | 299 | 208 |
| 9 | Crime and Punishment | Fyodor Dostoevsky | 420 | 430 |
| 10 | The Da Vinci Code | Dan Brown | 380 | 454 |

---

## 🚀 Commands to Run the Project

### 1. Install Dependencies
If running on a new machine or fresh clone:
```bash
npm install
```

### 2. Start the Server with Nodemon (Development Mode)
Automatically restarts whenever changes are saved in `app.js`:
```bash
npm run dev
```

### 3. Start the Server with Node (Production Mode)
```bash
npm start
```
*The server starts listening on `http://localhost:3000/`.*

---

## 🌐 CRUD API Endpoints

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Root endpoint / Status check |
| **GET** | `/books` | Retrieve list of all books |
| **GET** | `/books/:bookId` | Retrieve a single book by ID |
| **POST** | `/books` | Add a new book |
| **PUT** | `/books/:bookId` | Update an existing book's details |
| **DELETE** | `/books/:bookId` | Delete a book by ID |

### Example Request Payloads:

#### Add a Book (`POST /books`)
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 650,
  "pages": 464
}
```

#### Update a Book (`PUT /books/1`)
```json
{
  "title": "To Kill a Mockingbird (Special Edition)",
  "author": "Harper Lee",
  "price": 450,
  "pages": 300
}
```

