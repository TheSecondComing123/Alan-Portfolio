const express = require('express')
const compression = require('compression')
const fs = require('fs/promises')
const path = require('path')
const matter = require('gray-matter')
const MarkdownIt = require('markdown-it')

const app = express()
const PORT = process.env.PORT || 3000
const IS_VERCEL = Boolean(process.env.VERCEL)
const BLOG_DIR = path.join(__dirname, 'content', 'blog')
const COMPONENTS_DIR = path.join(__dirname, 'components')
const PORTFOLIO_SECTION_IDS = ['home', 'projects', 'work', 'technologies']
const BLOG_PAGE_TITLE = 'Blog'
const BLOG_INDEX_DESCRIPTION =
    'Long-form notes on building products, optimizing systems, and improving as an engineer.'
const BLOG_ARTICLE_DESCRIPTION = 'Article details and implementation notes.'
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true })

function parseDateInput(input) {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [year, month, day] = input.split('-').map(Number)
        return new Date(year, month - 1, day)
    }

    return new Date(input)
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function formatDate(input) {
    const parsed = parseDateInput(input)
    if (Number.isNaN(parsed.getTime())) return ''

    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function getBlogPosts() {
    let entries = []
    try {
        entries = await fs.readdir(BLOG_DIR, { withFileTypes: true })
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []
        }
        throw error
    }

    const markdownEntries = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    const settledPosts = await Promise.allSettled(
        markdownEntries.map(async (entry) => {
            const slug = entry.name.replace(/\.md$/, '')
            const fullPath = path.join(BLOG_DIR, entry.name)
            const raw = await fs.readFile(fullPath, 'utf8')
            const parsed = matter(raw)
            const metadata = parsed.data || {}

            return {
                slug,
                title: metadata.title || slug,
                excerpt: metadata.excerpt || '',
                date: metadata.date || '',
                readTime: metadata.readTime || '',
                tags: Array.isArray(metadata.tags) ? metadata.tags : [],
                content: parsed.content || '',
            }
        }),
    )

    const posts = settledPosts
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)

    return posts.sort((a, b) => {
        const left = parseDateInput(a.date).getTime()
        const right = parseDateInput(b.date).getTime()
        const leftSafe = Number.isNaN(left) ? 0 : left
        const rightSafe = Number.isNaN(right) ? 0 : right
        return rightSafe - leftSafe
    })
}

function renderBlogLayout({
    title,
    description,
    body,
    backHref = '/',
    backLabel = 'Back to Portfolio',
}) {
    const safeTitle = escapeHtml(title)
    const safeDescription = escapeHtml(description)
    const safeBackHref = escapeHtml(backHref)
    const safeBackLabel = escapeHtml(backLabel)

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#1b211b" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:locale" content="en_US" />
  <link rel="stylesheet" href="/css/index.css" />
  <link rel="icon" type="image/png" href="/images/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="prefetch" href="${safeBackHref}" />
  <script src="/js/blog.js" defer></script>
</head>
<body class="blog-page">
  <main class="blog-page-main" role="main" aria-label="Blog content">
    <div class="window-container">
      <div class="window blog-page-window" id="blog">
        <div class="blog-page-actions">
          <a class="project-link blog-back-link" href="${safeBackHref}">${safeBackLabel}</a>
        </div>
        ${body}
      </div>
    </div>
  </main>
</body>
</html>`
}

function renderPostTags(tags) {
    if (!tags || tags.length === 0) return ''

    const renderedTags = tags
        .map((tag) => `<span class="tag" role="listitem">${escapeHtml(tag)}</span>`)
        .join('')

    return `<div class="blog-tags" role="list" aria-label="Article topics">${renderedTags}</div>`
}

function buildPostMeta(post) {
    return [formatDate(post.date), post.readTime].filter(Boolean).join(' | ')
}

function renderBlogSection({ description, ariaLabel, content }) {
    return `<h1 class="window-title">${BLOG_PAGE_TITLE}</h1>
<p class="description">${escapeHtml(description)}</p>
<section class="blog-grid" role="list" aria-label="${escapeHtml(ariaLabel)}">
  ${content}
</section>`
}

function renderBlogIndexCard(post) {
    const meta = buildPostMeta(post)
    const slug = encodeURIComponent(post.slug)

    return `<article class="blog-card" role="listitem">
  <header class="blog-header">
    <div class="blog-heading">
      <p class="blog-meta">${escapeHtml(meta)}</p>
      <h2 class="blog-title"><a class="blog-title-link" href="/blog/${slug}">${escapeHtml(post.title)}</a></h2>
    </div>
    <a class="project-link project-link-inline" href="/blog/${slug}">Read Article</a>
  </header>
  <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
  ${renderPostTags(post.tags)}
</article>`
}

function renderBlogEmptyStateCard() {
    return `<article class="blog-card" role="listitem">
  <h2 class="blog-title">No posts yet</h2>
  <p class="blog-excerpt">Add markdown files under <code>content/blog</code> to publish posts.</p>
</article>`
}

function renderBlogArticleCard(post) {
    const meta = buildPostMeta(post)
    const renderedMarkdown = markdown.render(post.content)

    return `<article class="blog-card" role="listitem">
  <header class="blog-header">
    <div class="blog-heading">
      <p class="blog-meta">${escapeHtml(meta)}</p>
      <h2 class="blog-title">${escapeHtml(post.title)}</h2>
    </div>
  </header>
  <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
  <div class="blog-article blog-markdown">${renderedMarkdown}</div>
  ${renderPostTags(post.tags)}
</article>`
}

function renderBlogNotFoundCard() {
    return `<article class="blog-card" role="listitem">
  <h2 class="blog-title"><a class="blog-title-link" href="/blog">Go to Blog Index</a></h2>
  <p class="blog-excerpt">Browse all published articles.</p>
</article>`
}

app.disable('x-powered-by')
app.use(compression())

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' https://unpkg.com https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: https:;",
    )
    next()
})

app.get(/^\/node_modules\//, (_req, res) => {
    res.status(403).send('Access Denied')
})

app.get('/components/all.html', async (_req, res, next) => {
    try {
        const htmlParts = await Promise.all(
            PORTFOLIO_SECTION_IDS.map((id) =>
                fs.readFile(path.join(COMPONENTS_DIR, `${id}.html`), 'utf8'),
            ),
        )
        res.type('html')
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
        res.send(htmlParts.join(''))
    } catch (error) {
        next(error)
    }
})

app.get('/blog', async (_req, res, next) => {
    try {
        const posts = await getBlogPosts()
        const cards = posts.map(renderBlogIndexCard).join('') || renderBlogEmptyStateCard()
        const body = renderBlogSection({
            description: BLOG_INDEX_DESCRIPTION,
            ariaLabel: 'Blog articles',
            content: cards,
        })

        res.send(
            renderBlogLayout({
                title: 'Alan Bagel | Blog',
                description:
                    'Engineering notes from Alan Bagel on building products, optimization work, and coding process.',
                body,
                backHref: '/',
                backLabel: 'Back to Portfolio',
            }),
        )
    } catch (error) {
        next(error)
    }
})

app.get('/blog/:slug', async (req, res, next) => {
    try {
        const posts = await getBlogPosts()
        const requestedSlug = decodeURIComponent(req.params.slug || '')
        const requestedSlugLower = requestedSlug.toLowerCase()
        const post = posts.find((item) => item.slug.toLowerCase() === requestedSlugLower)

        if (!post) {
            const body = renderBlogSection({
                description:
                    'That article does not exist. Check the blog index for available posts.',
                ariaLabel: 'Missing post',
                content: renderBlogNotFoundCard(),
            })

            res.status(404).send(
                renderBlogLayout({
                    title: 'Blog Post Not Found | Alan Bagel',
                    description: 'The blog post you requested does not exist.',
                    body,
                    backHref: '/blog',
                    backLabel: 'Back to Blog',
                }),
            )
            return
        }

        const body = renderBlogSection({
            description: BLOG_ARTICLE_DESCRIPTION,
            ariaLabel: 'Blog article',
            content: renderBlogArticleCard(post),
        })

        res.send(
            renderBlogLayout({
                title: `${post.title} | Alan Bagel`,
                description: post.excerpt || 'Engineering notes from Alan Bagel.',
                body,
                backHref: '/blog',
                backLabel: 'Back to Blog',
            }),
        )
    } catch (error) {
        next(error)
    }
})

app.use(express.static(path.join(__dirname, '.')))

app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

if (!IS_VERCEL && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`)
    })
}

module.exports = app
