const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

//firebase admin
const admin = require("firebase-admin");

const serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
const cors = require("cors");
app.use(cors());
app.use(express.json());
const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.lyk9xse.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const carsDB = client.db("carsDB");
    const carsCollection = carsDB.collection("carsCollection");
    const bookingsCollection = carsDB.collection("bookingsCollection");
    //cars api
    app.post("/cars", verifyFirebaseToken, async (req, res) => {
      const newCar = req.body;
      const result = await carsCollection.insertOne(newCar);
      res.send(result);
    });
    app.get("/cars", async (req, res) => {
      const email = req.query.provider_email;
      const query = {};
      if (email) {
        query.provider_email = email;
      }
      const result = await carsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/search", async (req, res) => {
      const searchText = req.query.search;
      const result = await carsCollection
        .find({ carName: { $regex: searchText, $options: "i" } })
        .toArray();
      res.send(result);
    });
    app.get("/latestCars", async (req, res) => {
      const cursor = carsCollection.find().sort({ posted_at: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/cars/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.findOne(query);
      res.send(result);
    });
    app.delete("/cars/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/cars/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedCar,
      };
      const result = await carsCollection.updateOne(query, update);
      res.send(result);
    });

    //bookings
    app.post("/bookings", verifyFirebaseToken, async (req, res) => {
      const newBooking = req.body;

      const result = await bookingsCollection.insertOne(newBooking);
      res.send(result);
    });
    app.get("/bookings", verifyFirebaseToken, async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        query["bookedBy.userEmail"] = email;
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });
    app.patch("/bookings/:id", verifyFirebaseToken, async (req, res) => {
      const newBooking = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: newBooking,
      };
      const result = await bookingsCollection.updateOne(query, update);
      res.send(result);
    });
    app.delete("/bookings/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });
    // app.delete("/bookings", verifyFirebaseToken, async (req, res) => {
    //   const result = await bookingsCollection.deleteMany({});
    //   res.send(result);
    // });
    // await client.db("admin").command({ ping: 1 });
    console.log("Mongo DB Connected Successfully");
  } catch (error) {
    console.log("Mongo DB Connection failed", error);
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("RentWheels Server is running");
});
app.listen(port, () => {
  console.log(`Server is hitting on port ${port}`);
});
