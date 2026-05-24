// FlappyGG — hidden easter egg. triggers after 3 rapid start/stop cycles.
// tap to flap. avoid the pipes. GG.

import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const BEST_KEY = 'gg:flappy_best';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  bg:       '#1a0d0a',
  bg2:      '#251612',
  bg3:      '#3a2419',
  cream:    '#f6efe4',
  peach:    '#ff9a78',
  peachDeep:'#e86a4a',
  muted:    '#9a8270',
  faint:    '#5a4a3c',
};

const GRAVITY      = 0.5;
const FLAP_FORCE   = -9;
const PIPE_SPEED   = 3.2;
const PIPE_WIDTH   = 52;
const PIPE_GAP     = 160;
const PIPE_INTERVAL= 240; // px between pipes
const BIRD_SIZE    = 36;
const BIRD_X       = W * 0.22;

interface Pipe {
  x: number;
  gapY: number; // center of gap
  scored: boolean;
}

type GameState = 'waiting' | 'playing' | 'dead';

export function FlappyGG({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [birdY, setBirdY] = useState(H * 0.45);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const bestRef = useRef(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);

  const birdYRef    = useRef(H * 0.45);
  const velRef      = useRef(0);
  const pipesRef    = useRef<Pipe[]>([]);
  const scoreRef    = useRef(0);
  const frameRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStateRef= useRef<GameState>('waiting');

  // load persisted best on mount
  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then(val => {
      if (val) { const n = parseInt(val, 10); bestRef.current = n; setBest(n); }
    });
  }, []);

  const reset = useCallback(() => {
    birdYRef.current = H * 0.45;
    velRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    gameStateRef.current = 'waiting';
    setBirdY(H * 0.45);
    setPipes([]);
    setScore(0);
    setGameState('waiting');
  }, []);

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  function spawnPipe(lastX: number): Pipe {
    const gapY = H * 0.25 + Math.random() * H * 0.45;
    return { x: lastX + PIPE_INTERVAL, gapY, scored: false };
  }

  function startGame() {
    if (gameStateRef.current === 'playing') return;
    gameStateRef.current = 'playing';
    setGameState('playing');
    velRef.current = FLAP_FORCE;

    // seed pipes off-screen
    const initialPipes: Pipe[] = [];
    for (let i = 0; i < 4; i++) {
      const lastX = initialPipes.length ? initialPipes[initialPipes.length - 1].x : W + 60;
      initialPipes.push(spawnPipe(lastX));
    }
    pipesRef.current = initialPipes;
    setPipes([...initialPipes]);

    frameRef.current = setInterval(tick, 16);
  }

  function flap() {
    if (gameStateRef.current === 'dead') { reset(); return; }
    if (gameStateRef.current === 'waiting') { startGame(); return; }
    velRef.current = FLAP_FORCE;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function tick() {
    if (gameStateRef.current !== 'playing') return;

    // physics
    velRef.current += GRAVITY;
    birdYRef.current += velRef.current;

    // ceiling / floor
    if (birdYRef.current < 0 || birdYRef.current > H - BIRD_SIZE) {
      die(); return;
    }

    // move pipes
    const updated = pipesRef.current.map(p => ({ ...p, x: p.x - PIPE_SPEED }));

    // score + collision
    const birdLeft  = BIRD_X;
    const birdRight = BIRD_X + BIRD_SIZE;
    const birdTop   = birdYRef.current;
    const birdBot   = birdYRef.current + BIRD_SIZE;

    for (const pipe of updated) {
      const pRight = pipe.x + PIPE_WIDTH;
      const pLeft  = pipe.x;
      const topBot = pipe.gapY - PIPE_GAP / 2;
      const botTop = pipe.gapY + PIPE_GAP / 2;

      // score when bird passes pipe center
      if (!pipe.scored && pRight < birdLeft) {
        pipe.scored = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        Haptics.selectionAsync();
      }

      // collision (only if horizontally overlapping)
      if (birdRight > pLeft + 4 && birdLeft < pRight - 4) {
        if (birdTop < topBot || birdBot > botTop) {
          die(); return;
        }
      }
    }

    // recycle pipes that went off-screen
    const visible = updated.filter(p => p.x + PIPE_WIDTH > -10);
    while (visible.length < 4) {
      const lastX = visible.length ? visible[visible.length - 1].x : W;
      visible.push(spawnPipe(lastX));
    }

    pipesRef.current = visible;
    setBirdY(birdYRef.current);
    setPipes([...visible]);
  }

  function die() {
    if (frameRef.current) clearInterval(frameRef.current);
    gameStateRef.current = 'dead';
    setGameState('dead');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (scoreRef.current > bestRef.current) {
      bestRef.current = scoreRef.current;
      setBest(scoreRef.current);
      AsyncStorage.setItem(BEST_KEY, String(scoreRef.current));
    }
  }

  useEffect(() => {
    return () => { if (frameRef.current) clearInterval(frameRef.current); };
  }, []);

  const birdRotation = Math.min(Math.max(velRef.current * 3, -25), 60);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <TouchableOpacity style={s.screen} activeOpacity={1} onPress={flap}>

        {/* pipes */}
        {pipes.map((pipe, i) => (
          <View key={i}>
            {/* top pipe */}
            <View style={[s.pipe, {
              left: pipe.x,
              top: 0,
              height: pipe.gapY - PIPE_GAP / 2,
            }]} />
            {/* bottom pipe */}
            <View style={[s.pipe, {
              left: pipe.x,
              top: pipe.gapY + PIPE_GAP / 2,
              bottom: 0,
            }]} />
          </View>
        ))}

        {/* bird */}
        <View style={[s.bird, {
          top: birdY,
          left: BIRD_X,
          transform: [{ rotate: `${birdRotation}deg` }],
        }]}>
          <Text style={s.birdEmoji}>🍑</Text>
        </View>

        {/* score */}
        <Text style={s.score}>{score}</Text>

        {/* overlay messages */}
        {gameState === 'waiting' && (
          <View style={s.msgBox}>
            <Text style={s.msgTitle}>FlappyGG</Text>
            <Text style={s.msgSub}>tap to start</Text>
          </View>
        )}

        {gameState === 'dead' && (
          <View style={s.msgBox}>
            <Text style={s.msgTitle}>GG.</Text>
            <Text style={s.msgSub}>score: {score}   best: {best}</Text>
            <Text style={s.msgHint}>tap to retry</Text>
          </View>
        )}

        {/* close */}
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: C.bg, position: 'relative',
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.peach,
    borderRadius: 4,
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birdEmoji: { fontSize: 28 },
  score: {
    position: 'absolute',
    top: 60, alignSelf: 'center', width: '100%', textAlign: 'center',
    fontSize: 48, fontWeight: '900', color: C.cream,
    opacity: 0.9,
  },
  msgBox: {
    position: 'absolute', top: '35%', left: 0, right: 0,
    alignItems: 'center', gap: 8,
  },
  msgTitle: { fontSize: 40, fontWeight: '900', color: C.peach },
  msgSub:   { fontSize: 16, color: C.muted },
  msgHint:  { fontSize: 13, color: C.faint, marginTop: 4 },
  closeBtn: {
    position: 'absolute', top: 56, right: 20,
    padding: 8,
  },
  closeText: { fontSize: 20, color: C.faint },
});
