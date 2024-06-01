import express from "express"
import { addNews, getNews, removeNews,updateNews} from "../controllers/newsController.js"
import requireAuth from "../middlewares/requireAuth.js";
const router = express.Router();

router.post("/addNews", requireAuth, addNews)
router.get("/getNews", getNews)
router.get("/removeNews",requireAuth, removeNews)
router.patch("/updateNews",requireAuth,updateNews)

export default router;