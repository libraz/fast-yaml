//! YAMLPath evaluator
//!
//! This module contains the evaluator for YAMLPath expressions.

use yaml_rust2::Yaml;

use super::types::{FilterExpr, PathExpr};

/// Evaluate a YAMLPath expression against a YAML document
pub fn evaluate_path<'a>(yaml: &'a Yaml, path: &PathExpr) -> Vec<&'a Yaml> {
    match path {
        PathExpr::Root => vec![yaml],
        PathExpr::Property(name) => {
            if let Yaml::Hash(hash) = yaml {
                if let Some(value) = hash.get(&Yaml::String(name.clone())) {
                    vec![value]
                } else {
                    vec![]
                }
            } else {
                vec![]
            }
        }
        PathExpr::Index(index) => {
            if let Yaml::Array(array) = yaml {
                if *index < array.len() {
                    vec![&array[*index]]
                } else {
                    vec![]
                }
            } else {
                vec![]
            }
        }
        PathExpr::Wildcard => {
            if let Yaml::Array(array) = yaml {
                array.iter().collect()
            } else if let Yaml::Hash(hash) = yaml {
                hash.values().collect()
            } else {
                vec![]
            }
        }
        PathExpr::RecursiveDescent => {
            let mut results = vec![];
            collect_recursive(yaml, &mut results);
            results
        }
        PathExpr::Filter(filter) => {
            if let Yaml::Array(array) = yaml {
                array.iter().filter(|item| evaluate_filter(item, filter)).collect()
            } else {
                vec![]
            }
        }
        PathExpr::Sequence(exprs) => {
            let mut results = vec![yaml];

            for expr in exprs {
                let mut new_results = vec![];

                for item in results {
                    new_results.extend(evaluate_path(item, expr));
                }

                results = new_results;
            }

            results
        }
    }
}

/// Recursively collect all values in a YAML document
fn collect_recursive<'a>(yaml: &'a Yaml, results: &mut Vec<&'a Yaml>) {
    results.push(yaml);

    match yaml {
        Yaml::Array(array) => {
            for item in array {
                collect_recursive(item, results);
            }
        }
        Yaml::Hash(hash) => {
            for (_, value) in hash {
                collect_recursive(value, results);
            }
        }
        _ => {}
    }
}

/// Evaluate a filter expression against a YAML value
pub fn evaluate_filter(yaml: &Yaml, filter: &FilterExpr) -> bool {
    match filter {
        FilterExpr::Equals(path, value) => {
            let results = evaluate_path(yaml, path);
            results.iter().any(|result| *result == value)
        }
        FilterExpr::NotEquals(path, value) => {
            let results = evaluate_path(yaml, path);
            results.iter().all(|result| *result != value)
        }
        FilterExpr::GreaterThan(path, value) => {
            let results = evaluate_path(yaml, path);
            results.iter().any(|result| *result > value)
        }
        FilterExpr::LessThan(path, value) => {
            let results = evaluate_path(yaml, path);
            results.iter().any(|result| *result < value)
        }
        FilterExpr::And(left, right) => {
            evaluate_filter(yaml, left) && evaluate_filter(yaml, right)
        }
        FilterExpr::Or(left, right) => {
            evaluate_filter(yaml, left) || evaluate_filter(yaml, right)
        }
    }
}
