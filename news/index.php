<h1> Updates </h1>

<div id="rss-feed-container">
    <p>Loading latest news...</p>
</div>


<script>
    async function loadRSS() {
    const FEED_URL = 'https://lunatine.lunarconstruct.net/news/feed.php';
    const container = document.getElementById('rss-feed-container');

    try {
        const response = await fetch(FEED_URL);
        const text = await response.text();
        const xml = new window.DOMParser().parseFromString(text, "text/xml");
        const items = xml.querySelectorAll("item");

        let html = '<ul class="rss-list">';
        items.forEach(el => {
            const title = el.querySelector("title").textContent;
            const link = el.querySelector("link").textContent;
            const date = new Date(el.querySelector("pubDate").textContent).toLocaleDateString();
            
            // 1. Grab the description from the XML
            const description = el.querySelector("description") ? el.querySelector("description").textContent : "";
            
            html += `
                <li style="margin-bottom: 30px;">
                    <a href="${link}"><strong>${title}</strong></a>
                    <div class="rss-date" style="margin-bottom: 5px;">${date}</div>
                    
                    <!-- 2. Display the preview text -->
                    <div class="rss-preview" style="color: #be8dd4; font-size: 0.9em; line-height: 1.4;">
                        ${description}
                    </div>
                    
                    <a href="${link}" style="font-size: 0.8em; color: #e29b31; text-transform: uppercase;">Read Full Post →</a>
                </li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p>Failed to load news feed.</p>';
        console.error(err);
    }
}

loadRSS();
</script>
