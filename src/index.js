import { DBconnect } from "./db/index.js";
import "dotenv/config";
import { app } from "./app.js";

DBconnect()
  .then(() => {
    app.listen(process.env.PORT || 3000);

    console.log(`process is running at : ${process.env.PORT}`);

    app.on("error", (error) => {
      console.log("error:", error);
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed:", error);
  });
