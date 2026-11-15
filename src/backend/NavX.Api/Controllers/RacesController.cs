using MediatR;
using Microsoft.AspNetCore.Mvc;
using NavX.Application.Common;
using NavX.Application.Dtos;
using NavX.Application.Races.Commands.RunRace;
using NavX.Application.Races.Queries.GetRaceById;
using NavX.Application.Races.Queries.GetRaceHistory;
using NavX.Application.Races.Queries.GetReplay;

namespace NavX.Api.Controllers;

[Route("api/races")]
public sealed class RacesController : ApiControllerBase
{
    public RacesController(ISender sender) : base(sender)
    {
    }

    /// <summary>
    /// Executes BFS, DFS, Greedy, and A* search algorithms simultaneously on a city grid map.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RaceResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<RaceResultDto>> Create([FromBody] RunRaceCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Retrieves paginated historical race records.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<RaceResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<RaceResultDto>>> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetRaceHistoryQuery(page, pageSize), ct);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves a specific race result by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RaceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RaceResultDto>> GetById(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetRaceByIdQuery(id), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    /// <summary>
    /// Retrieves full deterministic algorithm replay data for a race, including all explored cells.
    /// </summary>
    [HttpGet("{id:guid}/replay")]
    [ProducesResponseType(typeof(RaceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RaceResultDto>> GetReplay(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetReplayQuery(id), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
