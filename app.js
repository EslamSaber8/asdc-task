const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection setup
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("yourDatabaseName"); // Replace 'yourDatabaseName' with your actual database name
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
}

connectToMongoDB();

// Multer setup for file upload
const upload = multer({ dest: "uploads/" });

// Endpoint to upload Excel file
app.post("/upload", upload.single("file"), async (req, res) => {
  const workbook = xlsx.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: ["id", "name", "description", "location", "price", "color"] });

  // Save data to MongoDB
  const collection = db.collection("tasks");
  await collection.insertMany(data);
  res.json({ message: "File uploaded successfully" });
});

// Endpoint to get all tasks
app.get("/tasks", async (req, res) => {
  const collection = db.collection("tasks");
  const tasks = await collection.find().toArray();
  res.json(tasks);
});

// Endpoint to get a task by id
app.get("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const collection = db.collection("tasks");
  const task = await collection.findOne({ id: taskId });

  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  res.json(task);
});

// Endpoint to update a task by id
app.put("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const { name, description, location, price, color } = req.body;

  const collection = db.collection("tasks");
  const result = await collection.updateOne({ id: taskId }, { $set: { name, description, location, price, color } });

  if (result.modifiedCount === 0) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  res.json({ message: "Task updated successfully" });
});

// Endpoint to delete a task by id
app.delete("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const collection = db.collection("tasks");
  const result = await collection.deleteOne({ id: taskId });

  if (result.deletedCount === 0) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  res.json({ message: "Task deleted successfully" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
