const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

    const userExist = await userModel.findOne({
        email, username
    })

    if(userExist) {
        return res.status(409).json({
            message: "User already exist"
        })
    }

  const user = await userModel.create({
    username,
    email,
    password,
  });
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "User created successfully",
    user,
  });
};

module.exports = { registerUser };
