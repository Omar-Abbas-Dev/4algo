using NetArchTest.Rules;
using Shouldly;
using Xunit;

namespace NavX.ArchitectureTests;

public class ArchitectureTests
{
    private const string DomainNamespace = "NavX.Domain";
    private const string ApplicationNamespace = "NavX.Application";
    private const string InfrastructureNamespace = "NavX.Infrastructure";
    private const string ApiNamespace = "NavX.Api";

    [Fact]
    public void Domain_ShouldNotDependOn_OtherLayers()
    {
        var result = Types.InAssembly(typeof(NavX.Domain.Common.Entity<>).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(ApplicationNamespace, InfrastructureNamespace, ApiNamespace)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(string.Join(", ", result.FailingTypeNames ?? Array.Empty<string>()));
    }

    [Fact]
    public void Application_ShouldNotDependOn_InfrastructureOrApi()
    {
        var result = Types.InAssembly(typeof(NavX.Application.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(InfrastructureNamespace, ApiNamespace)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(string.Join(", ", result.FailingTypeNames ?? Array.Empty<string>()));
    }

    [Fact]
    public void Infrastructure_ShouldNotDependOn_Api()
    {
        var result = Types.InAssembly(typeof(NavX.Infrastructure.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOn(ApiNamespace)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(string.Join(", ", result.FailingTypeNames ?? Array.Empty<string>()));
    }

    [Fact]
    public void Controllers_ShouldInheritFrom_ApiControllerBase()
    {
        var result = Types.InAssembly(typeof(NavX.Api.Controllers.ApiControllerBase).Assembly)
            .That()
            .ResideInNamespace("NavX.Api.Controllers")
            .And()
            .DoNotHaveName("ApiControllerBase")
            .Should()
            .Inherit(typeof(NavX.Api.Controllers.ApiControllerBase))
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(string.Join(", ", result.FailingTypeNames ?? Array.Empty<string>()));
    }
}
