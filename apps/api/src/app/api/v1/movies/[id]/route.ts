import database from "@/server/db/connect"
import MovieData from "@/entities/movie/model"
import { NextResponse } from "next/server"

// ======================================================== //
// ======================= DELETE MOVIES ====================== //
// ======================================================== //

database()

export const DELETE = async (req: Request, context: { params: Promise<{ id: string }> }) => {

    try {

        const { id } = await context.params
        await MovieData.findByIdAndDelete(id)
        return NextResponse.json({ message: "movie delete successfully" }, { status: 201 })

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({ message: "failed to delete movie" }, { status: 500 })

    }

}

// ======================================================== //
// ======================= UPDATE MOVIES ====================== //
// ======================================================== //

export const PATCH = async (req: Request, context: { params: Promise<{ id: string }> }) => {

    try {

        const { id } = await context.params
        const body = await req.json()
        const updatedData = await MovieData.findByIdAndUpdate(id, body, { new: true })
        return NextResponse.json({ message: "movie update successfully", updatedData }, { status: 201 })

    } catch (error) {

        const err = error as Error
        console.log(err.message)
        return NextResponse.json({ message: "failed to update movie" }, { status: 500 })

    }

}

// ======================================================== //
// ======================= GET MOVIES BY ID ====================== //
// ======================================================== //

export const GET = async (req: Request, context: { params: Promise<{ id: string }> }) => {

    try {

        const { id } = await context.params
        const movieById = await MovieData.findById(id)
        return NextResponse.json({ message: "movie successfully get by id", movieById }, { status: 201 })

    } catch (error) {
        const err = error as Error
        console.log(err.message);
        return NextResponse.json({ message: "failed to get movie by id" }, { status: 500 })
    }

}

