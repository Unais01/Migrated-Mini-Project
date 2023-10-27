const express = require('express');
const fs = require('fs');
const bodyparser = require('body-parser');
const port = process.env.PORT || 5000;
const path = require('path');
const multer = require('multer');
const docxtopdf = require('docx-pdf');
const {mergePdfs}  = require('./merge');
const { error } = require('console');
const app = express();

app.use(express.static('uploads'));
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });



app.use(express.static('public'));
// app.use('/static',express.static('public'));


app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html");

});






app.post('/docxtopdf', upload.single('file'), (req, res) => {
  // Assuming you're using a form to upload the DOCX file.
  const docxFilePath = req.file.path;
  const outputPdfFilePath = path.join(__dirname+"/Generator", Date.now()+'output.pdf'); // Change this to your desired output path.

  docxtopdf(docxFilePath, outputPdfFilePath, (err, result) => {
      if (err) {
      console.error(err);
      res.status(500).send('Error converting DOCX to PDF');
    } else {
      res.download(outputPdfFilePath,'output.pdf', (downloadError) => {
        res.sendFile(`${outputPdfFilePath}`)
      });
    }
  });
});


/*########################Merging pdf###########################*/





app.post('/merge', upload.array('pdfs', 2), async (req, res, next)=> {
    console.log(req.files)
    console.log(error)
    let d = await mergePdfs(path.join(__dirname, req.files[0].path), path.join(__dirname, req.files[1].path));
    //  res.redirect(`http://localhost:5000/static/${d}.pdf` )
    res.sendFile(__dirname+`/Merge Generator/${d}.pdf`)
     
  });

  app.listen(port, () => {
      console.log(`server is listening on http://localhost:${port}`);

});











      // app.post('/docxtopdf', upload.single('file'), (req, res) => {
      //     const docxFilePath = req.file.path;
      //      const outputPdfFilePath = path.join(__dirname, 'public', 'output.pdf');
      //     console.log(req.file.path);
      //     //let outputfilepath = Date.now() + "output.pdf";
      //     res.setHeader('Content-Disposition', `attachment; filename="${outputfilepath}"`);
      //     res.setHeader('Content-Type', 'application/pdf'); // Adjust the MIME type as needed
          
      
      //     docxtopdf(req.file.path, outputfilepath, (err, result) => {
      //         if (err) {
      //             console.log(err);
      //             res.status(500).send('Error converting DOCX to PDF');
      //         }
      //         else {
      //             res.download(outputfilepath, () => {
                     
      //             });
      //         }
      //     })
      // });