import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.deleteOne({ email: 'lokeshmew995@gmail.com' });
  console.log('User deleted');
  process.exit();
});
