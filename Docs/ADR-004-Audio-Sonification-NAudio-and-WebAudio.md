# ADR-004: Dual-Tier Audio Sonification (NAudio & Web Audio API)

## Status
Accepted

## Context
NavX Arena implements audio sonification so each algorithm is auditory as well as visual. The system must support real-time low-latency audio in the browser while fulfilling the architectural requirement to generate audio in C# using NAudio.

## Decision
We adopted a dual-tier sonification model:
1. **C# Backend (NAudio)**:
   - `NAudioSoundEffectGenerator` generates IEEE/PCM WAV files for all fundamental waveforms (Sine, Square, Triangle, Sawtooth), stereo panning, algorithm arrival arpeggios, vehicle honks, and the winner fanfare.
   - Exposed through `AudioController` (`GET /api/audio/effects/{name}` and `GET /api/audio/tone`).
2. **Browser Frontend (Web Audio API)**:
   - `BrowserSoundPlayer` synthesizes high-frequency real-time events (such as per-cell exploration ticks pitch-shifted by heuristic distance $h$) directly with zero network latency.
   - Also plays backend-generated WAV audio assets.
   - Enforces browser autoplay policies, providing manual unlock and global mute/unmute.

## Algorithm Auditory Profiles
| Algorithm | Waveform | Stereo Pan | Audio Character |
|---|---|---|---|
| BFS | Sine | Left (-0.8) | Smooth, regular pulses |
| DFS | Square | Slightly Left (-0.3) | Sharp, descending tones |
| Greedy | Triangle | Slightly Right (+0.3) | Impulsive, fast |
| A* | Sawtooth | Right (+0.8) | Balanced, intelligent |
