import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import express from "express";

const app = express();

export const DBconnect = async () => {
  try {
    const ConnectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(`\n CONNECTED: ${ConnectionInstance.connection.host}`);
  } catch (error) {
    console.log(`ERRORRRRRR:`, error);
  }
};
