import database from "@/configs/database"
import UserData from "@/models/userSchema"
import { NextResponse } from "next/server"

export const GET =  async(req: Request)=>{

    try {
        
        await database()
        const users = await UserData.find({role: "user"})
        return NextResponse.json({message: 'fetch all users' , status:200, users})

    } catch (error) {

        const err = error as Error
        console.log("users data : ",err.message);
        return NextResponse.json({message:err.message, status:500})

    }

}