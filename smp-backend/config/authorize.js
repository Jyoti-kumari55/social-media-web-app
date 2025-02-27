const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

const isAuthenticated = async (req, res, next) => {
    //console.log("Cookies:", req.cookies); 
 //   const token = req.header("Authorization")?.split(" ")[1];
 //console.log("wwww: ", req.cookies, "222", req.headers, req.header);

    // const token = req.cookies.token;
    let token = req.cookies.token;


      // If no token in cookies, check the Authorization header
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token){
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = decoded.userId;
        next();
    } catch (error) {          
        console.error(error);
        return res.status(401).json({ error: "Token is not valid or has expired." });
    }
}

module.exports = isAuthenticated;

