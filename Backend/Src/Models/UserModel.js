import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserModel = new mongoose.Schema(
  {
    fullName: {
      type: String,
      require: true,
      min: [3, "Name must be at least 3 characters long"],
      // max: [30, "Name must be at most 30 characters long"],
    },
    email: {
      type: String,
      require: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      require: true,

      min: [6, "Password must be at least 6 characters long"],
    },
    phone: {
      type: String,
      require: true,
      unique: true,
      match: [/^03\d{9}$/, "Phone number must be 10 digits long"],
    },
    phoneVerifiction: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    homeTourCompleted: {
      type: Boolean,
      default: false,
    },
    mpinHash: {
      type: String,
      select: false,
    },
    mpinSet: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

UserModel.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

UserModel.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserModel.methods.toJSON = function () {
  const userObject = this.toObject();

  delete userObject.password;

  return userObject;
};

UserModel.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const User = mongoose.model("User", UserModel);

export default User;
