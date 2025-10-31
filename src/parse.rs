//! YAML parsing functionality
//!
//! This module provides the core YAML parsing functions that are API-compatible with js-yaml.

use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Boolean, Number, JsString};
use yaml_rust2::{Yaml, YamlLoader};
use std::fmt::Write as FmtWrite;

/// Parse a YAML string into a JavaScript object
///
/// This function is API-compatible with js-yaml's parse function.
/// Uses direct JSON string conversion for optimal performance.
#[wasm_bindgen]
pub fn parse(input: &str) -> Result<JsValue, JsValue> {
    // Parse the YAML string using yaml-rust2
    let docs = match YamlLoader::load_from_str(input) {
        Ok(docs) => docs,
        Err(e) => {
            let error_msg = format!("YAML parsing error: {} at line {}, column {}",
                e.info(), e.marker().line(), e.marker().col() + 1);
            return Err(JsValue::from_str(&error_msg));
        }
    };

    if docs.is_empty() {
        return Ok(JsValue::NULL);
    }

    // Convert to JSON string (single allocation)
    let json_string = yaml_to_json_string(&docs[0])
        .map_err(|e| JsValue::from_str(&e))?;

    // Parse JSON string to JsValue (single WASM boundary crossing)
    js_sys::JSON::parse(&json_string)
        .map_err(|_| JsValue::from_str("Failed to parse JSON"))
}

/// Parse all YAML documents in a string into an array of JavaScript objects
#[wasm_bindgen]
pub fn parse_all(input: &str) -> Result<Array, JsValue> {
    let docs = match YamlLoader::load_from_str(input) {
        Ok(docs) => docs,
        Err(e) => {
            let error_msg = format!("YAML parsing error: {} at line {}, column {}",
                e.info(), e.marker().line(), e.marker().col() + 1);
            return Err(JsValue::from_str(&error_msg));
        }
    };

    let result = Array::new();
    for doc in docs {
        let json_string = yaml_to_json_string(&doc)
            .map_err(|e| JsValue::from_str(&e))?;
        let js_value = js_sys::JSON::parse(&json_string)
            .map_err(|_| JsValue::from_str("Failed to parse JSON"))?;
        result.push(&js_value);
    }

    Ok(result)
}

#[wasm_bindgen]
pub fn load(input: &str) -> Result<JsValue, JsValue> {
    parse(input)
}

#[wasm_bindgen]
pub fn load_all(input: &str) -> Result<Array, JsValue> {
    parse_all(input)
}

/// Alias for load_all with camelCase naming for JavaScript compatibility
#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn loadAll(input: &str) -> Result<Array, JsValue> {
    load_all(input)
}

/// Convert YAML to JSON string efficiently
fn yaml_to_json_string(yaml: &Yaml) -> Result<String, String> {
    let mut output = String::with_capacity(1024);
    write_yaml_as_json(yaml, &mut output)?;
    Ok(output)
}

/// Write YAML value as JSON to a string buffer
fn write_yaml_as_json(yaml: &Yaml, output: &mut String) -> Result<(), String> {
    match yaml {
        Yaml::Null => output.push_str("null"),
        Yaml::Boolean(b) => {
            output.push_str(if *b { "true" } else { "false" });
        },
        Yaml::Integer(i) => {
            write!(output, "{}", i).map_err(|e| e.to_string())?;
        },
        Yaml::Real(s) => {
            match s.parse::<f64>() {
                Ok(f) => {
                    write!(output, "{}", f).map_err(|e| e.to_string())?;
                },
                Err(_) => return Err(format!("Invalid float: {}", s)),
            }
        },
        Yaml::String(s) => {
            output.push('"');
            for ch in s.chars() {
                match ch {
                    '"' => output.push_str("\\\""),
                    '\\' => output.push_str("\\\\"),
                    '\n' => output.push_str("\\n"),
                    '\r' => output.push_str("\\r"),
                    '\t' => output.push_str("\\t"),
                    '\x08' => output.push_str("\\b"),
                    '\x0C' => output.push_str("\\f"),
                    c if c.is_control() => {
                        write!(output, "\\u{:04x}", c as u32).map_err(|e| e.to_string())?;
                    },
                    c => output.push(c),
                }
            }
            output.push('"');
        },
        Yaml::Array(arr) => {
            output.push('[');
            for (i, item) in arr.iter().enumerate() {
                if i > 0 {
                    output.push(',');
                }
                write_yaml_as_json(item, output)?;
            }
            output.push(']');
        },
        Yaml::Hash(hash) => {
            output.push('{');
            let mut first = true;
            for (key, value) in hash {
                if !first {
                    output.push(',');
                }
                first = false;

                // Write key as string
                match key {
                    Yaml::String(s) => {
                        output.push('"');
                        for ch in s.chars() {
                            match ch {
                                '"' => output.push_str("\\\""),
                                '\\' => output.push_str("\\\\"),
                                '\n' => output.push_str("\\n"),
                                '\r' => output.push_str("\\r"),
                                '\t' => output.push_str("\\t"),
                                c => output.push(c),
                            }
                        }
                        output.push('"');
                    },
                    _ => {
                        write!(output, "\"{}\"", format!("{:?}", key)).map_err(|e| e.to_string())?;
                    }
                }

                output.push(':');
                write_yaml_as_json(value, output)?;
            }
            output.push('}');
        },
        Yaml::Alias(_) => return Err("YAML aliases are not supported".to_string()),
        Yaml::BadValue => return Err("Invalid YAML value".to_string()),
    }
    Ok(())
}

// Keep this for yamlpath compatibility
pub(crate) fn yaml_to_js_value(yaml: &Yaml) -> Result<JsValue, JsValue> {
    match yaml {
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
            let js_array = Array::new_with_length(arr.len() as u32);
            for (i, item) in arr.iter().enumerate() {
                js_array.set(i as u32, yaml_to_js_value(item)?);
            }
            Ok(js_array.into())
        },
        Yaml::Hash(hash) => {
            let js_obj = Object::new();
            for (key, value) in hash {
                let key_str = match key {
                    Yaml::String(s) => s.as_str(),
                    _ => &format!("{:?}", key)
                };
                let js_value = yaml_to_js_value(value)?;
                js_sys::Reflect::set(&js_obj, &JsString::from(key_str).into(), &js_value)
                    .map_err(|_| JsValue::from_str("Failed to set property"))?;
            }
            Ok(js_obj.into())
        },
        Yaml::Alias(_) => Err(JsValue::from_str("YAML aliases are not supported")),
        Yaml::BadValue => Err(JsValue::from_str("Invalid YAML value")),
    }
}
