import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_SECRET_KEY, {
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
      maxPoolSize: 10, 
      minPoolSize: 1,
    }).then(mongoose => {
      console.log('DB connected');
      return mongoose;
    }).catch(err => {
      console.error('DB connection error:', err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};