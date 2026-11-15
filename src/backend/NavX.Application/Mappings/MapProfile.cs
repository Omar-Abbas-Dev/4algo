using AutoMapper;
using NavX.Application.Dtos;
using NavX.Domain.Entities;

namespace NavX.Application.Mappings;

public sealed class MapProfile : Profile
{
    public MapProfile()
    {
        CreateMap<SavedMap, MapDto>()
            .ForCtorParam(nameof(MapDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(MapDto.Name), opt => opt.MapFrom(src => src.Name))
            .ForCtorParam(nameof(MapDto.Grid), opt => opt.MapFrom(src => src.Grid.ToJaggedArray()))
            .ForCtorParam(nameof(MapDto.DefaultStart), opt => opt.MapFrom(src => src.DefaultStart.HasValue ? new[] { src.DefaultStart.Value.Row, src.DefaultStart.Value.Col } : null))
            .ForCtorParam(nameof(MapDto.DefaultGoal), opt => opt.MapFrom(src => src.DefaultGoal.HasValue ? new[] { src.DefaultGoal.Value.Row, src.DefaultGoal.Value.Col } : null))
            .ForCtorParam(nameof(MapDto.CreatedAtUtc), opt => opt.MapFrom(src => src.CreatedAtUtc));
    }
}
