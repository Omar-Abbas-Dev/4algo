using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NavX.Domain.Entities;
using NavX.Domain.ValueObjects;

namespace NavX.Infrastructure.Persistence.Configurations;

public sealed class SavedMapConfiguration : IEntityTypeConfiguration<SavedMap>
{
    private static readonly JsonSerializerOptions JsonOptions = new();

    public void Configure(EntityTypeBuilder<SavedMap> builder)
    {
        builder.ToTable("SavedMaps");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name)
            .HasMaxLength(100)
            .IsRequired();

        var gridConverter = new ValueConverter<Grid, string>(
            v => JsonSerializer.Serialize(v.ToJaggedArray(), JsonOptions),
            v => new Grid(JsonSerializer.Deserialize<int[][]>(v, JsonOptions) ?? new[] { new[] { 1, 1 }, new[] { 1, 1 } }));

        var nullablePositionConverter = new ValueConverter<Position?, string?>(
            v => v.HasValue ? JsonSerializer.Serialize(new[] { v.Value.Row, v.Value.Col }, JsonOptions) : null,
            v => string.IsNullOrEmpty(v) ? null : ToPosition(v));

        builder.Property(m => m.Grid)
            .HasConversion(gridConverter)
            .HasColumnType("TEXT")
            .IsRequired();

        builder.Property(m => m.DefaultStart)
            .HasConversion(nullablePositionConverter)
            .HasColumnType("TEXT");

        builder.Property(m => m.DefaultGoal)
            .HasConversion(nullablePositionConverter)
            .HasColumnType("TEXT");

        builder.Property(m => m.CreatedAtUtc)
            .IsRequired();
    }

    private static Position ToPosition(string json)
    {
        var arr = JsonSerializer.Deserialize<int[]>(json, JsonOptions);
        return arr != null && arr.Length == 2 ? new Position(arr[0], arr[1]) : new Position(0, 0);
    }
}
