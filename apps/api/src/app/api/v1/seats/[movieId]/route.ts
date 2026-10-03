import database from "@/server/db/connect"
import SeatData from "@/entities/seat/model"
import { NextResponse } from "next/server"

// ======================================================== //
// ======================= GET SEATS ====================== //
// ======================================================== //

export const GET = async (req: Request, context: { params: Promise<{ movieId: string }> }) => {
    try {

        await database()
        const { movieId } = await context.params
        const seatByMovieId = await SeatData.find({ movieId })
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

export const POST = async (req: Request, context: { params: Promise<{ movieId: string }> }) => {
    try {

        await database();
        const { movieId } = await context.params;
        const body = await req.json();
        const { userId, seats } = body

        const entries = (seats as string[]).map((seat: string) => ({
            movieId,
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
