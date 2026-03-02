import express from "express";
import cors from "cors";
import guardianRoutes from "./routes/guardian.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/guardian", guardianRoutes);

app.get("/", (req, res) => {
  res.send("Guardian API running");
});

export default app;