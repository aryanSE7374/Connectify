import httpStatus from 'http-status';
import {User} from '../models/user.model.js'; // .js
import bcrypt, {hash} from 'bcrypt';
import crypto from "crypto"

// NOTE : prefer JWT for token generation
// implement token expiry and rate limiter

/*

Weaknesses (to be resolved later) : 

•	No token expiry
•	No logout endpoint
•	No JWT
•	No automatic session restore
•	Token sent via query params (not headers)

*/

const login = async ( req,res )=>{

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "BAD REQ : Please Provide Details to log in" })
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid USERNAME or password" }) // fix : Never reveal which user is valid
        }
 

        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        // bcrypt.compare() is async
        if ( isPasswordCorrect ) {
            let token = crypto.randomBytes(32).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token })
        } 

        else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or PASSWORD" })
        }

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` })
    }
}

const register = async(req,res)=>{


    if ( !req.body ){
        return res.status(400).json({
        message: "Request body is missing"
        });
    }
    
    const{name,username,password} = req.body;

    try {

        const existingUser = await User.findOne({username});
        if(existingUser) return res.status(httpStatus.FOUND).json({message:"user already exist"});
        // early return statement => no else block needed

        const hashedPassword = await bcrypt.hash(password,10); // hash ( pass , saltOrRounds )

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save(); // async operation
        res.status(httpStatus.CREATED).json({message:"User Registered"});
        
    } catch (error) {
        res.json({message : `Something went wrong :${error}` });
    }

}

export { login , register } ;