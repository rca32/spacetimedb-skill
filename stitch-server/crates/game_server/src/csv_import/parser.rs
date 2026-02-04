use log::{debug, error, info};
use serde::de::DeserializeOwned;
use std::io::Read;
use std::path::Path;

use super::embedded;
use super::error::{CsvImportError, CsvResult};

/// Parse a CSV file into a vector of typed records
///
/// Handles:
/// - UTF-8 BOM removal
/// - Flexible CSV parsing with csv::ReaderBuilder
/// - Detailed error reporting with line numbers
pub fn parse_csv_file<T: DeserializeOwned>(path: &str) -> CsvResult<Vec<T>> {
    let path_obj = Path::new(path);
    let file_name = path_obj
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string());

    if !path_obj.exists() {
        if let Some(csv_content) = embedded::get_embedded_csv(path) {
            info!("[CSV-IMPORT] Using embedded CSV for: {}", file_name);
            return parse_csv_string(csv_content);
        }
        error!("[CSV-IMPORT] File not found: {}", path);
        return Err(CsvImportError::MissingFile(path.to_string()));
    }

    info!("[CSV-IMPORT] Parsing: {}", file_name);

    let mut file = std::fs::File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    // Remove UTF-8 BOM if present
    let content = remove_bom(&content);

    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .escape(Some(b'\\'))
        .from_reader(content.as_bytes());

    let headers = reader.headers().map(|h| h.iter().count()).unwrap_or(0);
    debug!("[CSV-IMPORT] {} - Found {} columns", file_name, headers);

    let mut records = Vec::new();
    let mut line_number: u64 = 1; // Start at 1 for header

    for result in reader.deserialize::<T>() {
        line_number += 1;
        match result {
            Ok(record) => records.push(record),
            Err(e) => {
                error!(
                    "[CSV-IMPORT] Parse error in {} at line {}: {}",
                    file_name, line_number, e
                );
                return Err(CsvImportError::ParseError {
                    line: line_number,
                    message: format!("Failed to deserialize: {}", e),
                });
            }
        }
    }

    info!(
        "[CSV-IMPORT] Successfully parsed {}: {} records",
        file_name,
        records.len()
    );
    Ok(records)
}

/// Remove UTF-8 BOM (Byte Order Mark) if present
fn remove_bom(content: &str) -> &str {
    const BOM: &str = "\u{FEFF}";
    if content.starts_with(BOM) {
        &content[BOM.len()..]
    } else {
        content
    }
}

/// Parse CSV from a string (useful for testing)
pub fn parse_csv_string<T: DeserializeOwned>(csv_content: &str) -> CsvResult<Vec<T>> {
    let content = remove_bom(csv_content);

    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .escape(Some(b'\\'))
        .from_reader(content.as_bytes());

    let mut records = Vec::new();
    let mut line_number: u64 = 1;

    for result in reader.deserialize::<T>() {
        line_number += 1;
        match result {
            Ok(record) => records.push(record),
            Err(e) => {
                return Err(CsvImportError::ParseError {
                    line: line_number,
                    message: format!("Failed to deserialize: {}", e),
                });
            }
        }
    }

    Ok(records)
}

/// Get CSV headers without parsing records
pub fn get_csv_headers(path: &str) -> CsvResult<Vec<String>> {
    let path_obj = Path::new(path);

    if !path_obj.exists() {
        if let Some(csv_content) = embedded::get_embedded_csv(path) {
            return get_csv_headers_from_string(csv_content);
        }
        return Err(CsvImportError::MissingFile(path.to_string()));
    }

    let mut file = std::fs::File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    let content = remove_bom(&content);

    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .escape(Some(b'\\'))
        .from_reader(content.as_bytes());

    let headers: Vec<String> = reader.headers()?.iter().map(|h| h.to_string()).collect();

    Ok(headers)
}

/// Count records in CSV file (excluding header)
pub fn count_csv_records(path: &str) -> CsvResult<u64> {
    let path_obj = Path::new(path);

    if !path_obj.exists() {
        if let Some(csv_content) = embedded::get_embedded_csv(path) {
            return count_csv_records_from_string(csv_content);
        }
        return Err(CsvImportError::MissingFile(path.to_string()));
    }

    let mut file = std::fs::File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    let content = remove_bom(&content);

    let reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .escape(Some(b'\\'))
        .from_reader(content.as_bytes());

    let count = reader.into_records().count() as u64;
    Ok(count)
}

fn get_csv_headers_from_string(csv_content: &str) -> CsvResult<Vec<String>> {
    let content = remove_bom(csv_content);

    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .escape(Some(b'\\'))
        .from_reader(content.as_bytes());

    let headers: Vec<String> = reader.headers()?.iter().map(|h| h.to_string()).collect();

    Ok(headers)
}

fn count_csv_records_from_string(csv_content: &str) -> CsvResult<u64> {
    let content = remove_bom(csv_content);

    let reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .escape(Some(b'\\'))
        .from_reader(content.as_bytes());

    Ok(reader.into_records().count() as u64)
}
