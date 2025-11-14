//! YAMLPath module
//!
//! This module provides functionality for querying YAML documents using a path syntax
//! similar to JSONPath.

mod evaluator;
mod parser;
mod types;

use js_sys::Array;
use wasm_bindgen::prelude::*;
use yaml_rust2::YamlLoader;

use crate::parse::yaml_to_js_value;

/// Query a YAML document using a YAMLPath expression
///
/// @param {string} yaml - The YAML document to query
/// @param {string} path - The YAMLPath expression
/// @returns {Array} - Array of matching values
#[wasm_bindgen]
pub fn query(yaml: &str, path: &str) -> Result<JsValue, JsValue> {
    // Parse the YAML document
    let docs = match YamlLoader::load_from_str(yaml) {
        Ok(docs) => docs,
        Err(e) => {
            return Err(JsValue::from_str(&format!("YAML parsing error: {}", e)));
        }
    };

    if docs.is_empty() {
        // Return empty array for empty documents
        return Ok(Array::new().into());
    }

    // Parse the YAMLPath expression
    let path_expr = match parser::parse_path(path) {
        Ok(expr) => expr,
        Err(e) => {
            return Err(JsValue::from_str(&format!("YAMLPath parsing error: {}", e)));
        }
    };

    // Evaluate the YAMLPath expression against the YAML document
    let matches = evaluator::evaluate_path(&docs[0], &path_expr);

    // Convert the matches to a JavaScript array
    let result = Array::new();
    for value in matches {
        let js_value = yaml_to_js_value(value)?;
        result.push(&js_value);
    }

    Ok(result.into())
}

// No re-exports needed for now
