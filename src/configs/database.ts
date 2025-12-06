import { log } from "console"
import mongoose from "mongoose"
import envSetup from "./dotenv"

const database = async() =>{

    try {
        
        await mongoose.connect(envSetup.Mongo_URL)
        log('database is connected')

    } catch (error) {
        const err = error as Error
        log(err.message)

    }

}

export default database