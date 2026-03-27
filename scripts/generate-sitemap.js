const fs = require('fs/promises')
const path = require('path')
const matter = require('gray-matter')

const ROOT = path.join(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')
const OUTPUT_PATH = path.join(ROOT, 'sitemap.xml')
const DEFAULT_SITE_URL = 'https://alanthebagel.com'
const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')

function parseDateInput(input) {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [year, month, day] = input.split('-').map(Number)
        return new Date(year, month - 1, day)
    }

    return new Date(input)
}

function formatIso(input) {
    const parsed = parseDateInput(input)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toISOString()
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

async function getLatestModified(pathsToCheck) {
    const settled = await Promise.allSettled(pathsToCheck.map((filePath) => fs.stat(filePath)))
    const mtimes = settled
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value.mtime)

    if (mtimes.length === 0) return ''
    return new Date(Math.max(...mtimes.map((date) => date.getTime()))).toISOString()
}

async function getBlogPosts() {
    const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true })
    const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))

    const posts = await Promise.all(
        markdownFiles.map(async (entry) => {
            const filePath = path.join(BLOG_DIR, entry.name)
            const raw = await fs.readFile(filePath, 'utf8')
            const { data } = matter(raw)
            const slug = entry.name.replace(/\.md$/, '')
            const date = data?.date || ''
            const lastmod = formatIso(data?.lastModified || data?.updated || data?.modified || date)

            return { slug, date, lastmod }
        }),
    )

    return posts.sort((a, b) => {
        const left = parseDateInput(a.date).getTime()
        const right = parseDateInput(b.date).getTime()
        return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left)
    })
}

function buildXml(entries) {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for (const entry of entries) {
        lines.push('  <url>')
        lines.push(`    <loc>${escapeXml(entry.loc)}</loc>`)
        if (entry.lastmod) lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
        if (entry.changefreq)
            lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`)
        if (entry.priority) lines.push(`    <priority>${escapeXml(entry.priority)}</priority>`)
        lines.push('  </url>')
    }

    lines.push('</urlset>')
    return `${lines.join('\n')}\n`
}

async function main() {
    const posts = await getBlogPosts()
    const homeLastmod = await getLatestModified([
        path.join(ROOT, 'server.js'),
        path.join(ROOT, 'views', 'portfolio', 'index.ejs'),
        path.join(ROOT, 'js', 'index.js'),
        path.join(ROOT, 'css', 'site.css'),
    ])
    const blogLastmod = posts[0]?.lastmod || homeLastmod

    const entries = [
        { loc: `${SITE_URL}/`, lastmod: homeLastmod, changefreq: 'weekly', priority: '1.0' },
        { loc: `${SITE_URL}/blog`, lastmod: blogLastmod, changefreq: 'weekly', priority: '0.9' },
        {
            loc: `${SITE_URL}/projects`,
            lastmod: homeLastmod,
            changefreq: 'monthly',
            priority: '0.8',
        },
        ...posts.map((post) => ({
            loc: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
            lastmod: post.lastmod,
            changefreq: 'monthly',
            priority: '0.8',
        })),
    ]

    await fs.writeFile(OUTPUT_PATH, buildXml(entries), 'utf8')
    console.log(`Wrote ${OUTPUT_PATH} (${entries.length} URLs)`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
