import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';  // Node js file system to do operation on files 

 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDNIARY_CLOUD_NAME, 
    api_key: process.env.CLOUDNIARY_API_KEY, 
    api_secret: process.env.CLOUDNIARY_API_SECRET 
});

// We are getting local file location to upload file in Cloudinary

const uploadDataCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        // upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto' // which type of file (image, video)
        })
        // console.log("File uploaded successfully", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    }
    catch(error){
        // remove the temporary file as the upload has been failed
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadDataCloudinary}