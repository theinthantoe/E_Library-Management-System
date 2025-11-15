import * as process from "node:process";

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
import crypto from "crypto"
dotenv.config();

export const hashPassword  = async (password : any):Promise<string>=>{
 try{
     const hashedPassword = await bcrypt.hash(password, 12);
     return  hashedPassword;
 }catch (error){
     throw new Error("Error hashing password");
 }
}
export const comparePassword = async (password : string ,hashedPassowrd : string) : Promise<boolean> => {
    try{
        const isMatch = await bcrypt.compare(password,hashedPassowrd);
        return isMatch;
    }catch (error){
        throw new Error ("Error Comparing Password")
    }
}

export  const generateLicenseKey = ({mongoUrl,packageId,startDate,endDate} : any)=>{
    const secret = process.env.TOKEN_SECRET_KEY as string; // Replace with your secret
    const data = `${mongoUrl}|${packageId}|${startDate}|${endDate}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}
