import mongoose from 'mongoose';

const connectDb = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDb;

// const connectDb = async () => {
//     try {

//         console.log("Connecting to MongoDB...", "mongodb+srv://nsit2016manish_db_user:UfudkvGdohR4Gmsx@cluster0.y4ajz3m.mongodb.net/NextGenLearning?retryWrites=true&w=majority&ssl=true");
//         //const connection = await mongoose.connect(process.env.MONGO_URI);
//         const connection = await mongoose.connect("mongodb://localhost:27017/myDatabase", {
//             serverSelectionTimeoutMS: 5000,
//         });

//         console.log("Connected to MongoDB");
//     } catch (error) {
//         console.error("Error", error);
//         console.error("Error connecting to MongoDB:", error.message);
//         process.exit(1);
//     }
// }
