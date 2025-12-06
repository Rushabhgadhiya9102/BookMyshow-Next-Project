import database from "@/configs/database";
import { getDataFromToken } from "@/libs/authUser";
import UserData from "@/models/userSchema";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {

    try {
        
        await database()
        const userId = await getDataFromToken(req)
        const user = await UserData.findById(userId).select("-password");
        return NextResponse.json({message:"user found", status: 200, data:user})

    } catch (error) {
        const err = error as Error
        console.log(err.message);
    }

}