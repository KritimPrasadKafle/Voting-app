use anchor_lang::prelude::*;

#[cfg(test)]
mod tests;

declare_id!("5Fmz3ZSRyEQki4UpfARGigCTrK3sXfkJxSBxURnUjTxD");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, poll_start: u64, poll_end: u64, description: String) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.description = description;
        poll.candidate_amount = 0;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]  // ✅ Required to use poll_id in seeds
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
        init,
        payer = initializer,
        space = 8 + Poll::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,  // ✅ Required for init
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,           // ✅ comma, not semicolon
    #[max_len(200)]             // ✅ parentheses, not = 200
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}