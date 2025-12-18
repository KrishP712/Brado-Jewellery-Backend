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
  origin: ["http://localhost:5173","https://brado-jewellery-web.vercel.app", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}));


app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/admin', router)
app.use('/auth', router)

app.get('/', (req, res) => {
  res.send('Hii , Krish Server and API is running....')
})
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})