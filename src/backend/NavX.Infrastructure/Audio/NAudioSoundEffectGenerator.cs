using NAudio.Wave;
using NavX.Domain.Enums;

namespace NavX.Infrastructure.Audio;

/// <summary>
/// NAudio-based generator for synthesizing algorithmic sonification effects.
/// </summary>
public sealed class NAudioSoundEffectGenerator : ISoundEffectGenerator
{
    private const int SampleRate = 44100;
    private static readonly WaveFormat Stereo16BitFormat = new(SampleRate, 16, 2);

    public byte[] GenerateToneWav(
        SignalType signalType,
        double frequencyHz,
        double durationSeconds,
        float volume = 0.5f,
        float pan = 0.0f)
    {
        int totalSamples = (int)(SampleRate * durationSeconds);
        using var memStream = new MemoryStream();
        using (var writer = new WaveFileWriter(memStream, Stereo16BitFormat))
        {
            // Normalize pan: -1.0 (pure left) to +1.0 (pure right)
            float leftGain = Math.Clamp((1.0f - pan) / 2.0f * volume, 0f, 1f);
            float rightGain = Math.Clamp((1.0f + pan) / 2.0f * volume, 0f, 1f);

            for (int n = 0; n < totalSamples; n++)
            {
                double t = (double)n / SampleRate;
                double phase = (t * frequencyHz) % 1.0;

                // Envelope: short fade in/fade out to eliminate pops/clicks
                float envelope = 1.0f;
                int fadeSamples = Math.Min(SampleRate / 100, totalSamples / 4);
                if (n < fadeSamples)
                    envelope = (float)n / fadeSamples;
                else if (n > totalSamples - fadeSamples)
                    envelope = (float)(totalSamples - n) / fadeSamples;

                double rawSample = SampleFunction(signalType, phase);
                short leftSample = (short)Math.Clamp(rawSample * leftGain * envelope * short.MaxValue, short.MinValue, short.MaxValue);
                short rightSample = (short)Math.Clamp(rawSample * rightGain * envelope * short.MaxValue, short.MinValue, short.MaxValue);

                writer.WriteSample(leftSample / (float)short.MaxValue);
                writer.WriteSample(rightSample / (float)short.MaxValue);
            }
        }

        return memStream.ToArray();
    }

    public byte[] GenerateArrivalArpeggio(AlgorithmType algorithm)
    {
        // Generate distinct arpeggio notes for each algorithm
        var (signalType, pan, baseFreq) = algorithm switch
        {
            AlgorithmType.BFS => (SignalType.Sine, -0.8f, 261.63),      // C4
            AlgorithmType.DFS => (SignalType.Square, -0.3f, 220.00),    // A3
            AlgorithmType.Greedy => (SignalType.Triangle, 0.3f, 329.63), // E4
            AlgorithmType.AStar => (SignalType.Sawtooth, 0.8f, 392.00),  // G4
            _ => (SignalType.Sine, 0.0f, 440.00)
        };

        // Major triad: 1, 1.25 (major 3rd), 1.5 (perfect 5th), 2.0 (octave)
        double[] ratios = [1.0, 1.25, 1.5, 2.0];
        using var memStream = new MemoryStream();
        using (var writer = new WaveFileWriter(memStream, Stereo16BitFormat))
        {
            foreach (var ratio in ratios)
            {
                byte[] noteWav = GenerateToneWav(signalType, baseFreq * ratio, 0.12, 0.5f, pan);
                // Strip 44-byte WAV header and write raw PCM
                if (noteWav.Length > 44)
                {
                    writer.Write(noteWav, 44, noteWav.Length - 44);
                }
            }
        }
        return memStream.ToArray();
    }

    public byte[] GenerateWinnerFanfare()
    {
        // Grand fanfare for the lowest-cost winner
        // Notes: G4, C5, E5, G5 sustained
        double[] freqs = [392.00, 523.25, 659.25, 783.99];
        double[] durations = [0.15, 0.15, 0.15, 0.50];

        using var memStream = new MemoryStream();
        using (var writer = new WaveFileWriter(memStream, Stereo16BitFormat))
        {
            for (int i = 0; i < freqs.Length; i++)
            {
                byte[] noteWav = GenerateToneWav(SignalType.Sawtooth, freqs[i], durations[i], 0.6f, 0.0f);
                if (noteWav.Length > 44)
                {
                    writer.Write(noteWav, 44, noteWav.Length - 44);
                }
            }
        }
        return memStream.ToArray();
    }

    public byte[] GenerateTrafficHonk()
    {
        // Low dual-tone dissonance (140Hz + 150Hz) simulating a muffled vehicle horn
        return GenerateDualToneWav(SignalType.Sawtooth, 140, 154, 0.25, 0.5f, 0.0f);
    }

    public byte[] GenerateExploredTick(int heuristicDistance)
    {
        // Pitch increases as heuristic distance h decreases (closer to goal -> higher frequency)
        // h=0 -> 1200Hz, h=30 -> 300Hz
        double freq = Math.Clamp(1200.0 - (heuristicDistance * 30.0), 300.0, 1400.0);
        return GenerateToneWav(SignalType.Sine, freq, 0.03, 0.3f, 0.0f);
    }

    public byte[] GenerateEventSound(string eventName) => eventName.ToLowerInvariant() switch
    {
        "click" => GenerateToneWav(SignalType.Sine, 880, 0.02, 0.4f, 0.0f),
        "traffic" => GenerateTrafficHonk(),
        "thud" => GenerateToneWav(SignalType.Triangle, 90, 0.15, 0.7f, 0.0f),
        "start_placed" => GenerateToneWav(SignalType.Sine, 587.33, 0.12, 0.4f, -0.4f),
        "goal_placed" => GenerateToneWav(SignalType.Sine, 440.00, 0.12, 0.4f, 0.4f),
        "countdown" => GenerateToneWav(SignalType.Sine, 600, 0.10, 0.5f, 0.0f),
        "countdown_go" => GenerateToneWav(SignalType.Sawtooth, 1200, 0.25, 0.6f, 0.0f),
        "nopath" => GenerateDualToneWav(SignalType.Square, 200, 150, 0.35, 0.5f, 0.0f),
        "winner" => GenerateWinnerFanfare(),
        _ => GenerateToneWav(SignalType.Sine, 440, 0.05, 0.3f, 0.0f)
    };

    public IReadOnlyDictionary<string, byte[]> PreGenerateAllAssets()
    {
        var dict = new Dictionary<string, byte[]>
        {
            ["bfs_arrival.wav"] = GenerateArrivalArpeggio(AlgorithmType.BFS),
            ["dfs_arrival.wav"] = GenerateArrivalArpeggio(AlgorithmType.DFS),
            ["greedy_arrival.wav"] = GenerateArrivalArpeggio(AlgorithmType.Greedy),
            ["astar_arrival.wav"] = GenerateArrivalArpeggio(AlgorithmType.AStar),
            ["winner_fanfare.wav"] = GenerateWinnerFanfare(),
            ["traffic_honk.wav"] = GenerateTrafficHonk(),
            ["click.wav"] = GenerateEventSound("click"),
            ["thud.wav"] = GenerateEventSound("thud"),
            ["start_placed.wav"] = GenerateEventSound("start_placed"),
            ["goal_placed.wav"] = GenerateEventSound("goal_placed"),
            ["countdown.wav"] = GenerateEventSound("countdown"),
            ["countdown_go.wav"] = GenerateEventSound("countdown_go"),
            ["nopath.wav"] = GenerateEventSound("nopath")
        };

        // Also pre-generate algorithm idle waveforms
        dict["bfs_tone.wav"] = GenerateToneWav(SignalType.Sine, 440, 0.08, 0.4f, -0.8f);
        dict["dfs_tone.wav"] = GenerateToneWav(SignalType.Square, 330, 0.08, 0.4f, -0.3f);
        dict["greedy_tone.wav"] = GenerateToneWav(SignalType.Triangle, 550, 0.08, 0.4f, 0.3f);
        dict["astar_tone.wav"] = GenerateToneWav(SignalType.Sawtooth, 660, 0.08, 0.4f, 0.8f);

        return dict;
    }

    private static double SampleFunction(SignalType signalType, double phase) => signalType switch
    {
        SignalType.Sine => Math.Sin(2.0 * Math.PI * phase),
        SignalType.Square => Math.Sin(2.0 * Math.PI * phase) >= 0 ? 1.0 : -1.0,
        SignalType.Triangle => 2.0 * Math.Abs(2.0 * (phase - Math.Floor(phase + 0.5))) - 1.0,
        SignalType.Sawtooth => 2.0 * (phase - Math.Floor(phase)) - 1.0,
        _ => 0.0
    };

    private static byte[] GenerateDualToneWav(
        SignalType signalType,
        double freq1,
        double freq2,
        double durationSeconds,
        float volume,
        float pan)
    {
        int totalSamples = (int)(SampleRate * durationSeconds);
        using var memStream = new MemoryStream();
        using (var writer = new WaveFileWriter(memStream, Stereo16BitFormat))
        {
            float leftGain = Math.Clamp((1.0f - pan) / 2.0f * volume, 0f, 1f);
            float rightGain = Math.Clamp((1.0f + pan) / 2.0f * volume, 0f, 1f);

            for (int n = 0; n < totalSamples; n++)
            {
                double t = (double)n / SampleRate;
                double phase1 = (t * freq1) % 1.0;
                double phase2 = (t * freq2) % 1.0;

                float envelope = 1.0f;
                int fadeSamples = Math.Min(SampleRate / 100, totalSamples / 4);
                if (n < fadeSamples) envelope = (float)n / fadeSamples;
                else if (n > totalSamples - fadeSamples) envelope = (float)(totalSamples - n) / fadeSamples;

                double rawSample = (SampleFunction(signalType, phase1) + SampleFunction(signalType, phase2)) * 0.5;
                short leftSample = (short)Math.Clamp(rawSample * leftGain * envelope * short.MaxValue, short.MinValue, short.MaxValue);
                short rightSample = (short)Math.Clamp(rawSample * rightGain * envelope * short.MaxValue, short.MinValue, short.MaxValue);

                writer.WriteSample(leftSample / (float)short.MaxValue);
                writer.WriteSample(rightSample / (float)short.MaxValue);
            }
        }
        return memStream.ToArray();
    }
}
