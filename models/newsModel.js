import mongoose from "mongoose";

const newsSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: Object },
    category: { type: Object, required: true },
  },
  {
    timestamps: true,
  }
);

const newsModel = mongoose.model("News", newsSchema);
export default newsModel;
