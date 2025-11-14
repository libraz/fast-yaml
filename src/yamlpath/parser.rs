//! YAMLPath parser
//!
//! This module contains the parser for YAMLPath expressions.

use std::iter::Peekable;
use std::str::Chars;

use yaml_rust2::Yaml;

use super::types::{FilterExpr, Operator, PathExpr};

/// Parse a YAMLPath expression
pub fn parse_path(path: &str) -> Result<PathExpr, String> {
    let mut chars = path.chars().peekable();

    // Check if the path starts with '$' (root) or '.' (property)
    match chars.peek() {
        Some('$') => {
            chars.next(); // Consume '$'
            let expr = parse_path_segment(&mut chars)?;
            Ok(PathExpr::Sequence(vec![PathExpr::Root, expr]))
        }
        Some('.') => {
            let expr = parse_path_segment(&mut chars)?;
            Ok(PathExpr::Sequence(vec![PathExpr::Root, expr]))
        }
        _ => Err("Path must start with '$' or '.'".to_string()),
    }
}

/// Parse a path segment
pub fn parse_path_segment(chars: &mut Peekable<Chars>) -> Result<PathExpr, String> {
    match chars.peek() {
        Some('.') => {
            chars.next(); // Consume '.'

            // Check for recursive descent (..)
            if let Some('.') = chars.peek() {
                chars.next(); // Consume second '.'
                let property = parse_identifier(chars)?;
                return Ok(PathExpr::Sequence(vec![
                    PathExpr::RecursiveDescent,
                    PathExpr::Property(property),
                ]));
            }

            // Check for wildcard (*)
            if let Some('*') = chars.peek() {
                chars.next(); // Consume '*'

                // Check for more segments
                if let Some(c) = chars.peek() {
                    if *c == '.' || *c == '[' {
                        let next_segment = parse_path_segment(chars)?;
                        return Ok(PathExpr::Sequence(vec![PathExpr::Wildcard, next_segment]));
                    }
                }

                return Ok(PathExpr::Wildcard);
            }

            // Parse property name
            let property = parse_identifier(chars)?;

            // Check for more segments
            if let Some(c) = chars.peek() {
                if *c == '.' || *c == '[' {
                    let next_segment = parse_path_segment(chars)?;
                    return Ok(PathExpr::Sequence(vec![
                        PathExpr::Property(property),
                        next_segment,
                    ]));
                }
            }

            Ok(PathExpr::Property(property))
        }
        Some('[') => {
            chars.next(); // Consume '['

            // Check for array index, wildcard, or filter
            match chars.peek() {
                Some('*') => {
                    chars.next(); // Consume '*'
                    expect_char(chars, ']')?;

                    // Check for more segments
                    if let Some(c) = chars.peek() {
                        if *c == '.' || *c == '[' {
                            let next_segment = parse_path_segment(chars)?;
                            return Ok(PathExpr::Sequence(vec![PathExpr::Wildcard, next_segment]));
                        }
                    }

                    Ok(PathExpr::Wildcard)
                }
                Some('?') => {
                    chars.next(); // Consume '?'
                    expect_char(chars, '(')?;

                    let filter = parse_filter_expression(chars)?;

                    expect_char(chars, ')')?;
                    expect_char(chars, ']')?;

                    // Check for more segments
                    if let Some(c) = chars.peek() {
                        if *c == '.' || *c == '[' {
                            let next_segment = parse_path_segment(chars)?;
                            return Ok(PathExpr::Sequence(vec![
                                PathExpr::Filter(Box::new(filter)),
                                next_segment,
                            ]));
                        }
                    }

                    Ok(PathExpr::Filter(Box::new(filter)))
                }
                Some(c) if c.is_ascii_digit() => {
                    let index = parse_number(chars)?;
                    expect_char(chars, ']')?;

                    // Check for more segments
                    if let Some(c) = chars.peek() {
                        if *c == '.' || *c == '[' {
                            let next_segment = parse_path_segment(chars)?;
                            return Ok(PathExpr::Sequence(vec![
                                PathExpr::Index(index),
                                next_segment,
                            ]));
                        }
                    }

                    Ok(PathExpr::Index(index))
                }
                _ => Err("Invalid array index or filter".to_string()),
            }
        }
        _ => Err("Expected '.' or '['".to_string()),
    }
}

/// Parse a filter expression
pub fn parse_filter_expression(chars: &mut Peekable<Chars>) -> Result<FilterExpr, String> {
    // Parse the left-hand side of the filter expression
    let left = parse_filter_term(chars)?;

    // Skip any whitespace
    skip_whitespace(chars);

    // Check for logical operators
    if let Some(&c) = chars.peek() {
        if c == '&' || c == '|' {
            let op_char = c;
            chars.next(); // Consume first character

            // Expect a second character
            if chars.peek() != Some(&op_char) {
                return Err(format!(
                    "Expected '{}{}', got '{}{}'",
                    op_char,
                    op_char,
                    op_char,
                    chars.peek().unwrap_or(&' ')
                ));
            }

            chars.next(); // Consume second character

            // Skip any whitespace
            skip_whitespace(chars);

            // Parse the right-hand side of the filter expression
            let right = parse_filter_expression(chars)?;

            // Create the appropriate filter expression
            match op_char {
                '&' => Ok(FilterExpr::And(Box::new(left), Box::new(right))),
                '|' => Ok(FilterExpr::Or(Box::new(left), Box::new(right))),
                _ => unreachable!(),
            }
        } else {
            Ok(left)
        }
    } else {
        Ok(left)
    }
}

/// Parse a filter term (a single comparison)
fn parse_filter_term(chars: &mut Peekable<Chars>) -> Result<FilterExpr, String> {
    // Skip any whitespace
    skip_whitespace(chars);

    // Parse the left side of the filter (path expression)
    expect_char(chars, '@')?;
    let left = parse_path_segment(chars)?;

    // Skip any whitespace
    skip_whitespace(chars);

    // Parse the operator
    let op = parse_operator(chars)?;

    // Skip any whitespace
    skip_whitespace(chars);

    // Parse the right side of the filter (value)
    let right = parse_value(chars)?;

    // Create the appropriate filter expression
    match op {
        Operator::Equals => Ok(FilterExpr::Equals(Box::new(left), right)),
        Operator::NotEquals => Ok(FilterExpr::NotEquals(Box::new(left), right)),
        Operator::GreaterThan => Ok(FilterExpr::GreaterThan(Box::new(left), right)),
        Operator::LessThan => Ok(FilterExpr::LessThan(Box::new(left), right)),
        _ => Err(format!("Unexpected operator in filter term: {:?}", op)),
    }
}

/// Parse an identifier (property name)
fn parse_identifier(chars: &mut Peekable<Chars>) -> Result<String, String> {
    let mut identifier = String::new();

    while let Some(&c) = chars.peek() {
        if c.is_alphanumeric() || c == '_' {
            identifier.push(c);
            chars.next();
        } else {
            break;
        }
    }

    if identifier.is_empty() {
        Err("Expected identifier".to_string())
    } else {
        Ok(identifier)
    }
}

/// Parse a number (array index)
fn parse_number(chars: &mut Peekable<Chars>) -> Result<usize, String> {
    let mut number = String::new();

    while let Some(&c) = chars.peek() {
        if c.is_ascii_digit() {
            number.push(c);
            chars.next();
        } else {
            break;
        }
    }

    number
        .parse::<usize>()
        .map_err(|_| "Invalid number".to_string())
}

/// Parse an operator
fn parse_operator(chars: &mut Peekable<Chars>) -> Result<Operator, String> {
    let mut op_str = String::new();

    // Skip any whitespace before the operator
    skip_whitespace(chars);

    while let Some(&c) = chars.peek() {
        if c == '=' || c == '!' || c == '<' || c == '>' || c == '&' || c == '|' {
            op_str.push(c);
            chars.next();

            // Handle double-character operators
            if (c == '=' || c == '!' || c == '<' || c == '>' || c == '&' || c == '|')
                && chars.peek() == Some(&c)
            {
                op_str.push(c);
                chars.next();
            }
        } else {
            break;
        }
    }

    // Skip any whitespace after the operator
    skip_whitespace(chars);

    if op_str.is_empty() {
        Err("Expected operator".to_string())
    } else {
        Operator::from_str(&op_str).ok_or_else(|| format!("Unsupported operator: {}", op_str))
    }
}

/// Parse a value
fn parse_value(chars: &mut Peekable<Chars>) -> Result<Yaml, String> {
    // Skip whitespace
    skip_whitespace(chars);

    match chars.peek() {
        Some('"') => {
            chars.next(); // Consume '"'
            let mut value = String::new();

            while let Some(&c) = chars.peek() {
                if c == '"' {
                    chars.next(); // Consume closing '"'
                    return Ok(Yaml::String(value));
                } else {
                    value.push(c);
                    chars.next();
                }
            }

            Err("Unterminated string".to_string())
        }
        Some('t') => {
            // Parse "true"
            if chars.next() == Some('t')
                && chars.next() == Some('r')
                && chars.next() == Some('u')
                && chars.next() == Some('e')
            {
                Ok(Yaml::Boolean(true))
            } else {
                Err("Expected 'true'".to_string())
            }
        }
        Some('f') => {
            // Parse "false"
            if chars.next() == Some('f')
                && chars.next() == Some('a')
                && chars.next() == Some('l')
                && chars.next() == Some('s')
                && chars.next() == Some('e')
            {
                Ok(Yaml::Boolean(false))
            } else {
                Err("Expected 'false'".to_string())
            }
        }
        Some('n') => {
            // Parse "null"
            if chars.next() == Some('n')
                && chars.next() == Some('u')
                && chars.next() == Some('l')
                && chars.next() == Some('l')
            {
                Ok(Yaml::Null)
            } else {
                Err("Expected 'null'".to_string())
            }
        }
        Some(c) if c.is_ascii_digit() || *c == '-' => {
            let mut number = String::new();

            if *c == '-' {
                number.push('-');
                chars.next();
            }

            while let Some(&c) = chars.peek() {
                if c.is_ascii_digit() || c == '.' {
                    number.push(c);
                    chars.next();
                } else {
                    break;
                }
            }

            if number.contains('.') {
                // Parse as float
                match number.parse::<f64>() {
                    Ok(_) => Ok(Yaml::Real(number)),
                    Err(_) => Err("Invalid float".to_string()),
                }
            } else {
                // Parse as integer
                match number.parse::<i64>() {
                    Ok(i) => Ok(Yaml::Integer(i)),
                    Err(_) => Err("Invalid integer".to_string()),
                }
            }
        }
        _ => Err("Expected value".to_string()),
    }
}

/// Expect a specific character
fn expect_char(chars: &mut Peekable<Chars>, expected: char) -> Result<(), String> {
    match chars.next() {
        Some(c) if c == expected => Ok(()),
        Some(c) => Err(format!("Expected '{}', got '{}'", expected, c)),
        None => Err(format!("Expected '{}', got end of input", expected)),
    }
}

/// Skip whitespace characters
fn skip_whitespace(chars: &mut Peekable<Chars>) {
    while let Some(&c) = chars.peek() {
        if c.is_whitespace() {
            chars.next();
        } else {
            break;
        }
    }
}
