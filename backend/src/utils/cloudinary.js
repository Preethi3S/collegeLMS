const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

// Utility function to upload file to Cloudinary
exports.uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: "auto",
            folder: "college-lms"
        });
        return result.secure_url;
    } catch (error) {
        throw new Error('Error uploading file to Cloudinary');
    }
};

// Utility function to delete file from Cloudinary
exports.deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error('Error deleting file from Cloudinary');
    }
};