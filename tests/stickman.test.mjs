import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/stickman.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source + ';globalThis.S=Stickman;', context);
const S = context.S;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// Both builds (different shoulder and hip widths) must keep every contact.
const each = fn => { for (const build of ['male', 'female']) { S.setAvatar(build); for (const ex of S.EXERCISES) fn(ex, S.prepare(ex)); } S.setAvatar('male'); };

test('51 exercises with unique ids, each a periodic cycle of 4 s per rep at 120 samples/s', () => {
  const ids = S.EXERCISES.map(e => e.id);assert.equal(ids.length, 51);assert.equal(new Set(ids).size, 51);
  each((ex, d) => { assert.equal(d.N, ex.reps * 4 * 120); assert.equal(d.duration, ex.reps * 4); });
});

test('limbs keep their length and legs never have to over-reach', () => {
  each((ex, d) => {
    assert.ok(d.reach < 1, ex.id + ' leg IK clamped');
    for (let i = 0; i < d.N; i++) for (const k of ['L', 'R']) {
      const g = n => d.get(i, n + k);
      for (const [a, b, l] of [['H', 'K', 42], ['K', 'A', 42], ['S', 'E', 30], ['E', 'W', 25], ['W', 'T', 8]])
        assert.ok(Math.abs(dist(g(a), g(b)) - l) < 1e-3, ex.id + ' ' + a + b + k);
      assert.ok(Math.abs(dist(g('HE'), g('BA')) - 20) < 1e-3, ex.id + ' foot');
    }
  });
});

test('feet stay on or above the floor and do not slide while touching it', () => {
  each((ex, d) => {
    for (let i = 0; i < d.N; i++) for (const k of ['L', 'R']) for (const f of ['HE', 'BA', 'TO']) {
      const a = d.get(i, f + k), b = d.get(i + 1, f + k);
      assert.ok(a[1] > -1e-3, ex.id + ' ' + f + k + ' below floor');
      if (f !== 'TO' && a[1] < .3 && b[1] < .3) assert.ok(Math.hypot(a[0] - b[0], a[2] - b[2]) < .01, ex.id + ' ' + f + k + ' slides');
    }
  });
});

test('motion is continuous, including across the loop and between alternating reps', () => {
  each((ex, d) => {
    for (let i = 0; i < d.N; i++) for (const k of S.POINTS) {
      const a = d.get(i, k), b = d.get(i + 1, k);
      assert.ok(a.every(Number.isFinite), ex.id + ' ' + k);
      assert.ok(dist(a, b) < 3, ex.id + ' ' + k + ' jumps at frame ' + i);
    }
  });
});

test('hands on a chair back, a wall or a seat edge stay put', () => {
  for (const id of ['miniSquat', 'heel', 'side', 'backLeg', 'hamstringCurl', 'singleLegStand', 'wallPush', 'chairDip']) {
    const d = S.prepare(S.find(id));
    for (let i = 0; i < d.N; i++) for (const k of ['WL', 'WR']) assert.ok(dist(d.get(i, k), d.get(0, k)) < .01, id + ' ' + k + ' moves');
  }
});

test('every move actually moves, except the isometric presses', () => {
  each((ex, d) => {
    let most = 0;for (let i = 0; i < d.N; i += 4) for (const k of S.POINTS) most = Math.max(most, dist(d.get(i, k), d.get(0, k)));
    assert.ok(most > (['palmPress', 'towelPull'].includes(ex.id) ? 1 : ex.id === 'shoulderLift' ? 4 : 8), ex.id + ' moves ' + most.toFixed(1));
  });
});

test('hands placed on a support stay exactly there', () => {
  const push = S.prepare(S.EXERCISES.find(e => e.id === 'inclinePush'));
  for (let i = 0; i < push.N; i++) {
    assert.ok(dist(push.get(i, 'WL'), [21, 77.5, 44]) < 1e-3, 'left hand on the table');
    assert.ok(dist(push.get(i, 'WR'), [-21, 77.5, 44]) < 1e-3, 'right hand on the table');
  }
});

test('the squat keeps the centre of mass over the feet at every frame', () => {
  const d = S.prepare(S.EXERCISES.find(e => e.id === 'squat'));
  for (let i = 0; i < d.N; i++) {
    const z = d.get(i, 'COM')[2];
    assert.ok(z > d.get(i, 'HEL')[2] + 2 && z < d.get(i, 'BAL')[2] - 2, 'COM z ' + z.toFixed(1));
  }
});

test('descents are slower than the drive back up', () => {
  for (const id of ['squat', 'inclinePush']) {
    const d = S.prepare(S.EXERCISES.find(e => e.id === id)), m = [...d.metric];
    assert.ok(Math.max(...m) > 1.15 * -Math.min(...m), id + ' peak up speed beats peak down speed');
  }
});

test('the start/end view shows two different poses, whatever rep the app asks for', () => {
  const calls = [], ctx = new Proxy({}, { get: (t, k) => t[k] ?? ((...a) => { if (k === 'fillText') calls.push(a[0]); return { addColorStop() {} }; }), set: (t, k, v) => { t[k] = v; return true; } });
  for (const rep of [0, 1, 5]) S.renderPair(ctx, 360, 260, S.find('squat'), rep, {});
  const d = S.prepare(S.find('squat'));let deepest = 0;for (let i = 0; i < d.N; i++) deepest = Math.max(deepest, d.effort[i]);
  assert.ok(deepest > .8);assert.ok(calls.includes('动作终点'));
});

test('the two builds differ in shoulder and hip width but share limb lengths', () => {
  const width = (build, a, b) => { S.setAvatar(build); const d = S.prepare(S.find('squat')); return dist(d.get(0, a), d.get(0, b)); };
  assert.ok(width('male', 'SL', 'SR') - width('female', 'SL', 'SR') > 6, 'his shoulders are broader');
  assert.ok(width('female', 'HL', 'HR') - width('male', 'HL', 'HR') > 2, 'her hips are wider');
  assert.ok(Math.abs(width('male', 'HL', 'KL') - width('female', 'HL', 'KL')) < 1e-3);
  S.setAvatar('male');
});
