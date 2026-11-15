using Microsoft.OpenApi.Models;

namespace NavX.Api.Swagger;

public static class SwaggerExtensions
{
    public static IServiceCollection AddConfiguredSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "NavX Arena API",
                Version = "v1",
                Description = "High-performance Clean Architecture Web API for the NavX Arena multi-algorithm search race platform."
            });

            // Include XML comments from NavX.Api
            var xmlFile = $"{typeof(Program).Assembly.GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                c.IncludeXmlComments(xmlPath);
            }
        });

        return services;
    }
}
