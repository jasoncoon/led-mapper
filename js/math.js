export function mapNumber(l, inMin, inMax, outMin, outMax) {
  return ((l - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
