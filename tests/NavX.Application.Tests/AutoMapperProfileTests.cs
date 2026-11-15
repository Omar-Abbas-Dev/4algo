using AutoMapper;
using NavX.Application.Mappings;
using Xunit;

namespace NavX.Application.Tests;

public class AutoMapperProfileTests
{
    [Fact]
    public void AutoMapper_Configuration_ShouldBeValid()
    {
        var configuration = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<RaceProfile>();
            cfg.AddProfile<MapProfile>();
        });

        configuration.AssertConfigurationIsValid();
    }
}
