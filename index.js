/*const mongoURLs = [
  'mongodb+srv://uploader1:uploader1@uploader1.q2honhy.mongodb.net/?retryWrites=true&w=majority&appName=uploader1',
  'mongodb+srv://uploader2:uploader2@uploader2.uhnmx1u.mongodb.net/?retryWrites=true&w=majority&appName=uploader2',
  'mongodb+srv://uploader3:uploader3@uploader3.epntshm.mongodb.net/?retryWrites=true&w=majority&appName=uploader3',
  'mongodb+srv://uploader4:uploader4@uploader4.qpxbp5y.mongodb.net/?retryWrites=true&w=majority&appName=uploader4',
  'mongodb+srv://uploader5:uploader5@uploader5.6xmi6ph.mongodb.net/?retryWrites=true&w=majority&appName=uploader5',
];*/
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const uuid = require('uuid');
const schedule = require('node-schedule');

const app = express();
const PORT = process.env.PORT || 3076;

mongoose.connect('mongodb+srv://uploader5:uploader5@uploader5.6xmi6ph.mongodb.net/imageStore?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const imageSchema = new mongoose.Schema({
  _id: String,
  data: Buffer,
  contentType: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expires: '3d' } 
  }
});

const Image = mongoose.model('Image', imageSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const result = await Image.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log(`Deleted ${result.deletedCount} expired images`);
  } catch (error) {
    console.error('Error deleting expired images:', error);
  }
});

app.use(express.urlencoded({ extended: true })); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const id = uuid.v4();
    const newImage = new Image({
      _id: id,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
    });
    await newImage.save();

    res.send(`Image uploaded successfully! ID: ${id}`);
  } catch (error) {
    res.status(500).send('Error uploading image');
  }
});

app.get('/images/:id', async (req, res) => {
  try {
    const imageId = req.params.id;
    const image = await Image.findById(imageId);

    if (!image) {
      res.status(404).send('Image not found');
      return;
    }

    res.contentType(image.contentType);
    res.send(image.data);
  } catch (error) {
    res.status(500).send('Error retrieving image');
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

app.get('/admin/images', async (req, res) => {
  try {
    const images = await Image.find({}, { _id: 1, createdAt: 1, expiresAt: 1 });
    const formattedImages = images.map(image => ({
      _id: image._id,
      createdAt: formatDate(image.createdAt),
      expiresAt: formatDate(image.expiresAt)
    }));

    res.json(formattedImages);
  } catch (error) {
    res.status(500).send('Error retrieving images');
  }
});

function formatDate(date) {
  return date.toLocaleString(); 
}

app.post('/admin/images/delete', async (req, res) => {
  try {
    const imageId = req.body.imageId;
    await Image.findByIdAndDelete(imageId);
    res.send(`Image with ID ${imageId} deleted successfully`);
  } catch (error) {
    res.status(500).send('Error deleting image');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
