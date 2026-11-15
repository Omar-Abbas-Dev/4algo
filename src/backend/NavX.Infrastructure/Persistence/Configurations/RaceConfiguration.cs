using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.ValueObjects;

namespace NavX.Infrastructure.Persistence.Configurations;

public sealed class RaceConfiguration : IEntityTypeConfiguration<Race>
{
    private static readonly JsonSerializerOptions JsonOptions = new();

    public void Configure(EntityTypeBuilder<Race> builder)
    {
        builder.ToTable("Races");
        builder.HasKey(r => r.Id);

        var gridConverter = new ValueConverter<Grid, string>(
            v => JsonSerializer.Serialize(v.ToJaggedArray(), JsonOptions),
            v => new Grid(JsonSerializer.Deserialize<int[][]>(v, JsonOptions) ?? new[] { new[] { 1, 1 }, new[] { 1, 1 } }));

        var positionConverter = new ValueConverter<Position, string>(
            v => JsonSerializer.Serialize(new[] { v.Row, v.Col }, JsonOptions),
            v => ToPosition(v));

        builder.Property(r => r.Grid)
            .HasConversion(gridConverter)
            .HasColumnType("TEXT")
            .IsRequired();

        builder.Property(r => r.Start)
            .HasConversion(positionConverter)
            .HasColumnType("TEXT")
            .IsRequired();

        builder.Property(r => r.Goal)
            .HasConversion(positionConverter)
            .HasColumnType("TEXT")
            .IsRequired();

        builder.Property(r => r.Winner)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.CreatedAtUtc)
            .IsRequired();

        // OwnsMany for AlgorithmResult
        builder.OwnsMany(r => r.Results, a =>
        {
            a.ToTable("AlgorithmResults");
            a.WithOwner().HasForeignKey("RaceId");
            a.HasKey(res => res.Id);

            a.Property(res => res.Algorithm)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            var pathConverter = new ValueConverter<IReadOnlyList<Position>, string>(
                v => JsonSerializer.Serialize(v.Select(p => new[] { p.Row, p.Col }).ToArray(), JsonOptions),
                v => ToPositionList(v));

            var pathComparer = new ValueComparer<IReadOnlyList<Position>>(
                (a, b) => a != null && b != null && a.Count == b.Count
                          && a.Zip(b).All(pair => pair.First.Row == pair.Second.Row
                                               && pair.First.Col == pair.Second.Col),
                v => v.Aggregate(0, (hash, p) => HashCode.Combine(hash, p.Row, p.Col)),
                v => (IReadOnlyList<Position>)v.Select(p => new Position(p.Row, p.Col)).ToList());

            a.Property(res => res.Path)
                .HasConversion(pathConverter, pathComparer)
                .HasColumnType("TEXT")
                .IsRequired();
        });
    }

    private static Position ToPosition(string json)
    {
        var arr = JsonSerializer.Deserialize<int[]>(json, JsonOptions);
        return arr != null && arr.Length == 2 ? new Position(arr[0], arr[1]) : new Position(0, 0);
    }

    private static IReadOnlyList<Position> ToPositionList(string json)
    {
        var jagged = JsonSerializer.Deserialize<int[][]>(json, JsonOptions);
        if (jagged is null) return Array.Empty<Position>();
        return jagged.Select(p => new Position(p[0], p[1])).ToList();
    }
}
