import envSetup from "@/configs/dotenv"
import jwt from "jsonwebtoken"
import { NextRequest, NextResponse } from "next/server"

export const getDataFromToken = async (req:NextRequest) =>{

    try {
        
        const token = req.cookies.get("token")?.value || ''
        const decoded:any = jwt.verify(token, envSetup.SecretKey!)
        return decoded.id

    } catch (error) {
        const err = error as Error
        console.log(err.message);
    }

}