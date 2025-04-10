import mongoose,{Schema} from "mongoose";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const adminSchema=new Schema({
    officerName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    policeStation:{
        type:String,
        required:true,
        trim:true,
    },
    password:{
        type:String,
        require:[true,'password is required']
    },
    officersInStation: {
        type:[Object]
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})

adminSchema.pre("save",async function(next){
    if(!this.isModified("password"))
        {
            return next();
        }
        this.password= await bcrypt.hash(this.password,10)
        next();
})

adminSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}
adminSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            officerName:this.officerName,
            policeStation:this.policeStation
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
adminSchema.methods.generateRefreshToken=function(){
   return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const Admin=mongoose.model("Admin",adminSchema);