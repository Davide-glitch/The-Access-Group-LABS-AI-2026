using Lab6.Data;
using Lab6.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Register services into the DI container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core + SQL Server, reading the connection string from appsettings.json.
var connectionString = builder.Configuration.GetConnectionString("QuizzesDb");
builder.Services.AddDbContext<QuizzesDbContext>(options =>
    options.UseSqlServer(connectionString));

// The whole app talks to the IQuizRepository abstraction — never the concrete type.
// One line swapped it from the in-memory store to SQL Server. Scoped: one per request.
builder.Services.AddScoped<IQuizRepository, EfQuizRepository>();

var app = builder.Build();

// 2. Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
