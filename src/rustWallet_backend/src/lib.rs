use ic_cdk_macros::{init, update, query};  
use candid::{CandidType, Principal};  // Corrected import for Principal and CandidType
use serde::{Serialize, Deserialize};  // Serde for serialization

use bincode;  
use ic_cdk::storage;  // Use ic_cdk's stable memory API

#[derive(CandidType, Serialize, Deserialize)]  // Ensure both traits are derived
struct Token {
    id: u32,
    owner: Principal,
    balance: u64,
}

// Initialize the token in stable memory
#[init]
fn init() {
    let token = Token {
        id: 1,
        owner: ic_cdk::caller(),  // Set the initial owner to the caller of the init function
        balance: 1000,  // Initial balance
    };

    // Serialize and write to stable memory
    let serialized = bincode::serialize(&token).unwrap();
    storage::stable_save((serialized,)).unwrap();
}

#[update]
fn update_token(new_balance: u64) {
    let mut token: Token = load_token();
    token.balance = new_balance;  // Update balance

    // Serialize and save the updated token to memory
    let serialized = bincode::serialize(&token).unwrap();
    storage::stable_save((serialized,)).unwrap();
}

// Query function to read token details
#[query]
fn read_token() -> Token {
    load_token()  // Return the loaded token
}

// Helper function to load token from stable memory
fn load_token() -> Token {
    let (buf,): (Vec<u8>,) = storage::stable_restore().unwrap();
    bincode::deserialize(&buf).unwrap()  // Deserialize and return the token
}
