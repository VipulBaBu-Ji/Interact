
const router=require("express").Router();
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const User=require("../models/User");

router.post("/signup",async(req,res)=>{
 const {username,password}=req.body;
 const hash=await bcrypt.hash(password,10);
 await User.create({username,password:hash});
 res.json({msg:"created"});
});

router.post("/login",async(req,res)=>{
 const {username,password}=req.body;
 const user=await User.findOne({username});
 if(!user)return res.status(400).json({msg:"invalid"});
 const ok=await bcrypt.compare(password,user.password);
 if(!ok)return res.status(400).json({msg:"invalid"});
 const token=jwt.sign({id:user._id},process.env.JWT_SECRET || "secret");
 res.json({token,username});
});

module.exports=router;
