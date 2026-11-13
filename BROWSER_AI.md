# Browser AI judging

DECAILLION uses WebLLM 0.2.80 (vendored under dist/vendor, Apache-2.0 license included) and Qwen2.5-1.5B-Instruct MLC quantized weights. The player explicitly enables the download. WebLLM fetches model files from Hugging Face and the compiled WebGPU model library from MLC's configured repository. The model runs in a dedicated browser Web Worker; player answers are never sent to a model API. No API key, server inference, billing integration, or cloud fallback is used.

Known bank matches and unique close spellings are instant. Other answers are judged locally using schema-constrained JSON and validated before scoring. Scores are subjective rarity estimates, not population frequencies. The 1.5B model may misjudge facts or be susceptible to adversarial answers; this is a casual study game, not an authoritative assessment.

Requirements: WebGPU-compatible browser/GPU, roughly 1 GB initial model download and approximately 2 GB available GPU memory. Browser caching is best effort. The model must be enabled after each page reload; cached assets avoid re-downloading when retained.

The clock pauses during inference, with a 60-second maximum wait. Errors restore input and preserve remaining time. Navigation invalidates late responses. Unsupported devices retain bank gameplay. Loading can be cancelled and retried.

Validation: node --test tests/browser-ai.test.cjs
Browser QA verified unsupported-WebGPU messaging, retries and typo acceptance. The available test browser has no compatible GPU; the GPU model remains unverified here. CPU model loading and real inference were verified after adding the fallback.


## CPU fallback

When WebGPU is absent, adapter creation fails, or GPU initialization fails, the browser selects Transformers.js 3.8.1 with onnx-community/Qwen2.5-0.5B-Instruct (q4) on the WASM CPU backend. The vendored JS runtime is licensed under Apache-2.0 (license included). ONNX WASM runtime assets are fetched from the pinned jsDelivr package; model files come from Hugging Face. The model file is approximately 786 MB plus tokenizer/runtime assets. Allow ample device RAM.

CPU inference runs in a separate Web Worker, single threaded so it does not require cross-origin isolation or SharedArrayBuffer. The timeout is 180 seconds on CPU; GPU remains 60 seconds. CPU judging uses two short generations: YES/NO for correctness, followed by a numeric rarity tier only for accepted answers. Both outputs are strictly validated. Malformed output never becomes a scored answer. The CPU path preserves the submitted wording; known-answer spelling correction remains in the main game. The smaller model may be less accurate.

Automated tests additionally verify automatic CPU selection, GPU-to-CPU recovery, and download cancellation.

CPU browser verification: loaded without WebGPU; accepted “supply chain disruption” for business risks with tier 25; rejected “purple unicorns dancing.” These are smoke checks, not a comprehensive accuracy evaluation. Automated checks cover paused timers, retries, late responses, and backend selection.