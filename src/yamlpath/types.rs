//! YAMLPath type definitions
//!
//! This module contains the type definitions for YAMLPath expressions and filters.

use yaml_rust2::Yaml;

/// YAMLPath expression types
#[derive(Debug, Clone)]
pub enum PathExpr {
    /// Root of the document
    Root,
    /// Property access (e.g., `.property`)
    Property(String),
    /// Array index access (e.g., `[0]`)
    Index(usize),
    /// Wildcard (e.g., `[*]` or `.*`)
    Wildcard,
    /// Recursive descent (e.g., `..property`)
    RecursiveDescent,
    /// Filter expression (e.g., `[?(@.property==value)]`)
    Filter(Box<FilterExpr>),
    /// Sequence of expressions
    Sequence(Vec<PathExpr>),
}

/// Filter expression types
#[derive(Debug, Clone)]
pub enum FilterExpr {
    /// Equality comparison (e.g., `@.property == value`)
    Equals(Box<PathExpr>, Yaml),
    /// Inequality comparison (e.g., `@.property != value`)
    NotEquals(Box<PathExpr>, Yaml),
    /// Greater than comparison (e.g., `@.property > value`)
    GreaterThan(Box<PathExpr>, Yaml),
    /// Less than comparison (e.g., `@.property < value`)
    LessThan(Box<PathExpr>, Yaml),
    /// Logical AND of two filter expressions
    And(Box<FilterExpr>, Box<FilterExpr>),
    /// Logical OR of two filter expressions
    Or(Box<FilterExpr>, Box<FilterExpr>),
}

/// Operator types
#[derive(Debug, Clone, PartialEq)]
pub enum Operator {
    /// Equality operator (==)
    Equals,
    /// Inequality operator (!=)
    NotEquals,
    /// Greater than operator (>)
    GreaterThan,
    /// Less than operator (<)
    LessThan,
    /// Logical AND operator (&&)
    And,
    /// Logical OR operator (||)
    Or,
}

impl Operator {
    /// Convert a string to an operator
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "==" => Some(Operator::Equals),
            "!=" => Some(Operator::NotEquals),
            ">" => Some(Operator::GreaterThan),
            "<" => Some(Operator::LessThan),
            "&&" => Some(Operator::And),
            "||" => Some(Operator::Or),
            _ => None,
        }
    }
}
