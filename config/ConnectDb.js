const mongoose = require('mongoose')
const connectDb = async () => {
  try {
    console.log('MONGO_URL =>', process.env.MONGO_URL);

    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, 
    });

    console.log('MongoDB connected ✅');
  } catch (err) {
    console.error('MongoDB connection error ❌');
    console.error(err);
    process.exit(1);
  }
};
module.exports = connectDb
