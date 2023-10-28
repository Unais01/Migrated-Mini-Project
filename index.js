const express = require('express');
const fs = require('fs');
const bodyparser = require('body-parser');
const port = process.env.PORT || 5000;
const path = require('path');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const docxtopdf = require('docx-pdf');
const { mergePdfs } = require('./merge');
const { error, log } = require('console');
const ExcelJS = require('exceljs')
// const PDFDocument = require('pdfkit');
const { workerData } = require('worker_threads');
const app = express();
/*########################HMulter and serving static files###########################*/
app.use(express.static('uploads'));
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
/*########################file upload###########################*/
const upload = multer({ storage: storage });
app.use(express.static('public'));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

/*########################Home route###########################*/
app.get('/', (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});


/*########################Merging pdf###########################*/
app.post('/merge', upload.array('pdfs', 2), async (req, res, next) => {
  console.log(req.files)
  console.log(error);
  let d = await mergePdfs(path.join(__dirname, req.files[0].path), path.join(__dirname, req.files[1].path));
  res.sendFile(__dirname + `/Merge Generator/${d}.pdf`)
});



/*########################Word to  pdf###########################*/
app.post('/docxtopdf', upload.single('file'), (req, res) => {
  // Assuming you're using a form to upload the DOCX file.
  const docxFilePath = req.file.path;
  const outputPdfFilePath = path.join(__dirname + "/Generator", Date.now() + '_word.pdf'); // Change this to your desired output path.

  docxtopdf(docxFilePath, outputPdfFilePath, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error converting DOCX to PDF');
    } else {
      res.download(outputPdfFilePath, 'output.pdf', (downloadError) => {
        res.sendFile(`${outputPdfFilePath}`)
      });
    }
  });
});



/*########################EXCEL to PDF###########################*/

app.post('/xltopdf', upload.single('xls'), (req, res) => {
  // Assuming you're using a form to upload the DOCX file.
  const xlFilePath = req.file.path;
  // const outputPdfFilePath = path.join(__dirname + "/Generator", Date.now() + 'output.pdf'); // Change this to your desired output path.
  //  console.log(xlFilePath);



  (async () => {
    const outputPdfFilePath = path.join(__dirname + "/Generator", Date.now() + '_xls.pdf')
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(`${xlFilePath}`);
    const worksheet = workbook.getWorksheet('Sheet1' || "Sheet2" || "Eng Ist To VIIth");
    // const worksheet = workbook.getWorksheet('Sheet1');


    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(`${outputPdfFilePath}`));

    const columnSpacing = 50;

    worksheet.eachRow((row, rowIndex) => {
      row.eachCell((cell, colIndex) => {
        const xPos = colIndex * 40 + (colIndex - 1) * columnSpacing;
        const yPos = rowIndex * 40;

        pdfDoc.text(cell.text, xPos, yPos);
      })
    })



    pdfDoc.end();

    res.sendFile(__dirname + `/public/thankyou.html`)

  })();
});

/*########################image to PDF###########################*/
app.post('/imgtopdf', upload.single('file'), (req, res) => {
  // Assuming you're using a form to upload the DOCX file.
  const imagelocation = req.file.path;
  const pdflocation = path.join(__dirname+'/Generator', Date.now() + '_img.pdf');
  // const outputPdfFilePath = path.join(__dirname + "/Generator", Date.now() + 'output.pdf'); // Change this to your desired output path.
  //  console.log(xlFilePath);



  async function convertImageToPdf(imagePath, pdfPath) {
    // Read the image file asynchronously.
    const image = await fs.promises.readFile(imagePath);

    // Create a new PDF document.
    const pdfDoc = await PDFDocument.create();

    // Add a new page to the PDF document with a dimension of 400×400 points.
    const page = pdfDoc.addPage([400, 400]);

    // Embed the image into the PDF document.
    const imageEmbed = await pdfDoc.embedJpg(image);

    // Scale the image to fit within the page dimensions while preserving aspect ratio.
    const { width, height } = imageEmbed.scaleToFit(
      page.getWidth(),
      page.getHeight(),
    );

    // Draw the image on the PDF page.
    page.drawImage(imageEmbed, {
      x: page.getWidth() / 2 - width / 2, // Center the image horizontally.
      y: page.getHeight() / 2 - height / 2, // Center the image vertically.
      width,
      height,
      color: rgb(0, 0, 0), // Set the image color to black.
    });

    // Save the PDF document as bytes.
    const pdfBytes = await pdfDoc.save();

    // Write the PDF bytes to a file asynchronously.
    await fs.promises.writeFile(pdfPath, pdfBytes);
  }

  // Call the conversion function with input and output file paths.
  convertImageToPdf(`${imagelocation}`, `${pdflocation}`)
    .then(() => {
      console.log('Image converted to PDF successfully!');
      res.sendFile(`${pdflocation}`)
    })
    .catch((error) => {
      console.error('Error converting image to PDF:', error);
    });
});



app.listen(port, () => {
  console.log(`server is listening on http://localhost:${port}`);

});










