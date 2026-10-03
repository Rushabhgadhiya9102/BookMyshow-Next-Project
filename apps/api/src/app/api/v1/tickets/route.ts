import database from "@/server/db/connect"
import TicketData from "@/entities/ticket/model"
import { NextResponse } from "next/server"

export const POST = async(req: Request) => {

        try {
            await database()
            const body = await req.json()

            const seatCount = body.seats.length
            const ticket = await TicketData.create({...body, seatCount})
            console.log("ticket:" , ticket);
            return NextResponse.json({message:"ticket generate successfully", ticket, status:201})

        } catch (error) {
            
            const err = error as Error
            console.log("ticket error:", err.message);
            return NextResponse.json({message:err.message, status : 500})

        }

}

export const GET = async() =>{

    try {
        
        await database()
        const tickets = await TicketData.find({})
        console.log("tickets",tickets);
        return NextResponse.json({message:"ticket fetch successfully",tickets, status : 200})

    } catch (error) {
        
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({message: err.message, status: 500})

    }

}
