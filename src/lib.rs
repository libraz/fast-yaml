//! fast-yaml: High-performance YAML parser with js-yaml API compatibility
//!
//! This library provides a WebAssembly-based YAML parser that is API-compatible with js-yaml
//! but uses the high-performance yaml-rust2 Rust library under the hood.

use wasm_bindgen::prelude::*;
use web_sys::console;

mod parse;
mod validate;
mod yamlpath;
mod stream;

// Re-export the main functions
pub use parse::{parse, parse_all, load, load_all, loadAll};
pub use validate::validate;
pub use yamlpath::query;
pub use stream::parse_stream;

/// Version information
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // Log initialization
    console::log_1(&"fast-yaml initialized".into());
}
