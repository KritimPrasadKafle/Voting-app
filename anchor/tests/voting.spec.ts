import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Voting } from '../target/types/voting';
import { PublicKey } from '@solana/web3.js';
import { BankrunProvider, startAnchor } from 'anchor-bankrun';

// ✅ Import IDL from JSON, not from the types file
const IDL = require('../target/idl/voting.json');

describe('Voting', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Voting as Program<Voting>;

  let context;
  let provider: BankrunProvider;
  let votingProgram: Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "voting", programId: program.programId }],
      []
    );
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(IDL, provider);
  });

  it('Initialize Poll', async () => {
    const pollId = new anchor.BN(1);

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, 'le', 8)],
      votingProgram.programId
    );

    await votingProgram.methods
      .initializePoll(
        pollId,
        new anchor.BN(0),
        new anchor.BN(1759508293),
        'What is your favourite pho?'
      )
      .accounts({ initializer: provider.wallet.publicKey })
      .rpc();

    const pollAccount = await votingProgram.account.poll.fetch(pollAddress);

    expect(pollAccount.pollId.toNumber()).toBe(1);
    expect(pollAccount.pollStart.toNumber()).toBe(0);
    expect(pollAccount.pollEnd.toNumber()).toBe(1759508293);
    expect(pollAccount.description).toBe('What is your favourite pho?');
    expect(pollAccount.candidateAmount.toNumber()).toBe(0);
  });

  it('Initialize Candidate', async () => {
    const pollId = new anchor.BN(1);
    const candidateId = new anchor.BN(1);
    const candidateName = 'Beef Pho';

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, 'le', 8)],
      votingProgram.programId
    );

    const [candidateAddress] = PublicKey.findProgramAddressSync(
      [
        candidateId.toArrayLike(Buffer, 'le', 8),
        pollId.toArrayLike(Buffer, 'le', 8),
      ],
      votingProgram.programId
    );

    await votingProgram.methods
  .initializeCandidate(candidateId, candidateName, pollId)
  .accounts({
    initializer: provider.wallet.publicKey,
    // ✅ Remove candidate — Anchor derives it automatically from candidateId + pollId args
  })
  .rpc();

    const candidateAccount = await votingProgram.account.candidate.fetch(candidateAddress);

    expect(candidateAccount.candidateName).toBe(candidateName);
    expect(candidateAccount.voteCount.toNumber()).toBe(0);
  });

  it('Initialize second Candidate', async () => {
    const pollId = new anchor.BN(1);
    const candidateId = new anchor.BN(2);
    const candidateName = 'Chicken Pho';

    const [candidateAddress] = PublicKey.findProgramAddressSync(
      [
        candidateId.toArrayLike(Buffer, 'le', 8),
        pollId.toArrayLike(Buffer, 'le', 8),
      ],
      votingProgram.programId
    );

    await votingProgram.methods
  .initializeCandidate(candidateId, candidateName, pollId)
  .accounts({
    initializer: provider.wallet.publicKey,
  })
  .rpc();

    const candidateAccount = await votingProgram.account.candidate.fetch(candidateAddress);

    expect(candidateAccount.candidateName).toBe(candidateName);
    expect(candidateAccount.voteCount.toNumber()).toBe(0);
  });
});