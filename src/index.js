import express from 'express';
import cors from 'cors';


const app = express();

app.get("/", (req, res) => {
    res.send("This is a simple book library management system.");
});


app.listen(8000, () => {
    console.log("server running on port: 8000");
});