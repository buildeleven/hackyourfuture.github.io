const aws = require("aws-sdk");
const uuid = require("uuid/v4");
const { encryptData } = require("../utils/email-crypto");
let s3;

if (process.env.DEVELOPMENT) {
    s3 = new aws.S3({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY_ID
        }
    });
} else {
    s3 = new aws.S3();
}

module.exports = function(req, res) {
    const { type, fileName } = req.body;

    if (!type || !fileName) {
        res.status(400).json({
            error: "request file upload requires type and fileName"
        });
        return;
    }

    const extension = fileName.split(".").pop();
    const filename = `${uuid()}.${extension}`;

    const presignedGETURL = s3.createPresignedPost(
        {
            Bucket: "hyf-website-uploads",
            Key: filename, //filename
            Expires: 500, //time to expire in seconds
            Conditions: [
                { bucket: "hyf-website-uploads" },
                { key: filename },
                { acl: "public-read" }
                // Optionally control content type and file size
                // {'Content-Type': 'application/pdf'},
            ]
        },
        (err, data) => {
            if (err) {
                res.status(100).json({ error: "Something went wrong " });
                return;
            }

            data.fields.key = `${filename}`;

            res.status(200).json(data);
        }
    );
};
