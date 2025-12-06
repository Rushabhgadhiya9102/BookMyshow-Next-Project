import database from "@/configs/database"
import MovieData from "@/models/movieSchema"
import SeatData from "@/models/seatsSchema"
import { NextResponse } from "next/server"

// ======================================================== //
// ======================= GET SEATS ====================== //
// ======================================================== //

export const GET = async (req: Request, context: { params: Promise<{ id: string }> }) => {
    try {

        await database()
        const { id } = await context.params
        const seatByMovieId = await SeatData.find({ movieId: id })
        return NextResponse.json({ message: "seat fetch sucessfull", seatByMovieId, status: 200 })

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({ message: err.message, status: 500 })
        
    }

}

// ======================================================== //
// ======================= POST SEATS ====================== //
// ======================================================== //

export const POST = async (req: Request, context: { params: Promise<{ id: string }> }) => {
    try {

        await database();
        const { id } = await context.params;
        const body = await req.json();
        const { userId, seats } = body

        const entries = (seats as string[]).map((seat: string) => ({
            movieId: id,
            seatNumber: seat,
            bookedBy: userId
        }));

        const booked = await SeatData.insertMany(entries);

        return NextResponse.json({
            message: "seats booked successfully",
            booked
        });

    } catch (error) {
        const err = error as Error;
        console.log(err.message);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
};
