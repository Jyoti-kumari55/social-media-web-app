require("./db/dbConnect");
const express = require("express");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const commentRoute = require("./routes/comments");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const isAuthenticated = require("./config/authorize");
const app = express();

dotenv.config();
// const corsOptions = {
//   origin: process.env.FRONTEND_URL ||  "http://localhost:3000",
//   credentials: true,
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
//   optionSuccessStatus: 200,
// };

const allowedOrigins = [
  "http://localhost:3000",  // Local development
  "https://smp-frontend-beta.vercel.app",  // Production
];

// CORS options to check against incoming requests
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // Allow the request if the origin is in the allowedOrigins list or if there's no origin (for non-browser requests)
      callback(null, true);
    } else {
      // Reject the request if the origin is not allowed
      callback(new Error("CORS not allowed"), false);
    }
  },
  credentials: true,  // Allow credentials (cookies, etc.)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(helmet());
app.use(morgan("common"));
app.use(bodyParser.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*"); 
//   res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS"); 
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   ); 
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }
//   next();
// });
// app.use(cors());

const storage = multer.diskStorage({
   fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf'];
    if(!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and GIF files are allowed!'), false);
    }
    cd(null, true);
   }
});
const upload = multer({ storage });

app.post(
  "/api/upload",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).send("No file uploaded.");

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "uploads",
      });

      // console.log("Rsss: ", result);

      res.status(200).json({
        message: "Image uploaded successfully!",
        imageUrl: result.secure_url, // URL of the uploaded image
        imageId: result.public_id, // Public ID of the image on Cloudinary
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error uploading image.", error: error });
    }
  }
);
app.get("/", (req, res) => {
  res.send("Hello, Social Web!");
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

app.options('*', cors(corsOptions));

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}.`);
});
