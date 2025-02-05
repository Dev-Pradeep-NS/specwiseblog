const fs = require('fs');
const path = require('path');
require('dotenv').config();

const postsDir = path.resolve(process.env.POSTS_DIR);
const attachmentsDir = path.resolve(process.env.ATTACHMENTS_DIR);
const staticImagesDir = path.resolve(process.env.STATIC_IMAGES_DIR);

if (!fs.existsSync(staticImagesDir)) {
    fs.mkdirSync(staticImagesDir, { recursive: true });
    console.log(`Created missing directory: ${staticImagesDir}`);
}

fs.readdir(postsDir, (err, files) => {
    if (err) {
        console.error("Error reading posts directory:", err);
        return;
    }

    files.forEach((filename) => {
        if (filename.endsWith(".md")) {
            const filepath = path.join(postsDir, filename);

            fs.readFile(filepath, "utf-8", (err, content) => {
                if (err) {
                    console.error("Error reading file:", filepath, err);
                    return;
                }

                // Updated regex to match !![Image Description](image.png) format
                const imageMatches = content.match(/!!\[([^\]]*)\]\(([^)]+)\)/g);

                if (imageMatches) {
                    imageMatches.forEach((match) => {
                        // Extract image name from the full match
                        const imageName = match.match(/\(([^)]+)\)/)[1];
                        const markdownImage = `![Image Description](/specwiseblog/images/${encodeURIComponent(imageName)})`;
                        content = content.replace(match, markdownImage);

                        const imageSource = path.join(attachmentsDir, imageName);
                        const imageDest = path.join(staticImagesDir, imageName);

                        if (fs.existsSync(imageSource)) {
                            if (!fs.existsSync(imageDest)) {
                                fs.copyFile(imageSource, imageDest, (err) => {
                                    if (err) {
                                        console.error("Error copying file:", imageSource, "to", imageDest, err);
                                    } else {
                                        console.log(`Copied: ${imageName}`);
                                    }
                                });
                            } else {
                                console.log(`Image already exists, skipping copy: ${imageName}`);
                            }
                        } else {
                            console.warn(`Image not found: ${imageSource}`);
                        }
                    });

                    fs.writeFile(filepath, content, "utf-8", (err) => {
                        if (err) {
                            console.error("Error writing file:", filepath, err);
                        } else {
                            console.log(`Updated file: ${filepath}`);
                        }
                    });
                } else {
                    console.log(`No images found in: ${filepath}`);
                }
            });
        } else {
            console.log(`Skipping non-Markdown file: ${filename}`);
        }
    });
});

console.log("Markdown files processed and images copied successfully.");
