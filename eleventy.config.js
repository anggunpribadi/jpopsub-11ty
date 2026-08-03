import { minify } from "html-minifier-terser";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css/style.css": "css/style.css" });
  eleventyConfig.addPassthroughCopy({ "src/css/pagefind-component-ui.css": "css/pagefind-component-ui.css" });
  eleventyConfig.addPassthroughCopy("src/**/*.js");
  eleventyConfig.addPassthroughCopy("src/subtitles/*.srt");
  eleventyConfig.addWatchTarget("src/css/input.css");

  eleventyConfig.addWatchTarget("./_site/css/style.css");

  eleventyConfig.addTransform("htmlmin", async function (content, outputPath) {
    if (process.env.ELEVENTY_ENV !== "production") return content;
    if (!outputPath || !outputPath.endsWith(".html")) return content;

    return await minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    });
  });

  // Posts collection (content that is a post)
  eleventyConfig.addCollection("posts", function (api) {
    return api.getFilteredByGlob("src/posts/**/*.md").reverse();
  });

  // Unique tag names + counts (for /tag/[slug] pages; Eleventy already has tag collections by name)
  eleventyConfig.addCollection("tagList", function (api) {
    const posts = api.getFilteredByGlob("src/posts/**/*.md");
    const slugify = (s) => String(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const map = new Map();
    for (const post of posts) {
      const tags = post.data.tags || [];
      for (const t of tags) {
        const name = typeof t === "string" ? t : (t.name || t);
        const slug = slugify(name);
        if (!map.has(slug)) map.set(slug, { name, slug, count: 0 });
        map.get(slug).count++;
      }
    }

    return Array.from(map.values());
  });

  // Unique artists (categories) for /artist/[slug] routes; slug is slugified for URL
  eleventyConfig.addCollection("artists", function (api) {
    const posts = api.getFilteredByGlob("src/posts/**/*.md");
    const slugify = (s) => String(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const map = new Map();
    for (const post of posts) {
      const cat = post.data.category;
      if (cat) {
        const categories = Array.isArray(cat) ? cat : [cat];
        for (const c of categories) {
          const raw = typeof c === "string" ? c : (c.slug || c.name || c);
          const name = typeof c === "object" && c.name ? c.name : c;
          const slug = slugify(raw);
          if (!map.has(slug)) map.set(slug, { slug, name, count: 0 });
          map.get(slug).count++;
        }
      }
    }
    return Array.from(map.values());
  });

  // Filter: get posts by artist slug (slugified)
  eleventyConfig.addFilter("postsByArtist", function (posts, artistSlug) {
    const slugify = (s) => String(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const want = slugify(artistSlug);
    return posts.filter((p) => {
      const c = p.data.category;
      if (!c) return false;
      const categories = Array.isArray(c) ? c : [c];
      return categories.some(cat => {
        const raw = typeof cat === "string" ? cat : (cat.slug || cat.name || cat);
        return slugify(raw) === want;
      });
    });
  });

  // Collection: artist pages with pagination (30 posts per page)
  eleventyConfig.addCollection("artistPages", function (api) {
    const posts = api.getFilteredByGlob("src/posts/**/*.md").reverse();
    const slugify = (s) => String(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const map = new Map();
    
    // Build artist map with their posts
    for (const post of posts) {
      const cat = post.data.category;
      if (cat) {
        const categories = Array.isArray(cat) ? cat : [cat];
        for (const c of categories) {
          const raw = typeof c === "string" ? c : (c.slug || c.name || c);
          const name = typeof c === "object" && c.name ? c.name : c;
          const slug = slugify(raw);
          if (!map.has(slug)) map.set(slug, { slug, name, posts: [] });
          map.get(slug).posts.push(post);
        }
      }
    }
    
    // Generate pages for each artist
    const pages = [];
    for (const [slug, artist] of map) {
      const postsPerPage = 30;
      const totalPages = Math.ceil(artist.posts.length / postsPerPage);
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const start = (pageNum - 1) * postsPerPage;
        const end = start + postsPerPage;
        pages.push({
          slug: artist.slug,
          name: artist.name,
          pageNum: pageNum,
          totalPages: totalPages,
          posts: artist.posts.slice(start, end),
          allArtistPosts: artist.posts,
        });
      }
    }
    
    return pages;
  });

  // Collection: tag pages with pagination (30 posts per page)
  eleventyConfig.addCollection("tagPages", function (api) {
    const posts = api.getFilteredByGlob("src/posts/**/*.md").reverse();
    const slugify = (s) => String(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Get all tags and group posts by tag
    const tagMap = new Map();
    for (const post of posts) {
      const tags = post.data.tags || [];
      for (const tag of tags) {
        const tagSlug = slugify(tag);
        if (!tagMap.has(tagSlug)) tagMap.set(tagSlug, { name: tag, slug: tagSlug, posts: [] });
        tagMap.get(tagSlug).posts.push(post);
      }
    }
    
    // Generate pages for each tag
    const pages = [];
    for (const [tagSlug, tagData] of tagMap) {
      const postsPerPage = 30;
      const totalPages = Math.ceil(tagData.posts.length / postsPerPage);
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const start = (pageNum - 1) * postsPerPage;
        const end = start + postsPerPage;
        pages.push({
          name: tagData.name,
          slug: tagData.slug,
          pageNum: pageNum,
          totalPages: totalPages,
          posts: tagData.posts.slice(start, end),
          allTagPosts: tagData.posts,
        });
      }
    }
    
    return pages;
  });

  // Collection: homepage with pagination (30 posts per page)
  eleventyConfig.addCollection("homePages", function (api) {
    const posts = api.getFilteredByGlob("src/posts/**/*.md").reverse();
    const postsPerPage = 30;
    const totalPages = Math.ceil(posts.length / postsPerPage);
    
    const pages = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const start = (pageNum - 1) * postsPerPage;
      const end = start + postsPerPage;
      pages.push({
        pageNum: pageNum,
        totalPages: totalPages,
        posts: posts.slice(start, end),
      });
    }
    
    return pages;
  });

  eleventyConfig.addFilter("sort", function (array) {
    if (!Array.isArray(array)) return array;
    return [...array].sort((a, b) => {
      if (a == null || b == null) return 0;
      if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  });

  eleventyConfig.addFilter("sortBy", function (array, key) {
    if (!Array.isArray(array)) return array;
    return [...array].sort((a, b) => {
      const av = a && a[key];
      const bv = b && b[key];
      if (av == null || bv == null) return 0;
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv);
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
  });

  eleventyConfig.addFilter("take", function (array, n) {
    if (!Array.isArray(array)) return array;
    return array.slice(0, n);
  });

  eleventyConfig.addFilter("formatDate", function (date) {
    return date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
  });
  eleventyConfig.addFilter("htmlDateString", function (date) {
    return date ? new Date(date).toISOString().split("T")[0] : "";
  });

  eleventyConfig.addFilter("excerpt", (content, length = 160) => {
    if (!content) return "";

    // 1. Remove HTML tags using Regex
    const plainText = content.replace(/<[^>]*>?/gm, '');

    // 2. Clean up whitespace and newlines
    const cleanedText = plainText.replace(/\s+/g, ' ').trim();

    // 3. Truncate to the desired length
    if (cleanedText.length <= length) return cleanedText;
    
    return cleanedText.substring(0, length).trim() + "...";
  });

  eleventyConfig.addFilter("push", (arr, value) => {
    const array = Array.isArray(arr) ? [...arr] : [];
    if (value) array.push(value);
    return array;
  });

      
  return {
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../_data",
      output: "_site",
    },
    templateFormats: ["njk", "md", "html", "11ty.js"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
