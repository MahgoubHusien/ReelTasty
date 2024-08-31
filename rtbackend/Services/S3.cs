using Amazon.S3;
using Amazon.S3.Transfer;
using System;
using System.IO;
using System.Threading.Tasks;

public class S3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public S3Service(IAmazonS3 s3Client)
    {
        _s3Client = s3Client ?? throw new ArgumentNullException(nameof(s3Client));
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") 
                      ?? throw new ArgumentNullException("S3_BUCKET_NAME environment variable is not set.");
    }

    public async Task<string> UploadFileAsync(string filePath, string fileName)
    {
        if (string.IsNullOrEmpty(filePath)) throw new ArgumentException("File path cannot be null or empty", nameof(filePath));
        if (string.IsNullOrEmpty(fileName)) throw new ArgumentException("File name cannot be null or empty", nameof(fileName));

        try
        {
            var fileTransferUtility = new TransferUtility(_s3Client);

            using (var fileToUpload = new FileStream(filePath, FileMode.Open, FileAccess.Read))
            {
                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = fileToUpload,
                    Key = fileName,
                    BucketName = _bucketName,
                    CannedACL = S3CannedACL.PublicRead
                };

                await fileTransferUtility.UploadAsync(uploadRequest);
            }

            var s3Url = $"https://{_bucketName}.s3.amazonaws.com/{Uri.EscapeDataString(fileName)}";
            return s3Url;
        }
        catch (AmazonS3Exception ex)
        {
            throw new InvalidOperationException($"Error uploading file to S3: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"An error occurred during the file upload: {ex.Message}", ex);
        }
    }
}
