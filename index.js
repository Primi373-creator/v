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

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://uploader5:uploader5@uploader5.6xmi6ph.mongodb.net/?retryWrites=true&w=majority&appName=uploader5', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String
});

const Image = mongoose.model('Image', imageSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const newImage = new Image({
      data: req.file.buffer,
      contentType: req.file.mimetype
    });
    await newImage.save();

    res.send('Image uploaded successfully!');
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

    // Send the image data as a response
    res.contentType(image.contentType);
    res.send(image.data);
  } catch (error) {
    res.status(500).send('Error retrieving image');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
