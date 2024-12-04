# Regular Expression Search

This repository contains the code for the Regular Expression Search Chrome extension, which enables users to perform regular expression-based searches within websites. The extension has the following features:

- The search process is asynchronous, ensuring that it doesn't interfere with the user's activities or disrupt their browsing experience.
- Previously entered search keywords, including regular expressions, are saved to the search history, allowing users to quickly reuse them to search on the current page.

## Environment Setup Instructions

### Required Environment

- Visual Studio Code
- Dev Containers

### Steps

1. **Open with Dev Containers**  
   Open the project using Dev Containers in Visual Studio Code.

2. **Install Node.js using nvm**  
   Run the following command in the terminal to install the required Node.js version:
   ```bash
   nvm install
   ```

3. **Install Dependencies**
   Install the project dependencies by running:
   ```bash
   npm install
   ```

4. **Build the Project**
   Run the following command to build the project:
   ```bash
   npm run build
   ```

5. Check in Chrome Extension Management
   A `dist` directory will be created, which can be loaded in the Chrome extension management screen.

## TODO

Express difficulty as Easy/Medium/Hard, sorted in increasing order of difficulty.

- [ ] i18n (Easy)
- [ ] Switch the testing tool from Jest to Vitest. (Easy)
- [x] Add a CI workflow to create a release and include a .zip file in the release. (Medium)
- [ ] Switch the bundling tool from Webpack to Vite (or possibly Rollup, but likely Vite). (Medium)
- [ ] Handle dynamic DOM element changes. (Hard)

## Licensing

This software is released under the MIT License. See [LICENSE](LICENSE) for the full license text.
