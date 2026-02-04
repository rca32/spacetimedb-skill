//! CSV Import Validation Module
//!
//! Provides referential integrity validation for static data imports.
//! Ensures all foreign key relationships are valid before inserting data.

pub mod context;
pub mod error;
pub mod validator;

#[cfg(test)]
pub mod tests;

pub use context::ReferenceIndex;
pub use error::{ValidationError, ValidationFailure};
pub use validator::{ValidationResult, Validator};
