import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

export const uploadImageCloudinary = async (file, folder) => {
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
    });

    return new Promise((resolve, reject) => {
        let resourceType = 'auto';
        if (file.mimetype.startsWith('image/')) {
            resourceType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
            resourceType = 'video';
        } else if (file.mimetype === 'pdf/') {
            resourceType = 'pdf';
        }   else if (
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            resourceType = 'raw';
        }
        
        const uploadOptions = {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
        };

        const upload = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error.message);
                    return reject(new Error(`File upload failed: ${error.message}`));
                }
                resolve(result.secure_url);                  
            }
        );
        upload.end(file.buffer);
    });
};



export const deleteImageCloudinary = async (url) => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
        });
        let publicId = await getPublicIdFromUrl(url)
        let partsOfUrl = url.split('/');
        if (
            !publicId ||
            partsOfUrl.includes('default') || 
            publicId.startsWith('language-')
        );
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
        
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error.message);
        throw new Error("Image delete failed.");
    }
};


export const getPublicIdFromUrl = (url) => {
    const parts = url?.split('/image/upload/');
    
    const publicIdWithVersion = parts[1];
    return publicIdWithVersion?.split('/')?.slice(1)?.join('/')?.split('.')[0];
};

