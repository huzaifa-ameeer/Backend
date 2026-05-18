const express = require('express')
const authController = require('../controllers/auth.controller')

const router = express.Router()

router.post('/register', authController.registerUser)
router.get('/test', (req, res)=>{
    console.log(req.cookies)
    res.status(200).json({
        message: "test route",
        cookies: req.cookies
    })
})

module.exports = router