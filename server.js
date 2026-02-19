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
const VIEWS_DIR = path.join(__dirname, 'views')
const BLOG_PAGE_TITLE = 'Blog'
const BLOG_INDEX_DESCRIPTION =
    'Long-form notes on building products, optimizing systems, and improving as an engineer.'
const BLOG_ARTICLE_DESCRIPTION = 'Article details and implementation notes.'
const ASSET_VERSION = '20260221'
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true })

function parseDateInput(input) {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [year, month, day] = input.split('-').map(Number)
        return new Date(year, month - 1, day)
    }

    return new Date(input)
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

function buildPostMeta(post) {
    return [formatDate(post.date), post.readTime].filter(Boolean).join(' | ')
}

function buildPostViewModel(post) {
    return {
        ...post,
        meta: buildPostMeta(post),
        slugEncoded: encodeURIComponent(post.slug),
        renderedMarkdown: markdown.render(post.content || ''),
    }
}

app.disable('x-powered-by')
app.set('view engine', 'ejs')
app.set('views', VIEWS_DIR)
app.use(compression())

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' https://unpkg.com https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: https:;",
    )

    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    }

    next()
})

app.get(/^\/node_modules\//, (_req, res) => {
    res.status(403).send('Access Denied')
})

app.get('/blog', async (_req, res, next) => {
    try {
        const posts = await getBlogPosts()
        const viewPosts = posts.map(buildPostViewModel)

        res.render('blog/layout', {
            pageTitle: 'Alan Bagel | Blog',
            metaDescription:
                'Engineering notes from Alan Bagel on building products, optimization work, and coding process.',
            assetVersion: ASSET_VERSION,
            backHref: '/',
            backLabel: 'Back to Portfolio',
            heading: BLOG_PAGE_TITLE,
            description: BLOG_INDEX_DESCRIPTION,
            ariaLabel: 'Blog articles',
            contentTemplate: 'index',
            contentData: { posts: viewPosts },
        })
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
            res.status(404).render('blog/layout', {
                pageTitle: 'Blog Post Not Found | Alan Bagel',
                metaDescription: 'The blog post you requested does not exist.',
                assetVersion: ASSET_VERSION,
                backHref: '/blog',
                backLabel: 'Back to Blog',
                heading: BLOG_PAGE_TITLE,
                description:
                    'That article does not exist. Check the blog index for available posts.',
                ariaLabel: 'Missing post',
                contentTemplate: 'not-found',
                contentData: {},
            })
            return
        }

        res.render('blog/layout', {
            pageTitle: `${post.title} | Alan Bagel`,
            metaDescription: post.excerpt || 'Engineering notes from Alan Bagel.',
            assetVersion: ASSET_VERSION,
            backHref: '/blog',
            backLabel: 'Back to Blog',
            heading: BLOG_PAGE_TITLE,
            description: BLOG_ARTICLE_DESCRIPTION,
            ariaLabel: 'Blog article',
            contentTemplate: 'post',
            contentData: { post: buildPostViewModel(post) },
        })
    } catch (error) {
        next(error)
    }
})

app.get('/', async (_req, res, next) => {
    try {
        res.render('portfolio/index', { assetVersion: ASSET_VERSION })
    } catch (error) {
        next(error)
    }
})

app.get('/index.html', (_req, res) => {
    res.redirect(301, '/')
})

app.use(
    express.static(path.join(__dirname, '.'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
            }
        },
    }),
)

app.use((_req, res) => {
    res.status(404)
        .set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
        .render('errors/404', { assetVersion: ASSET_VERSION })
})

if (!IS_VERCEL && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`)
    })
}

module.exports = app
