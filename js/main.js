async function fetchText(url){
  const res = await fetch(url, {cache: "no-store"});
  if(!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}
async function fetchJSON(url){
  const res = await fetch(url, {cache: "no-store"});
  if(!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.json();
}

// Tiny BibTeX parser (good enough for typical personal-site .bib files).
function parseBibTeX(input){
  const entries = [];
  let i = 0;

  function skipWs(){ while(i < input.length && /\s/.test(input[i])) i++; }
  function readUntil(pred){
    let s = "";
    while(i < input.length && !pred(input[i])) { s += input[i++]; }
    return s;
  }
  function readBalanced(openChar, closeChar){
    // assumes input[i] is openChar
    let depth = 0;
    let s = "";
    while(i < input.length){
      const c = input[i++];
      s += c;
      if(c === openChar) depth++;
      else if(c === closeChar){
        depth--;
        if(depth === 0) break;
      }
    }
    return s;
  }
  function readValue(){
    skipWs();
    if(input[i] === '{'){
      const raw = readBalanced('{','}');
      return raw.slice(1,-1).trim();
    }
    if(input[i] === '"'){
      i++; // consume "
      let s = "";
      while(i < input.length){
        const c = input[i++];
        if(c === '"' && input[i-2] !== '\\') break;
        s += c;
      }
      return s.trim();
    }
    // bare word (e.g., dec)
    return readUntil(c => c === ',' || c === '}' || c === '\n').trim();
  }

  while(i < input.length){
    const at = input.indexOf('@', i);
    if(at === -1) break;
    i = at + 1;
    skipWs();
    const type = readUntil(c => c === '{' || c === '(').trim().toLowerCase();
    if(i >= input.length) break;
    const open = input[i++];
    const close = (open === '{') ? '}' : ')';
    skipWs();
    const key = readUntil(c => c === ',' || c === close).trim();
    if(input[i] === ',') i++;
    const fields = {};
    while(i < input.length){
      skipWs();
      if(input[i] === close){ i++; break; }
      const name = readUntil(c => c === '=' || c === close).trim().toLowerCase();
      if(input[i] === close){ i++; break; }
      i++; // =
      const value = readValue();
      fields[name] = value;
      // move to next comma or close
      skipWs();
      if(input[i] === ',') i++;
    }
    entries.push({type, key, ...fields});
  }
  return entries;
}

function splitAuthors(authorField){
  if(!authorField) return [];
  return authorField.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean);
}

function formatAuthorName(name){
  // Convert "Last, First" or "Last, First Middle" to "First Last" or "First Middle Last"
  name = name.trim();
  if(name.includes(',')){
    const parts = name.split(',').map(s => s.trim());
    if(parts.length >= 2){
      const last = parts[0];
      const first = parts.slice(1).join(' ');
      return `${first} ${last}`;
    }
  }
  return name;
}

function formatAuthors(authorField, authorLinks = {}, sharedAuthors = []){
  const authors = splitAuthors(authorField);
  if(authors.length === 0) return "";
  const formatted = authors.map(name => formatAuthorName(name));
  
  // Create a case-insensitive lookup for author links
  const linkMap = {};
  for(const [name, url] of Object.entries(authorLinks)){
    if(url) linkMap[name.toLowerCase()] = {originalName: name, url: url};
  }
  
  // Create a flexible matching function for shared authors
  // Matches by last name or full name (case-insensitive)
  function isSharedAuthor(formattedName, originalName){
    const formattedLower = formattedName.toLowerCase();
    const originalLower = originalName.toLowerCase();
    
    // Extract last name from original (before comma) and formatted (last word)
    const originalLast = originalLower.includes(',') ? originalLower.split(',')[0].trim() : originalLower.split(/\s+/).pop();
    const formattedLast = formattedLower.split(/\s+/).pop();
    
    for(const sharedName of sharedAuthors){
      const sharedLower = sharedName.toLowerCase();
      const sharedLast = sharedLower.split(/\s+/).pop();
      
      // Match if:
      // 1. Last names match (from original, formatted, or shared)
      // 2. Formatted name contains shared name or vice versa
      // 3. Original name's last name matches shared name's last name
      if(originalLast === sharedLast || 
         formattedLast === sharedLast ||
         formattedLower.includes(sharedLower) || 
         sharedLower.includes(formattedLower) ||
         originalLower.includes(sharedLast) ||
         sharedLower.includes(originalLast)){
        return true;
      }
    }
    return false;
  }
  
  // Format each author with links, highlighting, and asterisks
  const formattedAuthors = authors.map((originalName, idx) => {
    const authorName = formatted[idx];
    const authorLower = authorName.toLowerCase();
    const originalLower = originalName.toLowerCase();
    const linkEntry = linkMap[authorLower];
    const isShrisha = authorLower.includes("shrisha") && authorLower.includes("bharadwaj");
    const isShared = isSharedAuthor(authorName, originalName);
    
    let displayName = escapeHTML(authorName);
    if(isShared){
      displayName = `${displayName}*`;
    }
    
    if(isShrisha){
      // Highlight Shrisha's name (always, even if it has a link)
      if(linkEntry && linkEntry.url){
        // If it also has a link, make it both highlighted and clickable
        return `<a href="${escapeHTML(linkEntry.url)}" class="authorLink authorHighlight" target="_blank" rel="noopener">${displayName}</a>`;
      } else {
        return `<span class="authorHighlight">${displayName}</span>`;
      }
    } else if(linkEntry && linkEntry.url){
      // Author has a link - make it clickable
      return `<a href="${escapeHTML(linkEntry.url)}" class="authorLink" target="_blank" rel="noopener">${displayName}</a>`;
    } else {
      return displayName;
    }
  });
  
  // Join with commas and handle "and" before last author
  let result = formattedAuthors.join(", ");
  if(formattedAuthors.length > 1){
    result = result.replace(/, ([^,]+)$/, ", and $1");
  }
  return result;
}

function escapeHTML(s){
  return (s || "").toString().replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function makeLink(url, label){
  if(!url) return "";
  // Allow HTML in label (for code icon)
  if(label.includes("<span>")){
    return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${label}</a>`;
  }
  return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(label)}</a>`;
}

function bibToPretty(entry){
  // Keep it simple: show original-ish BibTeX re-serialized.
  const ignore = new Set(["type","key","shared_authors","url","paperurl","projecturl","codeurl","videourl","slidesurl","posterurl","arxivurl","preview","preview_width","previewwidth","selected"]);
  const parts = [];
  for(const [k,v] of Object.entries(entry)){
    if(ignore.has(k)) continue;
    parts.push(`  ${k} = {${v}},`);
  }
  return `@${entry.type}{${entry.key},\n${parts.join("\n")}\n}`;
}

function normalizeText(s){
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function pubMatchesQuery(pub, q){
  if(!q) return true;
  const hay = normalizeText([
    pub.title, pub.author, pub.venue, pub.booktitle, pub.journal, pub.year,
    pub.doi, pub.url
  ].join(" "));
  return hay.includes(q);
}

function groupByYear(pubs){
  const map = new Map();
  for(const p of pubs){
    const y = (p.year || "Other").toString();
    if(!map.has(y)) map.set(y, []);
    map.get(y).push(p);
  }
  // sort years desc numeric
  const years = Array.from(map.keys()).sort((a,b)=>{
    const na = parseInt(a,10), nb = parseInt(b,10);
    if(Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
    return a.localeCompare(b);
  });
  return years.map(y => ({year:y, pubs: map.get(y)}));
}

function formatVenue(p){
  const venue = (p.venue || "").trim();
  const booktitle = (p.booktitle || "").trim();
  const journal = (p.journal || "").trim();
  const year = p.year ? p.year.toString() : "";
  
  // Check all venue sources
  const venueLower = venue.toLowerCase();
  const booktitleLower = booktitle.toLowerCase();
  const journalLower = journal.toLowerCase();
  
  // Format SIGGRAPH venues
  if(venueLower.includes("siggraph") || booktitleLower.includes("siggraph") || journalLower.includes("siggraph")){
    let siggraphType = "";
    if(venueLower.includes("asia") || booktitleLower.includes("asia") || journalLower.includes("asia")){
      siggraphType = "SIGGRAPH Asia";
    } else {
      siggraphType = "SIGGRAPH";
    }
    
    // Determine if it's Journal Track or Conference Track
    let trackType = "";
    if(journal || journalLower.includes("tog") || journalLower.includes("transactions") || venueLower.includes("journal")){
      trackType = "Journal Track";
    } else if(booktitle || venueLower.includes("conference") || booktitleLower.includes("conference")){
      trackType = "Conference Track";
    }
    
    if(trackType && year){
      return `${siggraphType} (${trackType}), ${year}`;
    } else if(year){
      return `${siggraphType}, ${year}`;
    } else if(trackType){
      return `${siggraphType} (${trackType})`;
    } else {
      return siggraphType;
    }
  }
  
  // For other venues, use venue field or booktitle/journal, add year if available
  const finalVenue = venue || booktitle || journal;
  if(year && finalVenue){
    return `${finalVenue}, ${year}`;
  }
  return finalVenue || "";
}

function cleanTitle(title){
  if(!title) return "";
  // Remove curly braces but keep the content
  return title.replace(/\{([^}]+)\}/g, '$1');
}

function renderPubs(pubs, authorLinks = {}){
  const container = document.getElementById("pubs");
  container.innerHTML = "";

  for(const p of pubs){
    const w = parseInt(p.preview_width || p.previewwidth || "", 10);
    const style = Number.isFinite(w) && w > 0 ? ` style="--w:${w}px"` : "";
    const media = p.preview ? `<img${style} src="${escapeHTML(p.preview)}" alt="preview">` : "";

    const venue = formatVenue(p);
    const title = cleanTitle(p.title || "");
    
    // Parse shared authors field (comma-separated list of formatted names)
    const sharedAuthors = p.shared_authors ? p.shared_authors.split(",").map(s => s.trim()).filter(Boolean) : [];
    
    const links = [];
    if(p.paperurl || p.url) links.push(makeLink(p.paperurl || p.url, "Paper"));
    if(p.projecturl) links.push(makeLink(p.projecturl, "Project"));
    if(p.codeurl) links.push(makeLink(p.codeurl, "Code"));
    if(p.videourl) links.push(makeLink(p.videourl, "Video"));
    if(p.slidesurl) links.push(makeLink(p.slidesurl, "Slides"));
    if(p.posterurl) links.push(makeLink(p.posterurl, "Poster"));
    if(p.arxivurl) links.push(makeLink(p.arxivurl, "ArXiv"));

    const bibId = `bib_${p.key.replace(/[^a-zA-Z0-9_]/g,"_")}`;
    const bibToggleHTML = `<span class="bibToggle" data-target="${bibId}">BibTeX</span>`;
    links.push(bibToggleHTML);

    const pubHTML = `
      <div class="pub">
        <div class="pubMedia">${media}</div>
        <div class="pubMeta">
          <div class="pubTitle">${escapeHTML(title)}</div>
          <div class="pubAuthors">${formatAuthors(p.author || "", authorLinks, sharedAuthors)}</div>
          <div class="pubVenue">${escapeHTML(venue)}</div>
          <div class="pubLinks">${links.join(" ")}</div>
          <div class="bib" id="${bibId}">${escapeHTML(bibToPretty(p))}</div>
        </div>
      </div>`;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = pubHTML;
    container.appendChild(wrapper.firstElementChild);
  }

  // wire bib toggles
  document.querySelectorAll(".bibToggle").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.getAttribute("data-target");
      const bib = document.getElementById(id);
      const show = (bib.style.display !== "block");
      bib.style.display = show ? "block" : "none";
    });
  });
}

function renderNews(news){
  const recent = document.getElementById("newsRecent");
  const more = document.getElementById("newsMore");
  const btn = document.getElementById("newsToggle");

  const RECENT_N = 4;
  const head = news.slice(0, RECENT_N);
  const tail = news.slice(RECENT_N);

  const liHTML = (n) =>
    `<li><span class="newsDate">${escapeHTML(n.date)}</span><span class="newsText">${n.html}</span></li>`;

  recent.innerHTML = head.map(liHTML).join("");
  more.innerHTML = tail.map(liHTML).join("");

  if(tail.length === 0){
    btn.style.display = "none";
    more.hidden = true;
    return;
  }

  btn.addEventListener("click", ()=>{
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    more.hidden = expanded;
  });
}

async function main(){
  // News
  const news = await fetchJSON("data/news.json");
  renderNews(news);

  // Author links
  let authorLinks = {};
  try {
    authorLinks = await fetchJSON("data/author_links.json");
  } catch(err) {
    console.warn("Could not load author_links.json:", err);
  }

  // Publications
  const bib = await fetchText("data/publications.bib");
  const pubsAll = parseBibTeX(bib);

  // controls
  const showAll = document.getElementById("pub-showall");

  function filtered(){
    const onlySelected = !showAll.checked;
    return pubsAll
      .filter(p => !onlySelected || normalizeText(p.selected) === "true");
  }

  function rerender(){
    renderPubs(filtered(), authorLinks);
  }

  showAll.addEventListener("change", rerender);

  rerender();
}

main().catch(err=>{
  const el = document.getElementById("errors");
  if(el){
    el.style.display = "block";
    el.textContent = err.message || String(err);
  }
});
