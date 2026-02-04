//! Validation Error Types
//!
//! Detailed error information for referential integrity violations.

use std::fmt;

/// Specific type of validation failure
#[derive(Debug, Clone, PartialEq)]
pub enum ValidationFailure {
    /// Missing foreign key reference
    MissingForeignKey {
        /// Name of the file being validated
        file: String,
        /// Row number (1-indexed) where the error occurred
        row: usize,
        /// Name of the field containing the invalid reference
        field: String,
        /// The ID that was not found
        missing_id: u64,
        /// The type of entity being referenced
        referenced_table: String,
    },
    /// Invalid data format
    InvalidFormat {
        file: String,
        row: usize,
        field: String,
        message: String,
    },
    /// Required field is missing
    MissingRequiredField {
        file: String,
        row: usize,
        field: String,
    },
    /// Duplicate ID found
    DuplicateId {
        file: String,
        row: usize,
        id: u64,
        id_field: String,
    },
}

impl fmt::Display for ValidationFailure {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ValidationFailure::MissingForeignKey {
                file,
                row,
                field,
                missing_id,
                referenced_table,
            } => {
                write!(
                    f,
                    "[{}] Row {}: {} references invalid {} ID {}",
                    file, row, field, referenced_table, missing_id
                )
            }
            ValidationFailure::InvalidFormat {
                file,
                row,
                field,
                message,
            } => {
                write!(f, "[{}] Row {}: {} - {}", file, row, field, message)
            }
            ValidationFailure::MissingRequiredField { file, row, field } => {
                write!(
                    f,
                    "[{}] Row {}: Required field '{}' is empty",
                    file, row, field
                )
            }
            ValidationFailure::DuplicateId {
                file,
                row,
                id,
                id_field,
            } => {
                write!(
                    f,
                    "[{}] Row {}: Duplicate {} value {}",
                    file, row, id_field, id
                )
            }
        }
    }
}

/// Collection of validation errors for a single file or batch
#[derive(Debug, Default, Clone)]
pub struct ValidationError {
    failures: Vec<ValidationFailure>,
}

impl ValidationError {
    /// Create a new empty validation error collection
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a failure to the collection
    pub fn add_failure(&mut self, failure: ValidationFailure) {
        self.failures.push(failure);
    }

    /// Check if there are any failures
    pub fn is_empty(&self) -> bool {
        self.failures.is_empty()
    }

    /// Get the number of failures
    pub fn failure_count(&self) -> usize {
        self.failures.len()
    }

    /// Get all failures
    pub fn failures(&self) -> &[ValidationFailure] {
        &self.failures
    }

    /// Get a summary of failures by type
    pub fn summary(&self) -> String {
        let mut lines = Vec::new();
        lines.push(format!(
            "Validation failed with {} errors:",
            self.failures.len()
        ));

        for (i, failure) in self.failures.iter().enumerate() {
            lines.push(format!("  {}. {}", i + 1, failure));
        }

        lines.join("\n")
    }
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.summary())
    }
}

impl std::error::Error for ValidationError {}
