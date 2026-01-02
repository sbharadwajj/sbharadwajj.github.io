# My Homepage

Feel free to fork this page for your website. Please include the following acknowledgments. 

## Acknowledgements

- website design that I built on: https://www.dgp.toronto.edu/~hsuehtil/#about I really like how minimal and clean the webpage is.  
- Pretty tree icons from: https://www.flaticon.com/packs/forest-element-1

Recommended extra (optional) BibTeX fields (custom):
- `selected = {true|false}`  (controls whether it shows when “Show all” is off)
- `preview = {assets/img/publication_preview/your.gif}`
- `paperurl`, `projecturl`, `codeurl`, `videourl`
- `shared_author` automatically adds asterix to shared authors listed. 
- `author_links.json` has the homepage links of authors.

## Local preview
Some browsers block `fetch()` when you open `index.html` directly from disk.
Run a tiny server in this folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## GitHub Pages Deployment

This is a static HTML site, so it works perfectly with GitHub Pages without any special configuration.

### Quick Setup:

1. **Push your code to GitHub** (if you haven't already)
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click on **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** (or **master**) branch and **/ (root)** folder
   - Click **Save**

3. **Your site will be live at:**
   - `https://[your-username].github.io/[repository-name]/`
   - Or if your repository is named `[username].github.io`, it will be at:
   - `https://[your-username].github.io/`

### Notes:
- The `.nojekyll` file ensures GitHub Pages doesn't try to process this as a Jekyll site
- No Gemfile or Jekyll configuration needed - this is a pure static HTML site
- Changes will be automatically deployed when you push to the main branch
- It may take a few minutes for changes to appear after pushing

