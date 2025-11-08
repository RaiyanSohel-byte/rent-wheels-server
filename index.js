const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.lyk9xse.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const carsDB = client.db("carsDB");
const carsCollection = carsDB.collection("carsCollection");

async function run() {
  try {
    await client.connect();
    app.post("/cars", async (req, res) => {
      const newCar = req.body;
      const result = await carsCollection.insertOne(newCar);
      res.send(result);
    });
    app.get("/cars", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const result = await carsCollection.find(query).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Mongo DB Connected Successfully");
  } finally {
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("RentWheels Server is running");
});
app.listen(port, () => {
  console.log(`Server is hitting on port ${port}`);
});
