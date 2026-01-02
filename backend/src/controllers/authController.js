const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.registerAdmin = async (req,res)=>{
const hashed = await bcrypt.hash(req.body.password,10);
const admin = await User.create({...req.body,password:hashed,role:"admin"});
res.json(admin);
};


exports.login = async (req,res)=>{
const user = await User.findOne({email:req.body.email});
if(!user || !await bcrypt.compare(req.body.password,user.password))
return res.status(400).json({message:"Invalid creds"});
const token = jwt.sign({id:user._id},process.env.JWT_SECRET);
res.json({token,user});
};