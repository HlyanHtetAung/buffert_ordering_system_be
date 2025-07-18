const fs = require("fs");
const S3 = require("aws-sdk/clients/s3");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// upload a file to s3
async function uploadImageToS3(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
    ContentType: file.mimetype,
    // ACL: "public-read",
  };

  try {
    const result = await s3.upload(uploadParams).promise();
    return result;
  } catch (err) {
    console.error("S3 upload failed:", err);
    throw err;
  }
}

// download a file from s3

async function getImageFromS3(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };

  try {
    const result = await s3.getSignedUrlPromise("getObject", downloadParams);
    return result;
  } catch (err) {
    console.error("S3 download failed:", err);
    throw err;
  }
}

module.exports = {
  uploadImageToS3,
  getImageFromS3,
};
