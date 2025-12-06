import envSetup from "@/configs/dotenv";
import jwt from "jsonwebtoken";

// ========= SECRET KEY ========== //

const SECRETKEY = envSetup.SecretKey

// ========== SIGN THE TOKEN ========== //

export const signToken = (payload:any)=>{
    return jwt.sign(payload, SECRETKEY, {expiresIn : '1d'})
    
}

// ========== VERIFY THE TOKEN ========= //

export const verifyToken = (token:string)=>{
    return jwt.verify(token, SECRETKEY)
    
}