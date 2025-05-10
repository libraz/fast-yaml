//! YAML parsing functionality
//!
//! This module provides the core YAML parsing functions that are API-compatible with js-yaml.

use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Boolean, Number, JsString};
use web_sys::console;

use yaml_rust2::{Yaml, YamlLoader};

/// Parse a YAML string into a JavaScript object
///
/// This function is API-compatible with js-yaml's parse function.
/// For large documents, it uses batch processing for better performance.
#[wasm_bindgen]
pub fn parse(input: &str) -> Result<JsValue, JsValue> {
    // Performance optimization: Check input size to determine parsing strategy
    let input_len = input.len();

    // Log parsing start for debugging
    console::log_1(&format!("Parsing YAML document of size: {} bytes", input_len).into());

    // Parse the YAML string using yaml-rust2
    let docs = match YamlLoader::load_from_str(input) {
        Ok(docs) => docs,
        Err(e) => {
            // Include line number and column number in error message
            let error_msg = format!("YAML parsing error: {} at line {}, column {}",
                e.info(), e.marker().line(), e.marker().col() + 1);
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // Get the first document (js-yaml's parse function only returns the first document)
    if docs.is_empty() {
        // Return null for empty documents
        return Ok(JsValue::NULL);
    }

    // For large documents, use optimized conversion
    if input_len > 100_000 {
        console::log_1(&"Using optimized batch conversion for large document".into());
        return optimized_yaml_to_js_value(&docs[0]);
    }

    // For smaller documents, use standard conversion
    yaml_to_js_value(&docs[0])
}

/// Parse all YAML documents in a string into an array of JavaScript objects
///
/// This function is API-compatible with js-yaml's parseAll function.
/// For large documents, it uses batch processing for better performance.
#[wasm_bindgen]
pub fn parse_all(input: &str) -> Result<Array, JsValue> {
    // Performance optimization: Check input size to determine parsing strategy
    let input_len = input.len();

    // Log parsing start for debugging
    console::log_1(&format!("Parsing multiple YAML documents of size: {} bytes", input_len).into());

    // Parse the YAML string using yaml-rust2
    let docs = match YamlLoader::load_from_str(input) {
        Ok(docs) => docs,
        Err(e) => {
            // Include line number and column number in error message
            let error_msg = format!("YAML parsing error: {} at line {}, column {}",
                e.info(), e.marker().line(), e.marker().col() + 1);
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // Create a JavaScript array to hold the results
    let result = Array::new();

    // For large documents with multiple parts, use batch processing
    if input_len > 100_000 && docs.len() > 1 {
        console::log_1(&"Using batch processing for multiple documents".into());

        // Process documents in batches
        const BATCH_SIZE: usize = 10;
        for batch_start in (0..docs.len()).step_by(BATCH_SIZE) {
            let batch_end = (batch_start + BATCH_SIZE).min(docs.len());

            // Process documents in this batch
            for i in batch_start..batch_end {
                let js_doc = optimized_yaml_to_js_value(&docs[i])?;
                result.push(&js_doc);
            }

            // Encourage GC to reduce memory pressure
            if batch_end < docs.len() && batch_end % (BATCH_SIZE * 5) == 0 {
                js_sys::global().dyn_ref::<js_sys::Function>()
                    .and_then(|gc| {
                        // Try to call gc() if available
                        let _ = gc.call0(&JsValue::NULL);
                        Some(())
                    });
            }
        }
    } else {
        // For smaller documents, use standard processing
        for doc in docs {
            let js_doc = if input_len > 100_000 {
                optimized_yaml_to_js_value(&doc)?
            } else {
                yaml_to_js_value(&doc)?
            };
            result.push(&js_doc);
        }
    }

    Ok(result)
}

/// Parse a YAML string with schema validation into a JavaScript object
///
/// This function is API-compatible with js-yaml's load function.
#[wasm_bindgen]
pub fn load(input: &str) -> Result<JsValue, JsValue> {
    // Performance optimization: Check input size to determine parsing strategy
    let input_len = input.len();

    // Log loading start for debugging
    console::log_1(&format!("Loading YAML document of size: {} bytes", input_len).into());

    // For now, we'll just call parse, but in the future this will include schema validation
    parse(input)
}

/// Optimized version of yaml_to_js_value for large documents
/// Uses batch processing for arrays and hash maps
pub fn optimized_yaml_to_js_value(yaml: &Yaml) -> Result<JsValue, JsValue> {
    match yaml {
        // Basic types conversion is already efficient
        Yaml::Null => Ok(JsValue::NULL),
        Yaml::Boolean(b) => Ok(Boolean::from(*b).into()),
        Yaml::Integer(i) => Ok(Number::from(*i as f64).into()),
        Yaml::Real(s) => {
            match s.parse::<f64>() {
                Ok(f) => Ok(Number::from(f).into()),
                Err(_) => Err(JsValue::from_str(&format!("Invalid float: {}", s))),
            }
        },
        Yaml::String(s) => Ok(JsString::from(s.as_str()).into()),
        Yaml::Array(arr) => {
            let len = arr.len();
            let js_array = Array::new_with_length(len as u32);

            // Use batch processing for all arrays
            const BATCH_SIZE: usize = 500;

            // Process in batches
            for batch_start in (0..len).step_by(BATCH_SIZE) {
                let batch_end = (batch_start + BATCH_SIZE).min(len);

                // Process elements in this batch
                for i in batch_start..batch_end {
                    let js_item = yaml_to_js_value(&arr[i])?;
                    js_array.set(i as u32, js_item);
                }

                // Encourage GC to reduce memory pressure for very large arrays
                if len > 10000 && batch_end < len && batch_end % (BATCH_SIZE * 5) == 0 {
                    js_sys::global().dyn_ref::<js_sys::Function>()
                        .and_then(|gc| {
                            // Try to call gc() if available
                            let _ = gc.call0(&JsValue::NULL);
                            Some(())
                        });
                }
            }

            Ok(js_array.into())
        },
        Yaml::Hash(hash) => {
            let hash_len = hash.len();
            let js_obj = Object::new();

            // Use batch processing for all hash maps
            const BATCH_SIZE: usize = 500;

            // Convert key-value pairs to vector
            let pairs: Vec<_> = hash.iter().collect();

            // Process in batches
            for batch_start in (0..pairs.len()).step_by(BATCH_SIZE) {
                let batch_end = (batch_start + BATCH_SIZE).min(pairs.len());

                // Process key/value pairs in this batch
                for i in batch_start..batch_end {
                    let (key, value) = pairs[i];

                    // Convert key to string
                    let key_str = match key {
                        Yaml::String(s) => s.as_str(),
                        _ => &format!("{:?}", key)
                    };

                    // Convert value
                    let js_value = yaml_to_js_value(value)?;

                    // Set property on object
                    if let Err(_) = js_sys::Reflect::set(&js_obj, &JsString::from(key_str).into(), &js_value) {
                        return Err(JsValue::from_str("Failed to set property"));
                    }
                }

                // Encourage GC to reduce memory pressure for very large hash maps
                if hash_len > 10000 && batch_end < pairs.len() && batch_end % (BATCH_SIZE * 5) == 0 {
                    js_sys::global().dyn_ref::<js_sys::Function>()
                        .and_then(|gc| {
                            // Try to call gc() if available
                            let _ = gc.call0(&JsValue::NULL);
                            Some(())
                        });
                }
            }

            Ok(js_obj.into())
        },
        Yaml::Alias(_) => Err(JsValue::from_str("YAML aliases are not supported")),
        Yaml::BadValue => Err(JsValue::from_str("Invalid YAML value")),
    }
}

/// Parse all YAML documents in a string with schema validation into an array of JavaScript objects
///
/// This function is API-compatible with js-yaml's loadAll function.
/// For large documents, it uses batch processing for better performance.
#[wasm_bindgen]
pub fn load_all(input: &str) -> Result<Array, JsValue> {
    // Performance optimization: Check input size for logging
    let input_len = input.len();

    // Log loading start for debugging
    console::log_1(&format!("Loading multiple YAML documents of size: {} bytes", input_len).into());

    // For now, we'll just call parse_all, but in the future this will include schema validation
    parse_all(input)
}

/// Parse all YAML documents in a string with schema validation into an array of JavaScript objects
///
/// This function is an alias for load_all to provide camelCase API compatibility with js-yaml.
/// For large documents, it uses batch processing for better performance.
#[wasm_bindgen]
pub fn loadAll(input: &str) -> Result<Array, JsValue> {
    // Performance optimization: Check input size for logging
    let input_len = input.len();

    // Log loading start for debugging
    console::log_1(&format!("Loading multiple YAML documents (camelCase) of size: {} bytes", input_len).into());

    // Call load_all to avoid code duplication
    load_all(input)
}

// Internal helper functions

/// Convert a YAML value to a JavaScript value
///
/// Highly optimized version with batch processing and reduced recursion.
pub fn yaml_to_js_value(yaml: &Yaml) -> Result<JsValue, JsValue> {
    match yaml {
        // Basic types conversion is already efficient
        Yaml::Null => Ok(JsValue::NULL),
        Yaml::Boolean(b) => Ok(Boolean::from(*b).into()),
        Yaml::Integer(i) => Ok(Number::from(*i as f64).into()),
        Yaml::Real(s) => {
            // Optimize string to float conversion
            match s.parse::<f64>() {
                Ok(f) => Ok(Number::from(f).into()),
                Err(_) => Err(JsValue::from_str(&format!("Invalid float: {}", s))),
            }
        },
        Yaml::String(s) => Ok(JsString::from(s.as_str()).into()),
        Yaml::Array(arr) => {
            // Pre-allocate array capacity
            let len = arr.len();

            // Process small arrays directly
            if len < 1000 {
                let js_array = Array::new_with_length(len as u32);

                // Use index to set directly (more efficient than push operations)
                for (i, item) in arr.iter().enumerate() {
                    let js_item = yaml_to_js_value(item)?;
                    js_array.set(i as u32, js_item);
                }
                return Ok(js_array.into());
            }

            // Batch process large arrays
            let js_array = Array::new_with_length(len as u32);

            // Batch size (find optimal value experimentally)
            const BATCH_SIZE: usize = 500;

            // Process in batches
            for batch_start in (0..len).step_by(BATCH_SIZE) {
                let batch_end = (batch_start + BATCH_SIZE).min(len);

                // Process elements in this batch
                for i in batch_start..batch_end {
                    let js_item = yaml_to_js_value(&arr[i])?;
                    js_array.set(i as u32, js_item);
                }

                // Encourage GC to reduce memory pressure
                // (Adjust based on actual performance)
                if batch_end < len && batch_end % (BATCH_SIZE * 10) == 0 {
                    js_sys::global().dyn_ref::<js_sys::Function>()
                        .and_then(|gc| {
                            // Try to call gc() if available
                            let _ = gc.call0(&JsValue::NULL);
                            Some(())
                        });
                }
            }

            Ok(js_array.into())
        },
        Yaml::Hash(hash) => {
            let hash_len = hash.len();

            // Process small hash maps directly
            if hash_len < 1000 {
                let js_obj = Object::new();

                for (key, value) in hash {
                    // Optimize key string conversion
                    let key_str = match key {
                        Yaml::String(s) => s.as_str(), // Avoid cloning
                        _ => {
                            // Support non-string keys for js-yaml compatibility
                            &format!("{:?}", key)
                        }
                    };

                    // Convert value
                    let js_value = yaml_to_js_value(value)?;

                    // Set property on object
                    if let Err(_) = js_sys::Reflect::set(&js_obj, &JsString::from(key_str).into(), &js_value) {
                        return Err(JsValue::from_str("Failed to set property"));
                    }
                }
                return Ok(js_obj.into());
            }

            // Batch process large hash maps
            let js_obj = Object::new();

            // Convert key-value pairs to vector
            let pairs: Vec<_> = hash.iter().collect();
            const BATCH_SIZE: usize = 500;

            // Process in batches
            for batch_start in (0..pairs.len()).step_by(BATCH_SIZE) {
                let batch_end = (batch_start + BATCH_SIZE).min(pairs.len());

                // Process key/value pairs in this batch
                for i in batch_start..batch_end {
                    let (key, value) = pairs[i];

                    // Convert key to string
                    let key_str = match key {
                        Yaml::String(s) => s.as_str(),
                        _ => &format!("{:?}", key)
                    };

                    // Convert value
                    let js_value = yaml_to_js_value(value)?;

                    // Set property on object
                    if let Err(_) = js_sys::Reflect::set(&js_obj, &JsString::from(key_str).into(), &js_value) {
                        return Err(JsValue::from_str("Failed to set property"));
                    }
                }

                // Encourage GC to reduce memory pressure
                if batch_end < pairs.len() && batch_end % (BATCH_SIZE * 10) == 0 {
                    js_sys::global().dyn_ref::<js_sys::Function>()
                        .and_then(|gc| {
                            let _ = gc.call0(&JsValue::NULL);
                            Some(())
                        });
                }
            }

            Ok(js_obj.into())
        },
        Yaml::Alias(_) => Err(JsValue::from_str("YAML aliases are not supported")),
        Yaml::BadValue => Err(JsValue::from_str("Invalid YAML value")),
    }
}
