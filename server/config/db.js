import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_study_assistant';
  try {
    if (uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('Could not set custom DNS servers:', dnsErr.message);
      }
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Primary MongoDB connection error (${uri}): ${error.message}`);
    const localUri = 'mongodb://127.0.0.1:27017/ai_study_assistant';
    if (process.env.NODE_ENV !== 'production' && uri !== localUri) {
      console.log(`Connecting to local MongoDB fallback at ${localUri}...`);
      try {
        const localConn = await mongoose.connect(localUri);
        console.log(`MongoDB Connected (local fallback): ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error(`Local MongoDB connection error: ${localErr.message}`);
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('On Render (production), please configure a valid MONGO_URI environment variable pointing to your MongoDB Atlas cluster.');
    }
    process.exit(1);
  }
};

export default connectDB;
