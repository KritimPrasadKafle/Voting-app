import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Voting } from '../target/types/voting';
import { PublicKey } from '@solana/web3.js';

describe('Voting', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Voting as Program<Voting>;

  it('Initialize Poll', async () => {
    const pollId = new anchor.BN(1);

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    const tx = await program.methods
      .initializePoll(
        pollId,                        // poll_id: u64
        new anchor.BN(0),              // poll_start: u64
        new anchor.BN(1759508293),     // poll_end: u64
        'What is your favourite pho?'  // description: String
      )
      .accounts({
        initializer: anchor.getProvider().publicKey,
      })
      .rpc();

    console.log('Transaction signature:', tx);

    const pollAccount = await program.account.poll.fetch(pollAddress);
    console.log('Poll account:', pollAccount);

    expect(pollAccount.pollId.toNumber()).toBe(1);
    expect(pollAccount.pollStart.toNumber()).toBe(0);
    expect(pollAccount.pollEnd.toNumber()).toBe(1759508293);
    expect(pollAccount.description).toBe('What is your favourite pho?');
    expect(pollAccount.candidateAmount.toNumber()).toBe(0);
  });
});