import envSetup from "@/configs/dotenv";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const POST = async (req: Request)=>{

    try {
        
        const body = await req.json();
        const { amount, movieId, userId, selectedSeats } = body;
        const stripe = new Stripe(envSetup.STRIPE_SECRET_KEY)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',

            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Movie Ticket for ${movieId}`,
                            description: `Ticket for movie with ID ${movieId} for user ${userId}`,
                        },
                        unit_amount: Number(amount) * 100,
                    },
                    quantity: 1,
                },
            ],
            success_url: `http://localhost:3000/client/MovieDetails/${movieId}?payment=success&user=${userId}&seats=${selectedSeats.join(
            
      ","
    )}`,
            cancel_url: `http://localhost:3000/client/MovieDetails/${movieId}?payment=failed`,
            
        })

        return NextResponse.json({
            // sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        const err = error as Error;
        console.error("Error creating Stripe session:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }

} 