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

