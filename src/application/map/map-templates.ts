import type { MapNode } from "../../domain/map/node";

export interface MapTemplate {
  id: string;
  keywords: string[];
  root: MapNode;
}

const subtopic = (id: string, title: string): MapNode => ({
  id,
  type: "subtopic",
  title,
});

export const ML_ENGINEER_MAP: MapNode = {
  id: "ml-engineer",
  type: "goal",
  title: "ML Engineer",
  purpose:
    "Design, build, and deploy machine learning systems in production — not just train models.",
  children: [
    {
      id: "mathematics",
      type: "area",
      title: "Mathematics",
      purpose: "The mathematical language behind every ML model.",
      children: [
        {
          id: "linear-algebra",
          type: "topic",
          title: "Linear Algebra",
          difficulty: "Intermediate",
          purpose:
            "Data, models, and learning rules are expressed with vectors and matrices. Eigenvalues and SVD power dimensionality reduction and understanding of neural nets.",
          prerequisites: ["basic-algebra"],
          subtopics: [
            "Vectors",
            "Matrices",
            "Matrix multiplication",
            "Linear transformations",
            "Eigenvalues & eigenvectors",
            "SVD",
          ],
          resources: [
            {
              title: "Mathematics for Machine Learning",
              type: "book",
              author: "Deisenroth, Faisal & Ong",
              difficulty: "Intermediate",
              why: "Covers exactly the linear algebra used in ML, with worked examples.",
              chapters: "Chapters 2–4",
            },
            {
              title: "MIT 18.06 Linear Algebra",
              type: "course",
              author: "Gilbert Strang",
              difficulty: "Intermediate",
              why: "The canonical visual intuition for linear algebra.",
              chapters: "Lectures 1–10",
            },
          ],
          project: {
            title: "Implement PCA from scratch",
            brief: "Compute the SVD of a dataset with NumPy and reduce its dimensionality; reconstruct and measure error.",
          },
          next: ["Probability", "Machine Learning Fundamentals"],
          children: [
            subtopic("vectors", "Vectors"),
            subtopic("matrices", "Matrices"),
            subtopic("matrix-mult", "Matrix Multiplication"),
            subtopic("linear-transforms", "Linear Transformations"),
            subtopic("eigenvalues", "Eigenvalues"),
            subtopic("svd", "SVD"),
          ],
        },
        {
          id: "probability",
          type: "topic",
          title: "Probability",
          difficulty: "Intermediate",
          purpose: "Uncertainty, inference, and the objective functions of ML all rest on probability.",
          subtopics: ["Random variables", "Distributions", "Expectation & variance", "Bayes' theorem"],
          resources: [
            {
              title: "A First Course in Probability",
              type: "book",
              author: "Sheldon Ross",
              difficulty: "Intermediate",
            },
          ],
          children: [
            subtopic("random-vars", "Random Variables"),
            subtopic("distributions", "Distributions"),
            subtopic("bayes", "Bayes' Theorem"),
          ],
        },
        {
          id: "calculus",
          type: "topic",
          title: "Calculus",
          difficulty: "Intermediate",
          purpose: "Gradients drive optimization (gradient descent) and backpropagation.",
          subtopics: ["Derivatives", "Partial derivatives", "Gradients", "Chain rule"],
          resources: [
            {
              title: "Essence of Calculus",
              type: "video",
              author: "3Blue1Brown",
              difficulty: "Beginner",
            },
          ],
          children: [
            subtopic("derivatives", "Derivatives"),
            subtopic("gradients", "Gradients"),
          ],
        },
        {
          id: "optimization",
          type: "topic",
          title: "Optimization",
          difficulty: "Advanced",
          purpose: "Training a model is optimization; understanding it avoids black-box training.",
          children: [
            subtopic("gradient-descent", "Gradient Descent"),
            subtopic("convexity", "Convexity"),
          ],
        },
      ],
    },
    {
      id: "programming",
      type: "area",
      title: "Programming",
      purpose: "The ability to turn models into working, reproducible code.",
      children: [
        {
          id: "python",
          type: "topic",
          title: "Python",
          difficulty: "Intermediate",
          purpose: "The lingua franca of ML engineering.",
          children: [
            subtopic("python-syntax", "Syntax & data structures"),
            subtopic("oop-python", "OOP & modules"),
          ],
        },
        {
          id: "numpy",
          type: "tool",
          title: "NumPy / Data libraries",
          difficulty: "Intermediate",
          purpose: "Vectorized computation underpins every ML framework.",
          children: [
            subtopic("numpy-basics", "ndarrays & broadcasting"),
            subtopic("pandas", "Pandas"),
          ],
        },
      ],
    },
    {
      id: "cs-foundations",
      type: "area",
      title: "Computer Science",
      purpose: "Efficiency, correctness, and the engineering craft around ML.",
      children: [
        {
          id: "algorithms",
          type: "topic",
          title: "Algorithms & Data Structures",
          difficulty: "Intermediate",
          purpose: "Reasoning about complexity and choosing the right structures for data pipelines.",
          children: [
            subtopic("big-o", "Big-O & complexity"),
            subtopic("hashmaps", "Arrays, hashmaps, trees"),
          ],
        },
        {
          id: "git-linux",
          type: "tool",
          title: "Git & Linux",
          difficulty: "Beginner",
          purpose: "Version control and the environment ML systems run in.",
        },
      ],
    },
    {
      id: "machine-learning",
      type: "area",
      title: "Machine Learning",
      purpose: "The core models, algorithms, and evaluation methodology.",
      children: [
        {
          id: "ml-fundamentals",
          type: "topic",
          title: "Machine Learning Fundamentals",
          difficulty: "Intermediate",
          purpose: "The shared concepts behind all learning algorithms: generalization, bias/variance, and evaluation.",
          prerequisites: ["linear-algebra", "probability", "calculus"],
          subtopics: ["Supervised vs unsupervised", "Bias/variance tradeoff", "Train/validation/test splits", "Model evaluation"],
          resources: [
            {
              title: "An Introduction to Statistical Learning",
              type: "book",
              author: "James, Witten, Hastie & Tibshirani",
              difficulty: "Intermediate",
              why: "The most approachable rigorous intro to ML concepts.",
            },
            {
              title: "Machine Learning Specialization",
              type: "course",
              author: "Andrew Ng",
              difficulty: "Beginner",
            },
          ],
          project: {
            title: "End-to-end supervised learning pipeline",
            brief: "Load a dataset, split, train, tune, and evaluate a model, and report metrics honestly.",
          },
          next: ["Deep Learning", "ML Systems"],
          children: [
            subtopic("regression", "Regression"),
            subtopic("classification", "Classification"),
            subtopic("clustering", "Clustering"),
            subtopic("model-evaluation", "Model Evaluation"),
          ],
        },
        {
          id: "deep-learning",
          type: "topic",
          title: "Deep Learning",
          difficulty: "Advanced",
          purpose: "Neural networks and the architectures behind modern AI.",
          prerequisites: ["ml-fundamentals"],
          subtopics: ["Neural networks", "Backpropagation", "CNNs", "RNNs", "Transformers"],
          resources: [
            {
              title: "Deep Learning",
              type: "book",
              author: "Goodfellow, Bengio & Courville",
              difficulty: "Advanced",
              chapters: "Part II: Modern Practical Deep Networks",
            },
            {
              title: "CS231n",
              type: "course",
              author: "Stanford",
              difficulty: "Advanced",
            },
          ],
          project: {
            title: "Implement a neural network from scratch",
            brief: "Build a small MLP with NumPy, implement backprop, and train it on MNIST.",
          },
          children: [
            subtopic("neural-nets", "Neural Networks"),
            subtopic("cnn", "CNN"),
            subtopic("rnn", "RNN"),
            subtopic("transformers", "Transformers"),
          ],
        },
        {
          id: "ml-systems",
          type: "topic",
          title: "ML Systems / MLOps",
          difficulty: "Advanced",
          purpose: "Ship, monitor, and scale models — the difference between a notebook and a product.",
          prerequisites: ["ml-fundamentals", "algorithms"],
          resources: [
            {
              title: "Designing Machine Learning Systems",
              type: "book",
              author: "Chip Huyen",
              difficulty: "Advanced",
            },
          ],
          children: [
            subtopic("deployment", "Deployment"),
            subtopic("data-pipelines", "Data Pipelines"),
            subtopic("monitoring", "Monitoring"),
          ],
        },
      ],
    },
    {
      id: "projects",
      type: "area",
      title: "Projects",
      purpose: "Concrete work that demonstrates and consolidates everything above.",
      children: [
        {
          id: "capstone",
          type: "project",
          title: "Capstone ML Project",
          purpose: "A production-quality, end-to-end ML system from data to deployment.",
          project: {
            title: "Build a production ML service",
            brief: "Choose a problem, collect data, train a model, serve it behind an API, and add monitoring.",
          },
        },
      ],
    },
  ],
};

export const DISTRIBUTED_SYSTEMS_MAP: MapNode = {
  id: "distributed-systems",
  type: "goal",
  title: "Distributed Systems",
  purpose: "Reason about and build systems that span multiple machines, tolerate faults, and stay consistent.",
  children: [
    {
      id: "ds-foundations",
      type: "area",
      title: "Foundations",
      purpose: "The theory every distributed system rests on.",
      children: [
        {
          id: "ds-concurrency",
          type: "topic",
          title: "Concurrency & Threading",
          difficulty: "Intermediate",
          purpose: "Processes, threads, locks, and memory models are the building blocks of concurrency.",
          children: [
            subtopic("threads", "Threads & processes"),
            subtopic("locks", "Locks & mutexes"),
            subtopic("memory-model", "Memory models"),
          ],
        },
        {
          id: "ds-networking",
          type: "topic",
          title: "Networking",
          difficulty: "Intermediate",
          purpose: "TCP/IP, sockets, and the fallacies of distributed computing.",
          children: [
            subtopic("tcp-ip", "TCP/IP"),
            subtopic("sockets", "Sockets & RPC"),
          ],
        },
        {
          id: "ds-clock",
          type: "topic",
          title: "Time & Ordering",
          difficulty: "Advanced",
          purpose: "Logical clocks, vector clocks, and why wall-clock time fails at scale.",
          children: [
            subtopic("logical-clocks", "Lamport clocks"),
            subtopic("vector-clocks", "Vector clocks"),
          ],
        },
      ],
    },
    {
      id: "ds-consistency",
      type: "area",
      title: "Consistency & Replication",
      purpose: "How multiple copies of data stay (or fail to stay) in sync.",
      children: [
        {
          id: "ds-replication",
          type: "topic",
          title: "Replication",
          difficulty: "Advanced",
          purpose: "Leader-based, multi-leader, and leaderless replication.",
          children: [
            subtopic("leader-repl", "Leader-based replication"),
            subtopic("quorum", "Quorums"),
          ],
        },
        {
          id: "ds-consensus",
          type: "topic",
          title: "Consensus",
          difficulty: "Advanced",
          purpose: "Paxos, Raft, and the CAP theorem.",
          prerequisites: ["ds-replication"],
          resources: [
            {
              title: "Designing Data-Intensive Applications",
              type: "book",
              author: "Martin Kleppmann",
              difficulty: "Advanced",
              chapters: "Chapters 5, 7–9",
            },
          ],
          children: [
            subtopic("raft", "Raft"),
            subtopic("paxos", "Paxos"),
            subtopic("cap", "CAP theorem"),
          ],
        },
      ],
    },
    {
      id: "ds-practice",
      type: "area",
      title: "Practice",
      purpose: "Concrete distributed systems you can build and study.",
      children: [
        {
          id: "ds-mit6824",
          type: "topic",
          title: "MIT 6.824 Labs",
          difficulty: "Advanced",
          purpose: "Implement Raft, a KV store, and sharded storage.",
          resources: [
            {
              title: "MIT 6.824: Distributed Systems",
              type: "course",
              author: "MIT",
              difficulty: "Advanced",
            },
          ],
          project: {
            title: "Implement Raft in Go",
            brief: "Pass the 6.824 Raft tests with leader election, log replication, and persistence.",
          },
        },
      ],
    },
  ],
};

export const RUST_MAP: MapNode = {
  id: "rust",
  type: "goal",
  title: "Rust & Systems Programming",
  purpose: "Write fast, memory-safe systems code with ownership and lifetimes.",
  children: [
    {
      id: "rust-core",
      type: "area",
      title: "Core Language",
      purpose: "The unique parts of Rust: ownership, borrowing, and lifetimes.",
      children: [
        {
          id: "rust-basics",
          type: "topic",
          title: "Syntax & Types",
          difficulty: "Beginner",
          purpose: "Types, structs, enums, pattern matching, and error handling.",
          children: [
            subtopic("types", "Types & structs"),
            subtopic("enums", "Enums & pattern matching"),
            subtopic("result", "Result & Option"),
          ],
        },
        {
          id: "rust-ownership",
          type: "topic",
          title: "Ownership & Borrowing",
          difficulty: "Intermediate",
          purpose: "The borrow checker, references, and lifetimes.",
          resources: [
            {
              title: "The Rust Programming Language",
              type: "book",
              author: "Klabnik & Nichols",
              difficulty: "Beginner",
              chapters: "Chapters 4, 10",
            },
          ],
          children: [
            subtopic("ownership", "Ownership"),
            subtopic("borrowing", "Borrowing"),
            subtopic("lifetimes", "Lifetimes"),
          ],
        },
      ],
    },
    {
      id: "rust-advanced",
      type: "area",
      title: "Advanced",
      purpose: "The features that make Rust powerful for systems work.",
      children: [
        {
          id: "rust-concurrency",
          type: "topic",
          title: "Concurrency",
          difficulty: "Advanced",
          purpose: "Threads, channels, Arc/Mutex, and Send/Sync.",
          children: [
            subtopic("threads", "Threads"),
            subtopic("channels", "Channels"),
            subtopic("sync", "Arc & Mutex"),
          ],
        },
        {
          id: "rust-unsafe",
          type: "topic",
          title: "Unsafe & FFI",
          difficulty: "Advanced",
          purpose: "When and how to step outside the safe subset.",
          children: [
            subtopic("unsafe", "Unsafe blocks"),
            subtopic("ffi", "FFI"),
          ],
        },
      ],
    },
    {
      id: "rust-practice",
      type: "area",
      title: "Practice",
      purpose: "Build real systems software in Rust.",
      children: [
        {
          id: "rust-project",
          type: "project",
          title: "Build a toy database",
          purpose: "A single-node key-value store or mini database.",
          project: {
            title: "Write a toy database engine",
            brief: "Implement a log-structured or B-tree key-value store with persistence and a simple CLI.",
          },
        },
      ],
    },
  ],
};

export const MAP_TEMPLATES: MapTemplate[] = [
  {
    id: "ml-engineer",
    keywords: ["ml", "machine learning", "deep learning", "data science", "ai", "artificial intelligence", "neural"],
    root: ML_ENGINEER_MAP,
  },
  {
    id: "distributed-systems",
    keywords: ["distributed system", "distributed systems", "distributed computing", "microservices"],
    root: DISTRIBUTED_SYSTEMS_MAP,
  },
  {
    id: "rust",
    keywords: ["rust", "systems programming"],
    root: RUST_MAP,
  },
];
