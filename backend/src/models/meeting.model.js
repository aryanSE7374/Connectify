import {Schema} from "mongoose";

const meetingSchema = new Schema( {

    user_id : { type : String } , // join with a custom name
    meetingCode : { type : String , required : true } , 
    Date : { 
        type : Date , 
        default : Date.now , 
        required : true 
    } 

});

const Meeting = mongoose.model( "Meeting" , meetingSchema ) ;
export {Meeting} ;