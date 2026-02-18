import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            ssl: true,
            tlsInsecure: true,
            retryWrites: true,
            w: "majority",
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 5
        })
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`)
        console.log("Retrying connection in 5 seconds...")
        setTimeout(() => connectDB(), 5000)
    }
}

export default connectDB