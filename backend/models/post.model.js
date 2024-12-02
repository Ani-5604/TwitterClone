import mongoose from "mongoose";
const postSchema = new mongoose.Schema(
	{
	  user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	  },
	  text: {
		type: String,
	  },
	  img: {
		type: String,
	  },
	  video: {
		type: String,
	  },
	  audio: {
		type: String,
	  },
	  deleted: {
		type: Boolean,
		default: false, // Soft deletion flag
	  },
	  likes: [
		{
		  type: mongoose.Schema.Types.ObjectId,
		  ref: "User",
		},
	  ],
	  comments: [
		{
		  text: {
			type: String,
			required: true,
		  },
		  user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		  },
		},
	  ],
	},
	{
	  timestamps: true,
	  // Custom validation to ensure only one media field is present
	  validate: {
		validator: function () {
		  const mediaFields = [this.img, this.video, this.audio];
		  const nonEmptyFields = mediaFields.filter(Boolean); // Filters out empty values
		  return nonEmptyFields.length <= 1; // Ensures no more than one media field is provided
		},
		message: "Only one media field (image, video, or audio) is allowed per post.",
	  },
	}
  );
  
const Post = mongoose.model("Post", postSchema);

export default Post;
