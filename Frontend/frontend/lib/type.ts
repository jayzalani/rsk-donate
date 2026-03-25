export interface Milestone {
  amount: bigint;
  released: boolean;
  description: string;
}

export interface CampaignData {
  description: string;
  targetAmount: bigint;
  totalRaised: bigint;
  ngo: string;
  verifier: string;
  lastUpdateTimestamp: bigint;
  milestones: Milestone[];
  myContribution: bigint;
}