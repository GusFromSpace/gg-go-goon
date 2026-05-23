// GG · src/components/ScreenBlush.tsx
//
// Anime-style screen blush overlay. Two soft-pink radial blooms on the screen
// edges, raked with hand-drawn-feeling hatching lines. Designed to flash on
// the Done screen when the user taps DONE before THRESHOLD_SEC elapsed.
//
// Usage:
//
//   import { ScreenBlush } from '@/components/ScreenBlush';
//
//   <View style={{ flex: 1, position: 'relative' }}>
//     {wasQuickDone && <ScreenBlush variant="flash" intensity="spicy" />}
//     {/* …your screen content… */}
//   </View>
//
// Renders at position: 'absolute', inset: 0 — drop it inside any screen View.
// pointerEvents="none" is baked in. Animation auto-runs on mount.
//
// Single dependency: react-native-svg (already in your deps).

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Defs, G, LinearGradient, Mask, Path, RadialGradient, Rect, Stop,
} from 'react-native-svg';

export type BlushIntensity = 'soft' | 'medium' | 'spicy';
export type BlushVariant   = 'pulse' | 'flash';

export interface ScreenBlushProps {
  /** Toggle the overlay. Fades in/out over 280ms. Default true. */
  active?: boolean;
  /** Bloom alpha + hatch density/weight. Default 'medium'. */
  intensity?: BlushIntensity;
  /**
   * 'flash' = three quick pulses then settles (good for the first reveal on the
   *           Done screen, fires once).
   * 'pulse' = steady gentle pulse (good for screens that hold the blush state).
   * Default 'pulse'.
   */
  variant?: BlushVariant;
}

const BLOOM = '#ed5070';   // soft outer glow
const HATCH = '#e0395e';   // deeper line color

const ALPHA      = { soft: 0.55, medium: 0.80, spicy: 1.0  } as const;
const LINE_ALPHA = { soft: 0.55, medium: 0.78, spicy: 0.95 } as const;
const LINE_SCALE = { soft: 0.7,  medium: 1.0,  spicy: 1.25 } as const;

// Hand-authored hatching, intentionally uneven. ViewBox 340×220.
// Lines lean ~18° clockwise from vertical (top-right). Right cheek mirrors via
// a scaleX(-1) transform on the wrapping <View>.
const HATCH_PATHS: ReadonlyArray<readonly [string, number]> = [
  ['M 50 175 Q 64 110 90 25',    2.6],
  ['M 78 184 Q 92 118 116 38',   2.4],
  ['M 104 178 Q 118 110 142 32', 2.8],
  ['M 132 188 Q 144 122 168 42', 2.2],
  ['M 158 180 Q 170 118 192 40', 2.6],
  ['M 184 184 Q 196 124 218 46', 2.4],
  ['M 212 170 Q 222 110 246 38', 2.8],
  ['M 238 158 Q 248 104 268 38', 2.2],
  ['M 262 144 Q 270 100 286 44', 2.4],
  // a few short outliers above the main rake
  ['M 108 56 Q 114 38 122 18',   1.8],
  ['M 156 50 Q 162 30 168 12',   1.8],
  ['M 230 60 Q 234 42 240 22',   1.8],
  // a short fragment trailing below the cluster
  ['M 90 192 Q 94 200 100 208',  1.6],
];

export function ScreenBlush({
  active = true,
  intensity = 'medium',
  variant = 'pulse',
}: ScreenBlushProps) {
  const fadeAnim  = useRef(new Animated.Value(active ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // fade with the `active` prop
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: active ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, fadeAnim]);

  // motion
  useEffect(() => {
    scaleAnim.stopAnimation();
    opacityAnim.stopAnimation();

    if (variant === 'flash') {
      // 3 quick pulses then settle — fires once on mount
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 170, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.96, duration: 250, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.10, duration: 250, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.98, duration: 340, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.04, duration: 280, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.00, duration: 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 1,    duration: 170, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.55, duration: 250, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1,    duration: 250, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.65, duration: 340, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.92, duration: 280, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.82, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      // gentle infinite pulse
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.05, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.96, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 1,    duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.72, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [variant, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <Animated.View
        style={[
          styles.cheek,
          styles.left,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Cheek intensity={intensity} />
      </Animated.View>
      <Animated.View
        style={[
          styles.cheek,
          styles.right,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }, { scaleX: -1 }] },
        ]}
      >
        <Cheek intensity={intensity} />
      </Animated.View>
    </Animated.View>
  );
}

// ── One cheek — bloom + hatching, masked on the inner edge ─────────────────
function Cheek({ intensity }: { intensity: BlushIntensity }) {
  const alpha     = ALPHA[intensity];
  const lineAlpha = LINE_ALPHA[intensity];
  const lineScale = LINE_SCALE[intensity];

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 340 220"
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        {/* off-center radial — center pushed toward the outer (left) edge */}
        <RadialGradient
          id="bloom"
          cx="34%" cy="50%" rx="70%" ry="80%" fx="34%" fy="50%"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0%"  stopColor={BLOOM} stopOpacity={alpha} />
          <Stop offset="30%" stopColor={BLOOM} stopOpacity={alpha * 0.6} />
          <Stop offset="55%" stopColor={BLOOM} stopOpacity={alpha * 0.18} />
          <Stop offset="72%" stopColor={BLOOM} stopOpacity={0} />
        </RadialGradient>

        {/* horizontal fade — clips the inner edge so the bloom can't reach
            the midline when two ScreenBlushes meet from each screen edge */}
        <LinearGradient id="fade" x1="0" y1="0.5" x2="1" y2="0.5">
          <Stop offset="0%"   stopColor="white" stopOpacity={1} />
          <Stop offset="60%"  stopColor="white" stopOpacity={1} />
          <Stop offset="100%" stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <Mask id="fadeMask" maskUnits="objectBoundingBox">
          <Rect x="0" y="0" width="340" height="220" fill="url(#fade)" />
        </Mask>
      </Defs>

      <G mask="url(#fadeMask)">
        <Rect x="0" y="0" width="340" height="220" fill="url(#bloom)" />
        <G stroke={HATCH} strokeLinecap="round" fill="none" opacity={lineAlpha}>
          {HATCH_PATHS.map(([d, w], i) => (
            <Path key={i} d={d} strokeWidth={w * lineScale} />
          ))}
        </G>
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  cheek: {
    position: 'absolute',
    top:    '34%',
    width:  '56%',
    height: '40%',
  },
  left:  { left:  '-10%' },
  right: { right: '-10%' },
});

export default ScreenBlush;
