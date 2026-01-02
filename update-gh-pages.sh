#!/bin/bash
# Script to update gh-pages branch with static HTML site

echo "Updating gh-pages branch with new static site..."

# Make sure we're on master
git checkout master

# Create or update gh-pages branch
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# Remove all files from gh-pages
git rm -rf .

# Copy all files from master
git checkout master -- .

# Commit the changes
git add .
git commit -m "Update to static HTML site - remove Jekyll"

# Push to origin
git push -f origin gh-pages

# Go back to master
git checkout master

echo "Done! Your gh-pages branch has been updated."
echo "GitHub Pages should now serve your new static site."
echo ""
echo "Note: It may take a few minutes for the changes to appear."
echo "You may need to clear your browser cache (Ctrl+F5 or Cmd+Shift+R)."

