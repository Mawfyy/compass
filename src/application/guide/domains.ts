export interface Domain {
  id: string;
  keywords: string[];
  title: string;
}

export const DOMAINS: Domain[] = [
  {
    id: "ml-engineer",
    keywords: ["ml", "machine learning", "deep learning", "data science", "ai", "artificial intelligence", "neural"],
    title: "ML Engineer",
  },
  {
    id: "distributed-systems",
    keywords: ["distributed system", "distributed systems", "distributed computing", "microservices"],
    title: "Distributed Systems",
  },
  {
    id: "rust",
    keywords: ["rust", "systems programming"],
    title: "Rust & Systems Programming",
  },
];
