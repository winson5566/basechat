import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export async function markdownToHtml(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeShiki, {
      theme: "catppuccin-latte",
    })
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}
