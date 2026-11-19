import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const app = express();

app.use(express.json());
app.use(cors());

//initialize MongoDB Altas DB
import { MongoClient, ObjectId } from 'mongodb';

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
    res.send("This is a simple book library management system.");
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
app.get("/all-books/:id", async (req, res) => {
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
app.patch("/all-books/:id", async (req, res) => {
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
app.delete("/all-books/:id", async (req, res) => {
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
app.get("/my-books", async (req, res) => {
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
app.post("/add-book", async (req, res) => {
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


//borrow books
app.post("/borrow-book", async (req, res) => {
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
app.get("/my-borrows", async (req, res) => {
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
app.delete("/my-borrows/:id", async (req, res) => {
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
