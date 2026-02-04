use std::fmt;

#[derive(Debug)]
pub enum CsvImportError {
    IoError(std::io::Error),
    CsvError(csv::Error),
    JsonError(serde_json::Error),
    ValidationError(String),
    MissingFile(String),
    ParseError {
        line: u64,
        message: String,
    },
    /// Referential integrity violation during import
    ReferentialIntegrityViolation {
        file: String,
        errors: Vec<String>,
    },
}

impl fmt::Display for CsvImportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CsvImportError::IoError(e) => write!(f, "IO Error: {}", e),
            CsvImportError::CsvError(e) => write!(f, "CSV Error: {}", e),
            CsvImportError::JsonError(e) => write!(f, "JSON Error: {}", e),
            CsvImportError::ValidationError(msg) => write!(f, "Validation Error: {}", msg),
            CsvImportError::MissingFile(path) => write!(f, "Missing File: {}", path),
            CsvImportError::ParseError { line, message } => {
                write!(f, "Parse Error at line {}: {}", line, message)
            }
            CsvImportError::ReferentialIntegrityViolation { file, errors } => {
                writeln!(f, "Referential Integrity Violation in {}:", file)?;
                for (i, error) in errors.iter().enumerate() {
                    writeln!(f, "  {}. {}", i + 1, error)?;
                }
                Ok(())
            }
        }
    }
}

impl std::error::Error for CsvImportError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            CsvImportError::IoError(e) => Some(e),
            CsvImportError::CsvError(e) => Some(e),
            CsvImportError::JsonError(e) => Some(e),
            _ => None,
        }
    }
}

impl From<std::io::Error> for CsvImportError {
    fn from(err: std::io::Error) -> Self {
        CsvImportError::IoError(err)
    }
}

impl From<csv::Error> for CsvImportError {
    fn from(err: csv::Error) -> Self {
        CsvImportError::CsvError(err)
    }
}

impl From<serde_json::Error> for CsvImportError {
    fn from(err: serde_json::Error) -> Self {
        CsvImportError::JsonError(err)
    }
}

pub type CsvResult<T> = Result<T, CsvImportError>;
