import { describe, expect, it } from 'vitest';
import { viewerReducer, currentScene, type TransitionGraph, type ViewerState } from './reducer';
import { buildTransitionGraph, neighbors } from './graph';
import type { SceneTransition } from '@/types/domain';

const graph: TransitionGraph = {
  get: (from, to) => (from === 'a' && to === 'b' ? { videoUrl: 'a-b.mp4' } : undefined),
};

describe('viewerReducer', () => {
  it('starts a transition when a video exists', () => {
    const s = viewerReducer({ kind: 'idle', scene: 'a' }, { type: 'NAVIGATE', to: 'b' }, graph);
    expect(s).toEqual({ kind: 'transitioning', from: 'a', to: 'b', videoUrl: 'a-b.mp4' });
    expect(currentScene(s)).toBe('b');
  });

  it('cuts directly when there is no video', () => {
    expect(viewerReducer({ kind: 'idle', scene: 'b' }, { type: 'NAVIGATE', to: 'c' }, graph)).toEqual({ kind: 'idle', scene: 'c' });
  });

  it('ignores navigation to the current scene', () => {
    const s: ViewerState = { kind: 'idle', scene: 'a' };
    expect(viewerReducer(s, { type: 'NAVIGATE', to: 'a' }, graph)).toBe(s);
  });

  it.each(['VIDEO_ENDED', 'VIDEO_FAILED'] as const)('lands on the target after %s', (type) => {
    const s: ViewerState = { kind: 'transitioning', from: 'a', to: 'b', videoUrl: 'a-b.mp4' };
    expect(viewerReducer(s, { type }, graph)).toEqual({ kind: 'idle', scene: 'b' });
  });

  it('ignores clicks while transitioning', () => {
    const s: ViewerState = { kind: 'transitioning', from: 'a', to: 'b', videoUrl: 'a-b.mp4' };
    expect(viewerReducer(s, { type: 'NAVIGATE', to: 'c' }, graph)).toBe(s);
  });

  it('ignores video events while idle', () => {
    const s: ViewerState = { kind: 'idle', scene: 'a' };
    expect(viewerReducer(s, { type: 'VIDEO_ENDED' }, graph)).toBe(s);
  });
});

const T: SceneTransition[] = [
  { fromSceneId: 'a', toSceneId: 'b', direction: 'right', videoDayUrl: 'd.mp4', videoDayMobileUrl: 'd-720.mp4', videoNightUrl: 'n.mp4', videoNightMobileUrl: null, frames: null },
  { fromSceneId: 'b', toSceneId: 'a', direction: 'left', videoDayUrl: 'r.mp4', videoDayMobileUrl: null, videoNightUrl: null, videoNightMobileUrl: null, frames: null },
];
const resolve = (p: string) => `/media/${p}`;

describe('buildTransitionGraph', () => {
  it('picks the day video on desktop', () => {
    expect(buildTransitionGraph(T, { night: false, mobile: false, resolve }).get('a', 'b')).toEqual({ videoUrl: '/media/d.mp4' });
  });
  it('picks the mobile variant when there is one', () => {
    expect(buildTransitionGraph(T, { night: false, mobile: true, resolve }).get('a', 'b')).toEqual({ videoUrl: '/media/d-720.mp4' });
  });
  it('falls back to the full-size night video on mobile', () => {
    expect(buildTransitionGraph(T, { night: true, mobile: true, resolve }).get('a', 'b')).toEqual({ videoUrl: '/media/n.mp4' });
  });
  it('cuts at night when there is no night video', () => {
    expect(buildTransitionGraph(T, { night: true, mobile: false, resolve }).get('b', 'a')).toBeUndefined();
  });
  it('returns undefined when the transition has no video (crossfade)', () => {
    const noVideo: SceneTransition[] = [{ ...T[0], videoDayUrl: null, videoDayMobileUrl: null }];
    expect(buildTransitionGraph(noVideo, { night: false, mobile: true, resolve }).get('a', 'b')).toBeUndefined();
  });
  it('returns undefined for unknown pairs', () => {
    expect(buildTransitionGraph(T, { night: false, mobile: false, resolve }).get('a', 'z')).toBeUndefined();
  });
});

describe('neighbors', () => {
  it('maps directions to scenes', () => {
    expect(neighbors(T, 'a')).toEqual({ right: 'b' });
    expect(neighbors(T, 'b')).toEqual({ left: 'a' });
  });
});
