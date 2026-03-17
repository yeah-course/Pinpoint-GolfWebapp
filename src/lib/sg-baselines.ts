/**
 * PGA Tour baseline expected strokes data.
 * shot_baseline: distance (yards) → expected strokes by lie (tee, fairway, rough, sand)
 * putt_baseline: distance (feet) → expected putts from green
 *
 * Data sourced from broadie-style strokes gained baselines.
 * Lookup uses nearest-distance interpolation.
 */

type ShotLie = "tee" | "fairway" | "rough" | "sand" | "recovery";

interface ShotEntry {
  distance: number;
  tee: number | null;
  fairway: number;
  rough: number;
  sand: number;
}

interface PuttEntry {
  distance: number;
  green: number;
}

// Shot baseline: distance in yards. Tee values start at 100.
const SHOT_BASELINE: ShotEntry[] = [
  {distance:3,tee:null,fairway:2,rough:2.16,sand:2.25},{distance:4,tee:null,fairway:2.03,rough:2.19,sand:2.28},{distance:5,tee:null,fairway:2.05,rough:2.21,sand:2.3},{distance:6,tee:null,fairway:2.08,rough:2.24,sand:2.32},{distance:7,tee:null,fairway:2.1,rough:2.26,sand:2.35},{distance:8,tee:null,fairway:2.13,rough:2.29,sand:2.37},{distance:9,tee:null,fairway:2.15,rough:2.31,sand:2.4},{distance:10,tee:null,fairway:2.18,rough:2.34,sand:2.43},{distance:11,tee:null,fairway:2.2,rough:2.37,sand:2.44},{distance:12,tee:null,fairway:2.23,rough:2.4,sand:2.45},{distance:13,tee:null,fairway:2.25,rough:2.42,sand:2.46},{distance:14,tee:null,fairway:2.28,rough:2.45,sand:2.47},{distance:15,tee:null,fairway:2.3,rough:2.48,sand:2.48},{distance:16,tee:null,fairway:2.32,rough:2.5,sand:2.49},{distance:17,tee:null,fairway:2.34,rough:2.53,sand:2.5},{distance:18,tee:null,fairway:2.36,rough:2.55,sand:2.51},{distance:19,tee:null,fairway:2.38,rough:2.57,sand:2.52},{distance:20,tee:null,fairway:2.4,rough:2.59,sand:2.53},{distance:21,tee:null,fairway:2.42,rough:2.61,sand:2.54},{distance:22,tee:null,fairway:2.43,rough:2.62,sand:2.55},{distance:23,tee:null,fairway:2.45,rough:2.63,sand:2.56},{distance:24,tee:null,fairway:2.46,rough:2.64,sand:2.58},{distance:25,tee:null,fairway:2.47,rough:2.65,sand:2.59},{distance:26,tee:null,fairway:2.48,rough:2.66,sand:2.6},{distance:27,tee:null,fairway:2.49,rough:2.67,sand:2.61},{distance:28,tee:null,fairway:2.5,rough:2.68,sand:2.63},{distance:29,tee:null,fairway:2.51,rough:2.69,sand:2.64},{distance:30,tee:null,fairway:2.52,rough:2.7,sand:2.66},{distance:31,tee:null,fairway:2.53,rough:2.71,sand:2.67},{distance:32,tee:null,fairway:2.54,rough:2.71,sand:2.69},{distance:33,tee:null,fairway:2.55,rough:2.72,sand:2.71},{distance:34,tee:null,fairway:2.55,rough:2.73,sand:2.73},{distance:35,tee:null,fairway:2.56,rough:2.74,sand:2.75},{distance:36,tee:null,fairway:2.57,rough:2.75,sand:2.76},{distance:37,tee:null,fairway:2.58,rough:2.75,sand:2.8},{distance:38,tee:null,fairway:2.59,rough:2.76,sand:2.8},{distance:39,tee:null,fairway:2.59,rough:2.77,sand:2.81},{distance:40,tee:null,fairway:2.6,rough:2.78,sand:2.82},{distance:41,tee:null,fairway:2.61,rough:2.79,sand:2.83},{distance:42,tee:null,fairway:2.61,rough:2.8,sand:2.84},{distance:43,tee:null,fairway:2.62,rough:2.81,sand:2.85},{distance:44,tee:null,fairway:2.63,rough:2.82,sand:2.86},{distance:45,tee:null,fairway:2.63,rough:2.83,sand:2.87},{distance:46,tee:null,fairway:2.64,rough:2.84,sand:2.88},{distance:47,tee:null,fairway:2.64,rough:2.85,sand:2.89},{distance:48,tee:null,fairway:2.65,rough:2.85,sand:2.9},{distance:49,tee:null,fairway:2.65,rough:2.86,sand:2.91},{distance:50,tee:null,fairway:2.66,rough:2.87,sand:2.92},{distance:51,tee:null,fairway:2.67,rough:2.87,sand:2.94},{distance:52,tee:null,fairway:2.67,rough:2.88,sand:2.96},{distance:53,tee:null,fairway:2.67,rough:2.88,sand:2.99},{distance:54,tee:null,fairway:2.68,rough:2.88,sand:3.01},{distance:55,tee:null,fairway:2.68,rough:2.89,sand:3.04},{distance:56,tee:null,fairway:2.69,rough:2.89,sand:3.06},{distance:57,tee:null,fairway:2.69,rough:2.89,sand:3.09},{distance:58,tee:null,fairway:2.69,rough:2.9,sand:3.11},{distance:59,tee:null,fairway:2.7,rough:2.9,sand:3.13},{distance:60,tee:null,fairway:2.7,rough:2.91,sand:3.15},{distance:61,tee:null,fairway:2.7,rough:2.91,sand:3.17},{distance:62,tee:null,fairway:2.7,rough:2.91,sand:3.18},{distance:63,tee:null,fairway:2.71,rough:2.92,sand:3.19},{distance:64,tee:null,fairway:2.71,rough:2.92,sand:3.19},{distance:65,tee:null,fairway:2.71,rough:2.92,sand:3.2},{distance:66,tee:null,fairway:2.71,rough:2.92,sand:3.2},{distance:67,tee:null,fairway:2.71,rough:2.92,sand:3.2},{distance:68,tee:null,fairway:2.72,rough:2.93,sand:3.21},{distance:69,tee:null,fairway:2.72,rough:2.93,sand:3.21},{distance:70,tee:null,fairway:2.72,rough:2.93,sand:3.21},{distance:71,tee:null,fairway:2.72,rough:2.93,sand:3.21},{distance:72,tee:null,fairway:2.73,rough:2.94,sand:3.22},{distance:73,tee:null,fairway:2.73,rough:2.94,sand:3.22},{distance:74,tee:null,fairway:2.73,rough:2.94,sand:3.22},{distance:75,tee:null,fairway:2.73,rough:2.94,sand:3.23},{distance:76,tee:null,fairway:2.74,rough:2.95,sand:3.23},{distance:77,tee:null,fairway:2.74,rough:2.95,sand:3.23},{distance:78,tee:null,fairway:2.74,rough:2.95,sand:3.23},{distance:79,tee:null,fairway:2.75,rough:2.96,sand:3.24},{distance:80,tee:null,fairway:2.75,rough:2.96,sand:3.24},{distance:81,tee:null,fairway:2.75,rough:2.96,sand:3.24},{distance:82,tee:null,fairway:2.75,rough:2.97,sand:3.24},{distance:83,tee:null,fairway:2.76,rough:2.97,sand:3.24},{distance:84,tee:null,fairway:2.76,rough:2.97,sand:3.24},{distance:85,tee:null,fairway:2.76,rough:2.98,sand:3.24},{distance:86,tee:null,fairway:2.76,rough:2.98,sand:3.24},{distance:87,tee:null,fairway:2.76,rough:2.98,sand:3.24},{distance:88,tee:null,fairway:2.77,rough:2.99,sand:3.24},{distance:89,tee:null,fairway:2.77,rough:2.99,sand:3.24},{distance:90,tee:null,fairway:2.77,rough:2.99,sand:3.24},{distance:91,tee:null,fairway:2.77,rough:2.99,sand:3.24},{distance:92,tee:null,fairway:2.78,rough:3,sand:3.24},{distance:93,tee:null,fairway:2.78,rough:3,sand:3.24},{distance:94,tee:null,fairway:2.78,rough:3,sand:3.24},{distance:95,tee:null,fairway:2.78,rough:3.01,sand:3.24},{distance:96,tee:null,fairway:2.79,rough:3.01,sand:3.24},{distance:97,tee:null,fairway:2.79,rough:3.01,sand:3.23},{distance:98,tee:null,fairway:2.79,rough:3.01,sand:3.23},{distance:99,tee:null,fairway:2.8,rough:3.02,sand:3.23},
  {distance:100,tee:2.92,fairway:2.8,rough:3.02,sand:3.23},{distance:101,tee:2.92,fairway:2.8,rough:3.02,sand:3.23},{distance:102,tee:2.93,fairway:2.81,rough:3.03,sand:3.23},{distance:103,tee:2.93,fairway:2.81,rough:3.03,sand:3.23},{distance:104,tee:2.94,fairway:2.81,rough:3.03,sand:3.23},{distance:105,tee:2.94,fairway:2.81,rough:3.03,sand:3.22},{distance:106,tee:2.95,fairway:2.82,rough:3.04,sand:3.22},{distance:107,tee:2.95,fairway:2.82,rough:3.04,sand:3.22},{distance:108,tee:2.96,fairway:2.82,rough:3.04,sand:3.22},{distance:109,tee:2.96,fairway:2.82,rough:3.05,sand:3.22},{distance:110,tee:2.96,fairway:2.83,rough:3.05,sand:3.22},{distance:111,tee:2.97,fairway:2.83,rough:3.05,sand:3.22},{distance:112,tee:2.97,fairway:2.83,rough:3.06,sand:3.22},{distance:113,tee:2.98,fairway:2.83,rough:3.06,sand:3.22},{distance:114,tee:2.98,fairway:2.84,rough:3.06,sand:3.21},{distance:115,tee:2.98,fairway:2.84,rough:3.06,sand:3.21},{distance:116,tee:2.98,fairway:2.84,rough:3.07,sand:3.21},{distance:117,tee:2.99,fairway:2.84,rough:3.07,sand:3.21},{distance:118,tee:2.99,fairway:2.84,rough:3.07,sand:3.21},{distance:119,tee:2.99,fairway:2.85,rough:3.08,sand:3.21},{distance:120,tee:2.99,fairway:2.85,rough:3.08,sand:3.21},
  {distance:121,tee:2.99,fairway:2.85,rough:3.08,sand:3.21},{distance:122,tee:2.99,fairway:2.86,rough:3.09,sand:3.21},{distance:123,tee:2.99,fairway:2.86,rough:3.09,sand:3.21},{distance:124,tee:2.99,fairway:2.86,rough:3.09,sand:3.21},{distance:125,tee:2.99,fairway:2.86,rough:3.1,sand:3.21},{distance:126,tee:2.99,fairway:2.87,rough:3.1,sand:3.21},{distance:127,tee:2.99,fairway:2.87,rough:3.1,sand:3.21},{distance:128,tee:2.99,fairway:2.88,rough:3.11,sand:3.21},{distance:129,tee:2.99,fairway:2.88,rough:3.11,sand:3.21},{distance:130,tee:2.98,fairway:2.88,rough:3.11,sand:3.21},
  {distance:131,tee:2.98,fairway:2.88,rough:3.12,sand:3.21},{distance:132,tee:2.98,fairway:2.88,rough:3.12,sand:3.21},{distance:133,tee:2.98,fairway:2.89,rough:3.12,sand:3.21},{distance:134,tee:2.98,fairway:2.89,rough:3.13,sand:3.21},{distance:135,tee:2.98,fairway:2.89,rough:3.13,sand:3.21},{distance:136,tee:2.97,fairway:2.9,rough:3.13,sand:3.21},{distance:137,tee:2.97,fairway:2.9,rough:3.14,sand:3.22},{distance:138,tee:2.97,fairway:2.9,rough:3.14,sand:3.22},{distance:139,tee:2.97,fairway:2.91,rough:3.14,sand:3.22},{distance:140,tee:2.97,fairway:2.91,rough:3.15,sand:3.22},
  {distance:141,tee:2.97,fairway:2.91,rough:3.15,sand:3.22},{distance:142,tee:2.97,fairway:2.92,rough:3.16,sand:3.22},{distance:143,tee:2.97,fairway:2.92,rough:3.16,sand:3.23},{distance:144,tee:2.97,fairway:2.92,rough:3.17,sand:3.23},{distance:145,tee:2.97,fairway:2.93,rough:3.17,sand:3.23},{distance:146,tee:2.97,fairway:2.93,rough:3.17,sand:3.23},{distance:147,tee:2.97,fairway:2.93,rough:3.18,sand:3.23},{distance:148,tee:2.97,fairway:2.94,rough:3.18,sand:3.24},{distance:149,tee:2.97,fairway:2.94,rough:3.19,sand:3.24},{distance:150,tee:2.97,fairway:2.94,rough:3.19,sand:3.24},
  {distance:151,tee:2.97,fairway:2.95,rough:3.19,sand:3.25},{distance:152,tee:2.97,fairway:2.95,rough:3.2,sand:3.25},{distance:153,tee:2.98,fairway:2.95,rough:3.2,sand:3.25},{distance:154,tee:2.98,fairway:2.96,rough:3.21,sand:3.26},{distance:155,tee:2.98,fairway:2.96,rough:3.21,sand:3.26},{distance:156,tee:2.98,fairway:2.96,rough:3.21,sand:3.27},{distance:157,tee:2.98,fairway:2.97,rough:3.22,sand:3.27},{distance:158,tee:2.99,fairway:2.97,rough:3.22,sand:3.27},{distance:159,tee:2.99,fairway:2.98,rough:3.23,sand:3.28},{distance:160,tee:2.99,fairway:2.98,rough:3.23,sand:3.28},
  {distance:161,tee:2.99,fairway:2.98,rough:3.23,sand:3.28},{distance:162,tee:2.99,fairway:2.99,rough:3.24,sand:3.29},{distance:163,tee:3,fairway:2.99,rough:3.24,sand:3.29},{distance:164,tee:3,fairway:3,rough:3.24,sand:3.3},{distance:165,tee:3,fairway:3,rough:3.25,sand:3.3},{distance:166,tee:3.01,fairway:3.01,rough:3.25,sand:3.31},{distance:167,tee:3.01,fairway:3.01,rough:3.26,sand:3.32},{distance:168,tee:3.01,fairway:3.02,rough:3.26,sand:3.32},{distance:169,tee:3.01,fairway:3.02,rough:3.26,sand:3.33},{distance:170,tee:3.02,fairway:3.03,rough:3.27,sand:3.33},
  {distance:171,tee:3.02,fairway:3.03,rough:3.27,sand:3.34},{distance:172,tee:3.02,fairway:3.04,rough:3.28,sand:3.35},{distance:173,tee:3.03,fairway:3.04,rough:3.28,sand:3.35},{distance:174,tee:3.03,fairway:3.05,rough:3.28,sand:3.36},{distance:175,tee:3.03,fairway:3.05,rough:3.29,sand:3.37},{distance:176,tee:3.04,fairway:3.06,rough:3.29,sand:3.37},{distance:177,tee:3.04,fairway:3.06,rough:3.3,sand:3.38},{distance:178,tee:3.04,fairway:3.07,rough:3.3,sand:3.39},{distance:179,tee:3.05,fairway:3.07,rough:3.31,sand:3.39},{distance:180,tee:3.05,fairway:3.08,rough:3.31,sand:3.4},
  {distance:181,tee:3.06,fairway:3.08,rough:3.31,sand:3.41},{distance:182,tee:3.06,fairway:3.09,rough:3.32,sand:3.42},{distance:183,tee:3.06,fairway:3.1,rough:3.32,sand:3.42},{distance:184,tee:3.06,fairway:3.1,rough:3.33,sand:3.43},{distance:185,tee:3.07,fairway:3.11,rough:3.34,sand:3.44},{distance:186,tee:3.07,fairway:3.11,rough:3.34,sand:3.44},{distance:187,tee:3.08,fairway:3.12,rough:3.35,sand:3.45},{distance:188,tee:3.08,fairway:3.12,rough:3.35,sand:3.46},{distance:189,tee:3.08,fairway:3.13,rough:3.36,sand:3.46},{distance:190,tee:3.09,fairway:3.13,rough:3.36,sand:3.47},
  {distance:191,tee:3.09,fairway:3.14,rough:3.37,sand:3.48},{distance:192,tee:3.09,fairway:3.14,rough:3.37,sand:3.49},{distance:193,tee:3.1,fairway:3.15,rough:3.38,sand:3.5},{distance:194,tee:3.1,fairway:3.15,rough:3.39,sand:3.5},{distance:195,tee:3.1,fairway:3.16,rough:3.39,sand:3.51},{distance:196,tee:3.11,fairway:3.16,rough:3.4,sand:3.52},{distance:197,tee:3.11,fairway:3.17,rough:3.4,sand:3.53},{distance:198,tee:3.11,fairway:3.18,rough:3.41,sand:3.53},{distance:199,tee:3.12,fairway:3.18,rough:3.41,sand:3.54},{distance:200,tee:3.12,fairway:3.19,rough:3.42,sand:3.55},
  {distance:210,tee:3.15,fairway:3.25,rough:3.48,sand:3.63},{distance:220,tee:3.17,fairway:3.32,rough:3.53,sand:3.7},{distance:230,tee:3.2,fairway:3.38,rough:3.59,sand:3.77},{distance:240,tee:3.25,fairway:3.45,rough:3.64,sand:3.84},{distance:250,tee:3.34,fairway:3.52,rough:3.69,sand:3.89},{distance:260,tee:3.45,fairway:3.58,rough:3.74,sand:3.93},{distance:270,tee:3.56,fairway:3.64,rough:3.79,sand:3.97},{distance:280,tee:3.65,fairway:3.69,rough:3.83,sand:4},{distance:290,tee:3.69,fairway:3.74,rough:3.87,sand:4.02},{distance:300,tee:3.71,fairway:3.78,rough:3.9,sand:4.04},
  {distance:310,tee:3.75,fairway:3.81,rough:3.92,sand:4.07},{distance:320,tee:3.79,fairway:3.84,rough:3.95,sand:4.12},{distance:330,tee:3.83,fairway:3.86,rough:3.98,sand:4.19},{distance:340,tee:3.86,fairway:3.88,rough:4.02,sand:4.26},{distance:350,tee:3.89,fairway:3.91,rough:4.06,sand:4.34},{distance:360,tee:3.92,fairway:3.95,rough:4.11,sand:4.41},{distance:370,tee:3.94,fairway:3.99,rough:4.16,sand:4.48},{distance:380,tee:3.96,fairway:4.03,rough:4.21,sand:4.55},{distance:390,tee:3.98,fairway:4.07,rough:4.26,sand:4.63},{distance:400,tee:3.99,fairway:4.11,rough:4.3,sand:4.69},
  {distance:410,tee:4,fairway:4.13,rough:4.32,sand:4.72},{distance:420,tee:4.02,fairway:4.15,rough:4.34,sand:4.73},{distance:430,tee:4.05,fairway:4.17,rough:4.36,sand:4.75},{distance:440,tee:4.08,fairway:4.2,rough:4.39,sand:4.78},{distance:450,tee:4.12,fairway:4.24,rough:4.43,sand:4.82},{distance:460,tee:4.17,fairway:4.29,rough:4.48,sand:4.87},{distance:470,tee:4.22,fairway:4.34,rough:4.53,sand:4.92},{distance:480,tee:4.28,fairway:4.4,rough:4.59,sand:4.98},{distance:490,tee:4.34,fairway:4.46,rough:4.65,sand:5.04},{distance:500,tee:4.41,fairway:4.53,rough:4.72,sand:5.11},
  {distance:520,tee:4.54,fairway:4.66,rough:4.85,sand:5.24},{distance:540,tee:4.65,fairway:4.78,rough:4.97,sand:5.36},{distance:560,tee:4.74,fairway:4.86,rough:5.05,sand:5.44},{distance:580,tee:4.79,fairway:4.91,rough:5.1,sand:5.49},{distance:600,tee:4.82,fairway:4.94,rough:5.13,sand:5.52},
];

// Putt baseline: distance in feet
const PUTT_BASELINE: PuttEntry[] = [
  {distance:1,green:1},{distance:2,green:1.01},{distance:3,green:1.04},{distance:4,green:1.13},{distance:5,green:1.23},{distance:6,green:1.34},{distance:7,green:1.42},{distance:8,green:1.5},{distance:9,green:1.56},{distance:10,green:1.61},{distance:11,green:1.65},{distance:12,green:1.69},{distance:13,green:1.73},{distance:14,green:1.75},{distance:15,green:1.78},{distance:16,green:1.8},{distance:17,green:1.82},{distance:18,green:1.84},{distance:19,green:1.86},{distance:20,green:1.87},{distance:21,green:1.88},{distance:22,green:1.9},{distance:23,green:1.91},{distance:24,green:1.92},{distance:25,green:1.93},{distance:26,green:1.94},{distance:27,green:1.95},{distance:28,green:1.96},{distance:29,green:1.97},{distance:30,green:1.98},{distance:31,green:1.99},{distance:32,green:1.99},{distance:33,green:2},{distance:34,green:2.01},{distance:35,green:2.02},{distance:36,green:2.03},{distance:37,green:2.03},{distance:38,green:2.04},{distance:39,green:2.05},{distance:40,green:2.06},{distance:41,green:2.07},{distance:42,green:2.08},{distance:43,green:2.09},{distance:44,green:2.09},{distance:45,green:2.1},{distance:46,green:2.11},{distance:47,green:2.12},{distance:48,green:2.13},{distance:49,green:2.13},{distance:50,green:2.14},{distance:51,green:2.15},{distance:52,green:2.15},{distance:53,green:2.16},{distance:54,green:2.17},{distance:55,green:2.18},{distance:56,green:2.18},{distance:57,green:2.19},{distance:58,green:2.2},{distance:59,green:2.2},{distance:60,green:2.21},{distance:61,green:2.22},{distance:62,green:2.22},{distance:63,green:2.23},{distance:64,green:2.24},{distance:65,green:2.24},{distance:66,green:2.25},{distance:67,green:2.26},{distance:68,green:2.26},{distance:69,green:2.27},{distance:70,green:2.28},{distance:71,green:2.28},{distance:72,green:2.29},{distance:73,green:2.29},{distance:74,green:2.3},{distance:75,green:2.31},{distance:76,green:2.31},{distance:77,green:2.32},{distance:78,green:2.33},{distance:79,green:2.33},{distance:80,green:2.34},{distance:81,green:2.34},{distance:82,green:2.35},{distance:83,green:2.36},{distance:84,green:2.36},{distance:85,green:2.37},{distance:86,green:2.38},{distance:87,green:2.38},{distance:88,green:2.39},{distance:89,green:2.39},{distance:90,green:2.4},
];

/**
 * Lookup expected strokes from a given lie/distance.
 * Uses linear interpolation between nearest data points.
 */
export function lookupExpectedShot(distanceYards: number, lie: ShotLie): number {
  // Recovery treated as rough (worst non-sand lie)
  const effectiveLie = lie === "recovery" ? "rough" : lie;
  
  const data = SHOT_BASELINE;
  if (data.length === 0) return 3; // fallback
  
  // Clamp to range
  if (distanceYards <= data[0].distance) {
    const entry = data[0];
    if (effectiveLie === "tee" && entry.tee != null) return entry.tee;
    return entry[effectiveLie === "tee" ? "fairway" : effectiveLie];
  }
  if (distanceYards >= data[data.length - 1].distance) {
    const entry = data[data.length - 1];
    if (effectiveLie === "tee" && entry.tee != null) return entry.tee;
    return entry[effectiveLie === "tee" ? "fairway" : effectiveLie];
  }
  
  // Binary search for bracket
  let lo = 0, hi = data.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (data[mid].distance <= distanceYards) lo = mid;
    else hi = mid;
  }
  
  const loEntry = data[lo];
  const hiEntry = data[hi];
  
  const getVal = (entry: ShotEntry): number => {
    if (effectiveLie === "tee") {
      return entry.tee ?? entry.fairway; // fallback tee → fairway for short distances
    }
    return entry[effectiveLie];
  };
  
  if (loEntry.distance === hiEntry.distance) return getVal(loEntry);
  
  const t = (distanceYards - loEntry.distance) / (hiEntry.distance - loEntry.distance);
  return getVal(loEntry) + t * (getVal(hiEntry) - getVal(loEntry));
}

/**
 * Lookup expected putts from distance in feet.
 */
export function lookupExpectedPutts(distanceFeet: number): number {
  const data = PUTT_BASELINE;
  if (data.length === 0) return 2;
  
  if (distanceFeet <= 0) return 0;
  if (distanceFeet <= data[0].distance) return data[0].green;
  if (distanceFeet >= data[data.length - 1].distance) {
    // Extrapolate linearly beyond 90ft
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const slope = (last.green - prev.green) / (last.distance - prev.distance);
    return last.green + slope * (distanceFeet - last.distance);
  }
  
  // Linear interpolation
  let lo = 0, hi = data.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (data[mid].distance <= distanceFeet) lo = mid;
    else hi = mid;
  }
  
  const loE = data[lo], hiE = data[hi];
  if (loE.distance === hiE.distance) return loE.green;
  const t = (distanceFeet - loE.distance) / (hiE.distance - loE.distance);
  return loE.green + t * (hiE.green - loE.green);
}

export type { ShotLie };
