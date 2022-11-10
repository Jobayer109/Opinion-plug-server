const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bplzh34.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbConnect = async () => {
  try {
    const serviceCollection = client.db("opinion-plug").collection("services");
    const reviewCollection = client.db("opinion-plug").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: "1d" });
      res.send({ token });
    });

    app.post("/service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/services", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      let query = {};

      const cursor = serviceCollection.find(query);
      const count = await serviceCollection.estimatedDocumentCount(query);
      const services = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send({ count, services });
    });

    app.get("/homeServices", async (req, res) => {
      const cursor = serviceCollection.find({});
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const query = { _id: ObjectId(req.params.id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      let query = {};

      if (req.query.serviceId) {
        query = {
          serviceId: req.query.serviceId,
        };
      }
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      const query = { _id: ObjectId(req.params.id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/reviews/:id", async (req, res) => {
      const comment = req.body.comment;
      const query = { serviceId: req.query.serviceId };
      const updateDoc = {
        $set: {
          comment: comment,
        },
      };
      const result = await reviewCollection.updateOne(query, updateDoc);
      res.send(result);
    });
  } finally {
  }
};
dbConnect().catch((error) => console.log(error.message));

app.get("/", (req, res) => {
  res.send("Opinion plug server is running");
});

app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
