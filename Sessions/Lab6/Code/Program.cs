using Lab6.Data;
using Lab6.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register the MCP Server and discover the tools we just wrote
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();

// EF Core + SQL Server configuration
var connectionString = builder.Configuration.GetConnectionString("QuizzesDb");
builder.Services.AddDbContext<QuizzesDbContext>(options =>
    options.UseSqlServer(connectionString));

// Our Scoped EF Core Repository
builder.Services.AddScoped<IQuizRepository, EfQuizRepository>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

// Map the Streamable HTTP endpoint for the AI agent to hit
app.MapMcp("/mcp");

app.Run();