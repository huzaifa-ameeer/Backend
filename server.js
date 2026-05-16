require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/db/db.js')

connectDb()

app.listen(3000, ()=>{
    console.log("Server is running on port 3000")
})