//! Quarks Core Library
//!
//! A Rust library for health data processing, security, and validation.
//! Compiles to WebAssembly for use in the web application.

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub mod crypto;
pub mod health;
pub mod nutrition;
pub mod validation;

// Re-exports for convenience
pub use crypto::{encrypt_data, decrypt_data, hash_data, generate_key};
pub use health::{HealthMetrics, calculate_bmi, calculate_bmr, calculate_tdee};
pub use nutrition::{NutritionData, MacroBreakdown, calculate_macro_percentages};
pub use validation::{validate_email, validate_barcode, sanitize_string, ValidationError};

/// Initialize the WASM module (sets up panic hook for better error messages)
#[cfg(feature = "wasm")]
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Version of the library
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_version() {
        assert!(!env!("CARGO_PKG_VERSION").is_empty());
    }
}
