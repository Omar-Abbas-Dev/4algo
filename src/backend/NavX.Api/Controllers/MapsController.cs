using MediatR;
using Microsoft.AspNetCore.Mvc;
using NavX.Application.Dtos;
using NavX.Application.Maps.Commands.DeleteMap;
using NavX.Application.Maps.Commands.SaveMap;
using NavX.Application.Maps.Queries.GetMapById;
using NavX.Application.Maps.Queries.GetMaps;

namespace NavX.Api.Controllers;

[Route("api/maps")]
public sealed class MapsController : ApiControllerBase
{
    public MapsController(ISender sender) : base(sender)
    {
    }

    /// <summary>
    /// Retrieves all saved grid maps.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MapDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MapDto>>> GetAll(CancellationToken ct)
    {
        var result = await Sender.Send(new GetMapsQuery(), ct);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves a specific saved map by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MapDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MapDto>> GetById(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetMapByIdQuery(id), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    /// <summary>
    /// Saves a new grid map preset.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MapDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MapDto>> Create([FromBody] SaveMapCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Deletes a saved grid map preset.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var success = await Sender.Send(new DeleteMapCommand(id), ct);
        if (!success) return NotFound();
        return NoContent();
    }
}
