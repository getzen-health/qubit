//! Cryptography module for health data encryption
//!
//! Provides AES-256-GCM encryption for sensitive health data,
//! secure hashing, and key generation.

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;
use sha2::{Digest, Sha256};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use thiserror::Error;

/// Cryptographic errors
#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Invalid key: {0}")]
    InvalidKey(String),
    #[error("Invalid data: {0}")]
    InvalidData(String),
}

const NONCE_SIZE: usize = 12;
const KEY_SIZE: usize = 32;

/// Generate a new random encryption key (base64 encoded)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn generate_key() -> String {
    let mut key = [0u8; KEY_SIZE];
    OsRng.fill_bytes(&mut key);
    BASE64.encode(key)
}

/// Encrypt data using AES-256-GCM
///
/// # Arguments
/// * `plaintext` - The data to encrypt
/// * `key_base64` - Base64 encoded 256-bit key
///
/// # Returns
/// Base64 encoded ciphertext (nonce + encrypted data + tag)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn encrypt_data(plaintext: &str, key_base64: &str) -> Result<String, String> {
    encrypt_impl(plaintext, key_base64).map_err(|e| e.to_string())
}

fn encrypt_impl(plaintext: &str, key_base64: &str) -> Result<String, CryptoError> {
    // Decode key
    let key_bytes = BASE64
        .decode(key_base64)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;

    if key_bytes.len() != KEY_SIZE {
        return Err(CryptoError::InvalidKey(format!(
            "Key must be {} bytes, got {}",
            KEY_SIZE,
            key_bytes.len()
        )));
    }

    // Create cipher
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;

    // Generate random nonce
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    // Combine nonce + ciphertext
    let mut combined = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(combined))
}

/// Decrypt data encrypted with AES-256-GCM
///
/// # Arguments
/// * `encrypted_base64` - Base64 encoded ciphertext
/// * `key_base64` - Base64 encoded 256-bit key
///
/// # Returns
/// Decrypted plaintext
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn decrypt_data(encrypted_base64: &str, key_base64: &str) -> Result<String, String> {
    decrypt_impl(encrypted_base64, key_base64).map_err(|e| e.to_string())
}

fn decrypt_impl(encrypted_base64: &str, key_base64: &str) -> Result<String, CryptoError> {
    // Decode key
    let key_bytes = BASE64
        .decode(key_base64)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;

    if key_bytes.len() != KEY_SIZE {
        return Err(CryptoError::InvalidKey(format!(
            "Key must be {} bytes",
            KEY_SIZE
        )));
    }

    // Decode encrypted data
    let combined = BASE64
        .decode(encrypted_base64)
        .map_err(|e| CryptoError::InvalidData(e.to_string()))?;

    if combined.len() < NONCE_SIZE {
        return Err(CryptoError::InvalidData("Data too short".to_string()));
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Create cipher and decrypt
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| CryptoError::InvalidKey(e.to_string()))?;

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

    String::from_utf8(plaintext).map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
}

/// Hash data using SHA-256
///
/// # Arguments
/// * `data` - Data to hash
/// * `salt` - Optional salt to add
///
/// # Returns
/// Hex-encoded hash
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn hash_data(data: &str, salt: Option<String>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    if let Some(s) = salt {
        hasher.update(s.as_bytes());
    }
    hex::encode(hasher.finalize())
}

/// Mask sensitive string for display
/// Example: "John Smith" -> "J*** S****"
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn mask_string(input: &str) -> String {
    input
        .split_whitespace()
        .map(|word| {
            if word.len() <= 1 {
                "*".to_string()
            } else {
                let first = word.chars().next().unwrap();
                format!("{}{}", first, "*".repeat(word.len() - 1))
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Mask email for display
/// Example: "john@example.com" -> "j***@e******.com"
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn mask_email(email: &str) -> String {
    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return "***@***.***".to_string();
    }

    let local = parts[0];
    let domain_parts: Vec<&str> = parts[1].split('.').collect();

    let masked_local = if local.is_empty() {
        "***".to_string()
    } else {
        let first = local.chars().next().unwrap();
        format!("{}{}", first, "*".repeat(local.len().min(5)))
    };

    let masked_domain = if domain_parts.is_empty() || domain_parts[0].is_empty() {
        "***".to_string()
    } else {
        let first = domain_parts[0].chars().next().unwrap();
        format!("{}{}", first, "*".repeat(domain_parts[0].len().min(5)))
    };

    let tld = if domain_parts.len() > 1 {
        domain_parts[1..].join(".")
    } else {
        "***".to_string()
    };

    format!("{}@{}.{}", masked_local, masked_domain, tld)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let key = generate_key();
        let plaintext = "Hello, World!";

        let encrypted = encrypt_data(plaintext, &key).unwrap();
        let decrypted = decrypt_data(&encrypted, &key).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_hash() {
        let hash1 = hash_data("test", None);
        let hash2 = hash_data("test", Some("salt".to_string()));

        assert_ne!(hash1, hash2);
        assert_eq!(hash1.len(), 64); // SHA-256 produces 64 hex chars
    }

    #[test]
    fn test_mask_string() {
        assert_eq!(mask_string("John Smith"), "J*** S****");
        assert_eq!(mask_string("A"), "*");
    }

    #[test]
    fn test_mask_email() {
        assert_eq!(mask_email("john@example.com"), "j****@e*****.com");
    }
}
