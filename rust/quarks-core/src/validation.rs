//! Input validation and sanitization
//!
//! Provides validation for user inputs to prevent injection attacks
//! and ensure data integrity.

use regex::Regex;
use std::sync::OnceLock;
use thiserror::Error;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;


/// Returns a compiled static regex (panics only at first call if pattern is invalid,
/// which is a compile-time guarantee for literal patterns)
macro_rules! static_regex {
    ($pattern:expr) => {{
        static RE: OnceLock<Regex> = OnceLock::new();
        RE.get_or_init(|| Regex::new($pattern).expect("static regex pattern is valid"))
    }};
}


/// Validation errors
#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("Invalid email format")]
    InvalidEmail,
    #[error("Invalid barcode format")]
    InvalidBarcode,
    #[error("String too long: max {max} characters")]
    StringTooLong { max: usize },
    #[error("Invalid date format")]
    InvalidDate,
    #[error("Value out of range: {0}")]
    OutOfRange(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

/// Validate email format
///
/// # Arguments
/// * `email` - Email address to validate
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_email(email: &str) -> bool {
    // Basic email regex - not exhaustive but catches most issues
    let email_regex = static_regex!(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    );

    email_regex.is_match(email) && email.len() <= 254
}

/// Validate barcode format (UPC-A, EAN-13, EAN-8)
///
/// # Arguments
/// * `barcode` - Barcode string to validate
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_barcode(barcode: &str) -> bool {
    // Must be 8, 12, or 13 digits
    let valid_lengths = [8, 12, 13];

    if !valid_lengths.contains(&barcode.len()) {
        return false;
    }

    // Must be all digits
    if !barcode.chars().all(|c| c.is_ascii_digit()) {
        return false;
    }

    // Validate check digit for EAN-13 and UPC-A
    if barcode.len() >= 12 {
        return validate_ean_checksum(barcode);
    }

    true
}

/// Validate EAN/UPC checksum
fn validate_ean_checksum(barcode: &str) -> bool {
    let digits: Vec<u32> = barcode
        .chars()
        .filter_map(|c| c.to_digit(10))
        .collect();

    if digits.len() < 8 {
        return false;
    }

    let len = digits.len();
    let check_digit = digits[len - 1];

    let mut sum = 0;
    for (i, &digit) in digits[..len - 1].iter().enumerate() {
        if (len - 1 - i) % 2 == 0 {
            sum += digit;
        } else {
            sum += digit * 3;
        }
    }

    let calculated_check = (10 - (sum % 10)) % 10;
    calculated_check == check_digit
}

/// Sanitize string input by removing dangerous characters
///
/// Removes HTML tags and special characters that could be used for XSS
///
/// # Arguments
/// * `input` - String to sanitize
///
/// # Returns
/// Sanitized string
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn sanitize_string(input: &str) -> String {
    // Remove HTML tags
    let tag_regex = static_regex!(r"<[^>]*>");
    let no_tags = tag_regex.replace_all(input, "");

    // Remove or encode dangerous characters
    no_tags
        .chars()
        .filter(|c| {
            // Allow alphanumeric, spaces, and common punctuation
            c.is_alphanumeric()
                || c.is_whitespace()
                || matches!(*c, '.' | ',' | '-' | '_' | '!' | '?' | ':' | ';' | '(' | ')' | '@' | '#' | '%' | '+' | '=' | '/')
        })
        .collect::<String>()
        .trim()
        .to_string()
}

/// Sanitize string with length limit
///
/// # Arguments
/// * `input` - String to sanitize
/// * `max_length` - Maximum allowed length
///
/// # Returns
/// Sanitized and truncated string
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn sanitize_string_with_limit(input: &str, max_length: usize) -> String {
    let sanitized = sanitize_string(input);
    if sanitized.len() > max_length {
        sanitized[..max_length].to_string()
    } else {
        sanitized
    }
}

/// Validate date string in YYYY-MM-DD format
///
/// # Arguments
/// * `date` - Date string to validate
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_date(date: &str) -> bool {
    let date_regex = static_regex!(r"^\d{4}-\d{2}-\d{2}$");

    if !date_regex.is_match(date) {
        return false;
    }

    // Parse and validate the actual date values
    let parts: Vec<&str> = date.split('-').collect();
    if parts.len() != 3 {
        return false;
    }

    let year: u32 = match parts[0].parse() {
        Ok(y) => y,
        Err(_) => return false,
    };
    let month: u32 = match parts[1].parse() {
        Ok(m) => m,
        Err(_) => return false,
    };
    let day: u32 = match parts[2].parse() {
        Ok(d) => d,
        Err(_) => return false,
    };

    // Basic validation
    if year < 1900 || year > 2100 {
        return false;
    }
    if month < 1 || month > 12 {
        return false;
    }
    if day < 1 || day > 31 {
        return false;
    }

    // Days in month validation
    let days_in_month = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            // Leap year check
            if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => return false,
    };

    day <= days_in_month
}

/// Validate datetime string in ISO 8601 format
///
/// # Arguments
/// * `datetime` - Datetime string to validate
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_datetime(datetime: &str) -> bool {
    // ISO 8601 format: YYYY-MM-DDTHH:MM:SS or with timezone
    let datetime_regex = static_regex!(
        r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$"
    );

    if !datetime_regex.is_match(datetime) {
        return false;
    }

    // Validate the date part
    if datetime.len() >= 10 {
        validate_date(&datetime[..10])
    } else {
        false
    }
}

/// Validate UUID format
///
/// # Arguments
/// * `uuid` - UUID string to validate
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_uuid(uuid: &str) -> bool {
    let uuid_regex = static_regex!(
        r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    uuid_regex.is_match(uuid)
}

/// Validate number is within range
///
/// # Arguments
/// * `value` - Value to validate
/// * `min` - Minimum allowed value
/// * `max` - Maximum allowed value
///
/// # Returns
/// true if within range, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_range(value: f64, min: f64, max: f64) -> bool {
    value >= min && value <= max && value.is_finite()
}

/// Validate and sanitize a food name
///
/// # Arguments
/// * `name` - Food name to validate
///
/// # Returns
/// Sanitized food name or error
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_food_name(name: &str) -> Result<String, String> {
    let sanitized = sanitize_string(name);

    if sanitized.is_empty() {
        return Err("Food name cannot be empty".to_string());
    }

    if sanitized.len() > 200 {
        return Err("Food name too long (max 200 characters)".to_string());
    }

    Ok(sanitized)
}

/// Validate meal type
///
/// # Arguments
/// * `meal_type` - Meal type to validate
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_meal_type(meal_type: &str) -> bool {
    matches!(
        meal_type.to_lowercase().as_str(),
        "breakfast" | "lunch" | "dinner" | "snack" | "other"
    )
}

/// Validate fasting protocol format (HH:MM)
///
/// # Arguments
/// * `protocol` - Protocol string (e.g., "16:8")
///
/// # Returns
/// true if valid, false otherwise
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn validate_fasting_protocol(protocol: &str) -> bool {
    let protocol_regex = static_regex!(r"^\d{1,2}:\d{1,2}$");

    if !protocol_regex.is_match(protocol) {
        return false;
    }

    let parts: Vec<&str> = protocol.split(':').collect();
    if parts.len() != 2 {
        return false;
    }

    let fasting_hours: u32 = match parts[0].parse() {
        Ok(h) => h,
        Err(_) => return false,
    };
    let eating_hours: u32 = match parts[1].parse() {
        Ok(h) => h,
        Err(_) => return false,
    };

    // Total should be 24 hours and both should be reasonable values
    fasting_hours + eating_hours == 24 && fasting_hours >= 8 && eating_hours >= 4
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_email() {
        assert!(validate_email("test@example.com"));
        assert!(validate_email("user.name+tag@domain.co.uk"));
        assert!(!validate_email("invalid"));
        assert!(!validate_email("missing@domain"));
        assert!(!validate_email("@nodomain.com"));
    }

    #[test]
    fn test_validate_barcode() {
        // Valid EAN-13
        assert!(validate_barcode("5901234123457"));
        // Valid UPC-A
        assert!(validate_barcode("012345678905"));
        // Invalid - wrong length
        assert!(!validate_barcode("123456"));
        // Invalid - not all digits
        assert!(!validate_barcode("12345678901a"));
    }

    #[test]
    fn test_sanitize_string() {
        // Parentheses are allowed, quotes are removed
        assert_eq!(sanitize_string("<script>alert('xss')</script>Hello"), "alert(xss)Hello");
        assert_eq!(sanitize_string("Normal text!"), "Normal text!");
        assert_eq!(sanitize_string("  Trimmed  "), "Trimmed");
    }

    #[test]
    fn test_validate_date() {
        assert!(validate_date("2024-01-15"));
        assert!(validate_date("2024-02-29")); // Leap year
        assert!(!validate_date("2023-02-29")); // Not a leap year
        assert!(!validate_date("2024-13-01")); // Invalid month
        assert!(!validate_date("2024-01-32")); // Invalid day
        assert!(!validate_date("invalid"));
    }

    #[test]
    fn test_validate_uuid() {
        assert!(validate_uuid("550e8400-e29b-41d4-a716-446655440000"));
        assert!(!validate_uuid("not-a-uuid"));
        assert!(!validate_uuid("550e8400-e29b-41d4-a716-44665544000")); // Too short
    }

    #[test]
    fn test_validate_range() {
        assert!(validate_range(50.0, 0.0, 100.0));
        assert!(!validate_range(150.0, 0.0, 100.0));
        assert!(!validate_range(f64::NAN, 0.0, 100.0));
        assert!(!validate_range(f64::INFINITY, 0.0, 100.0));
    }

    #[test]
    fn test_validate_fasting_protocol() {
        assert!(validate_fasting_protocol("16:8"));
        assert!(validate_fasting_protocol("18:6"));
        assert!(validate_fasting_protocol("20:4"));
        assert!(!validate_fasting_protocol("16:9")); // Doesn't add to 24
        assert!(!validate_fasting_protocol("invalid"));
    }

    #[test]
    fn test_validate_meal_type() {
        assert!(validate_meal_type("breakfast"));
        assert!(validate_meal_type("Lunch"));
        assert!(validate_meal_type("DINNER"));
        assert!(!validate_meal_type("brunch"));
    }
}
