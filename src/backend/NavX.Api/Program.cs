using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using NavX.Api;
using NavX.Application;
using NavX.Infrastructure;
using NavX.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration)
    .AddPresentation();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "NavX Arena API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");
app.UseAuthorization();

// Serve static assets from frontend/dist if built.
// In Docker the dist is copied to wwwroot/; in local dev it sits at ../../frontend/dist.
var frontendDist = Path.Combine(app.Environment.ContentRootPath, "..", "..", "frontend", "dist");
var wwwrootDist  = Path.Combine(app.Environment.ContentRootPath, "wwwroot");

// Prefer wwwroot (Docker / production), fall back to local dev path
var staticRoot = Directory.Exists(wwwrootDist) && Directory.EnumerateFiles(wwwrootDist).Any()
    ? wwwrootDist
    : Directory.Exists(frontendDist) ? frontendDist : null;
if (staticRoot is not null)
{
    var physicalProvider = new PhysicalFileProvider(Path.GetFullPath(staticRoot));
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = physicalProvider,
        RequestPath = ""
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = physicalProvider,
        RequestPath = ""
    });
}
else
{
    app.UseStaticFiles();
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));
app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));

// Fallback to React index.html for client-side routing
if (staticRoot is not null)
{
    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(Path.GetFullPath(staticRoot))
    });
}

app.Run();

public partial class Program { }
