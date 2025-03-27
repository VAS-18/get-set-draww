import mongoose from "mongoose";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://vas18:DBpasssword123@cluster0.i8bdd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

connectDB();
export default connectDB;
