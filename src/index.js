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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
