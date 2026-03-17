# 🗳️ Voting DApp — Solana + Anchor

A decentralized on-chain voting program built on Solana using the Anchor framework. Users can create polls, register candidates, and cast votes — all stored transparently on-chain.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Program Architecture](#program-architecture)
- [Account Structure](#account-structure)
- [Instructions](#instructions)
- [PDA Seeds](#pda-seeds)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Known Issues & Notes](#known-issues--notes)

---

## Overview

This program allows anyone to:

1. **Create a poll** with a description and a time window (`poll_start` / `poll_end`)
2. **Register candidates** under a poll, each identified by a numeric ID
3. **Vote** for a candidate by name within an active poll

All state is stored in PDAs (Program Derived Addresses) on-chain, making it fully verifiable and permissionless.

---

## Program Architecture

```
Wallet (initializer / voter)
        │
        ├── initialize_poll   ──▶  Poll PDA  [seeds: poll_id]
        │
        ├── initialize_candidate ──▶  Candidate PDA  [seeds: candidate_id, poll_id]
        │
        └── vote  ──▶  Candidate PDA  (increments vote_count)
                  └──▶  Poll PDA      (validates poll is active)
```

---

## Account Structure

### `Poll`

Stores metadata about a single poll.

| Field              | Type     | Description                          |
|--------------------|----------|--------------------------------------|
| `poll_id`          | `u64`    | Unique identifier for the poll       |
| `description`      | `String` | Poll question (max 200 chars)        |
| `poll_start`       | `u64`    | Unix timestamp when voting opens     |
| `poll_end`         | `u64`    | Unix timestamp when voting closes    |
| `candidate_amount` | `u64`    | Number of candidates registered      |

### `Candidate`

Stores a single candidate's data within a poll.

| Field            | Type     | Description                        |
|------------------|----------|------------------------------------|
| `candidate_name` | `String` | Name of the candidate (max 200 chars) |
| `vote_count`     | `u64`    | Total votes received               |

---

## Instructions

### `initialize_poll`

Creates a new poll account.

| Argument      | Type     | Description                   |
|---------------|----------|-------------------------------|
| `poll_id`     | `u64`    | Unique poll ID (used as seed) |
| `poll_start`  | `u64`    | Voting start timestamp        |
| `poll_end`    | `u64`    | Voting end timestamp          |
| `description` | `String` | Poll question                 |

**Accounts:** `initializer` (signer), `poll` (PDA, init), `system_program`

---

### `initialize_candidate`

Registers a candidate under an existing poll.

| Argument         | Type     | Description                          |
|------------------|----------|--------------------------------------|
| `candidate_id`   | `u64`    | Unique candidate ID (used as seed)   |
| `candidate_name` | `String` | Display name of the candidate        |
| `poll_id`        | `u64`    | The poll this candidate belongs to   |

**Accounts:** `initializer` (signer), `candidate` (PDA, init), `system_program`

---

### `vote`

Casts a vote for a candidate within a poll.

| Argument         | Type     | Description                              |
|------------------|----------|------------------------------------------|
| `candidate_name` | `String` | Name of the candidate to vote for (seed) |
| `poll_id`        | `u64`    | The poll to vote in                      |

**Accounts:** `voter` (signer), `poll` (PDA, validates active), `candidates` (PDA, mut)

---

## PDA Seeds

| Account     | Seeds                                          |
|-------------|------------------------------------------------|
| `Poll`      | `[poll_id (le bytes)]`                         |
| `Candidate` | `[candidate_id (le bytes), poll_id (le bytes)]`|

> ⚠️ **Seed mismatch note:** The `vote` instruction uses `candidate_name` as a seed, but `initialize_candidate` uses `candidate_id`. These must align for the PDAs to resolve to the same address. Consider standardizing to one approach (see [Known Issues](#known-issues--notes)).

---

## Project Structure

```
voting-dapp/
└── anchor/
    ├── programs/
    │   └── voting/
    │       └── src/
    │           └── lib.rs          # Program logic
    ├── tests/
    │   └── voting.ts               # Bankrun integration tests
    ├── target/
    │   ├── idl/
    │   │   └── voting.json         # Generated IDL
    │   └── types/
    │       └── voting.ts           # Generated TypeScript types
    └── Anchor.toml
```

---

## Prerequisites

| Tool          | Version     | Install                                                      |
|---------------|-------------|--------------------------------------------------------------|
| Rust          | stable      | [rustup.rs](https://rustup.rs)                               |
| Solana CLI    | 1.18+       | [docs.solana.com](https://docs.solana.com/cli/install-tool-suite) |
| Anchor CLI    | 0.30+       | `cargo install --git https://github.com/coral-xyz/anchor anchor-cli` |
| Node.js       | 18+         | [nodejs.org](https://nodejs.org)                             |
| Yarn / npm    | any         | bundled with Node                                            |

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd voting-dapp/anchor
```

### 2. Install JavaScript dependencies

```bash
yarn install
# or
npm install
```

### 3. Build the program

```bash
anchor build
```

This compiles the Rust program and regenerates `target/idl/voting.json` and `target/types/voting.ts`.

### 4. Sync the program ID

After the first build, copy the generated program ID into `lib.rs` and `Anchor.toml`:

```bash
anchor keys sync
```

### 5. Run tests

```bash
anchor test
```

---

## Running Tests

Tests use [Bankrun](https://github.com/kevinheavey/solana-bankrun) for fast, local simulation without needing a running validator.

```bash
anchor test
```

The test suite covers:

| Test                       | Description                                     |
|----------------------------|-------------------------------------------------|
| `Initialize Poll`          | Creates a poll and validates all fields         |
| `Initialize Candidate`     | Registers "Beef Pho" as candidate #1            |
| `Initialize second Candidate` | Registers "Chicken Pho" as candidate #2      |
| `Vote for Beef Pho`        | Casts one vote, expects `vote_count = 1`        |
| `Vote for Beef Pho again`  | Casts second vote, expects `vote_count = 2`     |
| `Vote for Chicken Pho`     | Votes for candidate #2, expects `vote_count = 1`|

---

## Known Issues & Notes

### Seed inconsistency between `initialize_candidate` and `vote`

`initialize_candidate` uses `[candidate_id, poll_id]` as PDA seeds, but `vote` uses `[candidate_name, poll_id]`. This means they derive **different PDAs** and the vote instruction cannot find the account created by initialize_candidate.

**Recommended fix** — standardize both to use `candidate_id`:

```rust
// In Vote struct
#[account(
    mut,
    seeds = [candidate_id.to_le_bytes().as_ref(), poll_id.to_le_bytes().as_ref()],
    bump
)]
pub candidates: Account<'info, Candidate>,
```

And update the `vote` function signature to accept `candidate_id: u64` instead of `candidate_name: String`.

### `candidate_amount` is never incremented

The `Poll` account has a `candidate_amount` field but `initialize_candidate` never increments it. Add this to the instruction if you want accurate tracking:

```rust
ctx.accounts.poll.candidate_amount += 1;
```

### No time validation in `vote`

The `vote` instruction has access to the `poll` account but does not currently validate that `Clock::get()?.unix_timestamp` falls between `poll_start` and `poll_end`. Add this guard to enforce the poll window.

---

## License

MIT