import { NextRequest, NextResponse } from "next/server";

// ======================================================== //
// ======================= MIDDLE WARE ====================== //
// ======================================================== //

export const middleware = (req:NextRequest) =>{

    const path = req.nextUrl.pathname
    const isPublicPath = path === '/LoginPage' || path === '/SignupPage';

    const token = req.cookies.get('token')?.value || null;

    if(token && isPublicPath){
        return NextResponse.redirect(new URL('/client', req.nextUrl));
    }

    if(!token && !isPublicPath){
        return NextResponse.redirect(new URL('/LoginPage', req.nextUrl));
    }

    if(token){

        const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString()
          );
          console.log('Payload in Middleware:', payload);

          const role = payload.role;
          
          if(path.startsWith('/admin') && role !== 'admin'){
            return NextResponse.redirect(new URL('/client', req.nextUrl));
          }

          if(path.startsWith('/client') && role !== 'user'){
            return NextResponse.redirect(new URL('/admin', req.nextUrl));
          }

    }
}

// ======================================================== //
// ======================= MATCHER ====================== //
// ======================================================== //

export const config = { 
    matcher: [
        '/client/:path*',
        '/admin/:path*',
        '/LoginPage',
        '/SignupPage'
    ]   
}
