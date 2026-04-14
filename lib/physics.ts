export interface SimParams {
  dia: number;
  sinker: number;
  vRel: number;
  depth: number;
}

export interface Point { x: number; y: number; }

export function calcLineCurve(params: SimParams): Point[] {
  const { dia, sinker, vRel, depth } = params;
  const N = 100;
  const segLen = depth / N;
  const rho = 1025, Cd = 1.2, correction = 0.85, g = 9.81;
  const lineDia = dia * 0.001;
  const dragPerSeg = 0.5 * rho * vRel ** 2 * Cd * (lineDia * segLen) * correction;
  const sinkerMass = sinker * 0.001;
  const sinkerWeight = sinkerMass * g - rho * (sinkerMass / 11340) * g;
  const segWeight = rho * Math.PI * (lineDia / 2) ** 2 * 0.12 * segLen * g * 0.3;

  const angles: number[] = [];
  let cumV = sinkerWeight, cumH = 0;
  for (let i = 0; i < N; i++) {
    cumH += dragPerSeg;
    cumV += segWeight;
    angles.push(Math.atan2(cumH, cumV));
  }

  const pts: Point[] = [];
  let x = 0, y = 0;
  for (let i = N - 1; i >= 0; i--) {
    x += Math.sin(angles[i]) * segLen;
    y += Math.cos(angles[i]) * segLen;
    pts.push({ x, y });
  }
  return pts;
}