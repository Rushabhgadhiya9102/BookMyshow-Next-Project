import database from "@/configs/database"
import UserData from "@/models/userSchema"
import MovieData from "@/models/movieSchema"
import { NextResponse } from "next/server"

// ======================================================== //
// ======================= GET MOVIES ====================== //
// ======================================================== //

export const GET = async (req: Request) => {

    try {

        await database()
        const cookiesHeader = req.headers.get("cookie") || "";
        const token: any = cookiesHeader.split("token=")[1];

        let filter:any = {};
        
        if (token) {
            const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
            const adminId = payload.id;
            const role = payload.role;

            if (role === "admin"){
                filter = { createdBy: adminId };
            }else if(role === "user"){
                filter = {};
            }
        }

        const movieData = await MovieData.find(filter)
        return NextResponse.json({ message: "movie fetch sucessfull", movieData, status: 200 })

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({ message: err.message, status: 500 })
    }

}

// ======================================================== //
// ======================= POST MOVIES ====================== //
// ======================================================== //

export const POST = async (req: Request) => {

    try {

        await database()
        const body = await req.json()
        const token: any = req.headers.get("cookie")?.split("token=")[1];
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        const adminId = payload.id;

        const movie = await MovieData.create({ ...body, createdBy: adminId })
        return NextResponse.json({ message: "movie created successfully", movie, status: 201 })

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({ message: err.message, status: 500 })

    }

}