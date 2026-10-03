import mongoose from "mongoose";

// ======================================================== //
// ======================= USER INTERFACE ====================== //
// ======================================================== //

interface IUser {
    username : string,
    email: string,
    password : string,
    role : 'admin' | 'user'
}

// ======================================================== //
// ======================= USER SCHEMA ====================== //
// ======================================================== //

const userSchema = new mongoose.Schema<IUser>({

    username : {
        type : String,
        unique : true,
        required : true
    },

    email : {
        type : String,
        unique : true,
        required : true
    },

    password : {
        type : String,
        unique : true,
        required : true
    },

    role: {
        type: String,
        enum : ['admin', 'user'],
        default: 'user'
    }

},{
    timestamps : true
})

const UserData = mongoose.models.UserData || mongoose.model('UserData', userSchema)
export default UserData