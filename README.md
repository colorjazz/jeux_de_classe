# jeux_de_classe — Portfolio

A fast, dependency-free portfolio site for showcasing classroom and educational games.

## Make it yours

Edit **`content.js`**. It holds everything on the site: name, role, tagline, bio, stats, skills, contact links and projects.
You don't need to touch the HTML, CSS or JS.

For each project:

| Field | Purpose |
| --- | --- |
| `title`, `year`, `summary` | Shown on the card |
| `description`, `role` | Shown in the detail popup |
| `tags` | Builds the filter buttons automatically |
| `image` | Optional. Drop a file in `assets/img/` and use `"assets/img/name.png"` |
| `accent` | Cover colour used when there's no image |
| `featured` | `true` makes the card double-width |
| `links` | Buttons in the popup, e.g. `{ label: "Play", url: "https://…" }` |

## Preview locally

Open `index.html` in a browser. No build step needed.

## Publish free with GitHub Pages

1. Merge this branch into `main`.
2. In the repo on GitHub go to **Settings → Pages**.
3. Under *Build and deployment*, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. The site goes live at `https://colorjazz.github.io/jeux_de_classe/`. You can attach a custom domain from the same page.
