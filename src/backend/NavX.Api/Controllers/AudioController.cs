using MediatR;
using Microsoft.AspNetCore.Mvc;
using NavX.Domain.Enums;
using NavX.Infrastructure.Audio;

namespace NavX.Api.Controllers;

[Route("api/audio")]
public sealed class AudioController : ApiControllerBase
{
    private readonly ISoundEffectGenerator _audioGenerator;

    public AudioController(ISender sender, ISoundEffectGenerator audioGenerator) : base(sender)
    {
        _audioGenerator = audioGenerator;
    }

    /// <summary>
    /// Retrieves the list of available pre-generated sound effects and waveforms.
    /// </summary>
    [HttpGet("effects")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<string>> GetAvailableEffects()
    {
        var assets = _audioGenerator.PreGenerateAllAssets();
        return Ok(assets.Keys.ToList());
    }

    /// <summary>
    /// Streams a synthesized WAV sound effect.
    /// </summary>
    [HttpGet("effects/{name}")]
    [Produces("audio/wav")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetEffect(string name)
    {
        var assets = _audioGenerator.PreGenerateAllAssets();
        if (assets.TryGetValue(name, out var bytes))
        {
            return File(bytes, "audio/wav", name);
        }

        // Try generating on the fly if named without .wav
        string keyWithWav = name.EndsWith(".wav", StringComparison.OrdinalIgnoreCase) ? name : $"{name}.wav";
        if (assets.TryGetValue(keyWithWav, out var wavBytes))
        {
            return File(wavBytes, "audio/wav", keyWithWav);
        }

        return NotFound();
    }

    /// <summary>
    /// Generates a custom waveform tone with specific frequency, duration, volume, and stereo pan.
    /// </summary>
    [HttpGet("tone")]
    [Produces("audio/wav")]
    public IActionResult GenerateTone(
        [FromQuery] SignalType signal = SignalType.Sine,
        [FromQuery] double freq = 440,
        [FromQuery] double duration = 0.1,
        [FromQuery] float volume = 0.5f,
        [FromQuery] float pan = 0.0f)
    {
        var bytes = _audioGenerator.GenerateToneWav(signal, freq, duration, volume, pan);
        return File(bytes, "audio/wav", "tone.wav");
    }
}
