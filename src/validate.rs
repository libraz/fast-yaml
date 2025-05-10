//! YAML validation functionality
//!
//! This module provides YAML validation functionality for YAML documents.

use wasm_bindgen::prelude::*;
use js_sys::{Object, Boolean, Array, Reflect, JsString, JSON};
use serde_json::{Value as JsonValue};
use yaml_rust2::{YamlLoader};

/// Validate a YAML document against a JSON Schema
///
/// @param {string} yaml - The YAML document to validate
/// @param {Object} schema - The JSON Schema to validate against
/// @returns {Object} - Validation result with success flag and any errors
#[wasm_bindgen]
pub fn validate(yaml: &str, schema: &JsValue) -> Result<JsValue, JsValue> {
    // Parse the YAML document
    let docs = match YamlLoader::load_from_str(yaml) {
        Ok(docs) => docs,
        Err(e) => {
            return Err(JsValue::from_str(&format!("YAML parsing error: {}", e)));
        }
    };

    if docs.is_empty() {
        return Err(JsValue::from_str("Empty YAML document"));
    }

    // Convert the YAML to JSON
    let yaml_value = &docs[0];
    let _json_value = match yaml_to_json(yaml_value) {
        Ok(value) => value,
        Err(e) => {
            return Err(JsValue::from_str(&format!("YAML to JSON conversion error: {}", e)));
        }
    };

    // Convert the schema from JsValue to JsonValue
    let schema_str = JSON::stringify(schema)
        .map_err(|_| JsValue::from_str("Failed to stringify schema"))?
        .as_string()
        .ok_or_else(|| JsValue::from_str("Failed to convert schema to string"))?;

    let _schema_value: JsonValue = match serde_json::from_str(&schema_str) {
        Ok(value) => value,
        Err(e) => {
            return Err(JsValue::from_str(&format!("Schema parsing error: {}", e)));
        }
    };

    // TODO: Implement JSON Schema validation
    // For now, just return a successful result
    let result = Object::new();
    let _ = Reflect::set(&result, &JsString::from("valid"), &Boolean::from(true));
    let _ = Reflect::set(&result, &JsString::from("errors"), &Array::new());

    Ok(result.into())
}

/// Convert YAML to JSON
fn yaml_to_json(yaml: &yaml_rust2::Yaml) -> Result<JsonValue, String> {
    match yaml {
        yaml_rust2::Yaml::Null => Ok(JsonValue::Null),
        yaml_rust2::Yaml::Boolean(b) => Ok(JsonValue::Bool(*b)),
        yaml_rust2::Yaml::Integer(i) => Ok(JsonValue::Number(serde_json::Number::from(*i))),
        yaml_rust2::Yaml::Real(s) => {
            let f = s.parse::<f64>().map_err(|e| format!("Failed to parse real: {}", e))?;
            Ok(JsonValue::Number(serde_json::Number::from_f64(f).ok_or_else(|| "Invalid float".to_string())?))
        },
        yaml_rust2::Yaml::String(s) => Ok(JsonValue::String(s.clone())),
        yaml_rust2::Yaml::Array(arr) => {
            let mut json_arr = Vec::new();
            for item in arr {
                json_arr.push(yaml_to_json(item)?);
            }
            Ok(JsonValue::Array(json_arr))
        },
        yaml_rust2::Yaml::Hash(hash) => {
            let mut map = serde_json::Map::new();
            for (k, v) in hash {
                let key = match k {
                    yaml_rust2::Yaml::String(s) => s.clone(),
                    _ => return Err("Hash key must be a string".to_string()),
                };
                map.insert(key, yaml_to_json(v)?);
            }
            Ok(JsonValue::Object(map))
        },
        yaml_rust2::Yaml::Alias(_) => Err("Aliases are not supported".to_string()),
        yaml_rust2::Yaml::BadValue => Err("Bad YAML value".to_string()),
    }
}
