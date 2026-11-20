import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());


// JWKS initialized once so keys are cached in memory (prevents spamming Vercel /api/auth/jwks)
const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
const JWKS = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));

//verfiy token
const validateToken = async (req, res, next) => {

  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).send({
      success: false,
      message: "You are not authorized"
    })
  }

  const token = authToken.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      success: false,
      message: "You are not authorized"
    })
  }

  try {
    const { payload } = await jwtVerify(token, JWKS)
    req.user = payload;
    next()
  } catch (error) {
    console.error("JWT verification error:", error?.message);
    return res.status(401).send({
      success: false,
      message: "Token not verified"
    })
  }
}

//initialize MongoDB Altas DB

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

const clientDB = await connectToMongoDB();
//create database
const db = clientDB.db("BookNook");
//create Books collection
const booksCollection = db.collection("Books");
const borrowsCollection = db.collection("borrows");

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BookNook API Server</title>
        <link rel="icon" href="https://fav.farm/📚" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: radial-gradient(circle at top, #12281e 0%, #07170f 60%, #040d08 100%);
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
          }
          .card {
            background: rgba(18, 38, 29, 0.85);
            border: 1px solid rgba(52, 211, 153, 0.25);
            backdrop-filter: blur(16px);
            border-radius: 20px;
            padding: 36px 32px;
            max-width: 540px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.1);
            text-align: center;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(52, 211, 153, 0.3);
            margin-bottom: 16px;
          }
          .pulse {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: pulse 1.8s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          h1 {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
          }
          p.subtitle {
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #86d39e;
            color: #07170f;
            padding: 11px 22px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 4px 14px rgba(134, 211, 158, 0.3);
          }
          .btn:hover {
            background: #72bf89;
            transform: translateY(-1px);
          }
          .endpoints {
            margin-top: 28px;
            text-align: left;
            background: #091711;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 16px 20px;
          }
          .endpoints-header {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #34d399;
            margin-bottom: 10px;
          }
          .route {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .route:last-child { border-bottom: none; }
          .method {
            font-weight: 700;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
          }
          .method.get { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
          .method.post { background: rgba(52, 211, 153, 0.15); color: #34d399; }
          .path {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            color: #cbd5e1;
            margin-left: 8px;
            flex-grow: 1;
          }
          .desc {
            font-size: 11px;
            color: #64748b;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">
            <span class="pulse"></span>
            API Status: Online & Healthy
          </div>
          <h1>📚 BookNook REST API</h1>
          <p class="subtitle">
            Secure and high-performance backend powering the BookNook community library platform.
          </p>
          <a class="btn" href="https://booknook-client-lilac.vercel.app" target="_blank" rel="noopener noreferrer">
            🌐 Open Live Website &rarr;
          </a>
          <div class="endpoints">
            <div class="endpoints-header">Available Primary Endpoints</div>
            <div class="route">
              <div>
                <span class="method get">GET</span>
                <span class="path">/all-books</span>
              </div>
              <span class="desc">Public Books</span>
            </div>
            <div class="route">
              <div>
                <span class="method get">GET</span>
                <span class="path">/new-arrivals</span>
              </div>
              <span class="desc">Latest Titles</span>
            </div>
            <div class="route">
              <div>
                <span class="method post">POST</span>
                <span class="path">/add-book</span>
              </div>
              <span class="desc">Protected (Auth)</span>
            </div>
            <div class="route">
              <div>
                <span class="method post">POST</span>
                <span class="path">/borrow-book</span>
              </div>
              <span class="desc">Protected (Auth)</span>
            </div>
            <div class="route">
              <div>
                <span class="method get">GET</span>
                <span class="path">/my-borrows</span>
              </div>
              <span class="desc">Protected (Auth)</span>
            </div>
          </div>
          <div class="footer">
            Built with Express.js & MongoDB Atlas • BookNook
          </div>
        </div>
      </body>
    </html>
    `);
});


//get all books api
app.get("/all-books", async (req, res) => {
    try {
        const books = await booksCollection.find().toArray();

        res.status(200).json({
            message: "send books",
            data: books,
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ message: "Failed to fetch books" });
    }
});


//get details books api
app.get("/all-books/:id",validateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid book ID format" });
        }

        const result = await booksCollection.findOne({ _id: new ObjectId(id) });

        if (!result) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching book details:", error);
        res.status(500).json({ message: "Failed to fetch book details" });
    }
});


//update book api
app.patch("/all-books/:id",validateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid book ID format" });
        }

        const updateData = { ...req.body };
        delete updateData._id; // prevent updating immutable _id

        if (updateData.totalCopies !== undefined) {
            updateData.totalCopies = Number(updateData.totalCopies);
        }

        const result = await booksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json({
            success: true,
            message: "Book updated successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ message: "Failed to update book" });
    }
});


//delete book api
app.delete("/all-books/:id", validateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid book ID format" });
        }

        const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json({
            success: true,
            message: "Book deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ message: "Failed to delete book" });
    }
});


//get books based on email
app.get("/my-books",validateToken, async (req, res) => {
    try {
        const email = req.query.email || req.query.userEmail;
        if (!email) {
            return res.status(200).json([]);
        }

        const query = {
            $or: [
                { userEmail: email },
                { email: email }
            ]
        };

        const result = await booksCollection.find(query).toArray();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching user books:", error);
        res.status(500).json({ message: "Failed to fetch user books" });
    }
});


//add books 
app.post("/add-book",validateToken, async (req, res) => {
    try {
        const book = req.body;

        console.log('Received book:', book);

        if (!book || Object.keys(book).length === 0) {
            return res.status(400).send({
                message: 'Book data is missing'
            });
        }

        const bookData = {
            ...book,
            addedAt: new Date()
        };

        const result = await booksCollection.insertOne(bookData);

        res.status(201).send({
            success: true,
            message: 'Book added successfully',
            insertedId: result.insertedId
        });

    } catch (error) {
        console.error(error);

        res.status(500).send({
            success: false,
            message: 'Failed to add book'
        });
    }
})

//get new arrivals books
app.get("/new-arrivals", async (req, res) => {
    try {
        const result = await booksCollection
            .find()
            .sort({ addedAt: -1, _id: -1 })
            .limit(6)
            .toArray();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching new arrivals books:", error);
        res.status(500).json({ message: "Failed to fetch new arrivals books" });
    }
});


//borrow books
app.post("/borrow-book",validateToken, async (req, res) => {
    try {
        const { bookId, bookTitle, bookImage, userEmail, userName, returnDate } = req.body;

        if (!bookId || !userEmail) {
            return res.status(400).json({ message: "Book ID and User Email are required" });
        }

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: "Invalid Book ID format" });
        }

        // 1. Check if book exists and has copies left
        const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        const copies = Number(book.totalCopies) || 0;
        if (copies <= 0) {
            return res.status(400).json({ message: "Sorry, this book is currently out of stock!" });
        }

        // 2. Check if user already borrowed this book
        const existingBorrow = await borrowsCollection.findOne({
            bookId: bookId,
            userEmail: userEmail,
        });

        if (existingBorrow) {
            return res.status(400).json({
                message: "You have already borrowed this book! Please return it before borrowing again."
            });
        }

        // 3. Create borrow record
        const today = new Date().toISOString().split("T")[0];
        const defaultReturn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const borrowData = {
            bookId,
            bookTitle: bookTitle || book.title,
            bookImage: bookImage || book.image || "",
            userName: userName || "Anonymous Reader",
            userEmail,
            borrowDate: today,
            returnDate: returnDate || defaultReturn,
            borrowedAt: new Date(),
        };

        const result = await borrowsCollection.insertOne(borrowData);

        // 4. Decrease book copies by 1
        await booksCollection.updateOne(
            { _id: new ObjectId(bookId) },
            { $inc: { totalCopies: -1 } }
        );

        res.status(201).json({
            success: true,
            message: "Book borrowed successfully!",
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error("Error borrowing book:", error);
        res.status(500).json({ message: "Failed to borrow book" });
    }
});


//get my-borrows book
app.get("/my-borrows",validateToken, async (req, res) => {
    try {
        const email = req.query.email || req.query.userEmail;
        if (!email) {
            return res.status(200).json([]);
        }

        const result = await borrowsCollection.find({ userEmail: email }).toArray();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching my-borrows:", error);
        res.status(500).json({ message: "Failed to fetch my-borrows" });
    }
});


//return book api
app.delete("/my-borrows/:id",validateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const borrowRecord = await borrowsCollection.findOne({ _id: new ObjectId(id) });
        if (!borrowRecord) {
            return res.status(404).json({ message: "Borrow record not found" });
        }

        // 1. Delete borrow record
        await borrowsCollection.deleteOne({ _id: new ObjectId(id) });

        // 2. Increase totalCopies of the book by 1
        if (borrowRecord.bookId && ObjectId.isValid(borrowRecord.bookId)) {
            await booksCollection.updateOne(
                { _id: new ObjectId(borrowRecord.bookId) },
                { $inc: { totalCopies: 1 } }
            );
        }

        res.status(200).json({
            success: true,
            message: "Book returned successfully!",
        });
    } catch (error) {
        console.error("Error returning book:", error);
        res.status(500).json({ message: "Failed to return book" });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
