import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const reviewIssueSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
    },
    lineReference: {
      type: String,
      required: true,
      trim: true,
    },
    suggestion: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const reviewSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    reviewType: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    issues: {
      type: [reviewIssueSchema],
      required: true,
      default: [],
    },
    improvedCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;

const Review: Model<ReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<ReviewDocument>("Review", reviewSchema);

export default Review;
