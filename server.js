const express = require('express');
const router = require('./routes');
require('dotenv').config()
const connectDb = require('./config/ConnectDb')
connectDb()
const app = express()
const port = process.env.PORT || 4000
const cookieParser = require('cookie-parser');
const cors = require("cors");

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}));


app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})

app.use('/admin', router)
app.use('/auth', router)