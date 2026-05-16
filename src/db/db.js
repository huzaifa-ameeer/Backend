const mongoose = require('mongoose')

const connectDb = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected Successfully !")
    } catch (error) {
        console.log("Database connection FAILED !", error)
    }
}

module.exports = connectDb