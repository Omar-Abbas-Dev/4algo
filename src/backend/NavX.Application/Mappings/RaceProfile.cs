using AutoMapper;
using NavX.Application.Dtos;
using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.ValueObjects;

namespace NavX.Application.Mappings;

public sealed class RaceProfile : Profile
{
    public RaceProfile()
    {
        CreateMap<Position, int[]>()
            .ConstructUsing(p => new[] { p.Row, p.Col });

        CreateMap<AlgorithmResult, AlgorithmResultDto>()
            .ForCtorParam(nameof(AlgorithmResultDto.Algorithm), opt => opt.MapFrom(src => src.Algorithm.ToFrontendName()))
            .ForCtorParam(nameof(AlgorithmResultDto.Cost), opt => opt.MapFrom(src => src.Cost))
            .ForCtorParam(nameof(AlgorithmResultDto.Path), opt => opt.MapFrom(src => src.Path.Select(p => new[] { p.Row, p.Col }).ToArray()))
            .ForCtorParam(nameof(AlgorithmResultDto.Explored), opt => opt.MapFrom(_ => (IReadOnlyList<int[]>?)null))
            .ForCtorParam(nameof(AlgorithmResultDto.ExploredCount), opt => opt.MapFrom(src => src.ExploredCount))
            .ForCtorParam(nameof(AlgorithmResultDto.TimeMs), opt => opt.MapFrom(src => src.TimeMs));

        CreateMap<Race, RaceResultDto>()
            .ForCtorParam(nameof(RaceResultDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(RaceResultDto.CreatedAtUtc), opt => opt.MapFrom(src => src.CreatedAtUtc))
            .ForCtorParam(nameof(RaceResultDto.Grid), opt => opt.MapFrom(src => src.Grid.ToJaggedArray()))
            .ForCtorParam(nameof(RaceResultDto.Start), opt => opt.MapFrom(src => new[] { src.Start.Row, src.Start.Col }))
            .ForCtorParam(nameof(RaceResultDto.Goal), opt => opt.MapFrom(src => new[] { src.Goal.Row, src.Goal.Col }))
            .ForCtorParam(nameof(RaceResultDto.Winner), opt => opt.MapFrom(src => src.Winner.HasValue ? src.Winner.Value.ToFrontendName() : null))
            .ForCtorParam(nameof(RaceResultDto.Results), opt => opt.MapFrom((src, ctx) => src.Results.Select(r => ctx.Mapper.Map<AlgorithmResultDto>(r)).ToList()))
            .ForCtorParam(nameof(RaceResultDto.FromCache), opt => opt.MapFrom(_ => false));
    }
}
