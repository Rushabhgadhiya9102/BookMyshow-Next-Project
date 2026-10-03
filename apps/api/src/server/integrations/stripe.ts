import Stripe from "stripe";
import envSetup from "@/shared/lib/env";

export const stripe = new Stripe(envSetup.STRIPE_SECRET_KEY);
