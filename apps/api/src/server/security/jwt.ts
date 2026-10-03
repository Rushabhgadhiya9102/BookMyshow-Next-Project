import envSetup from "@/shared/lib/env";
import type { AuthTokenPayload } from "@/entities/user/types";
import jwt from "jsonwebtoken";

// ========= SECRET KEY ========== //

const SECRETKEY = envSetup.SecretKey

// ========== SIGN THE TOKEN ========== //

export const signToken = (payload: Omit<AuthTokenPayload, keyof jwt.JwtPayload>) => {
    return jwt.sign(payload, SECRETKEY, {expiresIn : '1d'})
    
}

// ========== VERIFY THE TOKEN ========= //

export const verifyToken = (token:string): AuthTokenPayload => {
    return jwt.verify(token, SECRETKEY) as AuthTokenPayload
    
}
