import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import serverless from "serverless-http";
import bodyParser from "body-parser";
import { check, validationResult } from "express-validator";

dotenv.config();
const withDB = async (operations) => {
  const dbName = "digital-attitude-agenda";

  // const url = "mongodb://127.0.0.1:27017";
  const url = `mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@${process.env.DATABASE}.r9tnm38.mongodb.net/?retryWrites=true&w=majority`;
  //   console.log(url);

  try {
    const client = await MongoClient.connect(url, { useNewUrlParser: true });
    const db = client.db(dbName);
    const collection = db.collection("agendaContacts");

    await operations(collection);
    client.close();
  } catch (error) {
    console.log(
      `The following error was found with the DB operation: ${error}`
    );
  }
};

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

app.get("/api/", (req, res) => {
  res.send("root api route");
});

app.get("/api/contacts/", (req, res) => {
  withDB(async (collection) => {
    await collection
      .find()
      .toArray()
      .then((agendaContactsArray) => {
        res.status(200).json(agendaContactsArray);
        console.log(agendaContactsArray);
      })
      .catch((error) => {
        console.error(error);
        res
          .status(500)
          .json({ msg: `The following error was found: ${error}` });
      });
  }, res);
});
app.get("/api/contacts/:id", (req, res) => {
  withDB(async (collection) => {
    const ID = req.params.id;
    console.log("id", ID);
    await collection
      .findOne({ _id: new ObjectId(ID) })
      .then((contact) => {
        res.status(200).json(contact);
        console.log("sending item of id ", contact);
      })
      .catch((error) => {
        console.error(error);
        res
          .status(500)
          .json({ msg: `The following error was found: ${error}` });
      });
  }, res);
});

app.post(
  "/api/contacts/addContact",
  [
    check("contactName").isLength({ min: 3 }),
    check("contactSurname").isLength({ min: 3 }),
    check("email").isEmail(),
    check("address").isLength({ min: 3 }),
  ],
  (req, res) => {
    // const { contactName, contactSurname, email, phoneNumber } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Something is wrong with the request..." });
    }
    let contactInfo = req.body;
    contactInfo.updatedAt = new Date();
    console.log(contactInfo);
    withDB(async (collection) => {
      await collection
        .insertOne(contactInfo)
        .then((insertResult) => {
          res.status(200).json(insertResult);
          console.log(insertResult);
        })
        .catch((error) => {
          console.error(error);
          res
            .status(500)
            .json({ msg: `The following error was found: ${error}` });
        });
    }, res);
  }
);

app.post(
  "/api/contacts/edit",
  [
    // check("_id").isLength({ min: 24 }),
    check("contactName").isLength({ min: 3 }),
    check("contactSurname").isLength({ min: 3 }),
    check("email").isEmail(),
    check("address").isLength({ min: 3 }),
  ],
  (req, res) => {
    // const { contactName, contactSurname, email, phoneNumber } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Something is wrong with the request..." });
    }
    let contactInfo = req.body;
    const filter = { _id: new ObjectId(contactInfo.id) };
    console.log("filter:1", contactInfo.id);
    console.log("filter:2", filter);
    contactInfo.updatedAt = new Date();

    delete contactInfo.id;
    console.log("updateinfo:", contactInfo);

    withDB(async (collection) => {
      await collection
        .replaceOne(filter, contactInfo)
        .then((insertResult) => {
          res.status(200).json(insertResult);
          console.log(insertResult);
        })
        .catch((error) => {
          console.error(error);
          res
            .status(500)
            .json({ msg: `The following error was found: ${error}` });
        });
    }, res);
  }
);

const handler = serverless(app);

export { app, handler };
