const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.auth = async (req,res,next)=>{
const token = req.headers.authorization?.split(" ")[1];
if(!token) return res.status(401).json({message:"No token"});
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id);
next();
};


exports.adminOnly = (req,res,next)=>{
if(req.user.role !== "admin") return res.status(403).json({message:"Admin only"});
next();
};

exports.staffOnly = (req,res,next)=>{
if(!["staff", "supervisor", "admin"].includes(req.user.role)) {
  return res.status(403).json({message:"Staff access required"});
}
next();
};

exports.supervisorOnly = (req,res,next)=>{
if(!["supervisor", "admin"].includes(req.user.role)) {
  return res.status(403).json({message:"Supervisor or Admin access required"});
}
next();
};