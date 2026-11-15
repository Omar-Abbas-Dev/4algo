using MediatR;
using Microsoft.AspNetCore.Mvc;
using NavX.Application.Dtos;
using NavX.Application.Stats.Queries.GetStats;

namespace NavX.Api.Controllers;

[Route("api/stats")]
public sealed class StatsController : ApiControllerBase
{
    public StatsController(ISender sender) : base(sender)
    {
    }

    /// <summary>
    /// Retrieves algorithm performance and win statistics across all recorded races.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(StatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StatsDto>> GetStats(CancellationToken ct)
    {
        var result = await Sender.Send(new GetStatsQuery(), ct);
        return Ok(result);
    }
}
