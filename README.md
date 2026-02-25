# [ParallelBench](https://parallelbench.github.io)

Project page and interactive leaderboard for **"ParallelBench: Understanding the Trade-offs of Parallel Decoding in Diffusion LLMs"** (ICLR 2026).

## Development

No build step required. Open `index.html` in a browser or run a local server:

```bash
python3 -m http.server 8000
```

## Structure

```text
index.html            # Main project page
leaderboard/          # Interactive leaderboard (TPS vs Accuracy charts)
components/           # HTML fragments loaded at runtime
data/                 # Metadata, CSV figures, leaderboard JSON
js/                   # JavaScript (leaderboard logic, main page interactions)
assets/               # Images and static assets
```
