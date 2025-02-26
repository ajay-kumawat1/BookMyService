import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

export const uploadImageCloudinary = async (file, folder) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
        const isVideo = file.mimetype.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        const upload = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error.message);
                    return reject(new Error('Media upload failed.'));
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
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        let publicId = await getPublicIdFromUrl(url)

        return await cloudinary.uploader.destroy(publicId, { invalidate: true });

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


