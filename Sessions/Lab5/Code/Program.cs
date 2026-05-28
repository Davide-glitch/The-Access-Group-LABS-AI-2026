using Lab5.Repositories;

var builder = WebApplication.CreateBuilder(args);

// 1. Register services into the DI container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Register BOTH repositories so the controllers can use them!
builder.Services.AddSingleton<IQuizRepository, InMemoryQuizRepository>();
builder.Services.AddSingleton<IQuestionRepository, InMemoryQuestionRepository>();

var app = builder.Build();

// 3. Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();