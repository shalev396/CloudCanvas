/**
 * Viewport presets used by the responsive test suite.
 * Mirrors the set used by the Elytra template (320 → 2560).
 */

export type Viewport = {
  name: string;
  width: number;
  height: number;
};

export const VIEWPORTS: Viewport[] = [
  { name: "mobile_small", width: 320, height: 568 },
  { name: "mobile_mid", width: 375, height: 812 },
  { name: "mobile_large", width: 414, height: 896 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "laptop_large", width: 1440, height: 900 },
  { name: "desktop", width: 2560, height: 1440 },
];
