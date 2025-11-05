- This repository base on [Vinnl's feeds repository](https://github.com/Vinnl/feeds/)
# Use Github Action With [feed-me-up-scotty](https://www.npmjs.com/package/feed-me-up-scotty) tool to generate and host website rss feed automation
- [feeds.toml setup document](https://feed-me-up-scotty.vincenttunru.com/docs/setup/)
- [feed-me-up-scotty souce code](https://gitlab.com/vincenttunru/feed-me-up-scotty/) 

## feed url
- [limboy's blog](https://feeds.yitianyigexiangfa.com/limboy.xml)
all config url in [feeds.toml](feeds.toml)

## Prompt
Please read the setup documentation at https://feed-me-up-scotty.vincenttunru.com/docs/setup and implement the configuration beginning at line ${LINE_NUMBER:38} for the ${BLOG_URL} blog so the repository can monitor that blog’s RSS feed. If the site requires dynamic rendering, you may use a Playwright MCP server to fetch and generate feed data.
```