import database from "@/server/db/connect"
import type { MoviePayload } from "@/features/movies/types"
import MovieData from "@/entities/movie/model"
import { verifyToken } from "@/server/security/jwt"
import { NextResponse } from "next/server"

// ======================================================== //
// ======================= GET MOVIES ====================== //
// ======================================================== //

export const GET = async (req: Request) => {

    try {

        await database()
        const cookiesHeader = req.headers.get("cookie") || "";
        const token = cookiesHeader.split("token=")[1];

        let filter: { createdBy?: string } = {};
        
        if (token) {
            const payload = verifyToken(token);
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
        const body = await req.json() as MoviePayload
        const token = req.headers.get("cookie")?.split("token=")[1];

        if (!token) {
            return NextResponse.json({ message: "unauthorized", status: 401 }, { status: 401 })
        }

        const payload = verifyToken(token);
        const adminId = payload.id;

        const movie = await MovieData.create({ ...body, createdBy: adminId })
        return NextResponse.json({ message: "movie created successfully", movie, status: 201 })

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({ message: err.message, status: 500 })

    }

}
