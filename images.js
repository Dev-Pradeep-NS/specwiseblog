const fs = require('fs');
const path = require('path');

// Paths
const postsDir = path.join("C:", "Users", "pradeep", "Documents", "specwiseblog", "content", "posts");
const attachmentsDir = path.join("C:", "Users", "pradeep", "Documents", "Obsidian Vault", "attachments");
const staticImagesDir = path.join("C:", "Users", "pradeep", "Documents", "specwiseblog", "static", "images");

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

                // Step 2: Find all image links in the format [[Image.png]]
                const imageMatches = content.match(/\[\[([^]*?\.png)\]\]/g);

                if (imageMatches) {
                    imageMatches.forEach((match) => {
                        const imageName = match.replace(/\[\[|\]\]/g, ""); // Remove brackets
                        const markdownImage = `![Image Description](/images/${encodeURIComponent(imageName)})`;
                        content = content.replace(match, markdownImage);

                        // Step 4: Copy the image if it exists
                        const imageSource = path.join(attachmentsDir, imageName);
                        const imageDest = path.join(staticImagesDir, imageName);

                        if (fs.existsSync(imageSource)) {
                            fs.copyFile(imageSource, imageDest, (err) => {
                                if (err) {
                                    console.error("Error copying file:", imageSource, "to", imageDest, err);
                                }
                            });
                        } else {
                            console.warn("Image not found:", imageSource);
                        }
                    });

                    // Step 5: Write the updated content back to the file
                    fs.writeFile(filepath, content, "utf-8", (err) => {
                        if (err) {
                            console.error("Error writing file:", filepath, err);
                        }
                    });
                }
            });
        }
    });
});

console.log("Markdown files processed and images copied successfully.");
