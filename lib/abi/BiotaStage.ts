export const BIOTA_STAGE_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: '_dataHash', type: 'bytes32' }
    ],
    name: 'mintStage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  }
] as const;
