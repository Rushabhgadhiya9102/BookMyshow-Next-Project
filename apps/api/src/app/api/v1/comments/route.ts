import database from "@/server/db/connect"
import CommentData from "@/entities/comment/model"
import { NextResponse } from "next/server"

export const POST = async (req:Request)=>{

    try {
        
        await database()
        const body = await req.json()
        const comment = await CommentData.create(body)
        return NextResponse.json({message:"comment created successfully", status:201 ,comment})

    } catch (error) {
        const err = error as Error
        console.log(err.message)
        return NextResponse.json({message: err.message, status:500})
        
    }

}

