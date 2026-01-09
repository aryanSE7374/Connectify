import mongoose from "mongoose";
import {Schema} from "mongoose";

const userSchema = new Schema( {

    name : { type : String , required : true } , 
    username : { type : String , required : true , unique : true } , 
    password : { type : String , required : true } , // password me min length check lgana h
    token : { type : String }
    
});

const User = mongoose.model( "User" , userSchema ) ;
export {User} ;