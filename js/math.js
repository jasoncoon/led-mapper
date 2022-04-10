export function mapNumber(l, inMin, inMax, outMin, outMax) {
  if (inMax - inMin + outMin === 0) return 0;

  return ((l - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
