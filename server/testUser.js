import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const user = await User.create({
      name: 'test',
      email: 'lokeshmew995@gmail.com',
      phone: '9491919599',
      password: 'password',
      referredBy: null,
      walletBalance: 0
    });
    console.log('Success:', user);
  } catch (err) {
    console.error('Error creating user:', err.stack);
  }
  process.exit();
});
