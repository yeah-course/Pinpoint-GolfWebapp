/**
 * Strokes Gained calculation engine.
 *
 * Computes SG at hole level using baseline expected strokes.
 * Categories:
 *   - SG Off the Tee (par 4+ only)
 *   - SG Approach
 *   - SG Around the Green (missed GIR only)
 *   - SG Putting
 *
 * Formula per shot: SG = expected_before - (1 + expected_after)
 * For putting: SG = expected_putts(distance) - actual_putts
 */

import { lookupExpectedShot, lookupExpectedPutts, type ShotLie } from "./sg-baselines";
import type { Tables } from "@/integrations/supabase/types";

type RoundHole = Tables<"round_holes">;

export interface HoleSG {
  holeNumber: number;
  sgTotal: number;
  sgTee: number | null;       // null for par 3s
  sgApproach: number | null;
  sgAroundGreen: number | null;
  sgPutting: number | null;
}

export interface RoundSG {
  total: number;
  tee: number;
  approach: number;
  aroundGreen: number;
  putting: number;
  holes: HoleSG[];
}

/**
 * Compute SG for a single hole.
 *
 * Required data:
 * - score, putts, par, yardage (always)
 * - tee_shot_result (par 4+ for SG tee)
 * - approach_distance, approach_start_lie (for SG approach)
 * - putt_distance_feet (for SG putting)
 */
export function computeHoleSG(hole: RoundHole): HoleSG | null {
  const { score, putts, par, yardage, hole_number } = hole;

  if (score == null || putts == null) return null;

  // Approach data — par 3s auto-use hole yardage from tee
  const approachDistance: number | null = par === 3 ? yardage : ((hole as any).approach_distance as number | null);
  const approachStartLie: ShotLie | null = par === 3 ? "tee" : ((hole as any).approach_start_lie as ShotLie | null);
  const puttDistanceFeet = (hole as any).putt_distance_feet as number | null;

  const result: HoleSG = {
    holeNumber: hole_number,
    sgTotal: 0,
    sgTee: null,
    sgApproach: null,
    sgAroundGreen: null,
    sgPutting: null,
  };

  // --- SG Putting ---
  if (puttDistanceFeet != null && puttDistanceFeet > 0) {
    const expectedPutts = lookupExpectedPutts(puttDistanceFeet);
    result.sgPutting = expectedPutts - putts;
  }

  // --- SG Tee (par 4+ only) ---
  const teeShotResult = hole.tee_shot_result as ShotLie | null;
  if (par >= 4 && teeShotResult && approachDistance != null && approachDistance > 0) {
    const expectedFromTee = lookupExpectedShot(yardage, "tee");
    const expectedAfterTee = lookupExpectedShot(approachDistance, teeShotResult);
    result.sgTee = expectedFromTee - 1 - expectedAfterTee;
  }

  // --- SG Approach ---
  if (approachDistance != null && approachDistance > 0 && approachStartLie) {
    const expectedFromApproach = lookupExpectedShot(approachDistance, approachStartLie);

    if (hole.gir && puttDistanceFeet != null && puttDistanceFeet > 0) {
      // Hit green: approach → green in 1 shot
      const expectedAfterApproach = lookupExpectedPutts(puttDistanceFeet);
      result.sgApproach = expectedFromApproach - 1 - expectedAfterApproach;
    } else if (!hole.gir) {
      // Missed green: approach + around-green shots before putting
      // Total pre-putt strokes after tee = score - putts - (tee shots: 1 for par4+, 0 for par3)
      const teeShots = par >= 4 ? 1 : 0;
      const prePuttShotsAfterTee = score - putts - teeShots;
      // Approach used 1 of those, rest are around-green
      const aroundGreenShots = Math.max(0, prePuttShotsAfterTee - 1);

      if (puttDistanceFeet != null && puttDistanceFeet > 0) {
        // We know where putting started
        const expectedOnGreen = lookupExpectedPutts(puttDistanceFeet);

        // SG approach+ATG combined = expected(approach) - prePuttShotsAfterTee - expected_putts
        const sgApproachAndATG = expectedFromApproach - prePuttShotsAfterTee - expectedOnGreen;

        if (aroundGreenShots > 0) {
          // Split: attribute 1 shot of approach, rest to ATG
          // SG Approach ≈ expected(approach_dist, lie) - 1 - expected(~30yds, rough) [assume miss lands ~30yds]
          // This is approximate since we don't track where the approach ended
          const assumedMissDistance = 20; // yards, typical miss
          const expectedAfterMiss = lookupExpectedShot(assumedMissDistance, "rough");
          result.sgApproach = expectedFromApproach - 1 - expectedAfterMiss;
          result.sgAroundGreen = sgApproachAndATG - result.sgApproach;
        } else {
          result.sgApproach = sgApproachAndATG;
        }
      } else {
        // No putt distance, can't split precisely. Use total SG residual approach.
        result.sgApproach = expectedFromApproach - prePuttShotsAfterTee;
      }
    }
  }

  // Total SG = expected(yardage, tee or fairway) - score
  const startLie: ShotLie = par >= 4 ? "tee" : "fairway"; // par 3: usually from fairway-like
  result.sgTotal = lookupExpectedShot(yardage, startLie) - score;

  return result;
}

/**
 * Compute aggregated SG for a full round.
 */
export function computeRoundSG(holes: RoundHole[]): RoundSG {
  const sgHoles: HoleSG[] = [];
  let total = 0, tee = 0, approach = 0, aroundGreen = 0, putting = 0;

  for (const hole of holes) {
    const sg = computeHoleSG(hole);
    if (!sg) continue;

    sgHoles.push(sg);
    total += sg.sgTotal;
    if (sg.sgTee != null) tee += sg.sgTee;
    if (sg.sgApproach != null) approach += sg.sgApproach;
    if (sg.sgAroundGreen != null) aroundGreen += sg.sgAroundGreen;
    if (sg.sgPutting != null) putting += sg.sgPutting;
  }

  return { total, tee, approach, aroundGreen, putting, holes: sgHoles };
}
