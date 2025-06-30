# David's Project Portfolio

A dynamic GitHub Pages site that automatically showcases all my web projects and experiments. This repository serves as both a portfolio and a collection of interactive web applications.

## 🌟 Features

- **Dynamic Project Discovery**: Automatically lists all project directories without manual updates
- **README-Driven Descriptions**: Uses the first sentence of each project's README.md as the description
- **Visual Previews**: Displays favicon.svg files as project thumbnails
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Zero Maintenance**: Add new projects by simply creating a new directory

## 🚀 How It Works

The landing page (`index.html`) uses the GitHub API to:

1. **Discover Projects**: Automatically finds all directories in the repository
2. **Extract Descriptions**: Reads the first sentence from each project's `README.md`
3. **Display Thumbnails**: Shows `favicon.svg` files as square project icons
4. **Generate Links**: Creates navigation links to each project

## 📁 Project Structure

```
DavidEverlaw.github.io/
├── index.html              # Dynamic landing page
├── README.md              # This file
└── project-name/          # Each project directory
    ├── index.html         # Project entry point
    ├── README.md          # Project description (first sentence used)
    ├── favicon.svg        # Project thumbnail
    └── ...                # Project files
```

## ✨ Adding New Projects

To add a new project to the portfolio:

1. **Create a directory** with your project name
2. **Add your project files** including an `index.html`
3. **Create a README.md** with a clear first sentence describing the project
4. **Add a favicon.svg** for the project thumbnail (optional)
5. **Push to GitHub** - the landing page will automatically update!

## 🎨 Project Requirements

For best results, each project should include:

- **README.md**: First sentence becomes the project description
- **favicon.svg**: Square SVG icon for the project thumbnail
- **index.html**: Entry point for the project

## 🔧 Technical Details

- **Framework**: Vanilla JavaScript, HTML5, CSS3
- **API**: GitHub REST API for repository contents
- **Hosting**: GitHub Pages
- **Responsive**: CSS Grid with mobile-first design
- **Performance**: Parallel API calls for fast loading

## 🌐 Live Site

Visit the portfolio at: [https://davideverlaw.github.io](https://davideverlaw.github.io)
