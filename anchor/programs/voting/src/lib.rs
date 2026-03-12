use anchor_lang::prelude::*;

#[cfg(test)]
mod tests;

declare_id!("2EYUjiH8FG5smvqEiy5sNaBuaLnsF5bZHewZEKmeZPL3");
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

    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_id: u64, candidate_name: String, poll_id: u64) -> Result<()> {

        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_name = candidate_name;
        candidate.vote_count = 0;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, candidate_name: String, poll_id: u64) -> Result<()>{
        let candidate = &mut ctx.accounts.candidates;
        candidate.vote_count += 1;
        Ok(())
    }


}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [candidate_name.as_bytes(), poll_id.to_le_bytes().as_ref()],
        bump
    )]

    pub candidates: Account<'info, Candidate>,
}

#[derive(Accounts)]
#[instruction(candidate_id: u64, poll_id: u64)]
pub struct InitializeCandidate<'info>{
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
        init,
        payer = initializer,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [candidate_id.to_le_bytes().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(200)]
    pub candidate_name: String,
    pub vote_count: u64,
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