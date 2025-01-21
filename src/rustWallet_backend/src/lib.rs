use candid::{CandidType, Principal};
use ic_cdk_macros::{query, update};
use serde::Deserialize;
use std::cell::RefCell;

// Define the structure for a user account
#[derive(CandidType, Deserialize, Clone)]
struct UserAccount {
    principal: Principal,
    balance: u64,
}

// StableVec for storing user accounts
thread_local! {
    static USER_ACCOUNTS: RefCell<Vec<UserAccount>> = RefCell::new(Vec::new());
}

// Query function to get all users
#[query]
fn get_all_users() -> Vec<UserAccount> {
    USER_ACCOUNTS.with(|accounts| accounts.borrow().clone())
}

// Function to add a user wallet
#[update]
fn add_user_wallet(initial_balance: u64) -> Principal {
    let user_principal = ic_cdk::caller();

    USER_ACCOUNTS.with(|accounts| {
        if accounts
            .borrow()
            .iter()
            .any(|user| user.principal == user_principal)
        {
            ic_cdk::trap("User already exists.");
        }

        accounts.borrow_mut().push(UserAccount {
            principal: user_principal,
            balance: initial_balance,
        });
    });

    ic_cdk::println!("New user added: {}", user_principal);

    user_principal
}

// Function to add balance to the user's account
#[update]
fn add_balance(amount: u64) -> Result<String, String> {
    let user_principal = ic_cdk::caller();

    USER_ACCOUNTS.with(|accounts| {
        let mut accounts = accounts.borrow_mut();
        if let Some(user) = accounts
            .iter_mut()
            .find(|user| user.principal == user_principal)
        {
            user.balance += amount;
            Ok(format!("Balance added. New balance: {}", user.balance))
        } else {
            Err(format!(
                "User not found. Caller principal: {}",
                user_principal
            ))
        }
    })
}

// Function to withdraw balance from the user's account
#[update]
fn withdraw_balance(amount: u64) {
    let user_principal = ic_cdk::caller();

    USER_ACCOUNTS.with(|accounts| {
        let mut accounts = accounts.borrow_mut();
        if let Some(user) = accounts
            .iter_mut()
            .find(|user| user.principal == user_principal)
        {
            if user.balance < amount {
                ic_cdk::trap("Insufficient balance.");
            }
            user.balance -= amount;
            ic_cdk::println!("Balance withdrawn. New balance: {}", user.balance);
        } else {
            ic_cdk::trap("User not found.");
        }
    });
}

// Function to send balance to another user
#[update]
fn send_balance(receiver: Principal, amount: u64) {
    let sender_principal = ic_cdk::caller();

    USER_ACCOUNTS.with(|accounts| {
        let mut accounts = accounts.borrow_mut();

        // Separate mutable borrow into two steps to avoid conflicts
        let sender_index = accounts
            .iter()
            .position(|user| user.principal == sender_principal)
            .expect("Sender not found.");

        let receiver_index = accounts
            .iter()
            .position(|user| user.principal == receiver)
            .expect("Receiver not found.");

        // Ensure sender has sufficient balance
        if accounts[sender_index].balance < amount {
            ic_cdk::trap("Insufficient balance.");
        }

        // Perform the transfer
        accounts[sender_index].balance -= amount;
        accounts[receiver_index].balance += amount;

        ic_cdk::println!(
            "Transfer successful. {} sent {} to {}.",
            sender_principal,
            amount,
            receiver
        );
    });
}

// Query function to get the balance of a specific user
#[query]
fn get_user_balance(principal: Principal) -> Option<u64> {
    USER_ACCOUNTS.with(|accounts| {
        accounts
            .borrow()
            .iter()
            .find(|user| user.principal == principal)
            .map(|user| user.balance)
    })
}

// Required: Export the Candid interface
ic_cdk::export_candid!();
