using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using NavX.Application.Dtos;
using NavX.Application.Maps.Commands.SaveMap;
using NavX.Application.Races.Commands.RunRace;
using Shouldly;
using Xunit;

namespace NavX.Api.IntegrationTests;

/// <summary>
/// End-to-end integration tests that run the REAL Python algorithm engine.
/// No fakes — results come from actual BFS / DFS / Greedy / A* executions.
/// </summary>
public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly string[] ValidAlgorithms = ["BFS", "DFS", "Greedy", "A*"];

    // A 5×5 grid with a traffic corridor — algorithms will find paths with different costs.
    // A* is expected to find the optimal (cheapest) path.
    private static readonly int[][] TrafficGrid =
    [
        [1, 5, 5, 5, 1],
        [1, 5, 1, 5, 1],
        [1, 5, 1, 5, 1],
        [1, 1, 1, 5, 1],
        [5, 5, 5, 5, 1],
    ];

    // Simple open grid — all algorithms find the same cost path; winner is fastest by time.
    private static readonly int[][] OpenGrid =
    [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
    ];

    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        // Use the REAL application with the real PythonRaceEngine — no overrides.
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_ShouldReturnHealthy()
    {
        var response = await _client.GetAsync("/health");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PostRace_WithTrafficGrid_ShouldReturn201WithRealResults()
    {
        var command = new RunRaceCommand(
            Grid: TrafficGrid,
            Start: [0, 0],
            Goal: [4, 4]);

        var response = await _client.PostAsJsonAsync("/api/races", command);

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<RaceResultDto>();

        result.ShouldNotBeNull();
        result.Results.Count.ShouldBe(4);

        // Winner must be one of the valid algorithms
        result.Winner.ShouldNotBeNullOrEmpty();
        ValidAlgorithms.ShouldContain(result.Winner!);

        // Every result must have a valid algorithm name
        result.Results.Select(r => r.Algorithm).ShouldBeSubsetOf(ValidAlgorithms);

        // All algorithms should find a path on this fully-connected grid
        result.Results.Where(r => r.Cost.HasValue).Count().ShouldBe(4);

        // A* must find the minimum cost path (it's optimal by design)
        var astarResult = result.Results.Single(r => r.Algorithm == "A*");
        astarResult.Cost.ShouldNotBeNull();
        var minCost = result.Results.Min(r => r.Cost ?? int.MaxValue);
        astarResult.Cost!.Value.ShouldBe(minCost, "A* must always find the optimal (lowest-cost) path");

        // GetById must return the same race
        var getResponse = await _client.GetAsync($"/api/races/{result.Id}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PostRace_WithOpenGrid_ShouldReturn201WithRealResults()
    {
        var command = new RunRaceCommand(
            Grid: OpenGrid,
            Start: [0, 0],
            Goal: [2, 2]);

        var response = await _client.PostAsJsonAsync("/api/races", command);

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<RaceResultDto>();

        result.ShouldNotBeNull();
        result.Results.Count.ShouldBe(4);
        result.Winner.ShouldNotBeNullOrEmpty();
        ValidAlgorithms.ShouldContain(result.Winner!);

        // On an open grid all algorithms find the same cost path
        var costs = result.Results.Where(r => r.Cost.HasValue).Select(r => r.Cost!.Value).Distinct();
        costs.Count().ShouldBe(1, "All algorithms should find identical cost paths on an open grid");
    }

    [Fact]
    public async Task PostRace_WithInvalidGrid_ShouldReturn400BadRequest()
    {
        var command = new RunRaceCommand(
            Grid: [new[] { 1 }], // 1×1 — below minimum 2×2
            Start: [0, 0],
            Goal: [0, 0]);

        var response = await _client.PostAsJsonAsync("/api/races", command);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostRace_WithAlgorithmSubset_ShouldReturnOnlySelectedResults()
    {
        var command = new RunRaceCommand(
            Grid: OpenGrid,
            Start: [0, 0],
            Goal: [2, 2],
            Algorithms: ["BFS", "A*"]);

        var response = await _client.PostAsJsonAsync("/api/races", command);

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<RaceResultDto>();

        result.ShouldNotBeNull();
        result.Results.Count.ShouldBe(2);
        result.Results.Select(r => r.Algorithm).ShouldBe(["BFS", "A*"], ignoreOrder: true);
        ValidAlgorithms.ShouldContain(result.Winner!);
    }

    [Fact]
    public async Task SaveMap_And_GetMaps_ShouldPersistAndRetrieve()
    {
        var command = new SaveMapCommand(
            Name: "Integration Test Map",
            Grid: OpenGrid,
            DefaultStart: [0, 0],
            DefaultGoal: [2, 2]);

        var postResponse = await _client.PostAsJsonAsync("/api/maps", command);
        postResponse.StatusCode.ShouldBe(HttpStatusCode.Created);

        var listResponse = await _client.GetAsync("/api/maps");
        listResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var maps = await listResponse.Content.ReadFromJsonAsync<List<MapDto>>();
        maps.ShouldNotBeNull();
        maps.ShouldContain(m => m.Name == "Integration Test Map");
    }

    [Fact]
    public async Task GetStats_ShouldReturnTotalRacesAndWinCounts()
    {
        var response = await _client.GetAsync("/api/stats");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var stats = await response.Content.ReadFromJsonAsync<StatsDto>();
        stats.ShouldNotBeNull();
        // Stats must have entries for all four algorithms
        stats.Wins.ShouldContainKey("A*");
        stats.Wins.ShouldContainKey("BFS");
        stats.Wins.ShouldContainKey("DFS");
        stats.Wins.ShouldContainKey("Greedy");
    }

}
