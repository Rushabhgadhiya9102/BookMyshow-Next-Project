import database from "@/server/db/connect"
import CommentData from "@/entities/comment/model"
import { NextResponse } from "next/server"

export const GET = async(req: Request, context: {params: Promise<{ id: string }>})=>{

    try {
        
        await database()
        const {id} = await context.params
        const movieComment = await CommentData.find({movieId: id})
        return NextResponse.json({message:"comments fetched successfully", status:200 ,movieComment})

    } catch (error) {

        const err = error as Error
        console.log(err.message)
        return NextResponse.json({message: err.message, status: 500})
        
    }

}

export const DELETE = async(req:Request , context: {params: Promise<{id:string}>})=>{

    try {
        
        await database()
        const {id} = await context.params
        const deleteComment = await CommentData.findByIdAndDelete(id)
        return NextResponse.json({message:"comment deleted successfully", status:200 ,deleteComment})

    } catch (error) {

        const err = error as Error 
        console.log(err.message)
        return NextResponse.json({message: err.message, status: 500})
        
    }

}

export const PATCH = async(req:Request, context : {params: Promise<{id:string}>})=>{

    try {
        
        await database()
        const {id} = await context.params
        const body = await req.json()
        const updatedComment = await CommentData.findByIdAndUpdate(id, body, {new:true})
        return NextResponse.json({message:"comment updated successfully", status:200 ,updatedComment})
        

    } catch (error) {

        const err = error as Error
        console.log(err.message)
        return NextResponse.json({message: err.message, status: 500})
        
    }

}