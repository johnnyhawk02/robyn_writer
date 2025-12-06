# TinyTracer

## How to add images manually

Since you are uploading images directly to GitHub, follow these steps:

1.  **Go to GitHub:** Open your repository in your browser.
2.  **Navigate:** Click on the `public` folder, then the `assets` folder.
3.  **Upload:**
    *   Click **Add file** (top right) -> **Upload files**.
    *   Drag and drop your images (e.g., `car.png`, `apple.jpg`).
    *   Click **Commit changes**.
4.  **Update Code:**
    *   In `constants.ts`, simply use the filename:
    ```typescript
    {
      text: 'car',
      imageUrl: 'car.png' // The app automatically looks in public/assets/
    }
    ```

**Note:** It may take 1-2 minutes for new images to appear on the live site after you upload them to GitHub.
