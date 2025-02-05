# Obsidian to Hugo Blog Pipeline

A sophisticated automation pipeline that transforms Obsidian notes into a Hugo-powered blog with automated deployment to GitHub.

## 🌟 Features

- Seamless integration between Obsidian and Hugo
- Automatic image handling and transfer
- Git-based version control
- Automated deployment pipeline
- Support for both Windows and Unix-based systems
- Markdown-first approach

## 🛠️ Prerequisites

- [Obsidian](https://obsidian.md/)
- [Git](https://github.com/git-guides/install-git)
- [Go](https://go.dev/dl/)
- [Hugo](https://gohugo.io/installation/)
- [Python](https://www.python.org/downloads/)
- Node.js (for image processing script)

## 📁 Project Structure

```
project/
├── content/
│   └── posts/           # Blog posts directory
├── static/
│   └── images/         # Images directory
├── themes/             # Hugo themes
├── scripts/
│   ├── deploy.ps1      # Windows deployment script
│   └── deploy.sh       # Unix deployment script
└── images.js           # Image processing script
```

## 🚀 Setup Instructions

1. **Obsidian Setup**
   - Create a new Obsidian vault
   - Create a `_posts` folder for your blog posts
   - Note the directory path for configuration

2. **Hugo Setup**
   ```bash
   # Create new Hugo site
   hugo new site websitename
   cd websitename
   
   # Initialize git
   git init
   
   # Add theme (example using Terminal theme)
   git submodule add -f https://github.com/panr/hugo-theme-terminal.git themes/terminal
   ```

3. **Configuration**
   - Update `hugo.toml` with your preferred settings
   - Configure the deployment scripts with your paths:
     - Update `sourcePath` (Obsidian posts directory)
     - Update `destinationPath` (Hugo posts directory)
     - Set `myrepo` to your GitHub repository URL

## 🔄 Usage

### Windows

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Notes

- Always backup your content before running the deployment scripts
- Verify your paths in the deployment scripts before running
- Ensure all prerequisites are installed and properly configured
- Test the deployment process in a development environment first

## 🔧 Troubleshooting

If you encounter issues:
1. Verify all paths in your configuration
2. Ensure all prerequisites are installed
3. Check Git configuration and permissions
4. Verify Hugo theme installation
5. Check console output for specific error messages

## 📚 Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Obsidian Documentation](https://help.obsidian.md/)
- [Git Documentation](https://git-scm.com/doc)

### Mac/Linux
```bash
./deploy.sh
```

The deployment script will:
1. Sync posts from Obsidian to Hugo
2. Process and transfer images
3. Build the Hugo site
4. Commit and push changes to GitHub
5. Deploy to your hosting branch

## 📝 Blog Post Format

Each blog post should include the following frontmatter:
```yaml
---
title: Your Blog Title
date: YYYY-MM-DD
draft: false
tags:
  - tag1
  - tag2
---
```

## 🖼️ Image Handling

Images in Obsidian using the format `[[image.png]]` will automatically be:
- Copied to the Hugo static directory
- Converted to proper Hugo image syntax
- Deployed with your blog posts