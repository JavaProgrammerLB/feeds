# Feed configuration notes

This repo uses Feed me up, Scotty! to generate RSS feeds from web pages using CSS selectors defined in `feeds.toml`.

## Limboy blog feed

- Table: `[limboy]`
- Source: https://limboy.me/posts
- Scope: Only posts (excludes Book Notes) via `.article-item[data-type='post']`
- Selectors:
  - `entrySelector = ".article-list .article-item[data-type='post']"`
  - `titleSelector = "span.line-clamp-1"`
  - `linkSelector = "*"` (the entry anchor itself contains the link)
  - `dateSelector = "time"`
  - `dateFormat = "yyyy-MM-dd"`

## How to generate locally (optional)

Requires Node.js.

```bash
# Install and run without adding dependencies
npx feed-me-up-scotty

# Generated XML feeds will be in the public/ folder.
# For GitHub Pages automation, see README.md.
```

## Notes

- If the Limboy posts page changes structure, update the CSS selectors accordingly.
- To include Book Notes as well, change `entrySelector` to `.article-list .article-item` (remove the `[data-type='post']` filter).
