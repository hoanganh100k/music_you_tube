const { createWriteStream } = require("fs");
const fs = require("fs");

const { createInterface } = require("readline");
const { parse } = require("url");
const ytdl = require("ytdl-core");
const bodyParser = require("body-parser");

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});
//a
const express = require('express')
const app = express()
const port = process.env.PORT
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post('/geturlyt', (req, res) => {
    console.log(req.body)
    let video = req.body.url
    let format = "mp4" //định dạng
    if (format.startsWith(".")) format = format.replace(/./g, "");

    if (video.startsWith("http://") ||
        video.startsWith("https://") ||
        video.startsWith("www")) {
        if (video.includes("youtu.be")) {
            let url = parse(video, true);
            let video_id = url.pathname.toString().replace(/\//g, "");
            res.send({ "video_id": video_id })

            ytdl(`https://www.youtube.com/watch?v=${video_id}`)
                .pipe(createWriteStream(`file/${video_id}.${format}`))
                .on("finish", () => {
                    console.log("\nFinished!");
                    rl.close();
                });

            return;
        };

        let url = parse(video, true);
        let video_id = url.query.v;
        res.send({ "video_id": video_id })

        ytdl(`https://www.youtube.com/watch?v=${video_id}`)
            .pipe(createWriteStream(`file/${video_id}.${format}`))
            .on("finish", () => {
                console.log("\nFinished!");
                rl.close();
            });
    } else {
        res.send(video)
        ytdl(`https://www.youtube.com/watch?v=${video}`)
            .pipe(createWriteStream(`file/${video}.${format}`))
            .on("finish", () => {
                console.log("\nFinished!");
                rl.close();
            });
    };
})
app.get("/getvideo/:id", (req, res) => {
    const path = 'file/'+req.params.id+".mp4";

    fs.stat(path, (err, stat) => {

        // Handle file not found
        if (err !== null && err.code === 'ENOENT') {
            res.sendStatus(404);
        }

        const fileSize = stat.size
        const range = req.headers.range

        if (range) {

            const parts = range.replace(/bytes=/, "").split("-");

            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    });
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
