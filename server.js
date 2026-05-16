require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/db/db.js')
const authRoutes = require("./src/routes/auth.route.js")

connectDb()

app.use(express.json())
app.use('/api/auth', authRoutes)

app.listen(3000, ()=>{
    console.log("Server is running on port 3000")
})