# Lab 02: Express.js & SQLite Books API

A RESTful API built with Node.js, Express, and SQLite for managing a collection of books.

## Tech Stack
- **Node.js** & **Express**
- **SQLite3** & **sqlite**
- **Nodemon** (for development)

## Setup & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/books/` | Retrieve all books |
| `GET` | `/books/:bookId/` | Retrieve a single book by ID |
| `POST` | `/books/` | Add a new book |
| `PUT` | `/books/:bookId/` | Update an existing book by ID |
| `DELETE` | `/books/:bookId/` | Delete a book by ID |

### Example Request Body (POST / PUT)
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 500,
  "pages": 464
}
```
