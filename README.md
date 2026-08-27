# ⚡ ToolSphere — 100% Client-Side Web Utility SaaS

ToolSphere is a high-converting, fully responsive web utility SaaS designed to run **100% in the user's browser with \$0 API costs and \$0 backend server fees**, pre-configured with strategic **Adsterra ad slots** for maximum monetization revenue.

---

## 🛠️ Included Tools (Zero External APIs)
1. **Smart Image Compressor & Resizer:** Reduces file KB size up to 90% via HTML5 Canvas with quality sliders, dimension presets, and live size comparison.
2. **Multi-Format Image Converter:** Converts between PNG, JPG, WEBP, and BMP with batch conversion & ZIP archive download.
3. **Custom QR Code Studio:** Generates customizable QR codes for URLs, Plain Text, Wi-Fi networks, and Emails with color pickers and PNG download.
4. **Text & Case Utility Suite:** Word counter, character counter, reading time estimator, uppercase/lowercase/titlecase/slug transforms, and whitespace cleaner.
5. **Color Palette Studio (Bonus):** Extracts dominant hex colors from any uploaded image and outputs ready-to-use CSS variables.

---

## 💰 How to Add Your Adsterra Ads

Once your website is registered on [Adsterra Publisher](https://publishers.adsterra.com/), replace the placeholders in `index.html` with your Adsterra code snippets:

### 1. Top Header Banner (`728x90` or `320x50`)
* Open `index.html` and find `<!-- ADSTERRA CODE INJECTION POINT: HEADER BANNER -->`.
* Replace `<span>[ Insert Adsterra 728x90 Banner Script Here ]</span>` with your Adsterra banner script.

### 2. In-Tool Action Banner (`300x250` or Native Banner)
* Open `index.html` and find `<!-- ADSTERRA CODE INJECTION POINT: IN-TOOL BANNER -->`.
* Replace the placeholder with your 300x250 medium rectangle or 4:1 Native Banner code.

### 3. Sidebar Banner (`300x250` or `160x600` Skyscraper)
* Open `index.html` and find `<!-- ADSTERRA CODE INJECTION POINT: SIDEBAR AD -->`.
* Paste your desktop sidebar ad snippet.

### 4. Sticky Bottom Footer Banner (`728x90` / `320x50`)
* Open `index.html` and find `<!-- ADSTERRA CODE INJECTION POINT: STICKY FOOTER -->`.
* Paste your sticky mobile/desktop banner.

### 5. Adsterra Social Bar & Popunder (Highest CPM)
* **Social Bar:** Paste the script right before `</head>` in `index.html`.
* **Direct Link / Popunder on Download:** In `app.js`, look for `triggerDirectAdAction()` (line 120) and uncomment the `window.open` line with your Adsterra direct link.

---

## 🚀 Free $0 Deployment (Step-by-Step)

### Option A: Deploy on Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and create a free account.
2. Drag and drop this project folder into Vercel or connect via GitHub.
3. Your site is live instantly on `https://your-project.vercel.app` with free SSL!

### Option B: Deploy on GitHub Pages
1. Create a repository on GitHub.
2. Push `index.html`, `styles.css`, and `app.js`.
3. Go to **Settings > Pages** and set branch to `main`.
4. Your site is live on `https://username.github.io/repo-name/`.

### Option C: Deploy on Netlify
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop this folder directly into the browser.
3. Your site is live within 5 seconds.
