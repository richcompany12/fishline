export type LineType = 'jp' | 'us' | 'cn';

export const PE_DATA: Record<LineType, Record<string, number>> = {
  jp: {
    '0.4호':0.104,'0.6호':0.128,'0.8호':0.148,'1호':0.165,
    '1.2호':0.185,'1.5호':0.205,'2호':0.235,'2.5호':0.260,
    '3호':0.285,'4호':0.330,'5호':0.370,'6호':0.405,'7호':0.435
  },
  us: {
    '0.4호':0.114,'0.6호':0.140,'0.8호':0.163,'1호':0.181,
    '1.2호':0.203,'1.5호':0.225,'2호':0.259,'2.5호':0.285,
    '3호':0.315,'4호':0.363,'5호':0.405,'6호':0.447,'7호':0.480
  },
  cn: {}
};

Object.keys(PE_DATA.jp).forEach(k => {
  PE_DATA.cn[k] = +(PE_DATA.jp[k as keyof typeof PE_DATA.jp] * 1.2).toFixed(3);
});

export const SINKERS = [50,80,100,120,150,180,200,250,300,350,400,450,500];

export const SPECIES: { name: string; icon: string }[] = [];