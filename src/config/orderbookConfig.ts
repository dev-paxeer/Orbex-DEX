// Orderbook grouping configuration (ported from builders-workshop-ui)

export interface GroupingOption {
  value: string;
  label: string;
}

export interface PairOrderbookConfig {
  groupingOptions: GroupingOption[];
  sigFigMapping: { [groupingValue: string]: number | null };
}

const pattern5Decimal: PairOrderbookConfig = {
  groupingOptions: [
    { value: '0.00001', label: '0.00001' },
    { value: '0.0001', label: '0.0001' },
    { value: '0.001', label: '0.001' },
    { value: '0.01', label: '0.01' },
  ],
  sigFigMapping: {
    '0.00001': 5,
    '0.0001': 4,
    '0.001': 3,
    '0.01': 2,
  },
};

const pattern4Decimal: PairOrderbookConfig = {
  groupingOptions: [
    { value: '0.0001', label: '0.0001' },
    { value: '0.001', label: '0.001' },
    { value: '0.01', label: '0.01' },
    { value: '0.1', label: '0.1' },
  ],
  sigFigMapping: {
    '0.0001': 5,
    '0.001': 4,
    '0.01': 3,
    '0.1': 2,
  },
};

const pattern3Decimal: PairOrderbookConfig = {
  groupingOptions: [
    { value: '0.001', label: '0.001' },
    { value: '0.01', label: '0.01' },
    { value: '0.1', label: '0.1' },
    { value: '1', label: '1' },
  ],
  sigFigMapping: {
    '0.001': 5,
    '0.01': 4,
    '0.1': 3,
    '1': 2,
  },
};

const pattern2Decimal: PairOrderbookConfig = {
  groupingOptions: [
    { value: '0.01', label: '0.01' },
    { value: '0.1', label: '0.1' },
    { value: '1', label: '1.0' },
    { value: '10', label: '10.0' },
  ],
  sigFigMapping: {
    '0.01': 5,
    '0.1': 4,
    '1': 3,
    '10': 2,
  },
};

const pattern1Decimal: PairOrderbookConfig = {
  groupingOptions: [
    { value: '0.1', label: '0.1' },
    { value: '1', label: '1' },
    { value: '10', label: '10' },
    { value: '100', label: '100' },
  ],
  sigFigMapping: {
    '0.1': 5,
    '1': 4,
    '10': 3,
    '100': 2,
  },
};

const patternInteger: PairOrderbookConfig = {
  groupingOptions: [
    { value: '1', label: '1' },
    { value: '10', label: '10' },
    { value: '100', label: '100' },
    { value: '1000', label: '1000' },
  ],
  sigFigMapping: {
    '1': 5,
    '10': 4,
    '100': 3,
    '1000': 2,
  },
};

export const orderbookConfig: { [currency: string]: PairOrderbookConfig; default: PairOrderbookConfig } = {
  default: pattern2Decimal,
  BTC: patternInteger,
  ETH: pattern1Decimal,
  BNB: pattern2Decimal,
  SOL: pattern2Decimal,
  AAVE: pattern2Decimal,
  AVAX: pattern3Decimal,
  LTC: pattern3Decimal,
  GMX: pattern3Decimal,
  LINK: pattern3Decimal,
  INJ: pattern3Decimal,
  APT: pattern4Decimal,
  SUI: pattern4Decimal,
  ZRO: pattern4Decimal,
  TIA: pattern4Decimal,
  OMNI: pattern4Decimal,
  NEAR: pattern4Decimal,
  XRP: pattern4Decimal,
  RUNE: pattern4Decimal,
  WLD: pattern4Decimal,
  ATOM: pattern4Decimal,
  ORDI: pattern4Decimal,
  DOGE: pattern5Decimal,
  ADA: pattern5Decimal,
  ARB: pattern5Decimal,
  OP: pattern5Decimal,
  EUR: pattern5Decimal,
  GBP: pattern5Decimal,
  MERL: pattern5Decimal,
  SAFE: pattern5Decimal,
  REZ: pattern5Decimal,
  ETHFI: pattern5Decimal,
  BOME: pattern5Decimal,
  DYM: pattern5Decimal,
  POPCAT: pattern5Decimal,
  MEW: pattern5Decimal,
  BEAM: pattern5Decimal,
  STRK: pattern5Decimal,
  TON: pattern5Decimal,
  NOT: pattern5Decimal,
  RLB: pattern5Decimal,
  ALICE: pattern5Decimal,
  APE: pattern5Decimal,
  AVAIL: pattern5Decimal,
  DEGEN: pattern5Decimal,
  RDNT: pattern5Decimal,
  PEPE: pattern5Decimal,
  EIGEN: pattern5Decimal,
  XAU: pattern5Decimal,
  XAG: pattern5Decimal,
  GMCI30: pattern5Decimal,
  GML2: pattern5Decimal,
  GMMEME: pattern5Decimal,
  QQQ: pattern5Decimal,
  SPY: pattern5Decimal,
};
