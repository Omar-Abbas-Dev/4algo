namespace NavX.Infrastructure.Audio;

public enum SignalType
{
    Sine,
    Square,
    Triangle,
    Sawtooth
}

public sealed class SoundEffectOptions
{
    public const string SectionName = "SoundEffects";

    public int SampleRate { get; set; } = 44100;
    public string OutputDirectory { get; set; } = "wwwroot/audio";
}
