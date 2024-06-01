import multer from "multer";
import newsModel from "../models/newsModel.js";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretKey = process.env.SECRET_KEY;

const S3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: bucketRegion,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const addNews = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }
    // const fileName = Date.now() + "-" + file.originalname; // Generate a unique file name

    const params = {
      Bucket: bucketName,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(params);
      await S3.send(command);
      const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${file.originalname}`;

      const { title, description, category } = req.body;

      const newNews = new newsModel({ title, description, category, fileUrl });
      await newNews.save();

      return res.status(200).json({ message: "News added successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });
};
const removeNews = async (req, res) => {
  const { id } = req.body;
  console.log(req.body)

  try {
    // Find the existing news entry
    const existingNews = await newsModel.findById(id);
    if (!existingNews) {
      return res.status(404).json({ message: "News not found" });
    }

    // Extract the S3 key from the file URL
    if (existingNews.fileUrl) {
      const fileKey = existingNews.fileUrl.split("/").pop();

      // Delete the image from S3
      const deleteParams = {
        Bucket: bucketName,
        Key: fileKey,
      };

      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await S3.send(deleteCommand);
    }

    // Delete the news entry from MongoDB
    await newsModel.findByIdAndDelete(id);

    return res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getNews = (req, res) => {
  const { category } = req.query;
  const query = category ? { category } : {};

  newsModel
    .find(query)
    .then((data) => res.status(200).json(data))
    .catch((error) => res.status(501).json({ message: error.message }));
};
const updateNews = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { id } = req.body;
    const updates = req.body;
    const file = req.file;

    try {
      // Find the existing news entry
      const existingNews = await newsModel.findById(id);
      if (!existingNews) {
        return res.status(404).json({ message: "News not found" });
      }

      // Handle file update if a new file is provided
      if (file) {
        // Remove the old image from S3 if it exists
        if (existingNews.fileUrl) {
          const oldFileKey = existingNews.fileUrl.split("/").pop();
          const deleteParams = {
            Bucket: bucketName,
            Key: oldFileKey,
          };

          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await S3.send(deleteCommand);
        }

        // Upload the new image to S3
        const uploadParams = {
          Bucket: bucketName,
          Key: file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadCommand = new PutObjectCommand(uploadParams);
        await S3.send(uploadCommand);
        const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${file.originalname}`;
        updates.fileUrl = fileUrl;
      }

      // Update the news entry in MongoDB
      const updatedNews = await newsModel.findByIdAndUpdate(id, updates, {
        new: true,
      });
      if (!updatedNews) {
        return res.status(404).json({ message: "News not found" });
      }

      return res.status(200).json(updatedNews);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });
};

export { addNews, getNews, removeNews, updateNews };
