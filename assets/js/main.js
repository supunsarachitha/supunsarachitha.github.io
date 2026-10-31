"use strict";

document.documentElement.classList.add("js");

const GITHUB_USER = "supunsarachitha";
const REPOSITORY_ENDPOINT = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&type=owner`;
const EXCLUDED_REPOSITORIES = new Set(["Electronic_Helper", "Mobile_Journal_app"]);

const languageColors = {
    "C#": "#b8f529",
    Swift: "#f05138",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Dart: "#00b4ab",
    Python: "#3572a5",
    Java: "#b07219",
    HTML: "#e34c26",
    CSS: "#663399"
};

function getElement(selector, parent = document) {
    return parent.querySelector(selector);
}

function createSvg(iconId, className = "") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${iconId}`);
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.setAttribute("class", className);
    svg.append(use);
    return svg;
}

function safeExternalUrl(value) {
    try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch (error) {
        return null;
    }
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently updated";

    return `Updated ${new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date)}`;
}

function initializeTheme() {
    const toggle = getElement("[data-theme-toggle]");
    const themeMeta = getElement('meta[name="theme-color"]');
    if (!toggle) return;

    const updateThemeControls = () => {
        const isDark = document.documentElement.dataset.theme !== "light";
        toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
        if (themeMeta) themeMeta.setAttribute("content", isDark ? "#07110f" : "#f3f2eb");
    };

    toggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = nextTheme;

        try {
            localStorage.setItem("portfolio-theme", nextTheme);
        } catch (error) {
            // Theme switching does not depend on storage access.
        }

        updateThemeControls();
    });

    updateThemeControls();
}

function initializeNavigation() {
    const header = getElement("[data-site-header]");
    const menu = getElement("[data-site-nav]");
    const toggle = getElement("[data-menu-toggle]");
    if (!header || !menu || !toggle) return;

    const main = getElement("main");
    const footer = getElement("footer");
    const desktopBreakpoint = window.matchMedia("(min-width: 861px)");

    const setBackgroundInert = (isInert) => {
        [main, footer].forEach((element) => {
            if (element && "inert" in element) element.inert = isInert;
        });
    };

    const closeMenu = ({ returnFocus = false } = {}) => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
        menu.classList.remove("is-open");
        header.classList.remove("is-menu-open");
        document.body.classList.remove("menu-open");
        setBackgroundInert(false);
        if (returnFocus) toggle.focus();
    };

    const openMenu = () => {
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close navigation");
        menu.classList.add("is-open");
        header.classList.add("is-menu-open");
        document.body.classList.add("menu-open");
        setBackgroundInert(true);
        window.requestAnimationFrame(() => menu.querySelector("a")?.focus());
    };

    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (isOpen) closeMenu({ returnFocus: true }); else openMenu();
    });

    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));

    document.addEventListener("keydown", (event) => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (event.key === "Escape" && isOpen) {
            closeMenu({ returnFocus: true });
            return;
        }

        if (event.key !== "Tab" || !isOpen) return;

        const focusable = [...header.querySelectorAll('a[href], button:not([disabled])')]
            .filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    const handleBreakpointChange = (event) => {
        if (event.matches) closeMenu();
    };

    if (typeof desktopBreakpoint.addEventListener === "function") {
        desktopBreakpoint.addEventListener("change", handleBreakpointChange);
    } else {
        desktopBreakpoint.addListener(handleBreakpointChange);
    }

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860 && toggle.getAttribute("aria-expanded") === "true") {
            closeMenu();
        }
    }, { passive: true });

    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
}

function initializeRevealAnimations() {
    const items = document.querySelectorAll("[data-reveal]");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    items.forEach((item) => observer.observe(item));
}

function createRepoLink(repo, text, className = "") {
    const link = document.createElement("a");
    const url = safeExternalUrl(repo.html_url);
    link.href = url || `https://github.com/${GITHUB_USER}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = text;
    if (className) link.className = className;
    return link;
}

function createRepositoryCard(repo, index) {
    const article = document.createElement("article");
    article.className = "repo-card is-visible";
    if (index === 0) article.classList.add("repo-card--feature");
    if (index === 1) article.classList.add("repo-card--secondary");

    const top = document.createElement("div");
    top.className = "repo-card__top";

    const repoIndex = document.createElement("span");
    repoIndex.className = "repo-index";
    repoIndex.textContent = String(index + 1).padStart(2, "0");
    top.append(repoIndex);

    if (index === 0 || repo.archived) {
        const badge = document.createElement("span");
        badge.className = `repo-badge${repo.archived ? " repo-badge--muted" : ""}`;
        badge.textContent = repo.archived ? "Archived" : "Latest";
        top.append(badge);
    }

    const body = document.createElement("div");
    body.className = "repo-card__body";

    const language = document.createElement("p");
    language.className = "repo-language";
    const languageDot = document.createElement("span");
    languageDot.style.setProperty("--language-color", languageColors[repo.language] || "#aaa7ff");
    language.append(languageDot, document.createTextNode(repo.language || "Repository"));

    const title = document.createElement("h3");
    const titleLink = createRepoLink(repo, repo.name || "Untitled repository");
    titleLink.append(createSvg("icon-arrow-up-right"));
    title.append(titleLink);

    const description = document.createElement("p");
    description.textContent = repo.description || "Explore the source, implementation notes, and latest changes on GitHub.";

    body.append(language, title, description);

    const footer = document.createElement("div");
    footer.className = "repo-card__footer";

    const updated = document.createElement("time");
    updated.dateTime = repo.updated_at || "";
    updated.textContent = formatDate(repo.updated_at);

    const stats = document.createElement("div");
    stats.className = "repo-stats";

    const stars = document.createElement("span");
    stars.setAttribute("aria-label", `${repo.stargazers_count || 0} stars`);
    stars.append(createSvg("icon-star"), document.createTextNode(String(repo.stargazers_count || 0)));

    const forks = document.createElement("span");
    forks.setAttribute("aria-label", `${repo.forks_count || 0} forks`);
    forks.append(createSvg("icon-fork"), document.createTextNode(String(repo.forks_count || 0)));
    stats.append(stars, forks);

    footer.append(updated, stats);

    const homepage = safeExternalUrl(repo.homepage);
    if (homepage) {
        const preview = document.createElement("a");
        preview.className = "repo-demo";
        preview.href = homepage;
        preview.target = "_blank";
        preview.rel = "noreferrer";
        preview.append(document.createTextNode("Live preview"), createSvg("icon-arrow-up-right"));
        footer.append(preview);
    }

    article.append(top, body, footer);
    return article;
}

function updateRecentSignal(repositories) {
    document.querySelectorAll(".signal-item strong").forEach((element, index) => {
        if (repositories[index]) element.textContent = repositories[index].name;
    });
}

async function refreshRepositories() {
    const grid = getElement("[data-repo-grid]");
    const status = getElement("[data-repo-status]");
    if (!grid) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
        const response = await fetch(REPOSITORY_ENDPOINT, {
            headers: { Accept: "application/vnd.github+json" },
            signal: controller.signal
        });

        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

        const data = await response.json();
        const repositories = data
            .filter((repo) => !repo.private && !repo.fork && !EXCLUDED_REPOSITORIES.has(repo.name))
            .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at))
            .slice(0, 6);

        if (repositories.length < 6) throw new Error("Fewer than six public repositories returned");

        const fragment = document.createDocumentFragment();
        repositories.forEach((repo, index) => fragment.append(createRepositoryCard(repo, index)));
        grid.replaceChildren(fragment);
        updateRecentSignal(repositories);

        if (status) {
            status.replaceChildren();
            status.append(document.createElement("span"), document.createTextNode(" Live from GitHub · refreshed now"));
        }
    } catch (error) {
        if (status) status.title = "Live refresh unavailable; showing the verified repository snapshot.";
    } finally {
        window.clearTimeout(timeout);
    }
}

function initializeCurrentYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll("[data-current-year]").forEach((element) => {
        element.textContent = year;
    });
}

initializeTheme();
initializeNavigation();
initializeRevealAnimations();
initializeCurrentYear();
refreshRepositories();
