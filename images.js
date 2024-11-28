const fs = require('fs');
const path = require('path');

// Paths
const postsDir = path.join("C:", "Users", "pradeep", "Documents", "specwiseblog", "content", "posts");
const attachmentsDir = path.join("C:", "Users", "pradeep", "Documents", "Obsidian Vault", "attachments");
const staticImagesDir = path.join("C:", "Users", "pradeep", "Documents", "specwiseblog", "static", "images");

// Ensure static images directory exists
if (!fs.existsSync(staticImagesDir)) {
    fs.mkdirSync(staticImagesDir, { recursive: true });
    console.log(`Created missing directory: ${staticImagesDir}`);
}

// Function to process Markdown files
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

                // Find all image links in the format [[Image.png]]
                const imageMatches = content.match(/\[\[([^\]]+\.(png|jpg|jpeg|gif|svg))\]\]/gi);

                if (imageMatches) {
                    imageMatches.forEach((match) => {
                        const imageName = match.replace(/\[\[|\]\]/g, "");
                        // Update this line to include the full path for GitHub Pages
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
