    import database from "@/configs/database"
    import { signToken } from "@/libs/jwt"
    import UserData from "@/models/userSchema"
    import bcrypt from "bcryptjs"
    import { log } from "console"
    import { NextResponse } from "next/server"

    // ======================================================== //
    // ======================= POST REQUEST FOR LOGIN ====================== //
    // ======================================================== //

    export const POST = async(req:Request) =>{

        try {
            
            await database()
            const body = await req.json()
            const {email, password}:any = body 

            // user is not found 
            const user = await UserData.findOne({email})
            if(!user){
                return NextResponse.json({message : "user is not found", status: 404})
            }

            // in valid password
            const isValid = await bcrypt.compare(password, user.password)
            if(!isValid){
                return NextResponse.json({message : "invalid password", status: 404})
            }

            // token signin
            const token = signToken({
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            })

            // create cookies
            const res = NextResponse.json({message : "Login successfull", role:user.role, token, status: 200})

            res.cookies.set("token", token, {
                httpOnly: false,
                secure: false,
                path:"/",
                maxAge : 60*60*24
            })

            return res

        } catch (error) {
            const err = error as Error
            log(err.message)
            
        }

    }