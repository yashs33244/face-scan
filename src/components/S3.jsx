import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { useState } from "react";

function S3({ capturedPhotos, studentRollNo, instanceCode }) {
  const [uploadStatus, setUploadStatus] = useState({});

  const uploadFiles = async () => {
    const S3_BUCKET = "yashs3324-bk";
    const REGION = "eu-north-1";

    const s3 = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const uploadPromises = Object.entries(capturedPhotos).map(async ([view, photoDataUrl]) => {
      if (!photoDataUrl) return;

      // Convert base64 to blob
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();

      // Updated path to include instanceCode/studentRollNo/view.jpg
      const params = {
        Bucket: S3_BUCKET,
        Key: `${instanceCode}/${studentRollNo}/${view}.jpg`,
        Body: await blob.arrayBuffer(),
        ContentType: "image/jpeg",
      };

      try {
        await s3.send(new PutObjectCommand(params));
        setUploadStatus((prev) => ({ ...prev, [view]: "success" }));
      } catch (error) {
        console.error(`Error uploading ${view}:`, error);
        setUploadStatus((prev) => ({ ...prev, [view]: "error" }));
      }
    });

    await Promise.all(uploadPromises);
  };

  const allUploadsSuccessful =
    Object.keys(capturedPhotos).length > 0 && // Ensure there are photos to upload
    Object.keys(uploadStatus).length === Object.keys(capturedPhotos).length && // Ensure all photos are processed
    Object.values(uploadStatus).every((status) => status === "success"); // Check if all statuses are 'success'

  return (
    <div>
      <button
        className="bg-green-500 text-white p-2 w-full rounded-md hover:bg-green-600 transition-colors"
        onClick={uploadFiles}
        disabled={!Object.values(capturedPhotos).every(Boolean)} // Ensure all photos are captured before enabling
      >
        Upload All Photos
      </button>
      <div className="mt-4">
        {Object.entries(uploadStatus).map(([view, status]) => (
          <div key={view} className={`text-sm ${status === "success" ? "text-green-500" : "text-red-500"}`}>
            {view}: {status === "success" ? "✓ Uploaded" : "✗ Failed"}
          </div>
        ))}
        {allUploadsSuccessful && (
          <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md text-center font-medium">
            All photos uploaded successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default S3;