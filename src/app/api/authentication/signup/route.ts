import database from "@/configs/database"
import UserData from "@/models/userSchema"
import bcrypt from "bcryptjs"
import { log } from "console"
import { NextResponse } from "next/server"

export const POST = async (req:Request)=>{

    try {
        
        await database()
        const body = await req.json()
        const {password, confirmPassword, email}:any = body
        const existing = await UserData.findOne({email})

        if(existing){
            return NextResponse.json({message: "Already exists", status: 400})
        }

        if(password === confirmPassword){

            const hashPassword = await bcrypt.hash(password, 10)
            const createUserData = await UserData.create({...body, password: hashPassword})
            return NextResponse.json({message: "user is Created", createUserData ,status: 201})

        }

    } catch (error) {
        
        const err = error as Error
        log(err.message)

    }

}