export type ThemeMode = 'dark' | 'light' | 'system';
export type Appearance = {
  accent: 'blue' | 'violet' | 'teal' | 'rose' | 'amber' | 'custom';
  customAccent: string;
  textTone: 'neutral' | 'cool' | 'warm' | 'custom';
  customTextDark: string;
  customTextLight: string;
  glass: 'off' | 'subtle' | 'frosted';
  density: 'comfortable' | 'compact';
};
export const defaultAppearance: Appearance = {
  accent: 'blue', customAccent: '#679cff', textTone: 'neutral',
  customTextDark: '#edf0f5', customTextLight: '#202531', glass: 'subtle', density: 'comfortable',
};
export const accentPresets = {
  blue: ['#82aaff', '#295cba'], violet: ['#b59bff', '#7042b5'],
  teal: ['#62d3c5', '#08776d'], rose: ['#f49eb6', '#a6325b'], amber: ['#eac071', '#805b0b'],
} as const;
export const isHex = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
export function normalizeAppearance(value: unknown): Appearance {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<Appearance>;
  return {
    accent: ['blue', 'violet', 'teal', 'rose', 'amber', 'custom'].includes(input.accent ?? '') ? input.accent! : defaultAppearance.accent,
    customAccent: isHex(input.customAccent) ? input.customAccent : defaultAppearance.customAccent,
    textTone: ['neutral', 'cool', 'warm', 'custom'].includes(input.textTone ?? '') ? input.textTone! : defaultAppearance.textTone,
    customTextDark: isHex(input.customTextDark) ? input.customTextDark : defaultAppearance.customTextDark,
    customTextLight: isHex(input.customTextLight) ? input.customTextLight : defaultAppearance.customTextLight,
    glass: ['off', 'subtle', 'frosted'].includes(input.glass ?? '') ? input.glass! : 'subtle',
    density: input.density === 'compact' ? 'compact' : 'comfortable',
  };
}
const rgb = (hex: string) => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
const luminance = (hex: string) => rgb(hex).map(channel => {
  const value = channel / 255;
  return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
}
export function readableColor(color: string, background: string): string {
  if (contrast(color, background) >= 4.5) return color;
  const source = rgb(color);
  const destination = luminance(background) < .4 ? 255 : 0;
  for (let step = 1; step <= 20; step++) {
    const adjusted = '#' + source.map(channel => Math.round(channel + (destination - channel) * step / 20).toString(16).padStart(2, '0')).join('');
    if (contrast(adjusted, background) >= 4.5) return adjusted;
  }
  return destination ? '#ffffff' : '#000000';
}
export function appearanceColors(preferences: Appearance, theme: 'dark' | 'light') {
  const light = theme === 'light';
  const surface = light ? '#f8f9fc' : '#22252c';
  const rawAccent = preferences.accent === 'custom' ? preferences.customAccent : accentPresets[preferences.accent][light ? 1 : 0];
  const text = preferences.textTone === 'custom' ? (light ? preferences.customTextLight : preferences.customTextDark) :
    ({ neutral: ['#edf0f5', '#202531'], cool: ['#dce7f8', '#22334a'], warm: ['#f2eadb', '#3d3027'] } as const)[preferences.textTone][light ? 1 : 0];
  const accent = readableColor(rawAccent, surface);
  return { accent, text: readableColor(text, surface), onAccent: contrast(accent, '#111318') >= contrast(accent, '#ffffff') ? '#111318' : '#ffffff' };
}
