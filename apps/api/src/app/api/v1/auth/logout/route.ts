import { NextResponse } from "next/server"

export const GET = async ()=>{

    try {
        
        const res = NextResponse.json({message : "Logout successfull", status: 200})
        res.cookies.set("token", "", {
            httpOnly: true,
            expires : new Date(0)
        })
        return res

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        
    }

}