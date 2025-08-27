guidelines on creating routes:


The project uses a simple pattern for each page/route:

1. __Markdown content file__ – e.g., `home.md`, `about.md`.
2. __Route component__ – a `.tsx` file that fetches the markdown and renders it with `ReactMarkdown`.
3. __Route registration__ – entry in `app/routes.ts` using `route("name", "routes/name.tsx")`.
4. __Sidebar link__ – a `<Link>` entry in `app/components/SidebarNavigation.tsx`.

