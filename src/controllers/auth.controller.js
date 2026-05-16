const userModel = require('../models/user.model')

const registerUser = async (req, res)=>{
    const {username, email, password} = req.body
}
 
module.exports = {registerUser}