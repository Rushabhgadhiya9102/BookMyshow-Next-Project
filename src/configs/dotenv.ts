import dotenvx from '@dotenvx/dotenvx'
dotenvx.config()

interface setup {
    Mongo_URL: string,
    SecretKey:string,
    CLOUDINARY_NAME: string
    CLOUDINARY_API_KEY:string
    CLOUDINARY_SECRET_KEY:string
    STRIPE_API_KEY: string
    STRIPE_SECRET_KEY: string
    APINSTANCE:string
}

const envSetup:setup = {
    Mongo_URL : process.env.MONGODB_URI as string,
    SecretKey : process.env.SECRET_KEY as string,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
    CLOUDINARY_SECRET_KEY: process.env.CLOUDINARY_SECRET_KEY as string,
    STRIPE_API_KEY: process.env.STRIPE_API_KEY as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    APINSTANCE : process.env.APINSTANCE as string
}

export default envSetup