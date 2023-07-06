import express from 'express';
import cors from 'cors';
import { customAlphabet } from 'nanoid';
import { create } from 'ipfs';
import OrbitDB from 'orbit-db';
import bodyParser from 'body-parser';

const port = process.env.PORT || 8080;

var app = express();

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 11);

const dbSetup = async () => {
  const ipfsOptions = { repo: './ipfs',}
  const ipfs = await create(ipfsOptions)
  const orbitdb = await OrbitDB.createInstance(ipfs)
  const options = {
    // Give write access to ourselves
    accessController: {
      write: [orbitdb.identity.id]
    }
  }
  const db = await orbitdb.keyvalue('ids', options)
  await db.load()
  return db;
}

var db;

(async () => {
  db = await dbSetup();
})();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors());

app.get('/:id', (req, res) => {
  try {
    const value = db.get(req.params.id);
    res.status(200).send(value);
  } catch (e) {
    res.status(500).send({e});
  }
})

app.post('/', async (req, res) => {
  try {
    const body = req.body;
    const id = nanoid();
    if(!db.get(id)) {
      await db.put(id, body);
    } else {
      throw Error('Oops, there was an error. Please try again!')
    }
    res.status(200).send({id});
  } catch (e) {
    res.status(500).send({e});
  }
})

app.listen(port, function() {
  console.log('Our app is running on http://localhost:' + port);
});