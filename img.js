const express = require("express");
const router = express.Router();
const fs = require("fs");
const Sharp = require('sharp');
const { dirname } = require('path');
const appDir = dirname(require.main.filename);


router.get('/:imageName', (req, res, next) => {
    var image = req.params['imageName'];
    var imagePath = appDir + "/uploads/" + image;  
 console.log("imagepath:",imagePath);
    if (req.query.format != null) {
        if (fs.existsSync(imagePath)) {
            const format = req.query.format ? req.query.format : "png";
            const width = req.query.width ? parseInt(req.query.width) : null;
            const height = req.query.height ? parseInt(req.query.height) : null;
            const crop = req.query.crop ? req.query.crop : "cover";
 
            const stream = fs.createReadStream(imagePath);
            const transform = Sharp()
                .resize(width, height, {
                    fit: crop
                })
                .withMetadata({ orientation: 1 }) // Menghapus metadata yang tidak diperlukan
                .toFormat(format, {
                    quality: 80, 
                    failOnError: false
                }); 
            res.set('Content-Type', `image/${format}`);
            stream.pipe(transform).pipe(res);
            // Penanganan error pada stream dan transform
            stream.on('error', (err) => {
                console.error('Error pada stream file gambar:', err.message);
                res.status(500).send('Error pada stream file gambar');
            });
            transform.on('error', (err) => {
                console.error('Error pada transformasi gambar:', err.message);
                res.status(500).send('Error pada transformasi gambar');
            });
        } else {
            res.status(404).send('Gambar tidak ditemukan');
        }
    } else {
        next();
    }
 });
module.exports = router;