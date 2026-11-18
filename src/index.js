import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const app = express();

app.use(express.json());
app.use(cors());

//initialize MongoDB Altas DB
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
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

app.listen(8000, () => {
    console.log("server running on port: 8000");
});